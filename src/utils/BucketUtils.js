import {any, forEach, get, getOr, includes, isEqual, map, values} from 'lodash/fp';

import {processVotesForBucket} from './DarCollectionUtils';

export const binCollectionToBuckets = (collection) => {
  let buckets = [];
  // Step 1: Map all datasets to distinct buckets based on data use
  // Step 2: Pull all elections for those datasets into the buckets
  // Step 3: Pull all votes up to a top level bucket field for easier iteration

  // Step 1
  const datasets = get('datasets')(collection);
  map(d => {
    // Put each dataset into a bucket. If the dataset's data use is
    // unique or "Other", then it gets its own bucket. If the data
    // use is already in a bucket, then it gets merged in.
    let bucket = {
      datasets: [d],
      datasetIds: [d.dataSetId],
      dataUse: d.dataUse,
      elections: [],
      votes: []
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
