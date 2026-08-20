import { chain, filter, includes, isEmpty, isNil, map } from 'src/utils/NodashUtil'
import { Match } from 'src/libs/ajax/Match'
import { DataSet } from 'src/libs/ajax/DataSet'
import { ElasticsearchQuery } from 'src/types/elastic'
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
 * Step 3: Pull all Data Access elections for those datasets into the buckets
 * Step 4: Pull all votes up to a top level bucket field for easier iteration
 * Step 5: Set the bucket key/label from the dataUse + dataset ids
 * Step 6: Coalesce the algorithm decision per bucket
 */
export const binCollectionToBuckets = async (collection: Pick<DarCollection, 'datasets'> & Partial<Pick<DarCollection, 'dars'>>, dacIds: number[] = []): Promise<Bucket[]> => {
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

  return buckets
}

/**
 * Find all elections (in a dar) with a dataset id in the provided list of dataset ids.
 * Ensures that all elections are DataAccess elections.
 */
const findElectionsForDatasets = (dar: DataAccessRequest, datasetIds: number[]): Election[] => {
  return dar.elections
    ? Object.values(dar.elections)
        .filter((e: Election) => datasetIds.includes(e.datasetId) && e.electionType === 'DataAccess')
    : []
}

/**
 * Optionally filter a list of collection datasets by the dac ids provided.
 */
const filterDatasetsByDACs = (dacIds: number[], datasets: Dataset[]): Dataset[] => {
  return isEmpty(dacIds)
    ? datasets
    : filter(datasets, (dataset: Dataset) => includes(dacIds, dataset.dacId))
}

/**
 * Versions whose ABSTAIN is decided by Consent's `DataUseMatcherV5`, which supplies the rationale
 * the DAC reads. Suppressing these client-side would replace a real decision with "N/A".
 */
const BACKEND_ABSTAINING_VERSIONS: ReadonlySet<string> = new Set(['v3', 'v4', 'v5'])

/** Versions that predate server-side abstention and so still need client-side suppression. */
const CLIENT_SUPPRESSING_VERSIONS: ReadonlySet<string> = new Set(['v1', 'v2'])

const UNRECOGNIZED_ALGORITHM_RESULT = 'Unable to interpret the system match'

type AlgorithmVersionHandling = 'backend-abstains' | 'client-suppresses' | 'unrecognized'

/**
 * A bucket's datasets are matched in one pass, so mixed versions mean at least one row is stale;
 * applying the newest version's semantics to all of them would be a silent guess.
 */
const classifyAlgorithmVersion = (versions: (string | undefined)[]): AlgorithmVersionHandling => {
  if (versions.length !== 1) {
    return 'unrecognized'
  }
  const [version] = versions
  if (!isNil(version) && BACKEND_ABSTAINING_VERSIONS.has(version)) {
    return 'backend-abstains'
  }
  if (!isNil(version) && CLIENT_SUPPRESSING_VERSIONS.has(version)) {
    return 'client-suppresses'
  }
  return 'unrecognized'
}

/**
 * Generate the summary of algorithm results suitable for display in the UI
 *
 * Five potential cases:
 *  1. No matches
 *  2. A stale or unknown algorithm version - no result can be interpreted
 *  3. Exactly one match or N matches that are all the same - easy case
 *  4. Abstain is true and match is false - decision is abstained
 *  5. N matches - not all the same - very confusing case
 */
const calculateAlgorithmResultForBucket = (bucket: Bucket): AlgorithmResult => {
  if (isEmpty(bucket.matchResults)) {
    return { result: 'N/A', createDate: undefined, rationales: undefined, id: bucket.key }
  }

  const versions: (string | undefined)[] = chain(bucket.matchResults)
    .map((m: MatchResult) => m.algorithmVersion)
    .uniq()
    .value()
  const handling = classifyAlgorithmVersion(versions)
  if (handling === 'unrecognized') {
    return {
      result: UNRECOGNIZED_ALGORITHM_RESULT,
      createDate: bucket.matchResults[0].createDate,
      rationales: [
        `This match was recorded by algorithm version ${versions.map(v => v ?? 'unknown').join(', ')}, `
        + 'which DUOS can no longer interpret. Please vote without a system suggestion.',
      ],
      id: bucket.key,
    }
  }

  const unmatchable = isOther(bucket.dataUse) || shouldAbstain(bucket.dataUse)
  // Check on all possible true/false values in the matches.
  // If all matches are the same, we can merge them into a single match object for display.
  // If they are not all the same, we have to punt this decision solely to the DAC.
  const matchVals: boolean[] = (handling === 'backend-abstains' || !unmatchable)
    ? chain(bucket.matchResults)
        .map((m: MatchResult) => m.match)
        .uniq()
        .value()
    : []

  const abstain = hasBackendAbstention(bucket.matchResults)

  // check results based on matchVals
  if (isEmpty(matchVals)) {
    return { result: 'N/A', createDate: undefined, rationales: undefined, id: bucket.key }
  }
  else if ((matchVals.length === 1)) {
    const rationales: string[] = chain(bucket.matchResults)
      .flatMap((match: MatchResult) => match.rationales)
      .uniq()
      .value()
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

/** One abstention is enough: the algorithm declined on a dataset, so the bucket has no answer. */
const hasBackendAbstention = (matchResults: MatchResult[]): boolean => {
  const abstainList = map(matchResults, (m: MatchResult) => m.abstain)
  const abstainValList = filter(abstainList, (a: boolean | undefined) => a === true)
  return abstainValList.length > 0
}

/**
 * Calculate "Other" status for a data use. Data Uses can have 'otherRestrictions': TRUE|FALSE,
 * or they can have fields populated for 'other': 'other restriction' and 'secondaryOther': 'yet other restriction'
 *
 * Counts a secondary Other, unlike the classifier — this feeds only the legacy suppression path.
 */
const isOther = (dataUse?: DataUseSummary): boolean => {
  const primaryOther = dataUse?.primary?.some((dut: DataUseTerm) => dut.code === 'OTHER') || false
  const secondaryOther = dataUse?.secondary?.some((dut: DataUseTerm) => dut.code === 'OTHER') || false
  return primaryOther || secondaryOther
}

/**
 * Calculate abstention for a data use. There are a number of cases where there should
 * not be an algorithm decision if a field is true, including any "Other" state.
 *
 * Legacy (v1/v2) heuristic only, and deliberately broader than Consent's classifier: it abstains
 * on secondary modifiers like PUB or IRB, which V5 matches normally because they are not primary.
 */
export const shouldAbstain = (dataUse?: DataUseSummary): boolean => {
  return isOther(dataUse)
    || (dataUse?.secondary
      ? dataUse.secondary.map((dut: DataUseTerm) => dut.code).some(code => AbstainDataUseCodes.includes(code))
      : false)
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
              _index: 'dataset',
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
  } as ElasticsearchQuery)
  try {
    return await datasetQuery
  }
  catch (error) {
    const errorMessage = extractError(error)
    Notifications.showError({ text: `Error loading Dataset Term information for datasets: ${errorMessage}` })
  }
  return []
}
