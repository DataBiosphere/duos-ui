import {any, compact, findIndex, filter, flatMap, flow, forEach, get, getOr, includes, isEmpty, isEqual, join, map, toLower, uniq, values} from 'lodash/fp';
import {Match} from '../libs/ajax';
import {translateDataUseRestrictionsFromDataUseArray} from '../libs/dataUseTranslation';
import {processVotesForBucket} from './DarCollectionUtils';
import {processMatchData} from './VoteUtils';

/**
 * @param collection The full Data Access Request Collection
 * @returns {Promise<*[Bucket]>}
 */
export const binCollectionToBuckets = async (collection) => {

  // Find all match results for this collection. This will be placed into each
  // bucket based on the dataset that the match applies to in step 1.a
  const referenceIds = flow(
    map(d => d.referenceId),
    uniq
  )(collection.dars);
  const matchData = referenceIds.length > 0 ? await Match.findMatchBatch(referenceIds) : [];

  let buckets = [];

  // Step 1: Map all datasets to distinct buckets based on data use
  //      a: Pull out match data based on dataset that the match data applies to.
  //      b: Pull out the data use translations for the bucket's dataUse
  //      c: Set the bucket key/label from the dataUse + dataset ids
  // Step 2: Pull all elections for those datasets into the buckets
  // Step 3: Pull all votes up to a top level bucket field for easier iteration
  // Step 4: Prepend an RP Vote bucket for the DAC to vote on the research purpose

  const datasets = get('datasets')(collection);

  // Find all translated data uses for all datasets. translatedDataUses creates a parallel, ordered array in the same
  // order as rawDataUses, so we can associate them by index. Unfortunately, it also creates empty elements per
  // translation (one for any missing potential translation), so we need to filter those out.
  const rawDataUses = map(d => d.dataUse)(datasets);
  const translatedDataUses = await translateDataUseRestrictionsFromDataUseArray(rawDataUses);
  const flatTranslatedDataUses = map(t => compact(t))(translatedDataUses);

  // Step 1
  map(d => {
    // Put each dataset into a bucket. If the dataset's data use is
    // unique or "Other", then it gets its own bucket. If the data
    // use is already in a bucket, then it gets merged in.
    let bucket = {
      key: '',
      label: '',
      datasets: [d],
      datasetIds: [d.dataSetId],
      dataUse: d.dataUse,
      dataUses: [],
      elections: [],
      votes: [],
      matchResults: []
    };

    if (getOr(false)('otherRestrictions')(d.dataUse)) {
      buckets.push(bucket);
    } else {
      // Add to bucket if the data use doesn't exist
      const bucketDataUses = map(b => b.dataUse)(buckets);
      if (!any(d.dataUse)(bucketDataUses)) {
        buckets.push(bucket);
      } else {
        // If it does exist, merge this dataset into that bucket
        forEach(b => {
          if (isEqual(b.dataUse)(d.dataUse)) {
            b.datasets.push(d);
            b.datasetIds.push(d.dataSetId);
          }
        })(buckets);
      }
    }

    // Step 1.a: Populate match results for this bucket
    forEach(m => {
      if (toLower(d.datasetIdentifier) === toLower(m.consent)) {
        bucket.matchResults.push(m);
      }
    })(matchData);
    // Four potential cases:
    // 1. No matches
    // 2. Exactly one match, easy case
    // 3. N matches - all the same, also an easy case
    // 4. N matches - not all the same - confusing case
    forEach(b => {
      if (isEmpty(b.matchResults)) {
        b.algorithmResult = {result: 'N/A', createDate: undefined, failureReasons: undefined, id: b.key};
      } else if (!isEmpty(b.matchResults) && b.matchResults.length === 1) {
        const match = b.matchResults[0];
        const { createDate, failureReasons, id } = match;
        b.algorithmResult = {
          result: processMatchData(match),
          createDate,
          failureReasons,
          id
        };
      } else {
        const matchVals = flow(
          map(m => m.match),
          uniq
        )(b.matchResults);
        // All the same match value? Choose the first one
        if (matchVals.length === 1) {
          const match = b.matchResults[0];
          const { createDate, failureReasons, id } = match;
          b.algorithmResult = {
            result: processMatchData(match),
            createDate,
            failureReasons,
            id
          };
        } else {
          // Different match values? Provide a custom message
          b.algorithmResult = {result: 'Unable to determine a system match', createDate: undefined, failureReasons: ['Algorithm matched both true and false for this combination of datasets'], id: b.key};
        }
      }
    })(buckets);

    // Step 1.b: Populate translated dataUses
    const index = findIndex(d.dataUse)(rawDataUses);
    if (index >= 0) {
      bucket.dataUses = flatTranslatedDataUses[index];
    }

    // Step 1.c: Generate bucket key and label
    if (!isEmpty(bucket.dataUses)) {
      bucket.label = flow(
        map((du) => du.alternateLabel || du.code),
        join(', ')
      )(bucket.dataUses);
    } else {
      bucket.label = 'Undefined Data Use';
    }
    bucket.key = bucket.label + '_' + join('_')(bucket.datasetIds);

  })(datasets);

  // Step 2: Populate elections
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

  // Step 3: Populate votes
  forEach(bucket => {
    bucket.votes.push(processVotesForBucket(bucket.elections));
  })(buckets);

  // Step 4: Populate RUS Vote bucket with RP votes
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
  buckets.unshift({
    isRP: true,
    key: 'RUS Vote',
    votes: rpVotes
  });

  return buckets;
};
