import { flow, isEmpty, map, join, filter, forEach, flatMap, toLower, sortBy, isNil, size, findIndex, cloneDeep} from 'lodash/fp';
import {translateDataUseRestrictionsFromDataUseArray} from '../libs/dataUseTranslation';
import { Notifications } from '../libs/utils';
import { Collections } from '../libs/ajax';


//Initial step, organizes raw data for further processing in later function/steps
export const generatePreProcessedBucketData = async ({dars, datasets}) => {
  const dataUses = [];
  const buckets = {};
  const datasetBucketMap = {};
  let dataUseProcessedRestrictions;
  try {
    datasets.forEach((dataset) => {
      dataUses.push(dataset.dataUse || {});
    });
    dataUseProcessedRestrictions = await translateDataUseRestrictionsFromDataUseArray(dataUses);
  } catch(error) {
    throw new Error('Failed to generate data use translations');
  }
  //using restriction names, generate label for bucket
  dataUseProcessedRestrictions.forEach((restrictions, index) => {
    let dataUseLabel = flow([
      filter((restriction) => !isEmpty(restriction)),
      map((restriction) => restriction.alternateLabel || restriction.code),
      join(', ')
    ])(restrictions);

    if(dataUseLabel.length < 1) {
      dataUseLabel = 'Undefined Data Use';
    }

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
    chairpersonVotes: [],
    agreementVotes: []
  };

  darElections.forEach((election) => {
    const {electionType, votes = []} = election;
    let dateSortedVotes = sortBy((vote) => vote.updateDate)(votes);
    let targetFinal, targetChair, targetMember, targetFinalType;
    const {agreementVotes} = dataAccess;

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
      switch (lowerCaseType) {
        case 'agreement':
          agreementVotes.push(vote);
          break;
        case 'chairperson':
          targetChair.push(vote);
          break;
        case 'dac':
          targetMember.push(vote);
          break;
        default:
          break;
      }
      if(lowerCaseType === targetFinalType && !isNil(vote.vote)) {
        targetFinal.push(vote);
      }
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

//Admin only helper function
export const checkIfOpenableElectionPresent = (dars) => {
  const darCount = size(dars);
  const darsWithElections = filter((dar) => !isEmpty(dar.elections))(dars);
  if(darsWithElections.length !== darCount) { return true; }
  const elections = flow(
    map(dar => dar.elections),
    flatMap(electionMap => Object.values(electionMap)), //pulling out the individual elections from the object/map
    filter(election => election.status !== 'Open')
  )(dars);
  return elections.length > 0;
};

//Admin only helper function
export const checkIfCancelableElectionPresent = (dars) => {
  const elections = flow(
    map(dar => dar.elections),
    flatMap(electionMap => Object.values(electionMap)),
    filter(election => election.status === 'Open')
  )(dars);
  return !isEmpty(elections);
};

export const updateCollectionFn = ({collections, filterFn, searchRef, setCollections, setFilteredList}) =>
  (updatedCollection) => {
    const targetIndex = findIndex(
      (collection) =>
        collection.darCollectionId === updatedCollection.darCollectionId
    )(collections);
    if (targetIndex < 0) {
      Notifications.showError({
        text: `Error: Could not find ${updatedCollection.darCode} collection`,
      });
    } else {
      const collectionsCopy = cloneDeep(collections);
      //NOTE: update does not return datasets, so a direct collection update will mess up the datasets column
      //That's not a big deal, we know the only things updated were the elections, so we can still update the dars (sicne elections are nested inside)
      collectionsCopy[targetIndex].dars = updatedCollection.dars;
      const updatedFilteredList = filterFn(
        searchRef.current.value,
        collectionsCopy
      );
      setCollections(collectionsCopy);
      setFilteredList(updatedFilteredList);
    }
  };

export const cancelCollectionFn = ({updateCollections}) =>
  async ({ darCode, darCollectionId }) => {
    try {
      const canceledCollection = await Collections.cancelCollection(
        darCollectionId,
        'admin'
      );
      updateCollections(canceledCollection);
      Notifications.showSuccess({ text: `Successfully canceled ${darCode}` });
    } catch (error) {
      Notifications.showError({ text: `Error canceling ${darCode}` });
    }
  };

export const openCollectionFn = ({updateCollections}) =>
  async ({ darCode, darCollectionId }) => {
    try {
      const openCollection = await Collections.openElectionsById(darCollectionId);
      updateCollections(openCollection);
      Notifications.showSuccess({ text: `Successfully opened ${darCode}` });
    } catch (error) {
      Notifications.showError({ text: `Error opening ${darCode}` });
    }
  };

export default {
  generatePreProcessedBucketData,
  processDataUseBuckets
};