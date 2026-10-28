import { DataAccessRequest } from 'src/types/model'
import { isNil } from 'src/utils/NodashUtil'

type NumberedDar = Pick<DataAccessRequest, 'id' | 'parentId'>

/**
 * A progress report is any DAR with a parent. This reads parentId rather than the backend's
 * progressReport flag, which is also false for drafts, so the reports of a collection reverted
 * to draft keep their numbers.
 */
const isProgressReport = (dar: NumberedDar): boolean => !isNil(dar.parentId)

/**
 * A progress report's number: its place among the collection's progress reports, in id order.
 * The several original DARs of a pre-2022 collection have no parent, so they do not shift the
 * numbers. An original DAR has no number (0). The Full DAR tab and both voting history views
 * number reports this way.
 */
export const progressReportNumber = (dar: NumberedDar, collectionDars: NumberedDar[]): number =>
  isProgressReport(dar)
    ? collectionDars.filter(other => isProgressReport(other) && other.id <= dar.id).length
    : 0

/** The number the next progress report in the collection will take. */
export const nextProgressReportNumber = (collectionDars: NumberedDar[]): number =>
  collectionDars.filter(isProgressReport).length + 1

/** 'Progress Report N', or 'Initial DAR' for every original DAR in the collection. */
export const requestTypeLabel = (dar: NumberedDar, collectionDars: NumberedDar[]): string =>
  isProgressReport(dar) ? `Progress Report ${progressReportNumber(dar, collectionDars)}` : 'Initial DAR'
