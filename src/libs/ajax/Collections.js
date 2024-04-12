import { Config } from '../config';
import axios from 'axios';
import { getApiUrl } from '../ajax';


export const Collections = {
  cancelCollection: async (id, roleName) => {
    const url = `${await getApiUrl()}/api/collections/${id}/cancel`;
    const config = Object.assign({ params: { roleName } }, Config.authOpts());
    const res = await axios.put(url, {}, config);
    return res.data;
  },
  reviseCollection: async (id) => {
    const url = `${await getApiUrl()}/api/collections/${id}/resubmit`;
    const res = await axios.put(url, {}, Config.authOpts());
    return res.data;
  },
  getCollectionById: async (id) => {
    const url = `${await getApiUrl()}/api/collections/${id}`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },
  getCollectionSummariesByRoleName: async (roleName) => {
    const url = `${await getApiUrl()}/api/collections/role/${roleName}/summary`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },
  getCollectionSummaryByRoleNameAndId: async ({ roleName, id }) => {
    const url = `${await getApiUrl()}/api/collections/role/${roleName}/summary/${id}`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },
  openElectionsById: async (id) => {
    const url = `${await getApiUrl()}/api/collections/${id}/election`;
    const res = await axios.post(url, {}, Config.authOpts());
    return res.data;
  }
};
