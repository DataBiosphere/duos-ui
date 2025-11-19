import { getApiUrl } from '../ajax'
import { fetchPost } from 'src/libs/ajax/fetchAdapter'
import { extractConsentError, extractError } from 'src/utils/ErrorUtils.js'

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
      return await fetchPost(url, ticket)
    }
    catch (error) {
      throw extractConsentError(error) || new Error(extractError(error))
    }
  },

  uploadAttachment: async (file) => {
    const url = `${await getApiUrl()}/support/upload`
    try {
      return await fetchPost(url, file, { headers: { 'Content-Type': 'application/binary' }, isMultipart: true })
    }
    catch (error) {
      throw extractConsentError(error) || new Error(extractError(error))
    }
  },

}
