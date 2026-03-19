import { User } from 'src/libs/ajax/User'
import { Storage } from 'src/libs/storage'
import { AcknowledgementMap } from 'src/types/model'

export const Acknowledgments = {
  broadLcaAcknowledgement: 'Library_Card_Agreement_2023_ApplicationVersion',
  nihLcaAcknowledgement: 'NIH_Library_Card_Agreement_11.17.22_version.pdf',
}

const acknowledgementStorageKey = (ackKey: string): string => {
  return `acknowledgement_${ackKey}`
}

export const hasAccepted = async (...acknowledgements: string[]): Promise<boolean> => {
  // check if the acknowledgements are in the cache
  const allAcknowledgementsInStorage: boolean = acknowledgements.every(
    ackKey => Storage.getCurrentUserSettings(acknowledgementStorageKey(ackKey)) || false,
  )

  if (allAcknowledgementsInStorage) {
    return true // yay! we've cached all these acknowledgements
  }

  const userAcknowledgementsPayload: AcknowledgementMap = await User.getAcknowledgements()
  const acceptedAcknowledgements: string[] = Object.keys(userAcknowledgementsPayload)

  // cache the results from the backend...
  acceptedAcknowledgements.forEach(ackKey => Storage.setCurrentUserSettings<boolean>(acknowledgementStorageKey(ackKey), true))

  return acknowledgements.every(acknowledgement => acceptedAcknowledgements.includes(acknowledgement))
}

export const hasSOAcceptedDAAs = async (): Promise<boolean> => {
  return await hasAccepted(Acknowledgments.broadLcaAcknowledgement, Acknowledgments.nihLcaAcknowledgement)
}

export const acceptAcknowledgments = async (...ackKeys: string[]): Promise<void> => {
  const userAcknowledgementsPayload: AcknowledgementMap = await User.acceptAcknowledgments(...ackKeys)
  const acceptedAcknowledgements: string[] = Object.keys(userAcknowledgementsPayload)

  // cache the results
  acceptedAcknowledgements.forEach(ackKey => Storage.setCurrentUserSettings<boolean>(acknowledgementStorageKey(ackKey), true))
}

export default Acknowledgments

export const AcknowledgementService = {
  hasSOAcceptedDAAs,
}
