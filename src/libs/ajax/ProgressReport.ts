import axios from 'axios';
import {Config} from '../config';

export const ProgressReport = {
  submitProgressReport: async (progressReport: object, parentReferenceId: string) => {
    const url = `${await Config.getApiUrl()}/api/dar/v2/progress_report/` + parentReferenceId;
    return await axios.post(
        url,
        progressReport,
        Config.authOpts()
    );
  }
}
