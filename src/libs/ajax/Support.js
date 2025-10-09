import { getApiUrl } from '../ajax'
import { fetchPost } from 'src/libs/ajax/fetchAdapter'

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
    try {
      return await fetchPost(url, ticket, { headers: { 'Content-Type': 'application/json' } })
    }
    catch (error) {
      return Promise.reject(error)
    }
  },

  uploadAttachment: async (file) => {
    const url = `${await getApiUrl()}/support/upload`
    try {
      return await fetchPost(url, file, { headers: { 'Content-Type': 'application/binary' } })
    }
    catch (error) {
      return Promise.reject(error)
    }
  },

}
