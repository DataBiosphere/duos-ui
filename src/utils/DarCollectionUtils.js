import { flow, isEmpty, map, join, filter, forEach, flatMap, toLower, sortBy, isNil } from 'lodash/fp';
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
  //using restriction names, generate label for bucket
  dataUseProcessedRestrictions.forEach((restrictions, index) => {
    const dataUseLabel = flow([
      filter((restriction) => !isEmpty(restriction)),
      map((restriction) => restriction.alternateLabel || restriction.code),
      join(', ')
    ])(restrictions);

    //check if label already exists in map. If so, add current element to said collection
    //otherwise generate new bucket for map and add element afterwards
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
  const rp =  {
    chairpersonVotes: [],
    memberVotes : [],
    finalVotes: []
  };
  const dataAccess = {
    finalVotes: [],
    memberVotes: [],
    chairpersonVotes: []
  };

  darElections.forEach((election) => {
    const {electionType, votes = []} = election;
    let dateSortedVotes = sortBy((vote) => vote.updateDate)(votes);
    let targetFinal, targetChair, targetMember, targetFinalType;
    if(electionType === 'RP') {
      targetFinalType = 'chairperson';
      targetMember = rp.memberVotes;
      targetChair = rp.chairpersonVotes;
      targetFinal = rp.finalVotes;
    } else {
      targetFinalType = 'final';
      targetMember = dataAccess.memberVotes;
      targetChair = dataAccess.chairpersonVotes;
      targetFinal = dataAccess.finalVotes;
    }
    forEach(vote => {
      const lowerCaseType = toLower(vote.type);
      if(lowerCaseType === targetFinalType && !isNil(vote.vote)) {
        targetFinal.push(vote);
      }
      const targetArray = lowerCaseType === 'chairperson' ? targetChair : targetMember;
      targetArray.push(vote);
    })(dateSortedVotes);
  });
  return { rp, dataAccess };
};

//Follow up step to generatePreProcessedBucketData, function process formatted data for consumption within components
export const processDataUseBuckets = async(buckets) => {
  buckets = await buckets;
  //convert alters the lodash/fp map definition by uncapping the function arguments, allowing access to index
  const processedBuckets = map.convert({cap:false})((bucket, key) => {
    const { dars } = bucket;
    const elections = flow([
      map((dar) => Object.values(dar.elections)),
    ])(dars);
    //votes indexing lines up with dar indexing
    const votes = map(processVotesForBucket)(elections);
    return { key, dars, elections, votes };
  })(buckets);

  //Process custom RP Vote bucket for VoteSummary
  const rpVotes = flow([
    flatMap((bucket) => bucket.votes),
    map((votes) => ({rp:votes.rp}))
  ])(processedBuckets);

  const rpVoteData = {
    key: 'RP Vote',
    votes: rpVotes,
    isRP: true,
  };
  processedBuckets.unshift(rpVoteData);
  return processedBuckets;
};

export default {
  generatePreProcessedBucketData,
  processDataUseBuckets
};