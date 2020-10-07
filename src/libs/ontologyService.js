import axios from 'axios';
import { Config } from '../libs/config';


export async function searchOntology(obolibraryURL) {
  const baseURL = await Config.getOntologyApiUrl();
  const params = {id: obolibraryURL};
  try{
    let resp = await axios.get(`${baseURL}search`, {params});
    return resp.data[0];
  } catch(error) {
    console.log(error);
  }
}

export default {searchOntology};