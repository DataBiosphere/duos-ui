import { chain, filter, includes, isEmpty, isNil } from 'src/utils/NodashUtil'
import { Match } from 'src/libs/ajax/Match'
import { DataSet } from 'src/libs/ajax/DataSet'
import { ElasticsearchQuery } from 'src/types/elastic'
import { processVotesForBucket } from './DarCollectionUtils'
import { processMatchData } from './VoteUtils'
import {
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
 * From v3 on Consent decides ABSTAIN and supplies the rationale the DAC reads. A floor rather than
 * an allowlist, so a newer matcher does not blank every suggestion until this UI is redeployed.
 */
const FIRST_BACKEND_ABSTAINING_VERSION = 3

const UNRECOGNIZED_ALGORITHM_RESULT = 'System match unavailable for this algorithm version'

type AlgorithmVersionHandling = 'backend-abstains' | 'unrecognized'

const classifyOneVersion = (version: string | undefined): AlgorithmVersionHandling => {
  const majorVersion = isNil(version) ? null : /^v(\d+)$/.exec(version)
  return majorVersion && Number(majorVersion[1]) >= FIRST_BACKEND_ABSTAINING_VERSION
    ? 'backend-abstains'
    : 'unrecognized'
}

/** Versions mixed across match runs matter only when they disagree on how the results are read. */
const classifyAlgorithmVersion = (versions: (string | undefined)[]): AlgorithmVersionHandling => {
  const handlings = new Set(versions.map(classifyOneVersion))
  return handlings.size === 1 ? [...handlings][0] : 'unrecognized'
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
    // No single createDate applies when the rows come from runs DUOS reads differently.
    return {
      result: UNRECOGNIZED_ALGORITHM_RESULT,
      createDate: undefined,
      rationales: [
        `This match was recorded by algorithm version ${versions.map(v => v ?? 'unknown').join(', ')}, `
        + 'which DUOS cannot interpret. Please vote without a system suggestion.',
      ],
      id: bucket.key,
    }
  }

  // Check on all possible true/false values in the matches.
  // If all matches are the same, we can merge them into a single match object for display.
  // If they are not all the same, we have to punt this decision solely to the DAC.
  const matchVals: boolean[] = chain(bucket.matchResults)
    .map((m: MatchResult) => m.match)
    .uniq()
    .value()

  const abstain = hasRecordedAbstention(bucket.matchResults)

  if (matchVals.length === 1) {
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
const hasRecordedAbstention = (matchResults: MatchResult[]): boolean =>
  matchResults.some((m: MatchResult) => m.abstain === true)

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
