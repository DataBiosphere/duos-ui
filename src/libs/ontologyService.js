import axios from 'axios';
import { Notifications } from './utils';
import { getOntologyUrl } from './ajax';


export const OntologyService = {
  searchOntology: async (obolibraryURL) => {
    if (obolibraryURL.length === 0) {
      return [];
    }
    const baseURL = await getOntologyUrl();
    const params = {id: obolibraryURL};
    try{
      let resp = await axios.get(`${baseURL}/search`, {params});
      return resp.data;
    } catch(error) {
      Notifications.showError('Error: Ontology Search Request failed');
    }
  },
  extractDOIDFromUrl: (urls) => {
    const doidArr = [];
    urls.forEach(url => {
      const startIdx = url.search(/DOID_\d+/);
      if (startIdx > -1) {
        doidArr.push(url.slice(startIdx));
      }
    });
    return doidArr;
  }
};
