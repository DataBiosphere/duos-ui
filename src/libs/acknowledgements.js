import {User} from '../libs/ajax';

export const Acknowledgments = {
  broadLcaAcknowledgement: 'Library_Card_Agreement_2021.pdf',
  nihLcaAcknowledgement: 'NIH_Library_Card_Agreement_11.17.22_version.pdf',
};

export const hasAccepted = async (...acknowledgements) => {
  const userAcknowledgementsPayload = await User.getAcknowledgements();
  const acceptedAcknowledgements = Object.keys(userAcknowledgementsPayload);
  return acknowledgements.every((acknowledgement) => acceptedAcknowledgements.includes(acknowledgement));
};

export default Acknowledgments;