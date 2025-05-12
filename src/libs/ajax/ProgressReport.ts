import axios from 'axios';
import {Config} from '../config';

export const ProgressReport = {
  submitProgressReport: async (progressReport: object, parentId: string) => {
    const url = `${await Config.getApiUrl()}/api/dar/v2/progress_report/` + parentId;
    return await axios.post(
        url,
        progressReport,
        Config.authOpts()
    );
  }
}
