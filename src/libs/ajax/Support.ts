import { Config } from '../config'
import { FetchData, fetchPost } from 'src/libs/ajax/fetchAdapter'
import { extractConsentError, extractError } from 'src/utils/ErrorUtils'

export interface SupportTicket {
  name: string
  type: string
  email: string
  subject: string
  description: string
  url: string | undefined
  uploads: string[]
}

interface UploadAttachmentResponse {
  token?: string
}

export const Support = {
  /**
   * Creates a support ticket object to pass to {@link Support.createSupportRequest}.
   * @param name The requester's display name
   * @param type The request type (uppercased before sending)
   * @param email The requester's email address
   * @param subject A short summary of the issue
   * @param description A detailed description of the issue
   * @param attachmentToken Array of attachment tokens from prior {@link Support.uploadAttachment} calls
   * @param url The page URL where the request originated
   * @returns A {@link SupportTicket} object ready for submission
   */
  createTicket: (
    name: string,
    type: string,
    email: string,
    subject: string,
    description: string,
    attachmentToken: string[],
    url: string | undefined,
  ): SupportTicket => {
    return {
      name,
      type: type.toUpperCase(),
      email,
      subject,
      description,
      url,
      uploads: attachmentToken,
    }
  },

  /**
   * Submits a support request ticket to the DUOS support endpoint.
   * @param ticket The support ticket created by {@link Support.createTicket}
   * @returns Promise that resolves when the request is submitted successfully
   */
  createSupportRequest: async (ticket: SupportTicket): Promise<void> => {
    const url = `${await Config.getApiUrl()}/support/request`
    try {
      await fetchPost<void>(url, ticket)
    }
    catch (error) {
      throw extractConsentError(error) || new Error(extractError(error))
    }
  },

  /**
   * Uploads a file attachment to the DUOS support system.
   * @param file The file to upload as a binary multipart attachment
   * @returns Promise resolving with the server-assigned attachment token
   */
  uploadAttachment: async (file: File): Promise<FetchData<UploadAttachmentResponse>> => {
    const url = `${await Config.getApiUrl()}/support/upload`
    try {
      return await fetchPost<UploadAttachmentResponse>(url, file, { headers: { 'Content-Type': 'application/binary' }, isMultipart: true })
    }
    catch (error) {
      throw extractConsentError(error) || new Error(extractError(error))
    }
  },
}
