import { Config } from './config'
import { fetchOk } from "./ajax";


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

};
const getFile = async (URI) => {
  const res = await fetchOk(URI, Config.authOpts());
  return res.blob();
};
