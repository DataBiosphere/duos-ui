import axios from 'axios';
import { Config } from '../libs/config';
import { Notifications } from '../libs/utils';

export async function searchOntology(obolibraryURL) {
  const env = await Config.getEnv();
  const baseURL = env === 'local' ? '/' : await Config.getOntologyApiUrl();
  const params = {id: obolibraryURL};
  try{
    let resp = await axios.get(`${baseURL}search`, {params});
    return resp.data;
  } catch(error) {
    Notifications.showError('Error: Ontology Search Request failed');
  }
}

export function extractDOIDFromUrl(urls) {
  const doidArr = [];
  urls.forEach(url => {
    const startIdx = url.search(/DOID_\d+/);
    if (startIdx > -1) {
      doidArr.push(url.slice(startIdx));
    }
  });

  return doidArr;
}

export default { searchOntology };