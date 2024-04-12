import * as fp from 'lodash/fp';
import { Config } from '../config';
import { fetchAny } from '../ajax';


export const Support = {
  createTicket: (name, type, email, subject, description, attachmentToken, url) => {
    const ticket = {};

    ticket.request = {
      requester: { name: name, email: email },
      subject: subject,
      // BEWARE changing the following ids or values! If you change them then you must thoroughly test.
      custom_fields: [
        { id: 360012744452, value: type },
        { id: 360007369412, value: description },
        { id: 360012744292, value: name },
        { id: 360012782111, value: email },
        { id: 360018545031, value: email }
      ],
      comment: {
        body: description + '\n\n------------------\nSubmitted from: ' + url,
        uploads: attachmentToken
      },
      ticket_form_id: 360000669472
    };

    return ticket;

  },
  createSupportRequest: async (ticket) => {
    const res = await fetchAny('https://broadinstitute.zendesk.com/api/v2/requests.json', fp.mergeAll([Config.jsonBody(ticket), { method: 'POST' }]));
    return await res;
  },

  uploadAttachment: async (file) => {
    const res = await fetchAny('https://broadinstitute.zendesk.com/api/v2/uploads?filename=Attachment', fp.mergeAll([Config.attachmentBody(file), { method: 'POST' }]));
    return (await res.json()).upload;
  },
};
