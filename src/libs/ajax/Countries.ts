import { Config } from 'src/libs/config'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

export const Countries = {
  getCountries: async (): Promise<string[]> => {
    const url = `${await Config.getApiUrl()}/api-docs/ISO-3166-countries.json`
    const res = await fetchGet<string[]>(url)
    return res.data
  },
  DEFAULT_COUNTRY: 'United States of America (the)',
}
