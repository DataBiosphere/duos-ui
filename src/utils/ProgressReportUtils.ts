import { DataAccessRequest } from 'src/types/model'

type NumberedDar = Pick<DataAccessRequest, 'id'>

/**
 * A DAR's place in its collection in id order: the initial DAR is 0 and each later DAR is the
 * next progress report. The Full DAR tab and the voting history both number reports this way.
 */
export const progressReportNumber = (dar: NumberedDar, collectionDars: NumberedDar[]): number =>
  collectionDars.filter(other => other.id < dar.id).length

/**
 * 'Initial DAR', or 'Progress Report N'. Like the Full DAR tab, this goes by id order rather than
 * the progressReport flag, so the two views label every DAR in a collection the same way.
 */
export const requestTypeLabel = (dar: NumberedDar, collectionDars: NumberedDar[]): string => {
  const number = progressReportNumber(dar, collectionDars)
  return number === 0 ? 'Initial DAR' : `Progress Report ${number}`
}
