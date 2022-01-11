import { flow, isEmpty, map, join, filter, forEach } from 'lodash/fp';
import {translateDataUseRestrictionsFromDataUseArray} from '../libs/dataUseTranslation';

//Initial step, organizes raw data for further processing in later function/steps
export const generatePreProcessedBucketData = async ({dars, datasets}) => {
  const dataUses = [];
  const buckets = {};
  const datasetBucketMap = {};
  let dataUseProcessedRestrictions;

  try {
    datasets.forEach((dataset) => {
      dataUses.push(dataset.dataUse);
    });
    dataUseProcessedRestrictions = await translateDataUseRestrictionsFromDataUseArray(dataUses);
  } catch(error) {
    throw new Error('Failed to generate data use translations');
  }

  dataUseProcessedRestrictions.forEach((restrictions, index) => {
    const dataUseLabel = flow([
      filter((restriction) => !isEmpty(restriction)),
      map((restriction) => restriction.alternateLabel || restriction.code),
      join(', ')
    ])(restrictions);

    const dataset = datasets[index];
    const { dataSetId } = dataset;
    if(isEmpty(buckets[dataUseLabel])) {
      buckets[dataUseLabel] = {
        dars: [],
        datasets: [],
        dataUse: restrictions
      };
    }
    buckets[dataUseLabel].datasets.push(datasets[index]);
    datasetBucketMap[dataSetId] = buckets[dataUseLabel];
  });

  forEach((dar) => {
    const darDatasetId = dar.data.datasetIds[0];
    const targetBucket = datasetBucketMap[darDatasetId];
    targetBucket.dars.push(dar);
  })(dars);
  return buckets;
};

//Helper function for processDataUseBuckets, essentilly organizes votes in a dar's elections by type
const processVotesForBucket = (darElections) => {
  let finalVotes =  [];
  let rpVotes = [];
  let memberVotes = [];
  let chairpersonVote;

  darElections.forEach((election) => {
    const votes = election.votes || [];
    if(election.type === 'RP') {
      rpVotes = votes;
    } else {
      forEach((vote) => {
        switch (vote.type) {
          case 'FINAL':
            finalVotes.push(vote);
            break;
          case 'Chairperson':
            if(!isEmpty(vote.vote)) {
              chairpersonVote = vote;
            }
            break;
          case 'DAC':
            memberVotes.push(vote);
            break;
          default:
            break;
        }
      })(votes);
    }
  });
  return { finalVotes, rpVotes, memberVotes, chairpersonVote };
};

//Follow up step to generatePreProcessedBucketData, function process formatted data for consumption within components
export const processDataUseBuckets = async(buckets) => {
  buckets = await buckets;
  const processedBuckets = map((bucket, key) => {
    const { dars } = bucket;
    const elections = flow([
      map((dar) => Object.values(dar.elections)),
    ])(dars);
    //NOTE: votes indexing lines up with election indexing, which lines up with dar indexing
    const votes = map(processVotesForBucket)(elections);
    return Object.assign({key, dars, elections, votes});
  })(buckets);
  return processedBuckets;
};

export default {
  generatePreProcessedBucketData,
  processDataUseBuckets
};