import _ from 'lodash/fp'
import { Config } from './config';

const dataTemplate = {
  accessTotal: [
    ['Results', 'Votes'],
    ['Reviewed cases', 0],
    ['Pending cases', 0]
  ],
  accessReviewed: [
    ['Results', 'Votes'],
    ['Yes', 0],
    ['No', 0]
  ],
  dulTotal: [
    ['Results', 'Votes'],
    ['Reviewed cases', 0],
    ['Pending cases', 0]
  ],
  dulReviewed: [
    ['Results', 'Votes'],
    ['Yes', 0],
    ['No', 0]
  ],
  RPTotal: [
    ['Results', 'Votes'],
    ['Reviewed cases', 0],
    ['Pending cases', 0]
  ],
  RPReviewed: [
    ['Results', 'Votes'],
    ['Yes', 0],
    ['No', 0]
  ],
  VaultReviewed: [
    ['Results', 'Votes'],
    ['Yes', 0],
    ['No', 0]
  ],
  Agreement: [
    ['Results', 'Votes'],
    ['Agreement', 0],
    ['Disagreement', 0]
  ]
};

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

  findUserStatus: async userId => {
    const url = `${await Config.getApiUrl()}/dacuser/status/${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    const user = await res.json();
    return user;
  }
};

export const Votes = {

  find: async (consentId, voteId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/vote/${voteId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  listAllVotes: async (consentId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/vote`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  postVote: async (consentId, voteId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/vote/${voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'POST'}]));
    return res.json();
  },

  updateVote: async (consentId, voteId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/vote/${voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'PUT'}]));
    return res.json();
  },

  findDar: async (requestId, voteId) => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote/${voteId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  getDarVote: async (requestId, voteId) => {
    const url = `${await Config.getApiUrl()}/dataRequest/${requestId}/vote/${voteId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  postDarVote: async (requestId, vote) => {
    const postObject = {};
    postObject.vote = vote.vote;
    postObject.dacUserId = vote.dacUserId;
    postObject.rationale = vote.rationale;
    postObject.hasConcerns = vote.hasConcerns;

    const url = `${await Config.getApiUrl()}/dataRequest/${requestId}/vote/${vote.voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(postObject), { method: 'POST' }]));
    return res.json();
  },

  finalAccessDarVote: async (requestId, voteId, vote) => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote/${voteId}/final/`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(vote), {method: 'POST'}]));
    return res.json();
  },

  createDarVote: async (requestId, voteId, vote) => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote/${voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(vote), {method: 'POST'}]));
    return res.json();
  },

  updateDarVote: async (requestId, vote) => {
    const postObject = {};
    postObject.vote = vote.vote;
    postObject.dacUserId = vote.dacUserId;
    postObject.rationale = vote.rationale;
    postObject.hasConcerns = vote.hasConcerns;

    const url = `${await Config.getApiUrl()}/dataRequest/${requestId}/vote/${vote.voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(postObject), { method: 'PUT' }]));
    return res.json();
  },

  finalDarVote: async requestId => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote/final`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  findDarFinal: async (requestId) => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote/final`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  allDarVotes: async (requestId) => {
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

  darPendingCases: async (dacUserId) => {
    const url = `${await Config.getApiUrl()}/dataRequest/cases/pending/${dacUserId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  darPendingCasesDataOwner: async (dataOwnerId) => {
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

  summary: async () => {
    const url = `${await Config.getApiUrl()}/consent/cases/summary`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  summaryDetailFile: async (fileType) => {
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
  getDulFile: async (consentId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/dul`;
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
    let blob = await getFile(url);
    const ontologyUrl = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = ontologyUrl;
    a.download = fileName;
    a.click();
  },

  // fileName
  getApprovedUsersFile: async (fileName, dataSetId) => {
    const url = `${await Config.getApiUrl()}/dataset/${dataSetId}/approved/users`;
    return getFile(url);
  },

  getDARFile: async (darId) => {
    // DataRequestReportsResource
    const url = `${await Config.getApiUrl()}/dataRequest/${darId}/pdf`;
    const res = await getPDF(url);
    const respHeaders = res.headers;
    return {
      'file': await res.blob(),
      'fileName': respHeaders.get('Content-Disposition').split(';')[1].trim().split('=')[1]
    }
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
    const profile = await res.json();
    return profile;
  },

  list: async (userId) => {
    const url = `${await Config.getApiUrl()}/researcher/${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    const researcherList = await res.json();
    return researcherList;
  },

  update: async (userId, validate, researcherProperties) => {
    const url = `${await Config.getApiUrl()}/researcher/${userId}?validate=${validate}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(researcherProperties), {method: 'PUT'}]));
    return res.json();
  },

  register: async (userId, validate, researcherProperties) => {
    const url = `${await Config.getApiUrl()}/researcher/${userId}?validate=${validate}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(researcherProperties), {method: 'POST'}]));
    return res.json();
  },

  getResearcherProfileForDar: async (researcherId) => {
    const url = `${await Config.getApiUrl()}/researcher/${researcherId}/dar`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },
};

export const DataSet = {

  create: async (file, overwrite, userId) => {
    const url = `${await Config.getApiUrl()}/dataset/${userId}?overwrite=${overwrite}`;
    let formData = new FormData();
    formData.append("data", new Blob([file], {type: 'text/plain'}));
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'POST', body: formData}]));
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

  getDictionary: async () => {
    const url = `${await Config.getApiUrl()}/dataset/dictionary`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  download: async (objectIdList) => {
    const url = `${await Config.getApiUrl()}/dataset/download`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(objectIdList), {method: 'POST'}]));
    return res.json();
  },

  delete: async (datasetObjectId, dacUserId) => {
    const url = `${await Config.getApiUrl()}/dataset/${datasetObjectId}/${dacUserId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'DELETE'}]));
    return res.json();
  },

  disableDataset: async (datasetObjectId, active) => {
    const url = `${await Config.getApiUrl()}/dataset/disable/${datasetObjectId}/${active}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'DELETE'}]));
    return res.json();
  },

  reviewDataSet: async (dataSetId, needsApproval) => {
    const url = `${await Config.getApiUrl()}/dataset?dataSetId=${dataSetId}&needsApproval=${needsApproval}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'PUT'}]));
    return res.json();
  }
};

export const Consent = {

  ConsentResource: async (consentId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'GET'}]));
    let consent = await res.json();
    return consent;
  },

  findInvalidConsentRestriction: async () => {
    const url = `${await Config.getApiUrl()}/consent/invalid`;
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
    const data = await res.json();
    const regex = new RegExp('-', 'g');
    return data.map(dul => {
      const str = dul.consentName.replace(regex, ' ');
      dul.ct = dul.consentName + ' ' + dul.version;
      dul.cts = str + ' ' + dul.version;
      return dul;
    });
  },

  CreateConsentResource: async (consent) => {
    consent.requiresManualReview = false;
    consent.useRestriction = JSON.parse(consent.useRestriction);
    consent.dataUse = JSON.parse(consent.dataUse);
    const url = `${await Config.getApiUrl()}/consent`;
    try {
      const res = await fetchOk(url, _.mergeAll([Config.jsonBody(consent), Config.authOpts(), {method: 'POST'}]));
      if (res.ok) {
        return true;
      }
    } catch (err) {
      return await err.json().then(message => {
        return message.message
      });
    }
  },

  CreateDulResource: async (consentId, fileName, file) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/dul?fileName=${fileName}`;
    let formData = new FormData();
    formData.append("data", new Blob([file], {type: 'text/plain'}));
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'POST', body: formData}]));
    return res.json().then(
      () => {
        return true
      },
      (error) => {
        return error
      }
    );
  },

  update: async (consent) => {
    consent.requiresManualReview = false;
    consent.useRestriction = JSON.parse(consent.useRestriction);
    consent.dataUse = JSON.parse(consent.dataUse);
    const url = `${await Config.getApiUrl()}/consent/${consent.consentId}`;
    try {
      const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(consent), {method: 'PUT'}]));
      return await res.json().then(() => {
        return true
      });
    } catch (err) {
      return await err.json().then(message => {
        return message.message
      });
    }
  },

  DeleteConsentResource: async (consentId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'DELETE'}]));
    return res;
  },

};

export const Election = {

  create: async (consentId, election) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/election`;
    const res = await fetchOk(url, _.mergeAll([Config.jsonBody(election), Config.authOpts(), {method: 'POST'}]));
    return res;
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

  updateElection: async (electionId, document) => {
    const url = `${await Config.getApiUrl()}/election/${electionId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(document), {method: 'PUT'}]));
    return res.json();
  },

  findConsentElectionByDarElection: async (requestElectionId) => {
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
    return res;
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
    return await res.json();
  },

  DarElectionDatasetVotes: async (requestId) => {
    const url = `${await Config.getApiUrl()}/dataRequest/${requestId}/election/dataSetVotes`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  electionVote: async (voteId) => {
    const url = `${await Config.getApiUrl()}/election/vote/${voteId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },
};

export const DUL = {
  // DataUseLetterResource

  create: async (id) => {
    const url = `${await Config.getApiUrl()}/consent/${id}/dul`;
    const res = await fetchOk(url, _.mergeAll([Config.jsonBody(), Config.authOpts(), {method: 'POST'}]));
    return res.json();
  },
};

export const DAR = {
  // DataAccessRequestResource

  postDar: async dar => {
    const url = `${await Config.getApiUrl()}/dar`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(dar), {method: 'POST'}]));
    return res.json();
  },

  cancel: async referenceId => {
    const url = `${await Config.getApiUrl()}/dar/cancel/${referenceId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'PUT'}]));
    return res.json();
  },

  describeManage: async userId => {
    const url = `${await Config.getApiUrl()}/dar/manage?userId=${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  findDataAccessInvalidUseRestriction: async () => {
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

  getDataAccessManage: async userId => {
    const url = `${await Config.getApiUrl()}/dar/manage?userId=${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    const dars = await res.json();
    if (dars !== undefined) {
      dars.forEach(
        dar => {
          dar.ownerUser.roles.forEach(role => {
            if (role.name === 'Researcher') {
              dar.status = role.status;
            }
          });
        });
      return dars;
    } else {
      return [];
    }
  },

  getPartialDarRequestList: async userId => {
    const url = `${await Config.getApiUrl()}/dar/partials/manage?userId=${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    const pdars = await res.json();
    return pdars;
  },

  getPartialDarRequest: async userId => {
    const url = `${await Config.getApiUrl()}/dar/partial/${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    const pdars = await res.json();
    return pdars;
  },

  getDarFields: async (id, fields) => {
    const url = `${await Config.getApiUrl()}/dar/find/${id}?fields=${fields}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  darModalSummary: async (darId) => {
    const url = `${await Config.getApiUrl()}/dar/modalSummary/${darId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  describeDar: async (darId) => {
    let darInfo = {};
    const url = `${await Config.getApiUrl()}/dar/modalSummary/${darId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json().then(data => {
      darInfo.researcherId = data.userId;
      darInfo.status = data.status;
      darInfo.hasAdminComment = data.rationale !== null;
      darInfo.adminComment = data.rationale;
      darInfo.hasPurposeStatements = data.purposeStatements.length > 0;
      if (darInfo.hasPurposeStatements) {
        darInfo.purposeStatements = data.purposeStatements;
        darInfo.purposeManualReview = requiresManualReview(darInfo.purposeStatements);
      }
      darInfo.hasDiseases = data.diseases.length > 0;
      if (darInfo.hasDiseases) {
        darInfo.diseases = data.diseases;
      }
      if (data.researchType.length > 0) {
        darInfo.researchType = data.researchType;
        darInfo.researchTypeManualReview = requiresManualReview(darInfo.researchType);
      }
      return Researcher.getResearcherProfileForDar(darInfo.researcherId);
    }).then(data => {
      darInfo.pi = data.isThePI === 'true' ? data.profileName : data.piName;
      darInfo.havePI = data.havePI === 'true' || data.isThePI === 'true';
      darInfo.profileName = data.profileName;
      darInfo.institution = data.institution;
      darInfo.department = data.department;
      darInfo.city = data.city;
      darInfo.country = data.country;
      return new Promise(function (resolve) {
        resolve(darInfo);
      });
    });

    function requiresManualReview(object) {
      let manualReview = false;
      object.forEach(function (element) {
        if (element.manualReview === true) {
          manualReview = true;
        }
      });
      return manualReview;
    }
  },

};

export const Purpose = {


  dataAccessRequestManageResource: async (userId) => {
    if (userId === undefined) {
      userId = '';
    }
    const url = `${await Config.getApiUrl()}/dar/manage?userId=${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  postDataAccessRequest: async (dataAccessRequest) => {
    const url = `${await Config.getApiUrl()}/dar`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(dataAccessRequest), {method: 'POST'}]));
    return res.json();
  },

  cancelDar: async (referenceId) => {
    const url = `${await Config.getApiUrl()}/dar/cancel/${referenceId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'PUT'}]));
    return res.json();
  },

  requiresManualReview: (object) => {
    var manualReview = false;
    object.forEach(function (element) {
      if (element.manualReview === true) {
        manualReview = true;
      }
    });
    return manualReview;
  }

};

export const PendingCases = {

  findDataRequestPendingCasesByUser: async (userId) => {
    const url = `${await Config.getApiUrl()}/dataRequest/cases/pending/${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    const dars = await res.json();
    let resp = {
      access: dars,
      totalAccessPendingVotes: 0
    };

    resp.access.forEach(
      dar => {
        if (dar.alreadyVoted === false) {
          resp.totalAccessPendingVotes += (dar.alreadyVoted === false ? 1 : 0);
        }
      }
    );
    return resp;
  },


  findConsentPendingCasesByUser: async (userId) => {
    const url = `${await Config.getApiUrl()}/consent/cases/pending/${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    const duls = await res.json();

    let resp = {
      dul: duls,
      totalDulPendingVotes: 0
    };

    resp.dul.forEach(
      // dul.consentGroupName = $sce.trustAsHtml(dul.consentGroupName);
      dul => {
        if (dul.alreadyVoted === false) {
          resp.totalDulPendingVotes += (dul.alreadyVoted === false ? 1 : 0);
        }
      }
    );
    return resp;
  },


  findConsentUnReviewed: async (vm) => {
    const url = `${await Config.getApiUrl()}/consent/unreviewed`;
    const res = await fetchOk(url, Config.authOpts());
    const duls = await res.json();
    return duls;
  },

  findDARUnReviewed: async (vm) => {
    const url = `${await Config.getApiUrl()}/dar/cases/unreviewed`;
    const res = await fetchOk(url, Config.authOpts());
    const dars = await res.json();
    return dars;
  },

  findDataOwnerUnReviewed: async (dataOwnerId) => {
    const url = `${await Config.getApiUrl()}/dataRequest/cases/pending/dataOwner/${dataOwnerId}`;
    const res = await fetchOk(url, Config.authOpts());
    const dars = await res.json();
    return dars;
  },

  findSummary: async (data, vm) => {
    const consentUrl = `${await Config.getApiUrl()}/consent/cases/summary`;
    const dataAccessUrl = `${await Config.getApiUrl()}/dataRequest/cases/summary/DataAccess`;
    const rpUrl = `${await Config.getApiUrl()}/dataRequest/cases/summary/RP`;
    const matchUrl = `${await Config.getApiUrl()}/dataRequest/cases/matchsummary`;
    fetchOk(consentUrl, Config.authOpts()).then(
      access => {
        data = dataTemplate;

        data.dulTotal[1][1] = access.reviewedPositiveCases + access.reviewedNegativeCases;
        // pending cases
        data.dulTotal[2][1] = access.pendingCases;
        // positive cases
        data.dulReviewed[1][1] = access.reviewedPositiveCases;
        // negative cases
        data.dulReviewed[2][1] = access.reviewedNegativeCases;

        fetchOk(dataAccessUrl, Config.authOpts()).then(
          dul => {
            // reviewed cases
            data.accessTotal[1][1] = dul.reviewedPositiveCases + dul.reviewedNegativeCases;
            // pending cases
            data.accessTotal[2][1] = dul.pendingCases;
            // positive cases
            data.accessReviewed[1][1] = dul.reviewedPositiveCases;
            // negative cases
            data.accessReviewed[2][1] = dul.reviewedNegativeCases;

            fetchOk(rpUrl, Config.authOpts()).then(
              rp => {
                // reviewed cases
                data.RPTotal[1][1] = rp.reviewedPositiveCases + rp.reviewedNegativeCases;
                // pending cases
                data.RPTotal[2][1] = rp.pendingCases;
                // positive cases
                data.RPReviewed[1][1] = rp.reviewedPositiveCases;
                // negative cases
                data.RPReviewed[2][1] = rp.reviewedNegativeCases;
                fetchOk(matchUrl, Config.authOpts()).then(
                  match => {
                    if (match[0]) {
                      // positive cases
                      data.VaultReviewed[1][1] = match[0].reviewedPositiveCases;
                      // negative cases
                      data.VaultReviewed[2][1] = match[0].reviewedNegativeCases;
                    }
                    if (match[1]) {
                      // positive cases
                      data.Agreement[1][1] = match[1].reviewedPositiveCases;
                      // negative cases
                      data.Agreement[2][1] = match[1].reviewedNegativeCases;
                    }
                    return data;
                  },
                  err => {

                  }
                );
              },
              err => {

              }
            );
          },
          err => {

          }
        );
      }, err => {

      }
    );
  }
};

export const DataAccess = {
  getDarModalSummary: async (darId) => {
    const url = `${await Config.getApiUrl()}/dar/modalSummary/${darId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  }

};

export const Ontology = {

  postOntologyFile: async (fileData) => {
    var formData = new FormData();
    var uuid = Ontology.guid();
    var metadata = {};
    metadata[uuid] = fileData.fileMetadata;
    formData.append(uuid, fileData.file);
    formData.append("metadata", JSON.stringify(metadata));

    const url = `${await Config.getApiUrl()}/ontology`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'POST', body: formData}]));
    return await res.json();
  },

  retrieveIndexedFiles: async () => {
    const url = `${await Config.getApiUrl()}/ontology`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'GET'}]));
    return await res.json().then((data) => {return data});
  },

  deleteOntologyFile: async (fileUrl) => {
    const url = `${await Config.getApiUrl()}/ontology`;
    const obj = {fileUrl: fileUrl};
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(obj), {method: 'PUT'}]));
    return await res.json();
  },

  getOntologyTypes: async () => {
    const url = `${await Config.getApiUrl()}/ontology/types`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), {method: 'GET'}]));
    return await res.json();
  },

  guid: () => {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4();
  }
};
export const Help = {

  findHelpMeReports: async (userId, vm) => {
    const url = `${await Config.getApiUrl()}/report/user/${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();

  },

  createHelpMeReport: async (report) => {

  }
};

const fetchOk = async (...args) => {
  const res = await fetch(...args);
  return res.ok ? res : Promise.reject(res);
};

const getFile = async (URI) => {
  const res = await fetchOk(URI, Config.fileBody());
  return res.blob();
};

const getPDF = async (URI) => {
  return await fetchOk(URI, Config.fileBody());
};
