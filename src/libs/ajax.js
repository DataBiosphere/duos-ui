import _ from 'lodash/fp';
import { Config } from './config';
import { spinnerService } from './spinner-service';
import { Storage } from './storage';

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
    const url = `${process.env.REACT_APP_API_URL}/consent/${consentId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'GET' }]));
    return await res.json();
  },

  findDataUseLetterForConsent: async consentId => {
    const url = `${process.env.REACT_APP_API_URL}/consent/${consentId}/dul`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  findConsentManage: async () => {
    const url = `${process.env.REACT_APP_API_URL}/consent/manage`;
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

  postConsent: async (consent) => {
    consent.requiresManualReview = false;
    consent.useRestriction = JSON.parse(consent.useRestriction);
    consent.dataUse = JSON.parse(consent.dataUse);
    const url = `${process.env.REACT_APP_API_URL}/consent`;
    try {
      const res = await fetchOk(url, _.mergeAll([Config.jsonBody(consent), Config.authOpts(), { method: 'POST' }]));
      if (res.ok) {
        return true;
      }
    } catch (err) {
      return await err.json().then(message => {
        return message.message;
      });
    }
  },

  update: async (consent) => {
    consent.requiresManualReview = false;
    consent.useRestriction = JSON.parse(consent.useRestriction);
    consent.dataUse = JSON.parse(consent.dataUse);
    const url = `${process.env.REACT_APP_API_URL}/consent/${consent.consentId}`;
    try {
      const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(consent), { method: 'PUT' }]));
      await res.json();
      return true;
    } catch (err) {
      const message = await err.json();
      return message.message;
    }
  },

  postDul: async (consentId, fileName, file) => {
    const url = `${process.env.REACT_APP_API_URL}/consent/${consentId}/dul?fileName=${fileName}`;
    let formData = new FormData();
    formData.append("data", new Blob([file], { type: 'text/plain' }));
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'POST', body: formData }]));
    return res.json().then(
      () => {
        return true;
      },
      (error) => {
        return error;
      }
    );
  },

  deleteConsent: async (consentId) => {
    const url = `${process.env.REACT_APP_API_URL}/consent/${consentId}`;
    return await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
  },

  findInvalidConsentRestriction: async () => {
    const url = `${process.env.REACT_APP_API_URL}/consent/invalid`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  }

};

export const DAR = {

  describeDar: async (darId) => {
    let darInfo = {};
    const url = `${process.env.REACT_APP_API_URL}/dar/modalSummary/${darId}`;
    const res = await fetchOk(url, Config.authOpts());
    let data = await res.json();

    darInfo.researcherId = data.userId;
    darInfo.status = data.status;
    darInfo.hasAdminComment = data.rationale != null;
    darInfo.adminComment = data.rationale;
    darInfo.hasPurposeStatements = data.purposeStatements.length > 0;
    if (darInfo.hasPurposeStatements) {
      darInfo.purposeStatements = data.purposeStatements;
      darInfo.purposeManualReview = await DAR.requiresManualReview(darInfo.purposeStatements);
    }
    darInfo.hasDiseases = data.diseases.length > 0;
    darInfo.diseases = darInfo.hasDiseases ? data.diseases : [];
    if (data.researchType.length > 0) {
      darInfo.researchType = data.researchType;
      darInfo.researchTypeManualReview = await DAR.requiresManualReview(darInfo.researchType);
    }
    let researcherProperties = await Researcher.getResearcherProfile(darInfo.researcherId);
    darInfo.pi = researcherProperties.isThePI === 'true' ? researcherProperties.profileName : researcherProperties.piName;
    darInfo.havePI = researcherProperties.havePI === 'true' || researcherProperties.isThePI === 'true';
    darInfo.profileName = researcherProperties.profileName;
    darInfo.institution = researcherProperties.institution;
    darInfo.department = researcherProperties.department;
    darInfo.city = researcherProperties.city;
    darInfo.country = researcherProperties.country;
    return darInfo;
  },

  getPartialDarRequest: async darId => {
    const url = `${process.env.REACT_APP_API_URL}/dar/partial/${darId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  updatePartialDarRequest: async dar => {
    const url = `${process.env.REACT_APP_API_URL}/dar/partial`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(dar), { method: 'PUT' }]));
    return await res.json();
  },

  postPartialDarRequest: async dar => {
    const url = `${process.env.REACT_APP_API_URL}/dar/partial`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(dar), { method: 'POST' }]));
    return await res.json();
  },

  partialDarFromCatalogPost: async (userId, datasetIds) => {
    const url = `${process.env.REACT_APP_API_URL}/dar/partial/datasetCatalog?userId=${userId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(datasetIds), { method: 'POST' }]));
    return await res.json();
  },

  deletePartialDarRequest: async (darId) => {
    const url = `${process.env.REACT_APP_API_URL}/dar/partial/${darId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return await res;
  },

  getPartialDarRequestList: async userId => {
    const url = `${process.env.REACT_APP_API_URL}/dar/partials/manage?userId=${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  getDarConsent: async id => {
    const url = `${process.env.REACT_APP_API_URL}/dar/find/${id}/consent`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  getDarFields: async (id, fields) => {
    let url = `${process.env.REACT_APP_API_URL}/dar/find/${id}`;
    if (fields !== null) {
      url = url + `?fields=${fields}`;
    }
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  postDataAccessRequest: async dar => {
    const url = `${process.env.REACT_APP_API_URL}/dar`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(dar), { method: 'POST' }]));
    return await res;
  },

  cancelDar: async referenceId => {
    const url = `${process.env.REACT_APP_API_URL}/dar/cancel/${referenceId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'PUT' }]));
    return await res.json();
  },

  getAutoCompleteDS: async partial => {
    const url = `${process.env.REACT_APP_API_URL}/dataset/autocomplete/${partial}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  getAutoCompleteOT: async partial => {
    const url = `${process.env.REACT_APP_ONTOLOGY_API_URL}/autocomplete?q=${partial}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  getDataAccessManage: async userId => {
    userId = userId === undefined ? '' : userId;
    const url = `${process.env.REACT_APP_API_URL}/dar/manage/?userId=${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    let dars = await res.json();
    dars.map(dar => {
      if (dar.ownerUser !== null) {
        dar.ownerUser.roles.map(role => {
          if (role.name === 'Researcher') {
            dar.status = role.status;
            return dar;
          }
          return dar;
        });
      }
      return dar;
    });
    return dars;
  },

  updateDar: async (dar, id) => {
    const url = `${process.env.REACT_APP_API_URL}/dar/${id}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(dar), { method: 'PUT' }]));
    return await res;
  },

  getDarModalSummary: async (darId) => {
    const url = `${process.env.REACT_APP_API_URL}/dar/modalSummary/${darId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  hasUseRestriction: async (referenceId) => {
    const url = `${process.env.REACT_APP_API_URL}/dar/hasUseRestriction/${referenceId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  findDataAccessInvalidUseRestriction: async () => {
    const url = `${process.env.REACT_APP_API_URL}/dar/invalid`;
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

  postDAA: async (fileName, file, existentFileUrl) => {
    const url = `${process.env.REACT_APP_API_URL}/dar/storeDAA?fileName=${fileName}&existentFileUrl=${existentFileUrl}`;
    let formData = new FormData();
    formData.append("data", new Blob([file], { type: 'application/pdf' }));
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'POST', body: formData }]));
    return await res.json();
  },
};

export const DataSet = {

  postDatasetFile: async (file, overwrite, userId) => {
    const url = `${process.env.REACT_APP_API_URL}/dataset/${userId}?overwrite=${overwrite}`;
    let formData = new FormData();
    formData.append("data", new Blob([file], { type: 'text/plain' }));
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'POST', body: formData }]));
    return await res.json();
  },

  findDictionary: async () => {
    const url = `${process.env.REACT_APP_API_URL}/dataset/dictionary`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  findDataSets: async dacUserId => {
    const url = `${process.env.REACT_APP_API_URL}/dataset?dacUserId=${dacUserId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  getDataSetsByDatasetId: async dataSetId => {
    const url = `${process.env.REACT_APP_API_URL}/dataset/${dataSetId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  downloadDataSets: async (objectIdList, fileName) => {
    const url = `${process.env.REACT_APP_API_URL}/dataset/download`;
    const res = await fetchOk(url, _.mergeAll([Config.jsonBody(objectIdList), Config.fileOpts(), { method: 'POST' }]));

    fileName = fileName === null ? getFileNameFromHttpResponse(res) : fileName;
    const responseObj = await res.json();

    let blob = new Blob([responseObj.datasets], { type: 'text/plain' });
    const urlBlob = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = urlBlob;
    a.download = fileName;
    a.click();
  },

  deleteDataset: async (datasetObjectId, dacUserId) => {
    const url = `${process.env.REACT_APP_API_URL}/dataset/${datasetObjectId}/${dacUserId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return await res;
  },

  disableDataset: async (datasetObjectId, active) => {
    const url = `${process.env.REACT_APP_API_URL}/dataset/disable/${datasetObjectId}/${active}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
    return res;
  },

  reviewDataSet: async (dataSetId, needsApproval) => {
    const url = `${process.env.REACT_APP_API_URL}/dataset?dataSetId=${dataSetId}&needsApproval=${needsApproval}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'PUT' }]));
    return res.json();
  }
};

export const DatasetAssociation = {

  createDatasetAssociations: async (objectId, usersIdList) => {
    const url = `${process.env.REACT_APP_API_URL}/datasetAssociation/${objectId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(usersIdList), { method: 'POST' }]));
    return await res.json();
  },

  getAssociatedAndToAssociateUsers: async (objectId) => {
    const url = `${process.env.REACT_APP_API_URL}/datasetAssociation/${objectId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  updateDatasetAssociations: async (objectId, usersIdList) => {
    const url = `${process.env.REACT_APP_API_URL}/datasetAssociation/${objectId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(usersIdList), { method: 'PUT' }]));
    return res.json();
  }

};

export const Election = {

  findElectionById: async (electionId) => {
    const url = `${process.env.REACT_APP_API_URL}/election/${electionId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },
  findElectionByVoteId: async (voteId) => {
    const url = `${process.env.REACT_APP_API_URL}/election/vote/${voteId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  findElectionByDarId: async (requestId) => {
    const url = `${process.env.REACT_APP_API_URL}/dataRequest/${requestId}/election`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },


  downloadDatasetVotesForDARElection: async (requestId) => {
    const url = `${process.env.REACT_APP_API_URL}/dataRequest/${requestId}/election/dataSetVotes`;
    return getFile(url, 'datasetVotesSummary.txt');
  },

  findElection: async (consentId) => {
    const url = `${process.env.REACT_APP_API_URL}/consent/${consentId}/election`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  electionReviewResource: async (referenceId, type) => {
    const url = `${process.env.REACT_APP_API_URL}/electionReview?referenceId=${referenceId}&type=${type}`;
    const res = await fetchOk(url, Config.authOpts());
    if (res.status === 204) {
      return {};
    }
    return await res.json();
  },

  findDataAccessElectionReview: async (electionId, isFinalAccess) => {
    const url = `${process.env.REACT_APP_API_URL}/electionReview/access/${electionId}?isFinalAccess=${isFinalAccess}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  findRPElectionReview: async (electionId, isFinalAccess) => {
    const url = `${process.env.REACT_APP_API_URL}/electionReview/rp/${electionId}?isFinalAccess=${isFinalAccess}`;
    const res = await fetchOk(url, Config.authOpts());
    if (res.status === 204) {
      return {};
    }
    return await res.json();
  },

  updateElection: async (electionId, document) => {
    const url = `${process.env.REACT_APP_API_URL}/election/${electionId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(document), { method: 'PUT' }]));
    return await res.json();
  },

  createElection: async (consentId) => {
    var election = {};
    election.status = 'Open';
    const url = `${process.env.REACT_APP_API_URL}/consent/${consentId}/election`;
    const res = await fetchOk(url, _.mergeAll([Config.jsonBody(election), Config.authOpts(), { method: 'POST' }]));
    return res;
  },

  findReviewedConsents: async () => {
    const url = `${process.env.REACT_APP_API_URL}/consent/cases/closed`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  findInvalidConsentRestriction: async () => {
    const url = `${process.env.REACT_APP_API_URL}/consent/invalid`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  findReviewedDRs: async () => {
    const url = `${process.env.REACT_APP_API_URL}/dataRequest/cases/closed`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  findReviewedElections: async (electionId) => {
    const url = `${process.env.REACT_APP_API_URL}/electionReview/${electionId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  createDARElection: async (requestId) => {
    var election = {};
    election.status = 'Open';
    election.finalAccessVote = false;
    const url = `${process.env.REACT_APP_API_URL}/dataRequest/${requestId}/election`;
    const res = await fetchOk(url, _.mergeAll([Config.jsonBody(election), Config.authOpts(), { method: 'POST' }]));
    return res;
  },

  isDataSetElectionOpen: async () => {
    const url = `${process.env.REACT_APP_API_URL}/election/checkdataset`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  findElectionReviewById: async (electionId, referenceId) => {
    if (electionId !== undefined) {
      const url = `${process.env.REACT_APP_API_URL}/electionReview/${electionId}`;
      const res = await fetchOk(url, Config.authOpts());
      return await res.json();
    } else {
      const url = `${process.env.REACT_APP_API_URL}/electionReview/last/${referenceId}`;
      const res = await fetchOk(url, Config.authOpts());
      return await res.json();
    }
  },
  findConsentElectionByDarElection: async (requestElectionId) => {
    const url = `${process.env.REACT_APP_API_URL}/election/consent/${requestElectionId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  }

};

export const ElectionTimeout = {

  findApprovalExpirationTime: async () => {
    const url = `${process.env.REACT_APP_API_URL}/approvalExpirationTime`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  updateApprovalExpirationTime: async (approvalExpirationTime) => {
    const url = `${process.env.REACT_APP_API_URL}/approvalExpirationTime/${approvalExpirationTime.id}`;
    const res = await fetchOk(url, _.mergeAll([Config.jsonBody(approvalExpirationTime), Config.authOpts(), { method: 'PUT' }]));
    return res;
  },

  createApprovalExpirationTime: async (approvalExpirationTime) => {
    const url = `${process.env.REACT_APP_API_URL}/approvalExpirationTime`;
    const res = await fetchOk(url, _.mergeAll([Config.jsonBody(approvalExpirationTime), Config.authOpts(), { method: 'POST' }]));
    return await res.json();
  }
};

export const Email = {

  sendReminderEmail: async (voteId) => {
    const url = `${process.env.REACT_APP_API_URL}/emailNotifier/reminderMessage/${voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'POST' }]));
    return res;
  }

};

export const Files = {

  // Get DUL File requires another field for fileName to be downloaded
  // this field is required in the component
  getDulFile: async (consentId, fileName) => {
    const url = `${process.env.REACT_APP_API_URL}/consent/${consentId}/dul`;
    return getFile(url, fileName);
  },

  getDulFileByElectionId: async (consentId, electionId, fileName) => {
    const url = `${process.env.REACT_APP_API_URL}/consent/${consentId}/dul?electionId=${electionId}`;
    return getFile(url, fileName);
  },

  getOntologyFile: async (fileName, fileUrl) => {
    const encodeURI = encodeURIComponent(fileUrl);
    const url = `${process.env.REACT_APP_API_URL}/ontology/file?fileUrl=${encodeURI}&fileName=${fileName}`;
    return getFile(url, fileName);
  },

  getApprovedUsersFile: async (fileName, dataSetId) => {
    const url = `${process.env.REACT_APP_API_URL}/dataset/${dataSetId}/approved/users`;
    return getFile(url, fileName);
  },

  getDARFile: async (darId) => {
    const url = `${process.env.REACT_APP_API_URL}/dataRequest/${darId}/pdf`;
    return await getFile(url, null);
  },

  getDAAFile: async (researcherId, fileName) => {
    const url = `${process.env.REACT_APP_API_URL}/dar/downloadDAA/${researcherId}`;
    return getFile(url, fileName);
  }
};

export const Summary = {
  getFile: async (URI, nameFile) => {
    const url = `${process.env.REACT_APP_API_URL}${URI}`;
    return await getFile(url, nameFile);
  }
};

export const Help = {

  findHelpMeReports: async (userId) => {
    const url = `${process.env.REACT_APP_API_URL}/report/user/${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  createHelpMeReport: async (report) => {
    const url = `${process.env.REACT_APP_API_URL}/report`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(report), { method: 'POST' }]));
    return await res.json();
  }

};

export const Match = {

  findMatch: async (consentId, purposeId) => {
    const url = `${process.env.REACT_APP_API_URL}/match/${consentId}/${purposeId}`;
    const res = await fetchOk(url, Config.authOpts());
    let answer = {};
    try {
      answer = await res.json();
    } catch (error) {
      answer = {};
    } finally {
      return answer;
    }
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

    const url = `${process.env.REACT_APP_API_URL}/ontology`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'POST', body: formData }]));
    if (res.status === 204) {
      return [];
    }
    return await res.json();
  },

  retrieveIndexedFiles: async () => {
    const url = `${process.env.REACT_APP_API_URL}/ontology`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'GET' }]));
    return await res.json().then((data) => { return data; });
  },

  deleteOntologyFile: async (fileUrl) => {
    const url = `${process.env.REACT_APP_API_URL}/ontology`;
    const obj = { fileUrl: fileUrl };
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(obj), { method: 'PUT' }]));
    return await res.json();
  },

  getOntologyTypes: async () => {
    const url = `${process.env.REACT_APP_API_URL}/ontology/types`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'GET' }]));
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

export const PendingCases = {

  findDataRequestPendingCasesByUser: async (userId) => {
    const url = `${process.env.REACT_APP_API_URL}/dataRequest/cases/pending/${userId}`;
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
    const url = `${process.env.REACT_APP_API_URL}/consent/cases/pending/${userId}`;
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
    const url = `${process.env.REACT_APP_API_URL}/consent/unreviewed`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  findDARUnReviewed: async () => {
    const url = `${process.env.REACT_APP_API_URL}/dar/cases/unreviewed`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  findDataOwnerUnReviewed: async (dataOwnerId) => {
    const url = `${process.env.REACT_APP_API_URL}/dataRequest/cases/pending/dataOwner/${dataOwnerId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  findSummary: async () => {
    const consentUrl = `${process.env.REACT_APP_API_URL}/consent/cases/summary`;
    const dataAccessUrl = `${process.env.REACT_APP_API_URL}/dataRequest/cases/summary/DataAccess`;
    const rpUrl = `${process.env.REACT_APP_API_URL}/dataRequest/cases/summary/RP`;
    const matchUrl = `${process.env.REACT_APP_API_URL}/dataRequest/cases/matchsummary`;
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

  getPropertiesByResearcherId: async (userId) => {
    const url = `${process.env.REACT_APP_API_URL}/researcher/${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  createResearcherProperties: async (userId, validate, researcherProperties) => {
    const url = `${process.env.REACT_APP_API_URL}/researcher/${userId}?validate=${validate}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(researcherProperties), { method: 'POST' }]));
    return await res;
  },

  update: async (userId, validate, researcherProperties) => {
    const url = `${process.env.REACT_APP_API_URL}/researcher/${userId}?validate=${validate}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(researcherProperties), { method: 'PUT' }]));
    return res.json();
  },

  getResearcherProfile: async userId => {
    const url = `${process.env.REACT_APP_API_URL}/researcher/${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    const profile = await res.json();
    return await profile;
  }
};

export const StatFiles = {

  getFile: async fileType => {
    const url = `${process.env.REACT_APP_API_URL}/consent/cases/summary/file?fileType=${fileType}`;
    let fileName = null;
    if (fileType === 'TranslateDUL') {
      fileName = "summary.txt";
    } else if (fileType === 'DataAccess') {
      fileName = "DAR_summary.txt";
    }
    return getFile(url, fileName);
  },

  getDARsReport: async (reportType, fileName) => {
    const url = `${process.env.REACT_APP_API_URL}/dataRequest/${reportType}`;
    return getFile(url, fileName);
  }
};

export const User = {

  getByEmail: async email => {
    const url = `${process.env.REACT_APP_API_URL}/dacuser/${email}`;
    console.log(url);
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  list: async () => {
    const url = `${process.env.REACT_APP_API_URL}/dacuser`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  create: async user => {
    const url = `${process.env.REACT_APP_API_URL}/dacuser`;
    try {
      const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(user), { method: 'POST' }]));
      if (res.ok) {
        return res.json;
      }
    } catch (err) {
      return false;
    }
  },

  update: async (user, userId) => {
    const url = `${process.env.REACT_APP_API_URL}/dacuser/${userId}`;
    try {
      const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(user), { method: 'PUT' }]));
      if (res.ok) {
        return res.json();
      }
    } catch (err) {
      return false;
    }
  },

  updateMainFields: async (user, userId) => {
    const url = `${process.env.REACT_APP_API_URL}/dacuser/mainFields/${userId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(user), { method: 'PUT' }]));
    return res.json();
  },

  updateName: async (body, userId) => {
    const url = `${process.env.REACT_APP_API_URL}/dacuser/name/${userId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(body), { method: 'PUT' }]));
    return res.json();
  },

  validateDelegation: async (role, dacUser) => {
    const url = `${process.env.REACT_APP_API_URL}/dacuser/validateDelegation?role=` + role;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(dacUser), { method: 'POST' }]));
    return res.json();
  },

  registerUser: async user => {
    const url = `${process.env.REACT_APP_API_URL}/user`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(user), { method: 'POST' }]));
    return res.json();
  },

  registerStatus: async (userRoleStatus, userId) => {
    const url = `${process.env.REACT_APP_API_URL}/dacuser/status/${userId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(userRoleStatus), { method: 'PUT' }]));
    return res.json();
  },

  findUserStatus: async userId => {
    const url = `${process.env.REACT_APP_API_URL}/dacuser/status/${userId}`;
    const res = await fetchOk(url, Config.authOpts());
    const user = await res.json();
    return user;
  }
};

export const Votes = {

  getAllVotes: async (consentId) => {
    const url = `${process.env.REACT_APP_API_URL}/consent/${consentId}/vote`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  find: async (consentId, voteId) => {
    const url = `${process.env.REACT_APP_API_URL}/consent/${consentId}/vote/${voteId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  postVote: async (consentId, vote) => {
    var postObject = {};
    postObject.vote = vote.vote;
    postObject.dacUserId = vote.dacUserId;
    postObject.rationale = vote.rationale;
    const url = `${process.env.REACT_APP_API_URL}/consent/${consentId}/vote/${vote.voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(postObject), { method: 'POST' }]));
    return await res.json();
  },

  updateVote: async (consentId, vote) => {
    var voteToUpdate = {};
    voteToUpdate.vote = vote.vote;
    voteToUpdate.dacUserId = vote.dacUserId;
    voteToUpdate.rationale = vote.rationale;
    const url = `${process.env.REACT_APP_API_URL}/consent/${consentId}/vote/${vote.voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(voteToUpdate), { method: 'PUT' }]));
    return await res.json();
  },

  getDarVote: async (requestId, voteId) => {
    const url = `${process.env.REACT_APP_API_URL}/dataRequest/${requestId}/vote/${voteId}`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  getDarFinalAccessVote: async (requestId) => {
    const url = `${process.env.REACT_APP_API_URL}/dataRequest/${requestId}/vote/final`;
    const res = await fetchOk(url, Config.authOpts());
    return res.json();
  },

  postDarVote: async (requestId, vote) => {
    const postObject = {};
    postObject.vote = vote.vote;
    postObject.dacUserId = vote.dacUserId;
    postObject.rationale = vote.rationale;
    postObject.hasConcerns = vote.hasConcerns;
    const url = `${process.env.REACT_APP_API_URL}/dataRequest/${requestId}/vote/${vote.voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(postObject), { method: 'POST' }]));
    return res.json();
  },


  findDar: async (requestId, voteId) => {
    const url = `${process.env.REACT_APP_API_URL}/darRequest/${requestId}/vote/${voteId}`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  },

  updateDarVote: async (requestId, vote) => {
    const postObject = {};
    postObject.vote = vote.vote;
    postObject.dacUserId = vote.dacUserId;
    postObject.rationale = vote.rationale;
    postObject.hasConcerns = vote.hasConcerns;
    const url = `${process.env.REACT_APP_API_URL}/dataRequest/${requestId}/vote/${vote.voteId}`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(postObject), { method: 'PUT' }]));
    return await res.json();
  },

  updateFinalAccessDarVote: async (requestId, vote) => {
    var postObject = {};
    postObject.vote = vote.vote;
    postObject.dacUserId = vote.dacUserId;
    postObject.rationale = vote.rationale;
    if (vote.type === 'FINAL') {
      postObject.type = 'FINAL';
    }
    const url = `${process.env.REACT_APP_API_URL}/dataRequest/${requestId}/vote/${vote.voteId}/final`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(postObject), { method: 'POST' }]));
    return await res.json();

  }

};

export const AuthenticateNIH = {
  fireCloudVerifyUsr: async () => {
    const url = `${process.env.REACT_APP_FIRECLOUD_URL}me`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'GET' }]));
    return await res.json();
  },

  fireCloudRegisterUsr: async (profile) => {
    const url = `${process.env.REACT_APP_FIRECLOUD_URL}register/profile`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(AuthenticateNIH.parseProfile(profile)), { method: 'POST' }]));
    return await res.json();
  },

  verifyNihToken: async (token) => {
    const url = `${process.env.REACT_APP_FIRECLOUD_URL}api/nih/callback`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(token), { method: 'POST' }]));
    return await res.json();
  },

  parseProfile: (profile) => {
    let fireCloudProfileObj = {};
    fireCloudProfileObj.firstName = Storage.getCurrentUser().displayName;
    fireCloudProfileObj.lastName = Storage.getCurrentUser().displayName;
    fireCloudProfileObj.title = "DUOS Researcher";
    fireCloudProfileObj.contactEmail = Storage.getCurrentUser().email;
    fireCloudProfileObj.institute = (profile.institution !== undefined && profile.institution !== "") ? profile.institution : "n/a";
    fireCloudProfileObj.institutionalProgram = "n/a";
    fireCloudProfileObj.programLocationCity = "n/a";
    fireCloudProfileObj.programLocationState = "n/a";
    fireCloudProfileObj.programLocationCountry = "n/a";
    fireCloudProfileObj.pi = (profile.havePi !== undefined && profile.havePi === true)
      ? profile.piName : profile.isThePI === true
        ? Storage.getCurrentUser().displayName : "n/a";
    fireCloudProfileObj.nonProfitStatus = "n/a";
    return fireCloudProfileObj;
  },

  saveNihUsr: async (decodedData) => {
    const url = `${process.env.REACT_APP_API_URL}/nih`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), Config.jsonBody(decodedData), { method: 'POST' }]));
    return await res.json();
  },

  eliminateAccount: async () => {
    const url = `${process.env.REACT_APP_API_URL}/nih`;
    const res = await fetchOk(url, _.mergeAll([Config.authOpts(), { method: 'DELETE' }]));
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

const fetchOk = async (...args) => {
  spinnerService.showAll();
  const res = await fetch(...args);
  spinnerService.hideAll();
  if (!res.ok && res.status === 401) {
    Storage.clearStorage();
    window.location.href = '/login';
  }
  return res.ok ? res : Promise.reject(res);
};

const getFile = async (URI, fileName) => {
  const res = await fetchOk(URI, Config.fileBody());
  fileName = fileName === null ? getFileNameFromHttpResponse(res) : fileName;
  let blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
};

const getFileNameFromHttpResponse = (response) => {
  const respHeaders = response.headers;
  return respHeaders.get('Content-Disposition').split(';')[1].trim().split('=')[1];
};
