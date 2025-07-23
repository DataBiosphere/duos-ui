import { getApiUrl } from '../ajax'
import axios from 'axios'

export const Support = {

  createTicket: (name, type, email, subject, description, attachmentToken, url) => {
    return {
      name: name,
      type: type.toUpperCase(),
      email: email,
      subject: subject,
      description: description,
      url: url,
      uploads: attachmentToken,
    }
  },

  createSupportRequest: async (ticket) => {
    const url = `${await getApiUrl()}/support/request`
    return await axios.post(url, ticket, { headers: { 'Content-Type': 'application/json' } }).catch(
      function (error) {
        return Promise.reject(error.response)
      },
    )
  },

  uploadAttachment: async (file) => {
    const url = `${await getApiUrl()}/support/upload`
    return await axios.post(url, file, { headers: { 'Content-Type': 'application/binary' } }).catch(
      function (error) {
        return Promise.reject(error.response)
      },
    )
  },

}
