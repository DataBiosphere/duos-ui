import _ from 'lodash/fp'
import * as Config from './config'

const auth_token = "tokennnnnnnnn";

const authOpts = (token = auth_token) => ({ headers: { Authorization: `Bearer ${token}` } });
const jsonBody = body => ({ body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })

export const User = {

    getByEmail: async email => {
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

    findUserStatus:  async userId => {
        const url = `${await Config.getApiUrl()}/dacuser/status/${userId}`;
        const res = await fetchOk(url, authOpts());
        return res.json();
    }

}

const fetchOk = async (...args) => {
    const res = await fetch(...args);
    return res.ok ? res : Promise.reject(res);
}

