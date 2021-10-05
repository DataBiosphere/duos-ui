import fileDownload from 'js-file-download';
import * as fp from 'lodash/fp';
import {find, getOr, cloneDeep, unset, flow} from 'lodash/fp';
import {isNil} from 'lodash';
import {Config} from './config';
import {Models} from './models';
import {spinnerService} from './spinner-service';
import {StackdriverReporter} from './stackdriverReporter';
import {Storage} from './storage';
import axios from 'axios';
import {DataUseTranslation} from './dataUseTranslation';
import {isFileEmpty} from './utils';

//define axios interceptor
//to log out user and redirect to home when response has 401 status
//return responses with statuses in the 200s and reject the rest
axios.interceptors.response.use(function (response) {
  return response;
}, function (error) {
  if (error.response.status === 401) {
    Storage.clearStorage();
    window.location.href = '/home';
  }

  if (error.response.status >= 500) {
    reportError(error.response.config.url, error.response.status);
  }

  return Promise.reject(error);
});

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

export const Consent = {

  findConsentById: async (consentId) => {
    const url = `${await Config.getApiUrl()}/api/consent/${consentId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'GET' }]));
    return await res.json();
  },

  findConsentManage: async () => {
    const url = `${await Config.getApiUrl()}/api/consent/manage`;
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

  deleteConsent: async (consentId) => {
    const url = `${await Config.getApiUrl()}/api/consent/${consentId}`;
    return await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
  },

};

export const DAC = {

  list: async (withUsers) => {
    const url = `${await Config.getApiUrl()}/api/dac` + (fp.isEmpty(withUsers) ? '' : `?withUsers=${withUsers}`);
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  create: async (name, description) => {
    const url = `${await Config.getApiUrl()}/api/dac`;
    const dac = { "name": name, "description": description };
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(dac), { method: 'POST' }]));
    return res.json();
  },

  update: async (dacId, name, description) => {
    const url = `${await Config.getApiUrl()}/api/dac`;
    const dac = { "dacId": dacId, "name": name, "description": description };
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(dac), { method: 'PUT' }]));
    return res.json();
  },

  delete: async (dacId) => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    //we do not call .json() on res because the response has no body
    return res;
  },

  get: async (dacId) => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  datasets: async (dacId) => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}/datasets`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  autocompleteUsers: async (term) => {
    const url = `${await Config.getApiUrl()}/api/dac/users/${term}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  addDacChair: async (dacId, userId) => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}/chair/${userId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'POST' }]));
    return res.status;
  },

  removeDacChair: async (dacId, userId) => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}/chair/${userId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return res.status;
  },

  addDacMember: async (dacId, userId) => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}/member/${userId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'POST' }]));
    return res.status;
  },

  removeDacMember: async (dacId, userId) => {
    const url = `${await Config.getApiUrl()}/api/dac/${dacId}/member/${userId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return res.status;
  }

};

export const DAR = {

  //v2 get for DARs
  describeDar: async (darId) => {
    const apiUrl = await Config.getApiUrl();
    const authOpts = Config.authOpts();
    const rawDarRes = await axios.get(`${apiUrl}/api/dar/v2/${darId}`, authOpts);
    const rawDar = rawDarRes.data;
    const researcher = await User.getById(rawDar.userId);

    //NOTE: rewrite this, the dar should have the details needed on it (or the response) itself
    let darInfo = Models.dar;
    darInfo.hmb = rawDar.hmb;
    darInfo.methods = rawDar.methods;
    darInfo.controls = rawDar.controls;
    darInfo.population = rawDar.population;
    darInfo.other = rawDar.other;
    darInfo.otherText = rawDar.otherText;
    darInfo.forProfit = rawDar.forProfit;
    darInfo.gender = rawDar.gender;
    darInfo.pediatric = rawDar.pediatric;
    darInfo.illegalBehavior = rawDar.illegalBehavior;
    darInfo.addiction = rawDar.addiction;
    darInfo.sexualDiseases = rawDar.sexualDiseases;
    darInfo.stigmatizedDiseases = rawDar.stigmatizedDiseases;
    darInfo.vulnerablePopulation = rawDar.vulnerablePopulation;
    darInfo.populationMigration = rawDar.populationMigration;
    darInfo.psychiatricTraits = rawDar.psychiatricTraits;
    darInfo.notHealth = rawDar.notHealth;
    darInfo.diseases = rawDar.ontologies || [];
    darInfo.hasDiseases = !fp.isEmpty(darInfo.diseases);
    darInfo.rus = rawDar.rus;
    darInfo.researcherId = rawDar.userId;
    darInfo.darCode = rawDar.darCode;
    darInfo.projectTitle = rawDar.projectTitle;
    darInfo.institution = isNil(researcher.institution) ? "" : researcher.institution.name;
    darInfo.department = rawDar.department;
    darInfo.city = rawDar.city;
    darInfo.country = rawDar.country;
    darInfo.status = rawDar.status;
    darInfo.restrictions = rawDar.restrictions;
    darInfo.hasAdminComment = researcher.rationale != null;
    darInfo.adminComment = researcher.rationale;
    const purposeStatements = DataUseTranslation.generatePurposeStatement(darInfo);
    const researchType = DataUseTranslation.generateResearchTypes(darInfo);
    darInfo.hasPurposeStatements = purposeStatements && purposeStatements.length > 0;
    if (darInfo.hasPurposeStatements) {
      darInfo.purposeStatements = purposeStatements;
      darInfo.purposeManualReview = await DAR.requiresManualReview(darInfo.purposeStatements);
    } else {
      darInfo.purposeStatements = [];
    }
    if (researchType && researchType.length > 0) {
      darInfo.researchType = researchType;
      darInfo.researchTypeManualReview = await DAR.requiresManualReview(darInfo.researchType);
    }

    darInfo.datasets = rawDar.datasets;
    darInfo.datasetIds = rawDar.datasetIds;
    darInfo.pi = rawDar.investigator;
    darInfo.havePI = rawDar.havePI || rawDar.isThePI;
    //name from researcher bc name in props and on dar are not accurately populated
    darInfo.profileName = researcher.displayName;
    // dataUse from Models.dar has properties denoting what research the data will be used for.
    // Get these properties directly from the DAR.
    const dataUseModel = fp.keys(darInfo.dataUse);
    dataUseModel.forEach(key => {
      const value = rawDar[key];
      if (!fp.isNil(value)) {
        darInfo.dataUse[key] = value;
      }
    });
    return darInfo;
  },

  //v2 get for DARs
  getPartialDarRequest: async darId => {
    const url = `${await Config.getApiUrl()}/api/dar/v2/${darId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  //v2 update for dar partials
  updateDarDraft: async (dar, referenceId) => {
    const url = `${await Config.getApiUrl()}/api/dar/v2/draft/${referenceId}`;
    const res = await axios.put(url, dar, Config.authOpts());
    return res.data;
  },

  //api endpoint for v2 draft submission
  postDarDraft: async(dar) => {
    const url = `${await Config.getApiUrl()}/api/dar/v2/draft/`;
    const res = await axios.post(url, dar, Config.authOpts());
    return res.data;
  },

  //v2 delete dar
  deleteDar: async (darId) => {
    const url = `${await Config.getApiUrl()}/api/dar/v2/${darId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return await res;
  },

  //v2 get draft dars
  getDraftDarRequestList: async () => {
    const url = `${await Config.getApiUrl()}/api/dar/v2/draft/manage`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  getDarConsent: async id => {
    const url = `${await Config.getApiUrl()}/api/dar/find/${id}/consent`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  //v2 endpoint for DAR POST
  postDar: async (dar) => {
    const filteredDar = fp.omit(['createDate', 'sortDate', 'data_access_request_id'])(dar);
    const url = `${await Config.getApiUrl()}/api/dar/v2`;
    const res = axios.post(url, filteredDar, Config.authOpts());
    return await res.data;
  },

  cancelDar: async referenceId => {
    const url = `${await Config.getApiUrl()}/api/dar/cancel/${referenceId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'PUT' }]));
    return await res.json();
  },

  getAutoCompleteDS: async partial => {
    const url = `${await Config.getApiUrl()}/api/dataset/autocomplete/${partial}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  getAutoCompleteOT: async partial => {
    const url = `${await Config.getOntologyApiUrl()}/autocomplete?q=${partial}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  getDARDocument: async (referenceId, fileType) => {
    const authOpts = Object.assign(Config.authOpts(), {responseType: 'blob'});
    authOpts.headers = Object.assign(authOpts.headers, {
      'Content-Type': 'application/octet-stream',
      'Accept': 'application/octet-stream'
    });
    const url = `${await Config.getApiUrl()}/api/dar/v2/${referenceId}/${fileType}`;
    const res = await axios.get(url, authOpts);
    return res.data;
  },

  //new manage endpoint, should be renamed once v1 variant is removed from use
  getDataAccessManageV2: async(roleName) => {
    let url = `${await Config.getApiUrl()}/api/dar/manage/v2`;
    if (!isNil(roleName)) {
      url = `${await Config.getApiUrl()}/api/dar/manage/v2/?roleName=${roleName}`;
    }
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },

  getDarModalSummary: async (darId) => {
    const url = `${await Config.getApiUrl()}/api/dar/modalSummary/${darId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  requiresManualReview: (object) => {
    var manualReview = false;
    object.forEach(function (element) {
      if (element.manualReview === true) {
        manualReview = true;
      }
    });
    return manualReview;
  },

  //NOTE: endpoints requires a dar id
  uploadDARDocument: async(file, darId, fileType) => {
    if(isFileEmpty(file)) {
      return Promise.resolve({data: null});
    } else {
      let authOpts = Config.authOpts();
      authOpts.headers['Content-Type'] = 'multipart/form-data';
      let formData = new FormData();
      formData.append("file", file);
      const url = `${await Config.getApiUrl()}/api/dar/v2/${darId}/${fileType}`;
      return axios.post(url, formData, authOpts);
    }
  }
};

export const DataSet = {

  postDatasetForm: async (form) => {
    const url = `${await Config.getApiUrl()}/api/dataset/v2`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(form), { method: 'POST' }]));
    return await res.json();
  },

  getDatasets: async () => {
    const url = `${await Config.getApiUrl()}/api/dataset`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  getDarDatasets: async (datasetIds) => {
    let datasets;
    const datasetsPromise = datasetIds.map((id) => {
      return DataSet.getDataSetsByDatasetId(id);
    });
    datasets = await Promise.all(datasetsPromise);
    return datasets;
  },

  getDataSetsByDatasetId: async dataSetId => {
    const url = `${await Config.getApiUrl()}/api/dataset/${dataSetId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  downloadDataSets: async (objectIdList, fileName) => {
    const url = `${await Config.getApiUrl()}/api/dataset/download`;
    const res = await fetchOk(url, fp.mergeAll([Config.jsonBody(objectIdList), Config.fileOpts(), { method: 'POST' }]));

    fileName = fileName === null ? getFileNameFromHttpResponse(res) : fileName;
    const responseObj = await res.json();

    let blob = new Blob([responseObj.datasets], { type: 'text/plain' });
    const urlBlob = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = urlBlob;
    a.download = fileName;
    a.click();
  },

  deleteDataset: async (datasetObjectId) => {
    const url = `${await Config.getApiUrl()}/api/dataset/${datasetObjectId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return await res;
  },

  disableDataset: async (datasetObjectId, active) => {
    const url = `${await Config.getApiUrl()}/api/dataset/disable/${datasetObjectId}/${active}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return res;
  },

  reviewDataSet: async (dataSetId, needsApproval) => {
    const url = `${await Config.getApiUrl()}/api/dataset?dataSetId=${dataSetId}&needsApproval=${needsApproval}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'PUT' }]));
    return res.json();
  },

  updateDataset: async (datasetId, dataSetObject) => {
    const url = `${await Config.getApiUrl()}/api/dataset/${datasetId}`;
    return await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(dataSetObject), {method: 'PUT'}]));
  },

  validateDatasetName: async (name) => {
    const url = `${await Config.getApiUrl()}/api/dataset/validate?name=${name}`;
    try {
      // We expect a 404 in the case where the dataset name does not exist
      const res = await fetchAny(url, fp.mergeAll([Config.authOpts(), {method: 'GET'}]));
      if (res.status === 404) {
        return -1;
      }
      return await res.json();
    }
    catch (err) {
      return -1;
    }
  }
};

export const DatasetAssociation = {

  createDatasetAssociations: async (objectId, usersIdList) => {
    const url = `${await Config.getApiUrl()}/api/datasetAssociation/${objectId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(usersIdList), { method: 'POST' }]));
    return await res.json();
  },

  getAssociatedAndToAssociateUsers: async (objectId) => {
    const url = `${await Config.getApiUrl()}/api/datasetAssociation/${objectId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  updateDatasetAssociations: async (objectId, usersIdList) => {
    const url = `${await Config.getApiUrl()}/api/datasetAssociation/${objectId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(usersIdList), { method: 'PUT' }]));
    return res.json();
  }

};

export const Election = {

  getElectionVotes: async (electionId) => {
    const url = `${await Config.getApiUrl()}/api/election/${electionId}/votes`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  findElectionByVoteId: async (voteId) => {
    const url = `${await Config.getApiUrl()}/api/election/vote/${voteId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  findElectionByDarId: async (requestId) => {
    const url = `${await Config.getApiUrl()}/api/dataRequest/${requestId}/election`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  downloadDatasetVotesForDARElection: async (requestId) => {
    const url = `${await Config.getApiUrl()}/api/dataRequest/${requestId}/election/dataSetVotes`;
    return getFile(url, 'datasetVotesSummary.txt');
  },

  electionReviewResource: async (referenceId, type) => {
    const url = `${await Config.getApiUrl()}/api/electionReview?referenceId=${referenceId}&type=${type}`;
    const res = await fetchOk(url, Config.authOpts());
    if (res.status === 204) {
      return {};
    }
    return await res.json();
  },

  findDataAccessElectionReview: async (electionId) => {
    const url = `${await Config.getApiUrl()}/api/electionReview/access/${electionId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  // RP Election Information. Can be null for manual review DARs.
  // N.B. We get the rpElectionReview from the Access election id, not the rp election id. This is a legacy behavior.
  findRPElectionReview: async (electionId) => {
    const url = `${await Config.getApiUrl()}/api/electionReview/rp/${electionId}`;
    const res = await fetchOk(url, Config.authOpts());
    if (res.status === 204) {
      return {};
    }
    return await res.json();
  },

  updateElection: async (electionId, document) => {
    const url = `${await Config.getApiUrl()}/api/election/${electionId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(document), { method: 'PUT' }]));
    return await res.json();
  },

  createElection: async (consentId) => {
    const election = { status: 'Open' };
    const url = `${await Config.getApiUrl()}/api/consent/${consentId}/election`;
    const res = await fetchOk(url, fp.mergeAll([Config.jsonBody(election), Config.authOpts(), { method: 'POST' }]));
    return res;
  },

  createElectionForDac: async (consentId, dacId) => {
    const election = { status: 'Open' };
    const url = `${await Config.getApiUrl()}/api/consent/${consentId}/election/dac/${dacId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.jsonBody(election), Config.authOpts(), { method: 'POST' }]));
    return res;
  },

  findReviewedConsents: async () => {
    const url = `${await Config.getApiUrl()}/api/consent/cases/closed`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  findReviewedDRs: async () => {
    const url = `${await Config.getApiUrl()}/api/dataRequest/cases/closed`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  findReviewedElections: async (electionId) => {
    const url = `${await Config.getApiUrl()}/api/electionReview/${electionId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  createDARElection: async (requestId) => {
    const election = { status: 'Open', finalAccessVote: false };
    const url = `${await Config.getApiUrl()}/api/dataRequest/${requestId}/election`;
    const res = await fetchOk(url, fp.mergeAll([Config.jsonBody(election), Config.authOpts(), { method: 'POST' }]));
    return res.json();
  },

  isDataSetElectionOpen: async () => {
    const url = `${await Config.getApiUrl()}/api/election/checkdataset`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

};

export const ElectionTimeout = {

  findApprovalExpirationTime: async () => {
    const url = `${await Config.getApiUrl()}/api/approvalExpirationTime`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  updateApprovalExpirationTime: async (approvalExpirationTime) => {
    const url = `${await Config.getApiUrl()}/api/approvalExpirationTime/${approvalExpirationTime.id}`;
    const res = await fetchOk(url, fp.mergeAll([Config.jsonBody(approvalExpirationTime), Config.authOpts(), { method: 'PUT' }]));
    return res;
  },

  createApprovalExpirationTime: async (approvalExpirationTime) => {
    const url = `${await Config.getApiUrl()}/api/approvalExpirationTime`;
    const res = await fetchOk(url, fp.mergeAll([Config.jsonBody(approvalExpirationTime), Config.authOpts(), { method: 'POST' }]));
    return await res.json();
  }
};

export const Email = {

  sendReminderEmail: async (voteId) => {
    const url = `${await Config.getApiUrl()}/api/emailNotifier/reminderMessage/${voteId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'POST' }]));
    return res;
  }

};

export const Files = {

  getApprovedUsersFile: async (fileName, dataSetId) => {
    const url = `${await Config.getApiUrl()}/api/dataset/${dataSetId}/approved/users`;
    return getFile(url, fileName);
  }
};

export const Summary = {
  getFile: async (fileName) => {
    const URI = `/api/consent/cases/summary/file?fileType=${fileName}`;
    const url = `${await Config.getApiUrl()}/${URI}`;
    if (fileName === 'TranslateDUL') {
      return await getFile(url, 'DUL_summary.tsv');
    } else {
      return await getFile(url, 'DAR_summary.tsv');
    }
  }
};

export const Metrics = {

  getDatasetStats: async (datasetId) => {
    const url = `${await Config.getApiUrl()}/metrics/dataset/${datasetId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  }
};

export const Support = {

  createTicket: (name, type, email, subject, description, attachmentToken, url) => {
    const ticket = {};

    ticket.request = {
      requester: { name: name, email: email },
      subject: subject,
      // BEWARE changing the following ids or values! If you change them then you must thoroughly test.
      custom_fields: [
        { id: 360012744452, value: type},
        { id: 360007369412, value: description},
        { id: 360012744292, value: name},
        { id: 360012782111, value: email },
        { id: 360018545031, value: email }
      ],
      comment: {
        body: description + '\n\n------------------\nSubmitted from: ' + url,
        uploads: attachmentToken
      },
      ticket_form_id: 360000669472
    };

    return ticket;

  },
  createSupportRequest: async (ticket) => {
    const res = await fetchAny(`https://broadinstitute.zendesk.com/api/v2/requests.json`, fp.mergeAll([Config.jsonBody(ticket), { method: 'POST' }]));
    return await res;
  },

  uploadAttachment: async (file) => {
    const res = await fetchAny(`https://broadinstitute.zendesk.com/api/v2/uploads?filename=Attachment`, fp.mergeAll([Config.attachmentBody(file), { method: 'POST' }]));
    return (await res.json()).upload;
  },
};

export const Match = {

  findMatch: async (consentId, purposeId) => {
    const url = `${await Config.getApiUrl()}/api/match/${consentId}/${purposeId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  }
};

export const PendingCases = {

  findDataRequestPendingCases: async () => {
    const url = `${await Config.getApiUrl()}/api/dataRequest/cases/pending`;
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
    const url = `${await Config.getApiUrl()}/api/consent/cases/pending/${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    const duls = await res.json();

    let resp = {
      dul: duls,
      totalDulPendingVotes: 0
    };
    resp.dul.forEach(
      dul => {
        if (dul.alreadyVoted === false) {
          resp.totalDulPendingVotes += (dul.alreadyVoted === false ? 1 : 0);
        }
      }
    );
    return resp;
  },


  findConsentUnReviewed: async () => {
    const url = `${await Config.getApiUrl()}/api/consent/unreviewed`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  findDARUnReviewed: async () => {
    const url = `${await Config.getApiUrl()}/api/dar/cases/unreviewed`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  findDataOwnerUnReviewed: async (dataOwnerId) => {
    const url = `${await Config.getApiUrl()}/api/dataRequest/cases/pending/dataOwner/${dataOwnerId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  findSummary: async () => {
    const consentUrl = `${await Config.getApiUrl()}/api/consent/cases/summary`;
    const dataAccessUrl = `${await Config.getApiUrl()}/api/dataRequest/cases/summary/DataAccess`;
    const rpUrl = `${await Config.getApiUrl()}/api/dataRequest/cases/summary/RP`;
    const matchUrl = `${await Config.getApiUrl()}/api/dataRequest/cases/matchsummary`;
    const accessResponse = await fetchOk(consentUrl, Config.authOpts());
    const access = await accessResponse.json();
    let data = dataTemplate;
    data.dulTotal[1][1] = access.reviewedPositiveCases + access.reviewedNegativeCases;
    // pending cases
    data.dulTotal[2][1] = access.pendingCases;
    // positive cases
    data.dulReviewed[1][1] = access.reviewedPositiveCases;
    // negative cases
    data.dulReviewed[2][1] = access.reviewedNegativeCases;

    const dulResponse = await fetchOk(dataAccessUrl, Config.authOpts());
    const dul = await dulResponse.json();
    // reviewed cases
    data.accessTotal[1][1] = dul.reviewedPositiveCases + dul.reviewedNegativeCases;
    // pending cases
    data.accessTotal[2][1] = dul.pendingCases;
    // positive cases
    data.accessReviewed[1][1] = dul.reviewedPositiveCases;
    // negative cases
    data.accessReviewed[2][1] = dul.reviewedNegativeCases;

    const rpResponse = await fetchOk(rpUrl, Config.authOpts());
    const rp = await rpResponse.json();

    // reviewed cases
    data.RPTotal[1][1] = rp.reviewedPositiveCases + rp.reviewedNegativeCases;
    // pending cases
    data.RPTotal[2][1] = rp.pendingCases;
    // positive cases
    data.RPReviewed[1][1] = rp.reviewedPositiveCases;
    // negative cases
    data.RPReviewed[2][1] = rp.reviewedNegativeCases;
    const matchResponse = await fetchOk(matchUrl, Config.authOpts());
    const match = await matchResponse.json();
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
  }

};

export const Researcher = {

  createProperties: async (properties) => {
    const url = `${await Config.getApiUrl()}/api/user/profile`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(properties), { method: 'POST' }]));
    return await res;
  },

  updateProperties: async (userId, validate, properties) => {
    const url = `${await Config.getApiUrl()}/api/user/profile?validate=${validate}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(properties), { method: 'PUT' }]));
    return res.json();
  },

};

export const StatFiles = {

  getDARsReport: async (reportType, fileName) => {
    const url = `${await Config.getApiUrl()}/api/dataRequest/${reportType}`;
    return getFile(url, fileName);
  }
};

export const User = {

  //DEPRECATION NOTE: consider this method deprecated, a user's email can change with their employment
  //Therefore the possibility that the email registered to a DAR will differ from the researcher's current email, leading to invalid queries
  //Instead, use getById for more predictable results
  getByEmail: async email => {
    const url = `${await Config.getApiUrl()}/api/dacuser/${email}`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },

  getMe: async () => {
    const url = `${await Config.getApiUrl()}/api/user/me`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },

  getById: async id => {
    const url = `${await Config.getApiUrl()}/api/user/${id}`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },

  list: async roleName => {
    const url = `${await Config.getApiUrl()}/api/user/role/${roleName}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  create: async user => {
    const url = `${await Config.getApiUrl()}/api/dacuser`;
    try {
      const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(user), { method: 'POST' }]));
      if (res.ok) {
        return res.json;
      }
    } catch (err) {
      return false;
    }
  },

  update: async (user, userId) => {
    const url = `${await Config.getApiUrl()}/api/dacuser/${userId}`;
    // We should not be updating the user's create date, associated institution, or library cards
    let filteredUser = flow(
      cloneDeep,
      unset('updatedUser.createDate'),
      unset('updatedUser.institution'),
      unset('updatedUser.libraryCards')
    )(user);
    try {
      const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(filteredUser), { method: 'PUT' }]));
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      return false;
    }
  },

  registerUser: async () => {
    const url = `${await Config.getApiUrl()}/api/user`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'POST' }]));
    return res.json();
  },

  registerStatus: async (userRoleStatus, userId) => {
    const url = `${await Config.getApiUrl()}/api/dacuser/status/${userId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(userRoleStatus), { method: 'PUT' }]));
    return res.json();
  },

  getSOsForCurrentUser: async () => {
    const url = `${await Config.getApiUrl()}/api/user/signing-officials`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'GET' }]));
    return res.json();
  },
  getUnassignedUsers: async () => {
    const url = `${await Config.getApiUrl()}/api/user/institution/unassigned`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  }

};

export const Votes = {

  find: async (consentId, voteId) => {
    const url = `${await Config.getApiUrl()}/api/consent/${consentId}/vote/${voteId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  postVote: async (consentId, vote) => {
    var postObject = {};
    postObject.vote = vote.vote;
    postObject.dacUserId = vote.dacUserId;
    postObject.rationale = vote.rationale;
    const url = `${await Config.getApiUrl()}/api/consent/${consentId}/vote/${vote.voteId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(postObject), { method: 'POST' }]));
    return await res.json();
  },

  updateVote: async (consentId, vote) => {
    var voteToUpdate = {};
    voteToUpdate.vote = vote.vote;
    voteToUpdate.dacUserId = vote.dacUserId;
    voteToUpdate.rationale = vote.rationale;
    const url = `${await Config.getApiUrl()}/api/consent/${consentId}/vote/${vote.voteId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(voteToUpdate), { method: 'PUT' }]));
    return await res.json();
  },

  getDarVote: async (requestId, voteId) => {
    const url = `${await Config.getApiUrl()}/api/dataRequest/${requestId}/vote/${voteId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  postDarVote: async (requestId, vote) => {
    const postObject = {};
    postObject.vote = vote.vote;
    postObject.dacUserId = vote.dacUserId;
    postObject.rationale = vote.rationale;
    postObject.hasConcerns = vote.hasConcerns;
    const url = `${await Config.getApiUrl()}/api/dataRequest/${requestId}/vote/${vote.voteId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(postObject), { method: 'POST' }]));
    return res.json();
  },

  updateDarVote: async (requestId, vote) => {
    const postObject = {};
    postObject.vote = vote.vote;
    postObject.dacUserId = vote.dacUserId;
    postObject.rationale = vote.rationale;
    postObject.hasConcerns = vote.hasConcerns;
    const url = `${await Config.getApiUrl()}/api/dataRequest/${requestId}/vote/${vote.voteId}`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(postObject), { method: 'PUT' }]));
    return await res.json();
  },

  updateFinalAccessDarVote: async (requestId, vote) => {
    const url = `${await Config.getApiUrl()}/api/dataRequest/${requestId}/vote/${vote.voteId}/final`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(vote), { method: 'POST' }]));
    return await res.json();
  }
};

export const AuthenticateNIH = {

  verifyNihToken: async (token) => {
    const url = `${await Config.getProfileUrl()}/shibboleth-token`;
    const payload = fp.get('nih-username-token')(token);
    const res = await fetchAny(url, fp.mergeAll([Config.authOpts(), { method: 'POST', body: payload }]));
    return await res.json();
  },

  parseProfile: (profile) => {
    let fireCloudProfileObj = {};
    const properties = profile.researcherProperties;
    const instituteProp = find({'propertyKey': 'institution'})(properties);
    const piProp = find({'propertyKey' : 'havePi'});
    const isPiProp = find({'propertyKey' : 'isPi'});
    const isPi = isNil(isPiProp) ? "n/a" : Storage.getCurrentUser().displayName;
    fireCloudProfileObj.firstName = Storage.getCurrentUser().displayName;
    fireCloudProfileObj.lastName = Storage.getCurrentUser().displayName;
    fireCloudProfileObj.title = "DUOS Researcher";
    fireCloudProfileObj.contactEmail = Storage.getCurrentUser().email;
    fireCloudProfileObj.institute = isNil(instituteProp) ? '' : getOr('', 'propertyValue')(instituteProp);
    fireCloudProfileObj.institutionalProgram = "n/a";
    fireCloudProfileObj.programLocationCity = "n/a";
    fireCloudProfileObj.programLocationState = "n/a";
    fireCloudProfileObj.programLocationCountry = "n/a";
    fireCloudProfileObj.pi = isNil(piProp) ? isPi : getOr( "n/a", 'propertyValue')(piProp);
    fireCloudProfileObj.nonProfitStatus = "n/a";
    return fireCloudProfileObj;
  },

  saveNihUsr: async (decodedData) => {
    const url = `${await Config.getApiUrl()}/api/nih`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), Config.jsonBody(decodedData), { method: 'POST' }]));
    return await res.json();
  },

  eliminateAccount: async () => {
    const url = `${await Config.getApiUrl()}/api/nih`;
    const res = await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return await res;
  },

  expirationCount(expDate) {
    let result = -1;
    if (expDate !== null && expDate !== undefined) {
      var currentDate = new Date().getTime();
      var millisecondsPerDay = 24 * 60 * 60 * 1000;
      var count = (AuthenticateNIH.treatAsUTC(parseInt(expDate, 10)) - AuthenticateNIH.treatAsUTC(currentDate)) / millisecondsPerDay;
      if (count > 0) {
        result = Math.round(count);
      }
    }
    return result;
  },

  treatAsUTC(date) {
    var result = new Date(date);
    result.setMinutes(result.getMinutes() - result.getTimezoneOffset());
    return result;
  }

};

export const Institution = {
  list: async () => {
    const url = `${await Config.getApiUrl()}/api/institutions`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  getById: async (id) => {
    const url = `${await Config.getApiUrl()}/api/institutions/${id}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  postInstitution: async (institution) => {
    const url = `${await Config.getApiUrl()}/api/institutions`;
    const res = await axios.post(url, institution, Config.authOpts());
    return res.data;
  },

  putInstitution: async (id, institution) => {
    const url = `${await Config.getApiUrl()}/api/institutions/${id}`;
    const res = await axios.put(url, institution, Config.authOpts());
    return res.data;
  },

  deleteInstitution: async (id) => {
    const url = `${await Config.getApiUrl()}/api/institutions/${id}`;
    return await fetchOk(url, fp.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
  }
};

export const LibraryCard = {
  getAllLibraryCards: async () => {
    const url = `${await Config.getApiUrl()}/api/libraryCards`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },
  createLibraryCard: async (card) => {
    const url = `${await Config.getApiUrl()}/api/libraryCards`;
    const res = await axios.post(url, card, Config.authOpts());
    return res.data;
  },
  updateLibraryCard: async (card) => {
    const url = `${await Config.getApiUrl()}/api/libraryCards/${card.id}`;
    const res = await axios.put(url, card, Config.authOpts());
    return res.data;
  },
  deleteLibraryCard: async (id) => {
    const url = `${await Config.getApiUrl()}/api/libraryCards/${id}`;
    return await axios.delete(url, Config.authOpts());
  }
};

const fetchOk = async (...args) => {
  //TODO: Remove spinnerService calls
  spinnerService.showAll();
  const res = await fetch(...args);
  if (!res.ok && res.status === 401) {
    Storage.clearStorage();
    window.location.href = '/home';
  }
  if (res.status >= 400) {
    await reportError(args[0], res.status);
  }
  spinnerService.hideAll();
  return res.ok ? res : Promise.reject(res);
};

const fetchAny = async (...args) => {
  //TODO: Remove spinnerService calls
  spinnerService.showAll();
  const res = await fetch(...args);
  if (!res.ok && res.status === 401) {
    Storage.clearStorage();
    window.location.href = '/home';
  }
  if (res.status >= 500) {
    await reportError(args[0], res.status);
  }
  spinnerService.hideAll();
  return res;
};

const getFile = async (URI, fileName) => {
  const res = await fetchOk(URI, Config.fileBody());
  fileName = fileName === null ? getFileNameFromHttpResponse(res) : fileName;
  let blob = await res.blob();
  fileDownload(blob, fileName);
};

const getFileNameFromHttpResponse = (response) => {
  const respHeaders = response.headers;
  return respHeaders.get('Content-Disposition').split(';')[1].trim().split('=')[1];
};

const reportError = async (url, status) => {
  const msg = 'Error fetching response: '
    .concat(JSON.stringify(url))
    .concat('Status: ')
    .concat(status);
  await StackdriverReporter.report(msg);
};
