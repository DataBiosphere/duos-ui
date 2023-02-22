import {any, compact, findIndex, flow, forEach, get, getOr, includes, isEqual, map, toLower, uniq, values} from 'lodash/fp';

import {processVotesForBucket} from './DarCollectionUtils';
import {Match} from '../libs/ajax';
import {translateDataUseRestrictionsFromDataUseArray} from '../libs/dataUseTranslation';

/**
 * TODO: Prepend a rus bucket, add key
 * @param collection The Data Access Request Collection
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
  // Step 2: Pull all elections for those datasets into the buckets
  // Step 3: Pull all votes up to a top level bucket field for easier iteration


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

    // Step 1.a
    // Find the match results for this bucket
    forEach(m => {
      if (toLower(d.datasetIdentifier) === toLower(m.consent)) {
        bucket.matchResults.push(m);
      }
    })(matchData);

    // Step 1.b
    // Find the translation for this dataset's dataUse
    const index = findIndex(d.dataUse)(rawDataUses);
    if (index >= 0) {
      bucket.dataUses = flatTranslatedDataUses[index];
    }

  })(datasets);

  // Step 2
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

  // Step 3
  forEach(bucket => {
    bucket.votes.push(processVotesForBucket(bucket.elections));
  })(buckets);

  return buckets;
};
