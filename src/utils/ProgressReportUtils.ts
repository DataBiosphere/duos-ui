import { DataAccessRequest } from 'src/types/model'

type NumberedDar = Pick<DataAccessRequest, 'id' | 'progressReport'>

/**
 * A progress report's number: its place among the collection's progress reports, in id order.
 * Only DARs the backend marks as progress reports count, so the several original DARs of a
 * pre-2022 collection do not shift the numbers. An original DAR has no number (0). The Full DAR
 * tab and both voting history views number reports this way.
 */
export const progressReportNumber = (dar: NumberedDar, collectionDars: NumberedDar[]): number =>
  dar.progressReport
    ? collectionDars.filter(other => other.progressReport && other.id <= dar.id).length
    : 0

/** The number the next progress report in the collection will take. */
export const nextProgressReportNumber = (collectionDars: NumberedDar[]): number =>
  collectionDars.filter(dar => dar.progressReport).length + 1

/** 'Progress Report N', or 'Initial DAR' for every original DAR in the collection. */
export const requestTypeLabel = (dar: NumberedDar, collectionDars: NumberedDar[]): string =>
  dar.progressReport ? `Progress Report ${progressReportNumber(dar, collectionDars)}` : 'Initial DAR'
