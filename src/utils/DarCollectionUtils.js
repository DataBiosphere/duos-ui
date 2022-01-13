import { flow, isEmpty, map, join, filter, forEach, find, isNil, sortBy, lowerCase } from 'lodash/fp';
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
    dataUseProcessedRestrictions = await (await translateDataUseRestrictionsFromDataUseArray(dataUses));
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
    const targetType = election.electionType === 'RP' ? 'chairperson' : 'final';
    const targetArray = election.electionType === 'RP' ? rpVotes : finalVotes;
    const filteredFinalVotes = flow([
      sortBy((vote) => vote.createdate),
      filter((vote) => lowerCase(vote.type) === targetType)
    ])(votes);
    const castedFinalVote = find((vote) => !isNil(vote.vote))(filteredFinalVotes);

    if(isEmpty(castedFinalVote)) {
      targetArray.concat(filteredFinalVotes).flat(1);
    } else {
      targetArray.push(castedFinalVote);
    }
    forEach((vote) => {
      switch (vote.type) {
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
  });
  return { finalVotes, rpVotes, memberVotes, chairpersonVote };
};

//Follow up step to generatePreProcessedBucketData, function process formatted data for consumption within components
export const processDataUseBuckets = async(buckets) => {
  buckets = await buckets;
  const processedBuckets = map.convert({cap:false})((bucket, key) => {
    const { dars } = bucket;
    const elections = flow([
      map((dar) => Object.values(dar.elections)),
    ])(dars);
    //votes indexing lines up with dar indexing
    const votes = map(processVotesForBucket)(elections);
    return { key, dars, elections, votes };
  })(buckets);
  return processedBuckets;
};

export default {
  generatePreProcessedBucketData,
  processDataUseBuckets
};