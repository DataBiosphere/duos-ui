import { flow, isEmpty, flatMap, map } from 'lodash/fp';
import {translateDataUseRestrictionsFromDataUseArray} from '../libs/dataUseTranslation';

export const generateDataUseBucketData = async (dars, datasets) => {
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
    const dataUseLabel = restrictions.map((restriction) => restriction.alternateLabel || restriction.code).join(', ');
    const dataset = datasets[index];
    const { dataSetId } = dataset;
    if(isEmpty(buckets[dataUseLabel])) {
      buckets[dataUseLabel] = {
        dars: [],
        dataset: [],
        dataUse: restrictions
      };
    }
    buckets[dataUseLabel].datasets.push(datasets[index]);
    datasetBucketMap[dataSetId] = buckets[dataUseLabel];
  });

  dars.forEach((dar) => {
    const darDatasetId = dar.data.datasetIds[0];
    const targetBucket = datasetBucketMap[darDatasetId];
    targetBucket.dars.push(dar);
  });

  return buckets;
};

export const processDataUseBucketData = (buckets) => {
  const processedBuckets = buckets.map((bucket, key) => {
    const { dars } = bucket;
    const elections = flow([
      map((dar) => dar.elections),
      flatMap((electionArray) => electionArray)
    ])(dars);
    const votes = flow([
      map((election) => election.votes),
      flatMap((voteArray) => voteArray)
    ])(elections);

    let finalVotes = [];
    let rpVotes = [];
    let memberVotes = [];
    let chairpersonVote;

    votes.forEach(({type, vote}) => {
      switch (type) {
        case 'FINAL':
          finalVotes.push(vote);
          break;
        case 'RP':
          rpVotes.push(vote);
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
    });

    return { key, dars, elections, finalVotes, rpVotes, memberVotes, chairpersonVote };
  });
  return processedBuckets;
};

export default {
  generateDataUseBucketData,
  processDataUseBucketData
};