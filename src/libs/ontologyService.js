import { Notifications } from './utils'
import { Config } from './config'
import { Storage as storage } from '../libs/storage'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

export const OntologyService = {
  searchOntology: async (obolibraryURL) => {
    if (obolibraryURL.length === 0) {
      return []
    }
    const baseURL = await Config.getOntologyUrl()
    const params = { id: obolibraryURL }
    try {
      const data = storage.getData(obolibraryURL)
      if (data !== null) {
        return JSON.parse(data)
      }
      else {
        const response = await fetchGet(`${baseURL}/search`, { params })
        const data = response.data
        storage.setData(obolibraryURL, JSON.stringify(data))
        return data
      }
    }
    catch (_error) {
      Notifications.showError('Error: Ontology Search Request failed')
    }
  },
  extractDOIDFromUrl: (urls) => {
    const doidArr = []
    urls.forEach((url) => {
      const startIdx = url.search(/DOID_\d+/)
      if (startIdx > -1) {
        doidArr.push(url.slice(startIdx))
      }
    })
    return doidArr
  },
}
