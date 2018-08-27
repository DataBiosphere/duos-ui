import _ from 'lodash/fp'
import * as Config from './config'

// var auth_token = sessionStorage.getItem("GAPI") !== null ? JSON.parse(sessionStorage.getItem("GAPI")).accessToken : 'token';

const authOpts = (token = Token.getToken()) => ({ headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
const jsonBody = body => ({ body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });

export const Token = {

    setToken: async token => {
        console.log("received Token ", token);
    },
    getToken: () => {
        return sessionStorage.getItem("GAPI") !== null ? JSON.parse(sessionStorage.getItem("GAPI")).accessToken : 'token';
    }

};

export const User = {

    getByEmail: async email => {
        console.log("token? ", Token.getToken());

        const url = `${await Config.getApiUrl()}/dacuser/${email}`;
        const res = await fetchOk(url, authOpts());
        return res.json();
    },

    list: async () => {
        const url = `${await Config.getApiUrl()}/dacuser`;
        const res = await fetchOk(url, authOpts());
        return res.json();
    },

    create: async user => {
        const url = `${await Config.getApiUrl()}/dacuser`;
        const res = await fetchOk(url, _.mergeAll([authOpts(), jsonBody(user), { method: 'POST' }]));
        return res.json();
    },

    update: async(user, userId) => {
        const url = `${await Config.getApiUrl()}/dacuser/${userId}`;
        const res = await fetchOk(url, _.mergeAll([authOpts(), jsonBody(user), { method: 'PUT' }]));
        return res.json();
    },

    updateName: async(body, userId) => {
        const url = `${await Config.getApiUrl()}/dacuser/name/${userId}`;
        const res = await fetchOk(url, _.mergeAll([authOpts(), jsonBody(body), { method: 'PUT' }]));
        return res.json();
    },

    validateDelegation: async(role, dacUser) => {
        const url = `${await Config.getApiUrl()}/dacuser/validateDelegation?role=` + role;
        const res = await fetchOk(url, _.mergeAll([authOpts(), jsonBody(dacUser), { method: 'POST' }]));
        return res.json();
    },

    registerUser: async user => {
        const url = `${await Config.getApiUrl()}/user`;
        const res = await fetchOk(url, _.mergeAll([authOpts(), jsonBody(user), { method: 'POST' }]));
        return res.json();
    },

    registerStatus: async(userRoleStatus, userId) => {
        const url = `${await Config.getApiUrl()}/dacuser/status/${userId}`;
        const res = await fetchOk(url, _.mergeAll([authOpts(), jsonBody(userRoleStatus), { method: 'PUT' }]));
        return res.json(); 
    },

    getUserStatus:  async userId => {
        const url = `${await Config.getApiUrl()}/dacuser/status/${userId}`;
        const res = await fetchOk(url, authOpts());
        return res.json();
    }

};

export const Researcher = {

    getResearcherProfile : async userId => {

        const url = `${await Config.getApiUrl()}/researcher/${userId}`;
        const res = await fetchOk(url, authOpts());
        return res.json();
    }

};

export const DataSet = {

    create: async (file, overwrite, userId) => {
        const url = `${await Config.getApiUrl()}/dataset/${userId}?overwrite=${overwrite}`;
        let formData = new FormData();
        formData.append("data", new Blob([file], { type: 'text/plain' }));
        const res = await fetchOk(url, _.mergeAll([authOpts(), formData, { method: 'POST' }]));
        return res.json();
    },

    list: async dacUserId => {
        const url = `${await Config.getApiUrl()}/dataset?dacUserId=${dacUserId}`;
        const res = await fetchOk(url, authOpts());
        return res.json();
    },

    getByDataSetId: async dataSetId => {
        const url = `${await Config.getApiUrl()}/dataset/${dataSetId}`;
        const res = await fetchOk(url, authOpts());
        return res.json();
    },

    getDictionary: async() => {
        const url = `${await Config.getApiUrl()}/dataset/dictionary`;
        const res = await fetchOk(url, authOpts());
        return res.json();
    },
   
    download: async(objectIdList) => {
        const url = `${await Config.getApiUrl()}/dataset/download`;
        const res = await fetchOk(url, _.mergeAll([authOpts(), jsonBody(objectIdList), { method: 'POST' }]));
        return res.json();
    },

    delete: async(datasetObjectId, dacUserId) => {
        const url = `${await Config.getApiUrl()}/dataset/${datasetObjectId}/${dacUserId}`;
        const res = await fetchOk(url, _.mergeAll([authOpts(), { method: 'DELETE' }]));
        return res.json();
    },
    
    disableDataset: async(datasetObjectId, active) => {
        const url = `${await Config.getApiUrl()}/dataset/disable/${datasetObjectId}/${active}`;
        const res = await fetchOk(url, _.mergeAll([authOpts(), { method: 'DELETE' }]));
        return res.json();
    },

    reviewDataSet: async(dataSetId, needsApproval) => {
        const url = `${await Config.getApiUrl()}/dataset?dataSetId=${dataSetId}&needsApproval=${needsApproval}`;
        const res = await fetchOk(url, _.mergeAll([authOpts(), { method: 'PUT' }]));
        return res.json();
    }
}

export const Consent = {

    getById: async consentId => {
        const url = `${await Config.getApiUrl()}/consent/${consentId}`;
        const res = await fetchOk(url, authOpts());
        return res.json();
    },

    getDUL: async consentId => {
        const url = `${await Config.getApiUrl()}/consent/${consentId}/dul`;
        const res = await fetchOk(url, authOpts());
        return res.json();
    },

    getConsentManage: async (file, overwrite, userId) => {
        const url = `${await Config.getApiUrl()}/consent/manage`;
        const res = await fetchOk(url, authOpts());
        return res.json();
    },

    getInvalidConsentRestriction: async dacUserId => {
        const url = `${await Config.getApiUrl()}/consent/invalid`;
        const res = await fetchOk(url, authOpts());
        return res.json();
    },

    create: async consent => {
        consent.requiresManualReview = false;
        consent.useRestriction = JSON.parse(consent.useRestriction);
        consent.dataUse = JSON.parse(consent.dataUse);
        const url = `${await Config.getApiUrl()}/consent`;
        const res = await fetchOk(url, _.mergeAll([authOpts(), jsonBody(consent), { method: 'POST' }]));
        return res.json();
    },

    update: async consent => {
        consent.requiresManualReview = false;
        consent.useRestriction = JSON.parse(consent.useRestriction);
        consent.dataUse = JSON.parse(consent.dataUse);
        const url = `${await Config.getApiUrl()}/consent`;
        const res = await fetchOk(url, _.mergeAll([authOpts(), jsonBody(consent), { method: 'PUT' }]));
        return res.json();
    }
}


const fetchOk = async (...args) => {
    const res = await fetch(...args);
    return res.ok ? res : Promise.reject(res);
}

