import {
  any,
  compact,
  filter,
  findIndex,
  flatMap,
  flow,
  forEach,
  get,
  getOr,
  includes,
  isEmpty,
  isEqual,
  isUndefined,
  join,
  map,
  toLower,
  uniq,
  values
} from 'lodash/fp';
import {Match} from '../libs/ajax';
import {translateDataUseRestrictionsFromDataUseArray} from '../libs/dataUseTranslation';
import {processVotesForBucket} from './DarCollectionUtils';
import {processMatchData} from './VoteUtils';

/**
 * Entry method into bundling up datasets into groups based on common data use restrictions.
 *
 * Step 1: Map all datasets to distinct buckets based on data use
 *      a: Pull out match data based on dataset that the match data applies to.
 *      b: Pull out the data use translations for the bucket's dataUse
 *      c: Set the bucket key/label from the dataUse + dataset ids
 * Step 2: Pull all elections for those datasets into the buckets
 * Step 3: Set the bucket key/label from the dataUse + dataset ids
 * Step 4: Coalesce the algorithm decision per bucket
 * Step 5: Pull all votes up to a top level bucket field for easier iteration
 * Step 6: Prepend an RP Vote bucket for the DAC to vote on the research purpose
 *
 * @param collection The full Data Access Request Collection
 * @param dacIds An optional array of dac ids. If provided, bucket contents will be filtered to datasets matching
 *        the provided dac ids. This will extend to elections and votes as well.
 * @returns {Promise<*[Bucket]>}
 */
export const binCollectionToBuckets = async (collection, dacIds = []) => {

  let buckets = [];
  // Find all match results for this collection. This will be placed into each
  // bucket based on the dataset that the match applies to in step 1.a
  const referenceIds = flow(
    map(d => d.referenceId),
    uniq
  )(collection.dars);
  const matchData = referenceIds.length > 0 ? await Match.findMatchBatch(referenceIds) : [];

  // If we need to restrict the datasets to a particular DAC, do that here.
  const datasets = filterDatasetsByDACs(dacIds, get('datasets')(collection));

  // Find all translated data uses for all datasets. `translateDataUseRestrictionsFromDataUseArray` creates a parallel,
  // ordered array in the same order as rawDataUses, so we can associate them by index. Unfortunately, it also creates
  // empty elements per translation (one for any missing potential translation), so we need to filter those out.
  const rawDataUses = compact(map(d => d.dataUse)(datasets));
  const translatedDataUses = await translateDataUseRestrictionsFromDataUseArray(rawDataUses);
  const flatTranslatedDataUses = map(t => compact(t))(translatedDataUses);

  // Step 1: Create buckets for unique dataset groups
  forEach(dataset => {
    // Put each dataset into a bucket. If the dataset's data use is missing, unique or has an "Other" restriction, then
    // it gets its own bucket. If the data use is already in a bucket, then it gets merged in.
    let bucket = {
      key: '',
      label: '',
      datasets: [dataset],
      datasetIds: [dataset.dataSetId],
      dataUse: dataset.dataUse,
      dataUses: [],
      elections: [],
      votes: [],
      matchResults: []
    };

    if (isUndefined(dataset.dataUse) || isOther(dataset.dataUse)) {
      buckets.push(bucket);
    } else {
      // Add to bucket if the data use doesn't exist
      const bucketDataUses = map(b => b.dataUse)(buckets);
      if (!any(dataset.dataUse)(bucketDataUses)) {
        buckets.push(bucket);
      } else {
        // If it does exist, merge this dataset into that bucket
        forEach(b => {
          if (isEqual(b.dataUse)(dataset.dataUse)) {
            b.datasets.push(dataset);
            b.datasetIds.push(dataset.dataSetId);
          }
        })(buckets);
      }
    }

    // Step 1.a: Find match results for this dataset and add to bucket
    forEach(m => {
      if (toLower(dataset.datasetIdentifier) === toLower(m.consent)) {
        bucket.matchResults.push(m);
      }
    })(matchData);

    // Step 1.b: Populate translated dataUses
    if (dataset.dataUse) {
      const index = findIndex(dataset.dataUse)(rawDataUses);
      if (index >= 0 && !isUndefined(flatTranslatedDataUses[index])) {
        bucket.dataUses = flatTranslatedDataUses[index];
      }
    }

  })(datasets);

  // Step 2: Populate elections for each bucket
  const darMap = get('dars')(collection);
  forEach(dar => {
    const electionMap = get('elections')(dar);
    forEach(election => {
      // find the bucket this election belongs to
      const datasetId = get('dataSetId')(election);
      forEach(b => {
        if (includes(datasetId)(b.datasetIds)) {
          b.elections.push(election);
        }
      })(buckets);
    })(values(electionMap));
  })(values(darMap));

  // Steps 3-5
  forEach(b => {
    // Step 3: Generate bucket key and label
    if (!isEmpty(b.dataUses)) {
      b.label = flow(
        map((du) => du.alternateLabel || du.code),
        join(', ')
      )(b.dataUses);
    } else {
      b.label = 'Undefined Data Use';
    }
    b.key = 'bucket-' + join('-')(b.datasetIds);

    // Step 4: Coalesce match results into a single result per bucket
    b.algorithmResult = calculateAlgorithmResultForBucket(b);

    // Step 5: Populate votes for each bucket
    b.votes.push(processVotesForBucket(b.elections));
  })(buckets);

  // Step 6: Populate RUS Vote bucket with RP votes
  const rpVotes = createRpVoteStructureFromBuckets(buckets);
  buckets.unshift({
    isRP: true,
    key: 'RUS Vote',
    votes: rpVotes
  });

  return buckets;
};

/**
 * Optionally filter a list of collection datasets by the dac ids provided.
 * @private
 * @param dacIds List of dac ids. Can be empty
 * @param datasets List of datasets to filter
 * @returns {[]}
 */
const filterDatasetsByDACs = (dacIds, datasets) => {
  return isEmpty(dacIds) ?
    datasets :
    filter(
      dataset => includes(dataset.dacId)(dacIds)
    )(datasets);
};

/**
 * Generate the summary of algorithm results suitable for display in the UI
 *
 * Four potential cases:
 *  1. No matches
 *  2. Exactly one match, easy case
 *  3. N matches - all the same, also an easy case
 *  4. N matches - not all the same - very confusing case
 *
 * @private
 * @param bucket
 * @returns {{result: string, failureReasons: string[], id, createDate: undefined}|{result: (string|string), failureReasons: *, id: *, createDate: *}|{result: string, failureReasons: undefined, id, createDate: undefined}}
 */
const calculateAlgorithmResultForBucket = (bucket) => {

  // We actually DO NOT want to show system match results when the data use indicates
  // that a match should not be made. This happens for all "Other" cases.
  const unmatchable = isOther(bucket.dataUse);
  if (unmatchable || isEmpty(bucket.matchResults)) {
    return {result: 'N/A', createDate: undefined, failureReasons: undefined, id: bucket.key};
  } else if (!isEmpty(bucket.matchResults) && bucket.matchResults.length === 1) {
    const match = bucket.matchResults[0];
    const { createDate, failureReasons, id } = match;
    return {
      result: processMatchData(match),
      createDate,
      failureReasons,
      id
    };
  } else {
    const matchVals = flow(
      map(m => m.match),
      uniq
    )(bucket.matchResults);
    // All the same match value? Choose the first one
    if (matchVals.length === 1) {
      const match = bucket.matchResults[0];
      const { createDate, failureReasons, id } = match;
      return {
        result: processMatchData(match),
        createDate,
        failureReasons,
        id
      };
    } else {
      // Different match values? Provide a custom message
      return {result: 'Unable to determine a system match', createDate: undefined, failureReasons: ['Algorithm matched both true and false for this combination of datasets'], id: bucket.key};
    }
  }
};

/**
 * Calculate "Other" status for a data use. Data Uses can have 'otherRestrictions': TRUE|FALSE,
 * or they can have fields populated for 'other': 'other restriction' and 'secondaryOther': 'yet other restriction'
 * @private
 * @param dataUse
 * @returns TRUE|FALSE
 */
const isOther = (dataUse) => {
  const otherRestrictions = getOr(false)('otherRestrictions')(dataUse);
  const primaryOther = !isEmpty(getOr('')('other')(dataUse));
  const secondaryOther = !isEmpty(getOr('')('secondaryOther')(dataUse));
  return otherRestrictions || primaryOther || secondaryOther;
};

/**
 * Create a structure of RP votes from all votes in a list of buckets.
 *
 * @private
 * @param buckets
 * @returns [{rp: {chairpersonVotes: [], memberVotes : [], finalVotes: []}}]
 */
const createRpVoteStructureFromBuckets = (buckets) => {
  // List of rp vote groups broken out by election into chair, member, and final votes.
  let rpVotes = [];

  const rpElectionVoteArrays = flow(
    flatMap(b => b.elections),
    filter(e => toLower(e.electionType) === 'rp'),
    map(e => e.votes),
    // election.votes is a hash of vote id => vote object
    map(hash => values(hash))
  )(buckets);

  forEach(vArray => {
    let rpVoteGroup =  {
      chairpersonVotes: [],
      memberVotes : [],
      finalVotes: []
    };
    forEach(v => {
      const lowerCaseType = toLower(v.type);
      switch (lowerCaseType) {
        case 'chairperson':
          // 'Chairperson' votes count as final votes for 'RP' elections. This is not true for 'DataAccess' votes
          rpVoteGroup.chairpersonVotes.push(v);
          rpVoteGroup.finalVotes.push(v);
          break;
        case 'dac':
          rpVoteGroup.memberVotes.push(v);
          break;
        default:
          break;
      }
    })(vArray);
    rpVotes.push({rp: rpVoteGroup});
  })(rpElectionVoteArrays);

  return rpVotes;
};
