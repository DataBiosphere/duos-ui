import { filter, flatMap, flow, includes, isEmpty, map, uniq, values } from 'lodash/fp'
import { isNil } from 'lodash'
import { Match } from 'src/libs/ajax/Match'
import { DataSet } from 'src/libs/ajax/DataSet.js'
import { processVotesForBucket } from './DarCollectionUtils'
import { processMatchData } from './VoteUtils'
import {
  AbstainDataUseCodes,
  AlgorithmResult,
  DacTerm,
  DarCollection,
  DataAccessRequest,
  Dataset,
  DatasetTerm,
  DataUseSummary,
  DataUseTerm,
  Election,
  MatchResult,
  Vote,
} from 'src/types/model'
import { Notifications } from 'src/libs/utils'
import { extractError } from 'src/utils/ErrorUtils'
import { ControlledAccessType } from 'src/libs/dataUseTranslation'

export interface Bucket {
  key: string
  label: string
  datasets: Dataset[]
  datasetIds: number[]
  dataUse?: DataUseSummary
  dataUses?: DataUseTerm[]
  elections: Election[]
  votes: Record<string, VoteGroup>[]
  matchResults: MatchResult[]
  algorithmResult?: AlgorithmResult
  isRP?: boolean // Whether this is an RP (Research Purpose) vote bucket
  dacs?: DacTerm[]
}

interface VoteGroup {
  chairpersonVotes: Vote[]
  memberVotes: Vote[]
  finalVotes: Vote[]
  radarVotes?: Vote[]
}

/**
 * Entry method into bundling up datasets into groups based on common data use restrictions.
 *
 * Step 1: Map all datasets to distinct buckets based on data use
 *      a: Pull out the data use translations for the bucket's dataUse
 *      b: Populate translated dataUses
 * Step 2: Pull out match data based on dataset that the match data applies to.
 * Step 3: Pull all elections for those datasets into the buckets
 * Step 4: Pull all votes up to a top level bucket field for easier iteration
 * Step 5: Set the bucket key/label from the dataUse + dataset ids
 * Step 6: Coalesce the algorithm decision per bucket
 * Step 7: Prepend an RP Vote bucket for the DAC to vote on the research purpose
 */
export const binCollectionToBuckets = async (collection: DarCollection, dacIds: number[] = []): Promise<Bucket[]> => {
  const buckets: Bucket[] = []
  // Find the most recent DAR
  const recentDar: DataAccessRequest = collection.dars === undefined
    ? {} as DataAccessRequest
    : Object.values(collection.dars).sort((a, b) => b.id - a.id).at(0) || {} as DataAccessRequest
  // Find all match results for this collection. This will be placed into each
  // bucket based on the dataset that the match applies to in step 1.a
  const matchData: MatchResult[] = recentDar.referenceId ? await Match.findMatchBatch([recentDar.referenceId]) : []
  // If we need to restrict the datasets to a particular DAC, do that here.
  const datasets: Dataset[] = filterDatasetsByDACs(dacIds, collection.datasets)
  // Find the DatasetTerms which have preprocessed DataUse objects.
  const terms = await getDatasetTerms(datasets)
  // Terms don't come with type-specification so we need to modify that manually
  if (terms) {
    for (const term of terms) {
      if (term.dataUse?.primary) {
        for (const dut of term.dataUse.primary) {
          dut.type = ControlledAccessType.permissions
        }
      }
      if (term.dataUse?.secondary) {
        for (const dut of term.dataUse.secondary) {
          dut.type = ControlledAccessType.modifiers
        }
      }
    }
  }
  // Create a map of DataUse to a list of datasets. This will serve as the basis for bucketing datasets by DataUse.
  // Note that we need to use a string value of the DataUse object to ensure that we can use it as a key in a Map.
  const datasetTermMap: Map<string, Dataset[]> = new Map<string, Dataset[]>()
  if (terms) {
    for (const term of terms) {
      const stringValue = JSON.stringify(term.dataUse)
      const matchingDataset = datasets.find((dataset: Dataset) => dataset.datasetId === term.datasetId)
      if (matchingDataset) {
        if (datasetTermMap.has(stringValue)) {
          datasetTermMap.get(stringValue)!.push(matchingDataset)
        }
        else {
          datasetTermMap.set(stringValue, [matchingDataset])
        }
      }
    }
  }
  // Iterate through the datasetTermMap to create buckets
  const iterator = datasetTermMap.keys()
  for (const key of iterator) {
    const dataUseSummary: DataUseSummary = isNil(key) ? undefined : JSON.parse(key)
    const datasets: Dataset[] = datasetTermMap.get(key) || []
    const datasetIds = datasets?.map((dataset: Dataset) => dataset.datasetId)
    const dacIds = datasets?.map((dataset: Dataset) => dataset.dacId) || []
    const dacs: DacTerm[] = terms
      .filter((term: DatasetTerm) => dacIds.includes(term.dacId))
      .map((term: DatasetTerm) => term.dac)
      .filter((dac: DacTerm | undefined) => !isNil(dac))
      .filter((dac: DacTerm, index: number, self: DacTerm[]) => self.findIndex((d: DacTerm) => d.dacId === dac.dacId) === index)

    const bucket: Bucket = {
      key: '',
      label: '',
      datasets: datasets,
      datasetIds: datasetIds,
      dataUse: dataUseSummary,
      dataUses: [...dataUseSummary?.primary || [], ...dataUseSummary?.secondary || []],
      elections: [],
      votes: [],
      matchResults: [],
      dacs: dacs,
    }
    buckets.push(bucket)
  }

  // The following steps are all bucket-centric, so we can process them in a single loop
  // Steps 2-6
  for (const b of buckets) {
    // Step 2: Find match results for each dataset in bucket
    for (const m of matchData) {
      for (const dataset of b.datasets) {
        if (dataset.datasetIdentifier.toLowerCase() === m.consent.toLowerCase()) {
          b.matchResults.push(m)
        }
      }
    }

    // Step 3: Populate elections for datasets in this bucket
    b.elections = findElectionsForDatasets(recentDar, b.datasetIds)

    // Step 4: Populate votes for each bucket
    b.votes.push(processVotesForBucket(b.elections))

    // Step 5: Generate bucket key and label
    b.key = 'bucket-' + b.datasetIds.join('-')
    b.label = b.dataUses?.map((du: DataUseTerm) => du.code).join(', ') || 'Undefined Data Use'

    // Step 6: Coalesce match results into a single result per bucket
    b.algorithmResult = calculateAlgorithmResultForBucket(b)
  }

  // Step 7: Populate RUS Vote bucket with RP votes and move to the top of the bucket array
  const rpVotes = createRpVoteStructureFromBuckets(buckets)
  buckets.unshift({
    isRP: true,
    key: 'RUS Vote',
    votes: rpVotes,
    label: '',
    datasets: [],
    datasetIds: [],
    dataUses: [],
    elections: [],
    matchResults: [],
  })

  return buckets
}

/**
 * Find all elections (in a dar) with a dataset id in the provided list of dataset ids
 */
const findElectionsForDatasets = (dar: DataAccessRequest, datasetIds: number[]): Election[] => {
  return dar.elections
    ? Object.values(dar.elections)
        .filter((e: Election) => datasetIds.includes(e.datasetId))
    : []
}

/**
 * Optionally filter a list of collection datasets by the dac ids provided.
 */
const filterDatasetsByDACs = (dacIds: number[], datasets: Dataset[]): Dataset[] => {
  return isEmpty(dacIds)
    ? datasets
    : filter(
        (dataset: Dataset) => includes(dataset.dacId)(dacIds),
      )(datasets)
}

/**
 * Generate the summary of algorithm results suitable for display in the UI
 *
 * Four potential cases:
 *  1. No matches
 *  2. Exactly one match or N matches that are all the same - easy case
 *  3. Abstain is true and match is false - decision is abstained
 *  4. N matches - not all the same - very confusing case
 */
const calculateAlgorithmResultForBucket = (bucket: Bucket): AlgorithmResult => {
  // V1 and V2: We actually DO NOT want to show system match results when the data use indicates
  // that a match should not be made. This happens for all "Other" cases.
  const algorithmVersionV3 = bucket.matchResults.length > 0 && bucket.matchResults[0].algorithmVersion === 'v3'
  const unmatchable = isOther(bucket.dataUse) || shouldAbstain(bucket.dataUse)
  // Check on all possible true/false values in the matches.
  // If all matches are the same, we can merge them into a single match object for display.
  // If they are not all the same, we have to punt this decision solely to the DAC.
  // Check algorithm version: V3 does not need to be checked for 'unmatchable'
  const matchVals: boolean[] = (algorithmVersionV3 || !unmatchable)
    ? flow(
        map((m: MatchResult) => m.match),
        uniq,
      )(bucket.matchResults)
    : []

  const abstain = processV3Abstain(bucket.matchResults)

  // check results based on matchVals
  if (isEmpty(matchVals)) {
    return { result: 'N/A', createDate: undefined, rationales: undefined, id: bucket.key }
  }
  else if ((matchVals.length === 1)) {
    const rationales: string[] = flow(
      flatMap((match: MatchResult) => match.rationales),
      uniq,
    )(bucket.matchResults)
    const { createDate, failed, id, match } = bucket.matchResults[0]
    const matchResult = { createDate, rationales, failed, id, match }
    if (abstain) {
      return {
        result: 'Abstain',
        createDate,
        rationales,
        id,
      }
    }
    else {
      return {
        result: processMatchData(matchResult),
        createDate,
        rationales,
        id,
      }
    }
  }
  else {
    // Different match values? Provide a custom message
    return {
      result: 'Unable to determine a system match',
      createDate: undefined,
      rationales: ['Algorithm matched both true and false for this combination of datasets'],
      id: bucket.key,
    }
  }
}

/**
 * Process the match results for V3 Abstain. If we have a V3 result and we have
 * an ABSTAIN case, we can return true if the number of abstentions > 0
 */
const processV3Abstain = (matchResults: MatchResult[]): boolean => {
  const abstainList = map((m: MatchResult) => m.abstain)(matchResults)
  const abstainValList = filter((a: boolean | undefined) => a === true)(abstainList)
  return abstainValList.length > 0
}

/**
 * Calculate "Other" status for a data use. Data Uses can have 'otherRestrictions': TRUE|FALSE,
 * or they can have fields populated for 'other': 'other restriction' and 'secondaryOther': 'yet other restriction'
 */
const isOther = (dataUse?: DataUseSummary): boolean => {
  const primaryOther = dataUse?.primary?.some((dut: DataUseTerm) => dut.code === 'OTHER') || false
  const secondaryOther = dataUse?.secondary?.some((dut: DataUseTerm) => dut.code === 'OTHER') || false
  return primaryOther || secondaryOther
}

/**
 * Calculate abstention for a data use. There are a number of cases where there should
 * not be an algorithm decision if a field is true, including any "Other" state.
 */
export const shouldAbstain = (dataUse?: DataUseSummary): boolean => {
  const codeList: string[] = Object.keys(AbstainDataUseCodes)
  return isOther(dataUse)
    || (dataUse?.secondary
      ? dataUse.secondary.map((dut: DataUseTerm) => dut.code).some(code => codeList.includes(code))
      : false)
}

/**
 * Create a structure of RP (research purpose) votes from all votes in a list of buckets.
 */
const createRpVoteStructureFromBuckets = (buckets: Bucket[]): Array<{ rp: VoteGroup }> => {
  // List of rp vote groups broken out by election into chair, member, and final votes.
  const rpVotes: Array<{ rp: VoteGroup }> = []

  const rpElectionVoteArrays: Vote[][] = flow(
    flatMap((b: Bucket) => b.elections),
    filter((e: Election) => e.electionType.toLowerCase() === 'rp'),
    map((e: Election) => e.votes),
    // election.votes is a hash of vote id => vote object
    map((hash: Record<string, Vote>) => values(hash)),
  )(buckets)

  for (const vArray of rpElectionVoteArrays) {
    const rpVoteGroup: VoteGroup = {
      chairpersonVotes: [],
      memberVotes: [],
      finalVotes: [],
    }
    for (const v of vArray) {
      const lowerCaseType = v.type.toLowerCase()
      switch (lowerCaseType) {
        case 'chairperson':
          rpVoteGroup.chairpersonVotes.push(v)
          rpVoteGroup.finalVotes.push(v)
          break
        case 'dac':
          rpVoteGroup.memberVotes.push(v)
          break
        default:
          break
      }
    }
    rpVotes.push({ rp: rpVoteGroup })
  }
  return rpVotes
}

/**
 * Helper function to retrieve DatasetTerms for a list of datasets. This is primarily used to get the pre-processed
 * data use information so the UI doesn't have to reprocess it.
 */
const getDatasetTerms = async (datasets: Dataset[]): Promise<DatasetTerm[]> => {
  const datasetQuery = DataSet.searchDatasetIndex({
    from: 0,
    size: 10000,
    query: {
      bool: {
        must: [
          {
            match: {
              _type: 'dataset',
            },
          },
          {
            terms: {
              _id: datasets.map(dataset => dataset.datasetId),
            },
          },
        ],
      },
    },
  })
  try {
    return await datasetQuery
  }
  catch (error) {
    const errorMessage = extractError(error)
    Notifications.showError({ text: `Error loading Dataset Term information for datasets: ${errorMessage}` })
  }
  return []
}
