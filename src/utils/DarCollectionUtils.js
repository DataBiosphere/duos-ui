import {
  flow,
  isEmpty,
  map,
  join,
  filter,
  find,
  forEach,
  flatMap,
  toLower,
  sortBy,
  isNil,
  size,
  includes,
  get,
  concat,
  findIndex,
  cloneDeep,
  groupBy
} from 'lodash/fp';
import { translateDataUseRestrictionsFromDataUseArray } from '../libs/dataUseTranslation';
import {formatDate, Notifications} from '../libs/utils';
import { Collections, Match } from '../libs/ajax';
import { processMatchData } from './VoteUtils'

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
        case 'chairperson':
          targetChair.push(vote);
          break;
        case 'dac':
          targetMember.push(vote);
          break;
        default:
          break;
      }
      if(lowerCaseType === targetFinalType) {
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
    const { dars, dataUse } = bucket;
    const elections = flow([
      map((dar) => Object.values(dar.elections)),
    ])(dars);
    //votes indexing lines up with dar indexing
    const votes = map(processVotesForBucket)(elections);

    const dataUses = filter(dataUseDescription => !isEmpty(dataUseDescription))(dataUse);

    return { key, dars, elections, votes, dataUses };
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

//Gets data access votes from this bucket by members of this user's DAC
export const extractDacDataAccessVotesFromBucket = (bucket, user) => {
  const votes = !isNil(bucket) ? bucket.votes : [];

  return flow(
    map(voteData => voteData.dataAccess),
    filter((dataAccessData) => !isEmpty(dataAccessData)),
    map(filteredData => filteredData.memberVotes),
    filter(memberVotes => includes(user.dacUserId, map(memberVote => memberVote.dacUserId)(memberVotes))),
    flatMap(memberVotes => memberVotes)
  )(votes);
};

//Gets rp votes from this bucket by members of this user's DAC
export const extractDacRPVotesFromBucket = (bucket, user) => {
  const votes = !isNil(bucket) ? bucket.votes : [];

  return flow(
    map(voteData => voteData.rp),
    filter((rpData) => !isEmpty(rpData)),
    map(filteredData => filteredData.memberVotes),
    filter(memberVotes => includes(user.dacUserId, map(memberVote => memberVote.dacUserId)(memberVotes))),
    flatMap(memberVotes => memberVotes)
  )(votes);
};

//Gets this user's data access votes from this bucket; final and chairperson votes if isChair is true, member votes if false
export const extractUserDataAccessVotesFromBucket = (bucket, user, isChair) => {
  const votes = !isNil(bucket) ? bucket.votes : [];

  return flow(
    map(voteData => voteData.dataAccess),
    filter((dataAccessData) => !isEmpty(dataAccessData)),
    flatMap(filteredData => isChair ?
      concat(filteredData.finalVotes, filteredData.chairpersonVotes) :
      filteredData.memberVotes),
    filter(vote => vote.dacUserId === user.dacUserId)
  )(votes);
};

//Gets this user's rp votes from this bucket; final and chairperson votes if isChair is true, member votes if false
export const extractUserRPVotesFromBucket = (bucket, user, isChair) => {
  const votes = !isNil(bucket) ? bucket.votes : [];

  return flow(
    map(voteData => voteData.rp),
    filter((rpData) => !isEmpty(rpData)),
    flatMap(filteredData => isChair ?
      concat(filteredData.finalVotes, filteredData.chairpersonVotes) :
      filteredData.memberVotes),
    filter(vote => vote.dacUserId === user.dacUserId)
  )(votes);
};

export const getMatchDataForBuckets = async (buckets) => {
  const electionIdBucketMap = {}; //{ referenceId: bucket} }
  const idsArr = [];

  forEach((bucket) => {
    const {key, elections = []} = bucket;
    let dataAccessReferenceId;
    if(toLower(key) !== 'rp vote') {
      elections.every((darElections = []) => {
        dataAccessReferenceId = (
          find(election => toLower(election.electionType) === 'dataaccess')(darElections) || {}
        ).referenceId;
        return isNil(dataAccessReferenceId);
      });
      if(!isNil(dataAccessReferenceId)) {
        idsArr.push(dataAccessReferenceId);
        electionIdBucketMap[dataAccessReferenceId] = bucket;
      }
      bucket.algorithmResult = {result: 'N/A', createDate: 'N/A', id: key};
    }
  })(buckets);

  const matchData = await Match.findMatchBatch(idsArr);
  matchData.forEach((match) => {
    const { purpose, createDate, id } = match;
    const targetBucket = electionIdBucketMap[purpose];
    if(!isNil(targetBucket)) {
      targetBucket.algorithmResult = {
        result: processMatchData(match),
        createDate,
        id
      };
    }
  });
};

export const extractDatasetIdsFromBucket = (bucket) => {
  return flow(
    get('elections'),
    flatMap(election => flatMap(electionData => electionData)(election)),
    filter(electionData => electionData.electionType === 'DataAccess'),
    map(electionData => electionData.dataSetId)
  )(bucket);
};

//collapses votes by the same user with same vote (true/false) into a singular vote with appended rationales / dates if different
export const collapseVotesByUser = (votes) => {
  const votesGroupedByUser = groupBy(vote => vote.dacUserId)(cloneDeep(votes));
  return flatMap(userIdKey => {
    const votesByUser = votesGroupedByUser[userIdKey];
    const collapsedVotes = collapseVotes({votes: votesByUser});
    return convertToVoteObjects({collapsedVotes});
  })(Object.keys(votesGroupedByUser));
};

//helper method to collapse votes by converting them to an object with differing rationales and dates in arrays
const collapseVotes = ({votes}) => {
  const collapsedVotes = {};
  forEach( vote => {
    const matchingVote = collapsedVotes[`${vote.vote}`];
    if (isNil(matchingVote)) {
      collapsedVotes[`${vote.vote}`] = {
        dacUserId: vote.dacUserId,
        vote: vote.vote,
        voteId: vote.voteId,
        displayName: vote.displayName,
        rationales: !isNil(vote.rationale) ? [vote.rationale] : [],
        createDates: !isNil(vote.createDate) ? [vote.createDate] : []
      };
    }
    else {
      addIfUnique(vote.rationale, matchingVote.rationales);
      addIfUnique(vote.createDate, matchingVote.createDates);
    }
  })(votes);
  return collapsedVotes;
};

//helper method to follow collapseVotes in flow
const convertToVoteObjects = ({collapsedVotes}) => {
  return map( key => {
    const collapsedVote = collapsedVotes[key];
    const collapsedRationale = appendAll(collapsedVote.rationales);
    const collapsedDate = appendAll(map(date => formatDate(date))(collapsedVote.createDates));

    return {
      dacUserId: collapsedVote.dacUserId,
      vote: collapsedVote.vote,
      voteId: collapsedVote.voteId,
      displayName: collapsedVote.displayName,
      rationale: collapsedRationale,
      createDate: collapsedDate
    };
  })(Object.keys(collapsedVotes));
};

const appendAll = (values) => {
  let result = '';
  forEach(value => {
    result += `${value}\n`;
  })(values);
  return !isEmpty(result) ? result : null;
};

const addIfUnique = (newValue, existingValues) => {
  if(!isNil(newValue) && !includes(newValue, existingValues)) {
    existingValues.push(newValue);
  }
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

export const cancelCollectionFn = ({updateCollections, role}) =>
  async ({ darCode, darCollectionId }) => {
    try {
      const canceledCollection = await Collections.cancelCollection(
        darCollectionId,
        role
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
  processDataUseBuckets,
  extractDacDataAccessVotesFromBucket,
  extractDacRPVotesFromBucket,
  extractUserDataAccessVotesFromBucket,
  extractUserRPVotesFromBucket,
  extractDatasetIdsFromBucket,
  collapseVotesByUser
};