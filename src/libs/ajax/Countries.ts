import { getApiUrl } from 'src/libs/ajax'
import { Config } from 'src/libs/config'
import axios from 'axios'

export const Countries = {
  getCountries: async () => {
    const url = `${await getApiUrl()}/api-docs/ISO-3166-countries.json`
    const res = await axios.get(url, Config.authOpts())
    return await res.data
  },
  DEFAULT_COUNTRY: 'United States of America (the)',
}
