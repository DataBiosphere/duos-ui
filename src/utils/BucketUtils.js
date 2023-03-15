import {any, compact, filter, findIndex, flatMap, flow, forEach, get, getOr, includes, isEmpty, isEqual, isUndefined, join, map, pick, toLower, uniq, values} from 'lodash/fp';
import {Match} from '../libs/ajax';
import {translateDataUseRestrictionsFromDataUseArray} from '../libs/dataUseTranslation';
import {processVotesForBucket} from './DarCollectionUtils';
import {processMatchData} from './VoteUtils';

/**
 * Entry method into bundling up datasets into groups based on common data use restrictions.
 *
 * Step 1: Map all datasets to distinct buckets based on data use
 *      a: Pull out the data use translations for the bucket's dataUse
 *      b: Set the bucket key/label from the dataUse + dataset ids
 * Step 2: Pull out match data based on dataset that the match data applies to.
 * Step 3: Pull all elections for those datasets into the buckets
 * Step 4: Pull all votes up to a top level bucket field for easier iteration
 * Step 5: Set the bucket key/label from the dataUse + dataset ids
 * Step 6: Coalesce the algorithm decision per bucket
 * Step 7: Prepend an RP Vote bucket for the DAC to vote on the research purpose
 *
 * @public
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
          if (isEqualDataUse(b.dataUse, dataset.dataUse)) {
            b.datasets.push(dataset);
            b.datasetIds.push(dataset.dataSetId);
          }
        })(buckets);
      }
    }

    // Step 1.b: Populate translated dataUses
    if (dataset.dataUse) {
      const index = findIndex(dataset.dataUse)(rawDataUses);
      if (index >= 0 && !isUndefined(flatTranslatedDataUses[index])) {
        bucket.dataUses = flatTranslatedDataUses[index];
      }
    }

  })(datasets);

  // The following steps are all bucket-centric, so we can process those in a single loop
  // Steps 2-6
  forEach(b => {
    // Step 2: Find match results for each dataset in bucket
    forEach(m => {
      forEach(dataset => {
        if (toLower(dataset.datasetIdentifier) === toLower(m.consent)) {
          b.matchResults.push(m);
        }
      })(b.datasets);
    })(matchData);

    // Step 3: Populate elections for datasets in this bucket
    b.elections = findElectionsForDatasets(collection, b.datasetIds);

    // Step 4: Populate votes for each bucket
    b.votes.push(processVotesForBucket(b.elections));

    // Step 5: Generate bucket key and label
    if (!isEmpty(b.dataUses)) {
      b.label = flow(
        map((du) => du.alternateLabel || du.code),
        join(', ')
      )(b.dataUses);
    } else {
      b.label = 'Undefined Data Use';
    }
    b.key = 'bucket-' + join('-')(b.datasetIds);

    // Step 6: Coalesce match results into a single result per bucket
    b.algorithmResult = calculateAlgorithmResultForBucket(b);

  })(buckets);

  // Step 7: Populate RUS Vote bucket with RP votes
  const rpVotes = createRpVoteStructureFromBuckets(buckets);
  buckets.unshift({
    isRP: true,
    key: 'RUS Vote',
    votes: rpVotes
  });

  return buckets;
};

/**
 * Find all elections (in a dar collection) with a dataset id in the provided list of dataset ids
 * @private
 * @param collection
 * @param datasetIds
 * @returns {[]}
 */
const findElectionsForDatasets = (collection, datasetIds) => {
  // In a collection, DARs and elections are each a map of id => object
  // Iterate through all values of each map find elections associated to the provided dataset ids.
  const darMap = get('dars')(collection); // Map of dar reference id -> dar
  return flow(
    values, // List of DARs
    flatMap(dar => get('elections')(dar)), // List of maps of election id -> election
    flatMap(eMap => values(eMap)), // List of election objects
    filter(e => includes(get('dataSetId')(e))(datasetIds))
  )(darMap);
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
 * Three potential cases:
 *  1. No matches
 *  2. Exactly one match or N matches that are all the same - easy case
 *  3. N matches - not all the same - very confusing case
 *
 * @private
 * @param bucket
 * @returns {{result: string, failureReasons: string[], id, createDate: undefined}|{result: (string|string), failureReasons: *, id: *, createDate: *}|{result: string, failureReasons: undefined, id, createDate: undefined}}
 */
const calculateAlgorithmResultForBucket = (bucket) => {

  // We actually DO NOT want to show system match results when the data use indicates
  // that a match should not be made. This happens for all "Other" cases.
  const unmatchable = isOther(bucket.dataUse);
  // Check on all possible true/false values in the matches.
  // If all matches are the same, we can merge them into a single match object for display.
  // If they are not all the same, we have to punt this decision solely to the DAC.
  const matchVals = unmatchable ? [] : flow(
    map(m => m.match),
    uniq
  )(bucket.matchResults);

  if (isEmpty(matchVals)) {
    return {result: 'N/A', createDate: undefined, failureReasons: undefined, id: bucket.key};
  } else if (matchVals.length === 1) {
    // pull all unique failure reasons from all match failures into the display
    const failureReasons = flow(
      flatMap(match => match.failureReasons),
      uniq
    )(bucket.matchResults);
    const {createDate, failed, id, match} = bucket.matchResults[0];
    const matchResult = {createDate, failureReasons, failed, id, match};
    return {
      result: processMatchData(matchResult),
      createDate,
      failureReasons,
      id
    };
  } else {
    // Different match values? Provide a custom message
    return {result: 'Unable to determine a system match', createDate: undefined, failureReasons: ['Algorithm matched both true and false for this combination of datasets'], id: bucket.key};
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

/**
 * Constrain the equality check to a limited number of fields. These
 * fields are the ones that are used in the V2 algorithm and are what
 * determine whether it falls into a Data Use bucket. We limit the fields
 * because there are quite a few that have no impact on algorithm
 * decision-making. Fields like recontactMay and recontactMust are not
 * relevant to DAC decisions.
 *
 * @public
 * @param a Data Use
 * @param b Data Use
 * @returns {boolean}
 */
export const isEqualDataUse = (a, b) => {
  const fields = ['generalUse', 'hmbResearch', 'diseaseRestrictions',
    'populationOriginsAncestry', 'commercialUse', 'methodsResearch',
    'aggregateResearch', 'controlSetOption', 'gender', 'pediatric',
    'ethicsApprovalRequired', 'collaboratorRequired', 'publicationResults',
    'otherRestrictions', 'other', 'secondaryOther'];
  const aCopy = pick(fields)(a);
  const bCopy = pick(fields)(b);
  return isEqual(aCopy)(bCopy);
};
