import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'
import { AssetLookup } from 'src/types/library'

export const AssetCatalog = {
  /** Rejects with a 404 for an unknown identifier or one the user cannot read. */
  lookup: async (identifier: string): Promise<AssetLookup> => {
    const url = `${await Config.getApiUrl()}/api/asset-catalog/${encodeURIComponent(identifier)}`
    return (await fetchGet<AssetLookup>(url, Config.authOpts())).data
  },
}
