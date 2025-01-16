import {Config} from '../config';
import {getApiUrl} from '../ajax';
import axios from 'axios';

export const Support = {

  createTicket: (name, type, email, subject, description, attachmentToken, url) => {
    return  {
      name: name,
      type: type.toUpperCase(),
      email: email,
      subject: subject,
      description: description,
      url: url,
      uploads: attachmentToken
    };
  },

  createSupportRequest: async (ticket) => {
    const url = `${await getApiUrl()}/support/request`;
    return  await axios.post(url, Config.jsonBody(ticket));
  },

  uploadAttachment: async (file) => {
    const url = `${await getApiUrl()}/support/upload`;
    return  await axios.post(url, Config.attachmentBody(file));
  },

};
