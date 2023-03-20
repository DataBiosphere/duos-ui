import {flow, isEmpty, map, filter, find, forEach, flatMap, toLower, sortBy, isNil, includes, concat, findIndex, cloneDeep, groupBy, flatten} from 'lodash/fp';
import { formatDate, Notifications } from '../libs/utils';
import { Collections } from '../libs/ajax';

export const rpVoteKey = 'RUS Vote';

//Helper function for processDataUseBuckets, essentilly organizes votes in a dar's elections by type
export const processVotesForBucket = (darElections = []) => {
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


// Applies filter to arrays of votes grouped by election and
// only keeps arrays where at least one vote has the userId of the provided user
const filterVoteArraysForUsersDac = (voteArrays = [], user) => {
  const userIdsOfVotes = (votes) => {
    return map(vote => vote.userId)(votes);
  };

  return filter(
    voteArray => includes(user.userId, userIdsOfVotes(voteArray))
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
    filter((vote) => vote.userId === user.userId)(output) :
    filter((vote) => !isNil(vote.vote))(output);
};

//Gets this user's rp votes from this bucket; chairperson votes if isChair is true, member votes if false
//Note that filtering by DAC does not occur when viewing through th admin review page
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
    filter(vote => vote.userId === user.userId)(output) :
    filter(vote => !isNil(vote.vote))(output);
  return output;
};

//collapses votes by the same user with same vote (true/false) into a singular vote with appended rationales / dates if different
export const collapseVotesByUser = (votes) => {
  const votesGroupedByUser = groupBy(vote => vote.userId)(cloneDeep(votes));
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
        userId: vote.userId,
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
      userId: collapsedVote.userId,
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
      collectionsCopy[targetIndex] = updatedCollection;
      const updatedFilteredList = filterFn(
        searchRef.current.value,
        collectionsCopy
      );
      setCollections(collectionsCopy);
      setFilteredList(updatedFilteredList);
    }
  };

export const cancelCollectionFn =
  ({ updateCollections, role }) =>
    async ({ darCode, darCollectionId }) => {
      try {
        await Collections.cancelCollection(darCollectionId, role);
        const summary = await Collections.getCollectionSummaryByRoleNameAndId({
          id: darCollectionId,
          roleName: role,
        });
        updateCollections(summary);
        Notifications.showSuccess({ text: `Successfully canceled ${darCode}` });
      } catch (error) {
        Notifications.showError({ text: `Error canceling ${darCode}` });
      }
    };

export const openCollectionFn =
  ({ updateCollections, role }) =>
    async ({ darCode, darCollectionId }) => {
      try {
        await Collections.openElectionsById(darCollectionId);
        const summary = await Collections.getCollectionSummaryByRoleNameAndId({
          id: darCollectionId,
          roleName: role,
        });
        updateCollections(summary);
        Notifications.showSuccess({ text: `Successfully opened ${darCode}` });
      } catch (error) {
        Notifications.showError({ text: `Error opening ${darCode}` });
      }
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
  processVotesForBucket,
  extractDacDataAccessVotesFromBucket,
  extractDacRPVotesFromBucket,
  extractUserDataAccessVotesFromBucket,
  extractUserRPVotesFromBucket,
  collapseVotesByUser,
  updateFinalVote,
  rpVoteKey
};