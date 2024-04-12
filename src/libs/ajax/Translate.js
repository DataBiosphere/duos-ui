import { Config } from '../config';
import axios from 'axios';
import { getOntologyUrl } from '../ajax';


export const Translate = {
  translate: async (body) => {
    const url = `${await getOntologyUrl()}/translate/paragraph`;
    const res = await axios.post(url, body, Config.authOpts());
    return res.data;
  },
};
