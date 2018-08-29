import _ from 'lodash/fp'
import { Config } from './config';

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
    const res = await fetchOk(url, _.mergeAll([
      Config.authOpts(),
      Config.jsonBody(user),
      { method: 'POST' }
    ]));
    return res.json();
  },

  update: async(user, userId) => {
    const url = `${await Config.getApiUrl()}/dacuser/${userId}`;
    const res = await fetchOk(url, _.mergeAll([
      Config.authOpts(),
      Config.jsonBody(user),
      { method: 'PUT' }
    ]));
    return res.json();
  },

  updateName: async(body, userId) => {
    const url = `${await Config.getApiUrl()}/dacuser/name/${userId}`;
    const res = await fetchOk(url, _.mergeAll([
      Config.authOpts(),
      Config.jsonBody(body),
      { method: 'PUT' }
    ]));
    return res.json();
  },

  validateDelegation: async(role, dacUser) => {
    const url = `${await Config.getApiUrl()}/dacuser/validateDelegation?role=` + role;
    const res = await fetchOk(url, _.mergeAll([
      Config.authOpts(),
      Config.jsonBody(dacUser),
      { method: 'POST' }
    ]));
    return res.json();
  },

  registerUser: async user => {
    const url = `${await Config.getApiUrl()}/user`;
    const res = await fetchOk(url, _.mergeAll([
      Config.authOpts(),
      Config.jsonBody(user),
      { method: 'POST' }
    ]));
    return res.json();
  },

  registerStatus: async(userRoleStatus, userId) => {
    const url = `${await Config.getApiUrl()}/dacuser/status/${userId}`;
    const res = await fetchOk(url, _.mergeAll([
      Config.authOpts(),
      Config.jsonBody(userRoleStatus),
      { method: 'PUT' }
    ]));
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

  getById: async consentId => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  getDUL: async consentId => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/dul`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  getConsentManage: async (file, overwrite, userId) => {
    const url = `${await Config.getApiUrl()}/consent/manage`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  getInvalidConsentRestriction: async dacUserId => {
    const url = `${await Config.getApiUrl()}/consent/invalid`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  create: async consent => {
    consent.requiresManualReview = false;
    consent.useRestriction = JSON.parse(consent.useRestriction);
    consent.dataUse = JSON.parse(consent.dataUse);
    const url = `${await Config.getApiUrl()}/consent`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(consent), {method: 'POST'}]));
    return res.json();
  },

  update: async consent => {
    consent.requiresManualReview = false;
    consent.useRestriction = JSON.parse(consent.useRestriction);
    consent.dataUse = JSON.parse(consent.dataUse);
    const url = `${await Config.getApiUrl()}/consent`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(consent), {method: 'PUT'}]));
    return res.json();
  }
};

const fetchOk = async (...args) => {
  const res = await fetch(...args);
  return res.ok ? res : Promise.reject(res);
};

const getFile = async (URI) => {
  const res = await fetchOk(URI, Config.authOpts());
  return res.blob();
};
