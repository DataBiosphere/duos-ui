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
    map((votes) => votes.rp)
  ])(processedBuckets);
  const finalRPVotes = flatMap((votes) => votes.finalVotes)(rpVotes);
  const chairRPVotes = flatMap((votes) => votes.chairpersonVotes)(rpVotes);
  const memberRPVotes = flatMap((votes) => votes.memberVotes)(rpVotes);
  const rpVoteData = {
    key: 'RP Vote',
    votes: [{
      rp: {
        finalVotes: finalRPVotes,
        chairpersonVotes: chairRPVotes,
        memberVotes: memberRPVotes
      }
    }],
    isRP: true,
  };
  processedBuckets.unshift(rpVoteData);
  return processedBuckets;
};

export default {
  generatePreProcessedBucketData,
  processDataUseBuckets
};