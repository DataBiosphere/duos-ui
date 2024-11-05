import { Config } from '../config';
import axios from 'axios';


export const TerraDataRepo = {
  listSnapshotsByDatasetIds: async (identifiers) => {
    // Note that TDR is expecting dataset identifiers, not dataset ids
    const url = `${await Config.getTdrApiUrl()}/api/repository/v1/snapshots?duosDatasetIds=${identifiers.join('&duosDatasetIds=')}`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },
};
