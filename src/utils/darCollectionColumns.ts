import { DarCollectionTableColumnOptions, consoleTypes } from 'src/utils/DarCollectionUtils'

// Default base columns (most consoles)
const defaultBaseColumns: string[] = [
  DarCollectionTableColumnOptions.DAR_CODE,
  DarCollectionTableColumnOptions.NAME,
  DarCollectionTableColumnOptions.SUBMISSION_DATE,
  DarCollectionTableColumnOptions.RESEARCHER,
  DarCollectionTableColumnOptions.INSTITUTION,
  DarCollectionTableColumnOptions.DATASET_COUNT,
  DarCollectionTableColumnOptions.DATA_USE,
  DarCollectionTableColumnOptions.EXPIRES_AT,
  DarCollectionTableColumnOptions.STATUS,
  DarCollectionTableColumnOptions.ACTIONS,
]

// Consoles that see the DAC column (inserted right after DAR_CODE)
const consolesWithDac = new Set<string>([consoleTypes.ADMIN, consoleTypes.CHAIR])

// Consoles that vote, and so see the Votes column (inserted right after DATA_USE) -
// other consoles never cast DAC-member votes, so the column would always be empty for them
const consolesWithVotes = new Set<string>([consoleTypes.CHAIR, consoleTypes.MEMBER])

// Columns each console type drops from the default set
const excludedColumns: Record<string, string[]> = {
  [consoleTypes.ADMIN]: [DarCollectionTableColumnOptions.ACTIONS],
}

function getBaseColumns(consoleType: string): string[] {
  const columns = [...defaultBaseColumns]

  if (consolesWithDac.has(consoleType)) {
    columns.splice(columns.indexOf(DarCollectionTableColumnOptions.DAR_CODE) + 1, 0, DarCollectionTableColumnOptions.DAC)
  }
  if (consolesWithVotes.has(consoleType)) {
    columns.splice(columns.indexOf(DarCollectionTableColumnOptions.DATA_USE) + 1, 0, DarCollectionTableColumnOptions.VOTES)
  }

  const excluded = excludedColumns[consoleType] || []
  return columns.filter(col => !excluded.includes(col))
}

// Responsive breakpoints for each console type
interface Breakpoint {
  datasetCount: number
  expiresAt: number
  dataUse: number
}

const breakpoints: Record<string, Breakpoint> = {
  [consoleTypes.ADMIN]: { datasetCount: 1450, expiresAt: 1250, dataUse: 1650 },
  [consoleTypes.CHAIR]: { datasetCount: 1450, expiresAt: 1250, dataUse: 1650 },
  [consoleTypes.MEMBER]: { datasetCount: 1450, expiresAt: 1250, dataUse: 1650 },
  [consoleTypes.SIGNING_OFFICIAL]: { datasetCount: 1450, expiresAt: 1250, dataUse: 1650 },
  [consoleTypes.RESEARCHER]: { datasetCount: 1200, expiresAt: 1000, dataUse: 1450 },
}

export function getDarCollectionColumns(consoleType: string, windowWidth: number): string[] {
  const baseColumns = getBaseColumns(consoleType)
  const { datasetCount, expiresAt, dataUse } = breakpoints[consoleType] || breakpoints[consoleTypes.ADMIN]
  let columns = [...baseColumns]

  if (windowWidth < datasetCount) {
    columns = columns.filter(col => col !== DarCollectionTableColumnOptions.DATASET_COUNT)
  }
  if (windowWidth < expiresAt) {
    columns = columns.filter(col => col !== DarCollectionTableColumnOptions.EXPIRES_AT)
  }
  if (windowWidth < dataUse) {
    // Votes are shown per data-use group, so hide them together with DATA_USE - otherwise
    // Votes would be left with no data-use label to sit next to.
    columns = columns.filter(col => col !== DarCollectionTableColumnOptions.DATA_USE && col !== DarCollectionTableColumnOptions.VOTES)
  }
  return columns
}
