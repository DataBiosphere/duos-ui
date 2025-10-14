import { Config } from 'src/libs/config'
import { fetchGet, fetchPost, fetchDelete } from 'src/libs/ajax/fetchAdapter'
import { getApiUrl } from 'src/libs/ajax'

export const LibraryCard = {
  getAllLibraryCards: async () => {
    const url = `${await getApiUrl()}/api/libraryCards`
    const res = await fetchGet(url, Config.authOpts())
    return res.data
  },
  createLibraryCard: async (card) => {
    const url = `${await getApiUrl()}/api/libraryCards`
    const res = await fetchPost(url, card, Config.authOpts())
    return res.data
  },
  deleteLibraryCard: async (id) => {
    const url = `${await getApiUrl()}/api/libraryCards/${id}`
    const res = await fetchDelete(url, Config.authOpts())
    return res.data
  },
}
