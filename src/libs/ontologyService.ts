import { Notifications } from 'src/libs/utils'
import { Config } from 'src/libs/config'
import { Storage } from 'src/libs/storage'
import { fetchGet } from 'src/libs/ajax/fetchAdapter'

export interface OntologyEntry {
  id: string
  label: string
  synonyms?: string[]
  definition?: string
}

export const OntologyService = {
  searchOntology: async (obolibraryURL: string): Promise<OntologyEntry[]> => {
    if (obolibraryURL.length === 0) {
      return []
    }
    const baseURL = await Config.getApiUrl()
    const params = { ids: obolibraryURL }
    try {
      const cached = Storage.getData<OntologyEntry[]>(obolibraryURL)
      if (cached !== null) {
        return cached
      }
      else {
        const response = await fetchGet<OntologyEntry[]>(`${baseURL}/ontology/search`, { params })
        const data = response.data
        Storage.setData(obolibraryURL, data)
        return data
      }
    }
    catch (_error) {
      Notifications.showError({ text: 'Error: Ontology Search Request failed' })
      return []
    }
  },

  extractDOIDFromUrl: (urls: string[]): string[] => {
    const doidArr: string[] = []
    urls.forEach((url) => {
      const startIdx = url.search(/DOID_\d+/)
      if (startIdx > -1) {
        doidArr.push(url.slice(startIdx))
      }
    })
    return doidArr
  },
}
