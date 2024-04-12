import { Config } from '../config';
import axios from 'axios';
import { getApiUrl } from '../ajax';


export const LibraryCard = {
  getAllLibraryCards: async () => {
    const url = `${await getApiUrl()}/api/libraryCards`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },
  createLibraryCard: async (card) => {
    const url = `${await getApiUrl()}/api/libraryCards`;
    const res = await axios.post(url, card, Config.authOpts());
    return res.data;
  },
  updateLibraryCard: async (card) => {
    const url = `${await getApiUrl()}/api/libraryCards/${card.id}`;
    const res = await axios.put(url, card, Config.authOpts());
    return res.data;
  },
  deleteLibraryCard: async (id) => {
    const url = `${await getApiUrl()}/api/libraryCards/${id}`;
    return await axios.delete(url, Config.authOpts());
  }
};
