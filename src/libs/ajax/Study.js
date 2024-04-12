import { Config } from '../config';
import { getApiUrl, fetchOk } from '../ajax';


export const Study = {
  getStudyNames: async () => {
    const url = `${await getApiUrl()}/api/dataset/studyNames`;
    const res = await fetchOk(url, Config.authOpts());
    return await res.json();
  }
};
