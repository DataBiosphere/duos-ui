import {Config} from 'src/libs/config';
import axios from 'axios';
import {getApiUrl} from 'src/libs/ajax';


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
    // console.warn('WARNING: you are using a mock createLibraryCard implementation');

    // return new Promise((resolve, reject) => {
    //   setTimeout(() => {
    //     // 50% chance of returning an error
    //     if (Math.random() < 0) {
    //       resolve({
    //         id: 'stubbed-id',
    //         ...card
    //       });
    //     } else {
    //       reject({
    //         response: {
    //           data: {
    //             message: `Failed to issue library card for ${card.userEmail || card.email}`
    //           }
    //         }
    //       });
    //     }
    //   }, 1000);
    // });
  },
  deleteLibraryCard: async (id) => {
    const url = `${await getApiUrl()}/api/libraryCards/${id}`;
    return await axios.delete(url, Config.authOpts());
  }
};
