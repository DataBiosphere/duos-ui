import { Config } from '../config';
import axios from 'axios';
import { sleep, reportError } from '../ajax';
import {partition} from '../utils';

export const TerraDataRepo = {
  listSnapshotsByDatasetIds: async (identifiers) => {
    // We can hit max url length (2048) with many identifiers so partition them to a reasonable number and recombine
    // back into the EnumerateSnapshotModel schema: https://data.terra.bio/swagger-ui.html#/snapshots/enumerateSnapshots
    // DUOS ID + param (?duosDatasetIds=DUOS-000852): 27 chars
    // ~70 should a safe default at 1890 characters
    const partitionedIdentifiers = partition(identifiers, 70);
    let enumerateSnapshotModel = {
      total: 0,
      filteredTotal: 0,
      items: [],
      roleMap: {},
      errors: []
    };
    for await (const sublist of partitionedIdentifiers) {
      // Note that TDR is expecting dataset identifiers, not dataset ids
      const url = `${await Config.getTdrApiUrl()}/api/repository/v1/snapshots?duosDatasetIds=${sublist.join('&duosDatasetIds=')}`;
      const res = await axios.get(url, Config.authOpts());
      enumerateSnapshotModel.total = res.data.total;
      enumerateSnapshotModel.filteredTotal += res.data.filteredTotal;
      Object.assign(enumerateSnapshotModel.roleMap, res.data.roleMap);
      enumerateSnapshotModel.items.push(...res.data.items);
      enumerateSnapshotModel.errors.push(...res.data.errors);
    }
    return enumerateSnapshotModel;
  },

  prepareExport: async (snapshotId) => {
    const url = `${await Config.getTdrApiUrl()}/api/repository/v1/snapshots/${snapshotId}/export`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },

  waitForJob: async (jobId) => {
    const url = `${await Config.getTdrApiUrl()}/api/repository/v1/jobs/${jobId}`;
    const resultsUrl = `${await Config.getTdrApiUrl()}/api/repository/v1/jobs/${jobId}/result`;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const res = await axios.get(url, Config.authOpts());
      if (res.data.job_status === 'running') {
        await sleep(1000);
      } else if (res.data.job_status === 'succeeded') {
        const finalResult = await axios.get(resultsUrl, Config.authOpts());
        // Add the URL to link to
        finalResult.data.terraImportLink =
          `${await Config.getTerraUrl()}/#import-data?url=${window.location.origin}&snapshotId=${finalResult.data.snapshot.id}&format=tdrexport&snapshotName=${finalResult.data.snapshot.name}&tdrmanifest=${encodeURIComponent(finalResult.data.format.parquet.manifest)}&tdrSyncPermissions=false`;
        return finalResult.data;
      } else if (res.data.job_status === 'failed') {
        return reportError(url, res.data.status_code);
      }
    }
  },
};
