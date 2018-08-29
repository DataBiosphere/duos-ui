import _ from 'lodash/fp'
import { Storage } from './storage'
import { Config } from './config';

// Storage Variables
// const CurrentUser = "CurrentUser"; // System user
// const GoogleUser = "Gapi"; // Google user info, including token
// const UserIsLogged = "isLogged"; // User log status flag

export const User = {

  getByEmail: async email => {
    const url = `${await Config.getApiUrl()}/dacuser/${email}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },
  list: async () => {
    const url = `${await Config.getApiUrl()}/dacuser`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  create: async user => {
    const url = `${await Config.getApiUrl()}/dacuser`;
    const res = await fetchOk(url, _.mergeAll([ Config.authOpts(), Config.jsonBody(user), { method: 'POST' }]));
    return res.json();
  },

  update: async(user, userId) => {
    const url = `${await Config.getApiUrl()}/dacuser/${userId}`;
    const res = await fetchOk(url, _.mergeAll([ Config.authOpts(), Config.jsonBody(user), { method: 'PUT' }]));
    return res.json();
  },

  updateName: async(body, userId) => {
    const url = `${await Config.getApiUrl()}/dacuser/name/${userId}`;
    const res = await fetchOk(url, _.mergeAll([ Config.authOpts(), Config.jsonBody(body), { method: 'PUT' }]));
    return res.json();
  },

  validateDelegation: async(role, dacUser) => {
    const url = `${await Config.getApiUrl()}/dacuser/validateDelegation?role=` + role;
    const res = await fetchOk(url, _.mergeAll([ Config.authOpts(), Config.jsonBody(dacUser), { method: 'POST' }]));
    return res.json();
  },

  registerUser: async user => {
    const url = `${await Config.getApiUrl()}/user`;
    const res = await fetchOk(url, _.mergeAll([ Config.authOpts(), Config.jsonBody(user), { method: 'POST' }]));
    return res.json();
  },

  registerStatus: async(userRoleStatus, userId) => {
    const url = `${await Config.getApiUrl()}/dacuser/status/${userId}`;
    const res = await fetchOk(url, _.mergeAll([ Config.authOpts(), Config.jsonBody(userRoleStatus), { method: 'PUT' }]));
    return res.json();
  },

  findUserStatus:  async userId => {
    const url = `${await Config.getApiUrl()}/dacuser/status/${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  }
};

export const Votes = {
  find: async(consentId, voteId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/vote/${voteId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  listAllVotes: async (consentId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/vote`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  postVote: async(consentId, voteId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/vote/${voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'POST'}]));
    return res.json();
  },

  updateVote: async(consentId, voteId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/vote/${voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'PUT'}]));
    return res.json();
  },

  findDar: async(requestId, voteId) => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote/${voteId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  postDarVote: async(requestId, voteId, vote) => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote/${voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(vote), {method: 'POST'}]));
    return res.json();
  },

  finalAccessDarVote: async(requestId, voteId, vote) => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote/${voteId}/final/`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(vote), {method: 'POST'}]));
    return res.json();
  },

  createDarVote: async(requestId, voteId, vote) => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote/${voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(vote), {method: 'POST'}]));
    return res.json();
  },

  updateDarVote: async(requestId, voteId, vote) => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote/${voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(vote), {method: 'PUT'}]));
    return res.json();
  },

  finalDarVote: async requestId => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote/final`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  findDarFinal: async(requestId) => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote/final`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  allDarVotes: async(requestId) => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },
  // @Path("{api : (api/)?}dataRequest/{requestId}/vote")
  deleteVote: async (requestId, id) => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote/${id}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'DELETE'}]));
    return res.json();
  },

  deleteVotes: async (requestId) => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote/`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'DELETE'}]));
    return res.json();
  },
};

export const DarCases = {
  darPendingCases: async(dacUserId) => {
    const url = `${await Config.getApiUrl()}/dataRequest/cases/pending/${dacUserId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  darPendingCasesDataOwner: async(dataOwnerId) => {
    const url = `${await Config.getApiUrl()}/dataRequest/cases/pending/dataOwner/${dataOwnerId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  darSummaryCases: async type => {
    const url = `${await Config.getApiUrl()}/datarequest/cases/summary/${type}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  darMatchSummary: async () => {
    const url = `${await Config.getApiUrl()}/datarequest/cases/matchsummary/`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  describeClosedElections: async () => {
    const url = `${await Config.getApiUrl()}/datarequest/cases/closed/`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },
};

export const ConsentCases = {
  pending: async dacUserId => {
    const url = `${await Config.getApiUrl()}/consent/cases/pending/${dacUserId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  summary: async() => {
    const url = `${await Config.getApiUrl()}/consent/cases/summary`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  summaryDetailFile: async(fileType) => {
    const url = `${await Config.getApiUrl()}/consent/cases/summary/file?fileType=${fileType}`;
    return getFile(url);
  },

  describeClosedElections: async dacUserId => {
    const url = `${await Config.getApiUrl()}/consent/cases/closed`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  }
};

export const Files = {

  // Get DUL File requires another field for fileName to be downloaded
  // this field is required in the component
  getDulFile: async(consentId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}`;
    return getFile(url);
  },

  // fileName
  getDulFileByElectionId: async (consentId, electionId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/dul?electionId=${electionId}`;
    return getFile(url);
  },

  // fileName
  getOntologyFile: async (fileName, fileUrl) => {
    const encodeURI = encodeURIComponent(fileUrl);
    const url = `${await Config.getApiUrl()}/ontology/file?fileUrl=${encodeURI}&fileName=${fileName}`;
    return getFile(url);
  },

  // fileName
  getApprovedUsersFile: async (fileName, dataSetId) => {
    const url = `${await Config.getApiUrl()}/dataset/${dataSetId}/approved/users`;
    return getFile(url);
  },

  getDARFile: async (darId) => {
    // DataRequestReportsResource
    const url = `${await Config.getApiUrl()}/dataRequest/${darId}/pdf`;
    return getFile(url);
  },

  getByEmail: async email => {
    const url = `${await Config.getApiUrl()}/dacuser/${email}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  list: async () => {
    const url = `${await Config.getApiUrl()}/dacuser`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  create: async user => {
    const url = `${await Config.getApiUrl()}/dacuser`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(user), {method: 'POST'}]));
    return res.json();
  },

  update: async (user, userId) => {
    const url = `${await Config.getApiUrl()}/dacuser/${userId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(user), {method: 'PUT'}]));
    return res.json();
  },

  updateName: async (body, userId) => {
    const url = `${await Config.getApiUrl()}/dacuser/name/${userId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(body), {method: 'PUT'}]));
    return res.json();
  },

  validateDelegation: async (role, dacUser) => {
    const url = `${await Config.getApiUrl()}/dacuser/validateDelegation?role=` + role;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(dacUser), {method: 'POST'}]));
    return res.json();
  },

  registerUser: async user => {
    const url = `${await Config.getApiUrl()}/user`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(user), {method: 'POST'}]));
    return res.json();
  },

  registerStatus: async (userRoleStatus, userId) => {
    const url = `${await Config.getApiUrl()}/dacuser/status/${userId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(userRoleStatus), {method: 'PUT'}]));
    return res.json();
  },

  getUserStatus: async userId => {
    const url = `${await Config.getApiUrl()}/dacuser/status/${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  }
};

export const Summary = {
  getFile: async (URI) => {
    const url = `${await Config.getApiUrl()}${URI}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.blob();
  }
};

export const Researcher = {
  getResearcherProfile: async userId => {
    const url = `${await Config.getApiUrl()}/researcher/${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  list: async (userId) => {
    const url = `${await Config.getApiUrl()}/researcher/${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  update: async (userId, validate, researcherProperties) => {
    const url = `${await Config.getApiUrl()}/researcher/${userId}?validate=${validate}`;
    const res = await fetchOk(url, _.mergeAll([ Config.authOpts(), Config.jsonBody(researcherProperties), { method: 'PUT' }]));
    return res.json();
  },

  register: async (userId, validate, researcherProperties) => {
    const url = `${await Config.getApiUrl()}/researcher/${userId}?validate=${validate}`;
    const res = await fetchOk(url, _.mergeAll([ Config.authOpts(), Config.jsonBody(researcherProperties), { method: 'POST' }]));
    return res.json();
  },
};

export const DataSet = {

  create: async (file, overwrite, userId) => {
    const url = `${await Config.getApiUrl()}/dataset/${userId}?overwrite=${overwrite}`;
    let formData = new FormData();
    formData.append("data", new Blob([file], { type: 'text/plain' }));
    const res = await fetchOk(url, _.mergeAll([ Config.authOpts(), formData, { method: 'POST' }]));
    return res.json();
  },

  list: async dacUserId => {
    const url = `${await Config.getApiUrl()}/dataset?dacUserId=${dacUserId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  getByDataSetId: async dataSetId => {
    const url = `${await Config.getApiUrl()}/dataset/${dataSetId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  getDictionary: async() => {
    const url = `${await Config.getApiUrl()}/dataset/dictionary`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  download: async(objectIdList) => {
    const url = `${await Config.getApiUrl()}/dataset/download`;
    const res = await fetchOk(url, _.mergeAll([ Config.authOpts(), Config.jsonBody(objectIdList), { method: 'POST' }]));
    return res.json();
  },

  delete: async(datasetObjectId, dacUserId) => {
    const url = `${await Config.getApiUrl()}/dataset/${datasetObjectId}/${dacUserId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return res.json();
  },

  disableDataset: async(datasetObjectId, active) => {
    const url = `${await Config.getApiUrl()}/dataset/disable/${datasetObjectId}/${active}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return res.json();
  },

  reviewDataSet: async(dataSetId, needsApproval) => {
    const url = `${await Config.getApiUrl()}/dataset?dataSetId=${dataSetId}&needsApproval=${needsApproval}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'PUT' }]));
    return res.json();
  }
};

export const Consent = {

  ConsentResource: async consentId => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  ConsentDulResource: async consentId => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/dul`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  getConsentManage: async () => {
    const url = `${await Config.getApiUrl()}/consent/manage`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  getInvalidConsentRestriction: async () => {
    const url = `${await Config.getApiUrl()}/consent/invalid`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  create: async (consent) => {
    consent.requiresManualReview = false;
    consent.useRestriction = JSON.parse(consent.useRestriction);
    consent.dataUse = JSON.parse(consent.dataUse);
    const url = `${await Config.getApiUrl()}/consent`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(consent), {method: 'POST'}]));
    return res.json();
  },

  update: async (consent) => {
    consent.requiresManualReview = false;
    consent.useRestriction = JSON.parse(consent.useRestriction);
    consent.dataUse = JSON.parse(consent.dataUse);
    const url = `${await Config.getApiUrl()}/consent`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(consent), {method: 'PUT'}]));
    return res.json();
  }
};

export const Election = {

  create: async (consentId, election) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/election`;
    const res = await fetchOk(url, _.mergeAll([Config.jsonBody(election), Config.authOpts(), {method: 'POST'}]));
    return res.json();
  },

  describe: async (consentId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/election`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  delete: async (consentId, id) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/election/${id}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'DELETE'}]));
    return res.json();
  },

  downloadDatasetVotesForDARElection: async (requestId) => {
    const url = `${await Config.getApiUrl()}/dataRequest/${requestId}/election/dataSetVotes`;
    return getFile(url);
  },

  electionUpdateResource: async (electionId) => {
    const url = `${await Config.getApiUrl()}/election/${electionId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  electionUpdateResourceUpdate: async (electionId, document)  => {
    const url = `${await Config.getApiUrl()}/election/${electionId}`;
    const res = await fetchOk(url, _.mergeAll(Config.authOpts(), document, {method: 'PUT'}));
    return res.json();
  },

  electionConsentResource: async (requestElectionId) => {
    const url = `${await Config.getApiUrl()}/election/consent/${requestElectionId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  lastElectionReview: async (electionId) => {
    const url = `${await Config.getApiUrl()}/electionReview/last/${electionId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  electionReviewConsent: async (consentId) => {
    const url = `${await Config.getApiUrl()}/electionReview/consent/${consentId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  electionReview: async (electionId) => {
    const url = `${await Config.getApiUrl()}/electionReview/${electionId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  electionReviewResource: async (referenceId, type) => {
    const url = `${await Config.getApiUrl()}/electionReview?referenceId=${referenceId}&type=${type}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  dataAccessElectionReviewResource: async (electionId, isFinalAccess) => {
    const url = `${await Config.getApiUrl()}/electionReview/access/${electionId}?isFinalAccess=${isFinalAccess}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  RPElectionReviewResource: async (electionId, isFinalAccess) => {
    const url = `${await Config.getApiUrl()}/electionReview/rp/${electionId}?isFinalAccess=${isFinalAccess}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  ElectionReviewedConsents: async () => {
    const url = `${await Config.getApiUrl()}/consent/cases/closed`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  DataSetElection: async () => {
    const url = `${await Config.getApiUrl()}/election/checkdataset`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  DarElectionResourceGet: async (requestId) => {
    const url = `${await Config.getApiUrl()}/dataRequest/${requestId}/election`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  DarElectionResourcePost: async (requestId) => {
    let postElection = {};
    postElection.status = 'Open';
    postElection.finalAccessVote = false;

    const url = `${await Config.getApiUrl()}/dataRequest/${requestId}/election`;
    const res = await fetchOk(url, _.mergeAll([Config.jsonBody(postElection), Config.authOpts(), {method: 'POST'}]));
    return res.json();
  },

  DarElectionDatasetVotes: async (requestId) => {
    const url = `${await Config.getApiUrl()}/dataRequest/${requestId}/election/dataSetVotes`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  ElectionVote: async (voteId) => {
    const url = `${await Config.getApiUrl()}/election/vote/${voteId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },
};

export const DUL = {
  // DataUseLetterResource

  create: async (id) => {
    const url = `${await Config.getApiUrl()}/consent/${id}/dul`;
  },
};

export const DAR = {
  // DataAccessRequestResource

  postDar: async dar => {
    const url = `${await Config.getApiUrl()}/dar`;
    const res = await fetchOk(url, _.mergeAll([ Config.authOpts(), Config.jsonBody(dar), { method: 'POST' }]));
    return res.json();
  },

  cancel: async referenceId => {
    const url = `${await Config.getApiUrl()}/dar/cancel/${referenceId}`;
    const res = await fetchOk(url, _.mergeAll([ Config.authOpts(), { method: 'PUT' } ]));
    return res.json();
  },

  describeManage: async userId => {
    const url = `${await Config.getApiUrl()}/dar/manage?userId=${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  dataAccessInvalidUseRestriction: async () => {
    const url = `${await Config.getApiUrl()}/dar/invalid`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  typeAheadDatasetsResource: async partial => {
    const url = `${await Config.getApiUrl()}/dataset/autocomplete/${partial}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  darConsent: async id => {
    const url = `${await Config.getApiUrl()}/dar/find/${id}/consent`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  modalSummary: async id => {
    const url = `${await Config.getApiUrl()}/dar/modalSummary/${id}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },
};

const fetchOk = async (...args) => {
  const res = await fetch(...args);
  return res.ok ? res : Promise.reject(res);
};

const getFile = async (URI) => {
  const res = await fetchOk(URI, Config.authOpts());
  return res.blob();
};
