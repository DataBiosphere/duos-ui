import axios from 'axios';
import { Config } from '../libs/config';
import { Notifications } from '../libs/utils';

export async function searchOntology(obolibraryURL) {
  const baseURL = await Config.getOntologyApiUrl();
  const params = {id: obolibraryURL};
  try{
    let resp = await axios.get(`${baseURL}search`, {params});
    return resp.data;
  } catch(error) {
    Notifications.showError('Error: Ontology Search Request failed');
  }
}

export default { searchOntology };