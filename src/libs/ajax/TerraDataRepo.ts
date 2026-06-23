import { Config } from '../config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'
import { partition } from '../utils'
import { EnumerateSnapshotModel } from 'src/types/tdrModel'

export const TerraDataRepo = {
  /**
   * Lists TDR snapshots associated with a set of DUOS dataset identifiers.
   * Because URLs have a maximum length of ~2048 characters, identifiers are partitioned
   * into batches of 70 and fetched concurrently, then merged into a single
   * {@link EnumerateSnapshotModel}.
   * @param identifiers Array of DUOS dataset identifier strings
   * @returns Combined EnumerateSnapshotModel from all batch responses
   */
  listSnapshotsByDatasetIds: async (identifiers: string[]): Promise<EnumerateSnapshotModel> => {
    // We can hit max url length (2048) with many identifiers so partition them to a reasonable number and recombine
    // back into the EnumerateSnapshotModel schema: https://data.terra.bio/swagger-ui.html#/snapshots/enumerateSnapshots
    // DUOS ID + param (?duosDatasetIds=DUOS-000852): 27 chars
    // ~70 should a safe default at 1890 characters
    const partitionedIdentifiers = partition(identifiers, 70)
    const enumerateSnapshotModel: EnumerateSnapshotModel = {
      total: 0,
      filteredTotal: 0,
      items: [],
      roleMap: {},
      errors: [],
    }
    const rootTdrApiUrl = await Config.getTdrApiUrl()
    const snapshotPromises = partitionedIdentifiers.map((sublist) => {
      // 1000 should be safe with only 70 DUOS IDs.
      const url = `${rootTdrApiUrl}/api/repository/v1/snapshots?limit=1000&duosDatasetIds=${sublist.join('&duosDatasetIds=')}`
      return fetchGet<EnumerateSnapshotModel>(url, Config.authOpts())
    })
    await Promise.all(snapshotPromises).then(function (responses) {
      responses.forEach((res) => {
        enumerateSnapshotModel.total = res.data.total
        enumerateSnapshotModel.filteredTotal += res.data.filteredTotal
        Object.assign(enumerateSnapshotModel.roleMap, res.data.roleMap)
        enumerateSnapshotModel.items.push(...res.data.items)
        enumerateSnapshotModel.errors.push(...(res.data.errors ?? []))
      })
    })
    return enumerateSnapshotModel
  },
}
