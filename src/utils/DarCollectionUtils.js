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
  groupBy,
  flatten
} from 'lodash/fp';
import { translateDataUseRestrictionsFromDataUseArray } from '../libs/dataUseTranslation';
import {evaluateTrueString, formatDate, Notifications} from '../libs/utils';
import { Collections, Match } from '../libs/ajax';
import { processMatchData } from './VoteUtils';

export const rpVoteKey = 'RP Vote';

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
    key: rpVoteKey,
    votes: rpVotes,
    isRP: true,
  };
  processedBuckets.unshift(rpVoteData);
  return processedBuckets;
};

//Gets data access votes from this bucket by members of this user's DAC
//Note that filtering by DAC does not occur if user is viewing on admin review page
export const extractDacDataAccessVotesFromBucket = (bucket, user, adminPage) => {
  const votes = !isNil(bucket) ? bucket.votes : [];

  let memberVotesArrays = flow(
    map((voteData) => voteData.dataAccess),
    filter((dataAccessData) => !isEmpty(dataAccessData)),
    map((filteredData) => filteredData.memberVotes)
  )(votes);

  if(!adminPage) {
    memberVotesArrays = filterVoteArraysForUsersDac(memberVotesArrays, user);
  }
  return flatten(memberVotesArrays);
};

//Gets rp votes from this bucket by members of this user's DAC
//Note that filtering by DAC does not occur for users viewing through admin review page
export const extractDacRPVotesFromBucket = (bucket, user, adminPage) => {
  const votes = !isNil(bucket) ? bucket.votes : [];
  let rpVoteArrays = flow(
    map(voteData => voteData.rp),
    filter((rpData) => !isEmpty(rpData)),
    map(filteredData => filteredData.memberVotes)
  )(votes);

  if(!adminPage) {
    rpVoteArrays = filterVoteArraysForUsersDac(rpVoteArrays, user);
  }
  return flatten(rpVoteArrays);
};


//Gets final votes from this bucket by members of this user's DAC
//Note that filtering by DAC does not occur for users viewing through admin review page
export const extractDacFinalVotesFromBucket = (bucket, user, adminPage) => {
  const { votes = {}, isRP } = bucket;
  const targetAttr = isRP ? 'rp' : 'dataAccess';
  let finalVoteArrays = map((voteObj) =>
    !isEmpty(voteObj) ? voteObj[targetAttr].finalVotes : []
  )(votes);

  if(!adminPage) {
    finalVoteArrays = filterVoteArraysForUsersDac(finalVoteArrays, user);
  }
  return flatten(finalVoteArrays);
};

// Applies filter to arrays of votes grouped by election and
// only keeps arrays where at least one vote has the dacUserId of the provided user
const filterVoteArraysForUsersDac = (voteArrays = [], user) => {
  const userIdsOfVotes = (votes) => {
    return map(vote => vote.dacUserId)(votes);
  };

  return filter(
    voteArray => includes(user.dacUserId, userIdsOfVotes(voteArray))
  )(voteArrays);
};

//Gets this user's data access votes from this bucket; final and chairperson votes if isChair is true, member votes if false
//Note that filtering by DAC does not occur for users viewing through admin review page
export const extractUserDataAccessVotesFromBucket = (bucket, user, isChair = false, adminPage = false) => {
  const votes = !isNil(bucket) ? bucket.votes : [];
  let output = flow(
    map(voteData => voteData.dataAccess),
    filter((dataAccessData) => !isEmpty(dataAccessData)),
    flatMap(filteredData => adminPage || isChair ?
      concat(filteredData.finalVotes, filteredData.chairpersonVotes) :
      filteredData.memberVotes)
  )(votes);
  return !adminPage ?
    filter((vote) => vote.dacUserId === user.dacUserId)(output) :
    filter((vote) => !isNil(vote.vote))(output);
};

//Gets this user's rp votes from this bucket; chairperson votes if isChair is true, member votes if false
//Note that filtering by DAC does not occur when viewing through th eadmin raview page
export const extractUserRPVotesFromBucket = (bucket, user, isChair = false, adminPage = false) => {
  const votes = !isNil(bucket) ? bucket.votes : [];

  let output = flow(
    map(voteData => voteData.rp),
    filter((rpData) => !isEmpty(rpData)),
    flatMap(filteredData => adminPage || isChair ?
      filteredData.chairpersonVotes :
      filteredData.memberVotes)
  )(votes);

  output = !adminPage ?
    filter(vote => vote.dacUserId === user.dacUserId)(output) :
    filter(vote => !isNil(vote.vote))(output);
  return output;
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

      bucket.algorithmResult = {result: 'N/A', createDate: undefined, id: key};
    }
  })(buckets);

  const matchData = idsArr.length > 0 ? await Match.findMatchBatch(idsArr) : [];
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
    const lastUpdate = vote.updateDate || vote.createDate;
    if (isNil(matchingVote)) {
      collapsedVotes[`${vote.vote}`] = {
        dacUserId: vote.dacUserId,
        vote: vote.vote,
        voteId: vote.voteId,
        displayName: vote.displayName,
        rationales: !isNil(vote.rationale) ? [vote.rationale] : [],
        lastUpdates: !isNil(lastUpdate) ? [lastUpdate] : []
      };
    }
    else {
      addIfUnique(vote.rationale, matchingVote.rationales);
      addIfUnique(lastUpdate, matchingVote.lastUpdates);
    }
  })(votes);
  return collapsedVotes;
};

//helper method to follow collapseVotes in flow
const convertToVoteObjects = ({collapsedVotes}) => {
  return map( key => {
    const collapsedVote = collapsedVotes[key];
    const collapsedRationale = appendAll(collapsedVote.rationales);
    const collapsedDate = appendAll(map(date => formatDate(date))(collapsedVote.lastUpdates));

    return {
      dacUserId: collapsedVote.dacUserId,
      vote: collapsedVote.vote,
      voteId: collapsedVote.voteId,
      displayName: collapsedVote.displayName,
      rationale: collapsedRationale,
      lastUpdated: collapsedDate
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

export const getPI = (createUser) => {
  const createUserIsPI = flow(
    get('properties'),
    find(property => toLower(property.propertyKey) === 'isthepi'),
    get('propertyValue'),
    evaluateTrueString
  )(createUser);

  const piName = flow(
    get('properties'),
    find(property => toLower(property.propertyKey) === 'piname'),
    get('propertyValue')
  )(createUser);
  return createUserIsPI ? createUser.displayName : piName;
};

//helper function used in DarCollectionReview to update final vote on source of truth
//done to trigger re-renders on parent and child components (vote summary bar, member tab, etc.)
export const updateFinalVote = ({key, votePayload, voteIds, dataUseBuckets, setDataUseBuckets}) => {
  if(!isEmpty(votePayload)) {
    //clone entire bucket to trigger page re-render on bucket update (setDataUseBuckets)
    const clonedBuckets = cloneDeep(dataUseBuckets);
    const isRPBucket = toLower(key) === toLower(rpVoteKey);
    const targetBucket = find((bucket) => toLower(bucket.key) === toLower(key))(clonedBuckets);
    //source of votes will differ depending on the bucket (rp vs non-rp), so determine the callback function for flow here
    const voteObjectCallback = isRPBucket ? map((voteObj) => voteObj.rp) : map((voteObj) => voteObj.dataAccess);
    //to keep local source of truth updated without a fetch, we will need to update both the final and the chairperson votes
    //to make searching on the votes easier, concatenate and then flatten the finalVotes and chairpersonVotes into one array
    //NOTE: For the RP bucket the chairperson votes and the final votes are the same (RP has no final vote)
    //This was a conscious choice in order to keep processing the same between RP and non-RP buckets
    const votes = flow([
      voteObjectCallback,
      flatMap((voteObj) => concat(voteObj.finalVotes, voteObj.chairpersonVotes))
    ])(targetBucket.votes);

    //perform in place update of vote and vote rationale based on voteIds arguments
    //updates to the vote here will be reflected in clonedBuckets since the vote references are the same
    flow([
      filter((vote) => includes(vote.voteId, voteIds)),
      forEach((currentVote) => {
        const { rationale, vote } = votePayload;
        currentVote.rationale = rationale;
        currentVote.vote = vote;
      }),
    ])(votes);
    //set new bucket to trigger re-render, return clonedBuckets for debugging/testing efforts
    setDataUseBuckets(clonedBuckets);
    return clonedBuckets;
  }
};

export default {
  generatePreProcessedBucketData,
  processDataUseBuckets,
  extractDacDataAccessVotesFromBucket,
  extractDacRPVotesFromBucket,
  extractDacFinalVotesFromBucket,
  extractUserDataAccessVotesFromBucket,
  extractUserRPVotesFromBucket,
  extractDatasetIdsFromBucket,
  collapseVotesByUser,
  getPI,
  updateFinalVote,
  rpVoteKey
};