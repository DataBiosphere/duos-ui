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
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(user), { method: 'POST' }]));
    return res.json();
  },

  update: async (user, userId) => {
    const url = `${await Config.getApiUrl()}/dacuser/${userId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(user), { method: 'PUT' }]));
    return res.json();
  },

  updateName: async (body, userId) => {
    const url = `${await Config.getApiUrl()}/dacuser/name/${userId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(body), { method: 'PUT' }]));
    return res.json();
  },

  validateDelegation: async (role, dacUser) => {
    const url = `${await Config.getApiUrl()}/dacuser/validateDelegation?role=` + role;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(dacUser), { method: 'POST' }]));
    return res.json();
  },

  registerUser: async user => {
    const url = `${await Config.getApiUrl()}/user`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(user), { method: 'POST' }]));
    return res.json();
  },

  registerStatus: async (userRoleStatus, userId) => {
    const url = `${await Config.getApiUrl()}/dacuser/status/${userId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(userRoleStatus), { method: 'PUT' }]));
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
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'POST' }]));
    return res.json();
  },

  updateVote: async (consentId, voteId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/vote/${voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'PUT' }]));
    return res.json();
  },

  findDar: async (requestId, voteId) => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote/${voteId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  postDarVote: async (requestId, voteId, vote) => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote/${voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(vote), { method: 'POST' }]));
    return res.json();
  },

  finalAccessDarVote: async (requestId, voteId, vote) => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote/${voteId}/final/`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(vote), { method: 'POST' }]));
    return res.json();
  },

  createDarVote: async (requestId, voteId, vote) => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote/${voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(vote), { method: 'POST' }]));
    return res.json();
  },

  updateDarVote: async (requestId, voteId, vote) => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote/${voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(vote), { method: 'PUT' }]));
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
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return res.json();
  },

  deleteVotes: async (requestId) => {
    const url = `${await Config.getApiUrl()}/darRequest/${requestId}/vote/`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
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
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(user), { method: 'POST' }]));
    return res.json();
  },

  update: async (user, userId) => {
    const url = `${await Config.getApiUrl()}/dacuser/${userId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(user), { method: 'PUT' }]));
    return res.json();
  },

  updateName: async (body, userId) => {
    const url = `${await Config.getApiUrl()}/dacuser/name/${userId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(body), { method: 'PUT' }]));
    return res.json();
  },

  validateDelegation: async (role, dacUser) => {
    const url = `${await Config.getApiUrl()}/dacuser/validateDelegation?role=` + role;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(dacUser), { method: 'POST' }]));
    return res.json();
  },

  registerUser: async user => {
    const url = `${await Config.getApiUrl()}/user`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(user), { method: 'POST' }]));
    return res.json();
  },

  registerStatus: async (userRoleStatus, userId) => {
    const url = `${await Config.getApiUrl()}/dacuser/status/${userId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(userRoleStatus), { method: 'PUT' }]));
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
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(researcherProperties), { method: 'PUT' }]));
    return res.json();
  },

  register: async (userId, validate, researcherProperties) => {
    const url = `${await Config.getApiUrl()}/researcher/${userId}?validate=${validate}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(researcherProperties), { method: 'POST' }]));
    return res.json();
  },
};

export const DataSet = {

  create: async (file, overwrite, userId) => {
    const url = `${await Config.getApiUrl()}/dataset/${userId}?overwrite=${overwrite}`;
    let formData = new FormData();
    formData.append("data", new Blob([file], { type: 'text/plain' }));
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'POST', body: formData }]));
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
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(objectIdList), { method: 'POST' }]));
    return res.json();
  },

  delete: async (datasetObjectId, dacUserId) => {
    const url = `${await Config.getApiUrl()}/dataset/${datasetObjectId}/${dacUserId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return res.json();
  },

  disableDataset: async (datasetObjectId, active) => {
    const url = `${await Config.getApiUrl()}/dataset/disable/${datasetObjectId}/${active}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return res.json();
  },

  reviewDataSet: async (dataSetId, needsApproval) => {
    const url = `${await Config.getApiUrl()}/dataset?dataSetId=${dataSetId}&needsApproval=${needsApproval}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'PUT' }]));
    return res.json();
  }
};

export const Consent = {

  ConsentResource: async (consentId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'GET' }]));
    let consent = await res.json();
    // console.log("Consent Resource ", consent);
    // return await res.json();
    return consent;
  },

  getInvalidConsentRestriction: async () => {
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
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(consent), { method: 'POST' }]));
    return res.json();
  },

  CreateDulResource: async (consentId, fileName, file) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/dul?fileName=${fileName}`;
    let formData = new FormData();
    formData.append("data", new Blob([file], { type: 'text/plain' }));
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'POST', body: formData }]));
    return res.json().then(
      () => { return true },
      (error) => { return error }
    );
  },

  update: async (consent) => {
    consent.requiresManualReview = false;
    consent.useRestriction = JSON.parse(consent.useRestriction);
    consent.dataUse = JSON.parse(consent.dataUse);
    const url = `${await Config.getApiUrl()}/consent/${consent.consentId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(consent), { method: 'PUT' }]));
    return await res.json().then(
      () => { return true },
      (error) => { return error }
    );
  },


  /*
          function updateConsent(consent) {
            consent.requiresManualReview = false;
            var useRestriction = JSON.parse(consent.useRestriction);
            var dataUse = JSON.parse(consent.dataUse);
            consent.useRestriction = useRestriction;
            consent.dataUse = dataUse;
            return UpdateConsentResource.update({consentId: consent.consentId}, consent);
        }
  * */





  DeleteConsentResource: async (consentId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return res;
  },

};

export const Election = {

  create: async (consentId, election) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/election`;
    const res = await fetchOk(url, _.mergeAll([Config.jsonBody(election), Config.authOpts(), { method: 'POST' }]));
    return res;
  },

  describe: async (consentId) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/election`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  delete: async (consentId, id) => {
    const url = `${await Config.getApiUrl()}/consent/${consentId}/election/${id}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
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

  electionUpdateResourceUpdate: async (electionId, document) => {
    const url = `${await Config.getApiUrl()}/election/${electionId}`;
    const res = await fetchOk(url, _.mergeAll([Config.jsonBody(document),Config.authOpts(), { method: 'PUT'}]));
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
    const res = await fetchOk(url, _.mergeAll([Config.jsonBody(postElection), Config.authOpts(), { method: 'POST' }]));
    return res.json();
  },

  DarElectionDatasetVotes: async (requestId) => {
    const url = `${await Config.getApiUrl()}/dataRequest/${requestId}/election/dataSetVotes`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
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
    const res = await fetchOk(url, _.mergeAll([Config.jsonBody(), Config.authOpts(), { method: 'POST' }]));
    return res.json();
  },
};

export const DAR = {
  // DataAccessRequestResource

  postDar: async dar => {
    const url = `${await Config.getApiUrl()}/dar`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(dar), { method: 'POST' }]));
    return res.json();
  },

  cancel: async referenceId => {
    const url = `${await Config.getApiUrl()}/dar/cancel/${referenceId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'PUT' }]));
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

  getDarFields: async id => {
  const url = `${await Config.getApiUrl()}/dar/find/${id}`;
  const res = await fetchOk(url, Config.authOpts());
  return res.json();
  },

};

export const Purpose = {

  darModalSummary: async (darId) => {
    const url = `${await Config.getApiUrl()}/dar/modalSummary/${darId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  describeDar: async (darId) => {
    let darInfo = {};
    this.darModalSummary(darId).then((data) => {
      darInfo.researcherId = data.userId;
      darInfo.status = data.status;
      darInfo.hasAdminComment = data.rationale !== null;
      darInfo.adminComment = data.rationale;
      darInfo.hasPurposeStatements = data.purposeStatements.length > 0;
      if (darInfo.hasPurposeStatements) {
        darInfo.purposeStatements = data.purposeStatements;
        darInfo.purposeManualReview = this.requiresManualReview(darInfo.purposeStatements);
      }

    });
  },

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
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(dataAccessRequest), { method: 'POST' }]));
    return res.json();
  },

  cancelDar: async (referenceId) => {
    const url = `${await Config.getApiUrl()}/dar/cancel/${referenceId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'PUT' }]));
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

const fetchOk = async (...args) => {
  const res = await fetch(...args);
  return res.ok ? res : Promise.reject(res);
};

const getFile = async (URI) => {
  const res = await fetchOk(URI, Config.authOpts());
  return res.blob();
};