import {User} from './ajax';
import {Storage} from '../libs/storage';

export const Acknowledgments = {
  broadLcaAcknowledgement: 'Library_Card_Agreement_2023_ApplicationVersion',
  broadLcaAcknowledgement: 'Library_Card_Agreement_2023_UIversion.pdf',
  nihLcaAcknowledgement: 'NIH_Library_Card_Agreement_11.17.22_version.pdf',
};

const acknowledgementStorageKey = (ackKey) => {
  return `acknowledgement_${ackKey}`;
};

export const hasAccepted = async (...acknowledgements) => {

  // check if the acknowledgements are int he cache
  const allAcknowledgementsInStorage = acknowledgements.every(
    (ackKey) => Storage.getCurrentUserSettings(acknowledgementStorageKey(ackKey)) || false
  );

  if (allAcknowledgementsInStorage) {
    return true; // yay! we've cached all these acknowledgements
  }

  const userAcknowledgementsPayload = await User.getAcknowledgements();
  const acceptedAcknowledgements = Object.keys(userAcknowledgementsPayload);

  // cache the results from the backend...
  acceptedAcknowledgements.forEach((ackKey) => Storage.setCurrentUserSettings(acknowledgementStorageKey(ackKey), true));

  return acknowledgements.every((acknowledgement) => acceptedAcknowledgements.includes(acknowledgement));
};

export const hasSOAcceptedDAAs = async () => {
  return await hasAccepted(Acknowledgments.broadLcaAcknowledgement, Acknowledgments.nihLcaAcknowledgement);
};

export const acceptAcknowledgments = async (...ackKeys) => {
  const userAcknowledgementsPayload = await User.acceptAcknowledgments(...ackKeys);
  const acceptedAcknowledgements = Object.keys(userAcknowledgementsPayload);

  // cache the results
  acceptedAcknowledgements.forEach((ackKey) => Storage.setCurrentUserSettings(acknowledgementStorageKey(ackKey, true)));
};

export default Acknowledgments;