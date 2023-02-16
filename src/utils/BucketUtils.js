import {any, forEach, get, getOr, isEqual, map} from 'lodash/fp';

export const processCollection = (collection) => {
  let buckets = [];
  // Step 1: Map all datasets to distinct buckets based on data use
  // Step 2: Pull all elections for those datasets into the buckets
  const datasets = get('datasets')(collection);
  map(d => {
    // Put each dataset into a bucket. If the dataset's data use is
    // unique or "Other", then it gets its own bucket. If the data
    // use is already in a bucket, then it gets merged in.
    let bucket = {
      datasets: [d],
      dataUse: d.dataUse
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
          }
        })(buckets);
      }
    }
  })(datasets);
};
