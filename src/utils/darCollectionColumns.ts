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
  datasetsAndDataUse: number
  expiresAt: number
}

const breakpoints: Record<string, Breakpoint> = {
  [consoleTypes.ADMIN]: { datasetsAndDataUse: 1450, expiresAt: 1250 },
  [consoleTypes.CHAIR]: { datasetsAndDataUse: 1450, expiresAt: 1250 },
  [consoleTypes.MEMBER]: { datasetsAndDataUse: 1450, expiresAt: 1250 },
  [consoleTypes.SIGNING_OFFICIAL]: { datasetsAndDataUse: 1450, expiresAt: 1250 },
  [consoleTypes.RESEARCHER]: { datasetsAndDataUse: 1200, expiresAt: 1000 },
}

// A dataset count means little without its data use, and votes are cast per data-use group.
const dataUseGroupColumns = new Set<string>([
  DarCollectionTableColumnOptions.DATASET_COUNT,
  DarCollectionTableColumnOptions.DATA_USE,
  DarCollectionTableColumnOptions.VOTES,
])

export function getDarCollectionColumns(consoleType: string, windowWidth: number): string[] {
  const baseColumns = getBaseColumns(consoleType)
  const { datasetsAndDataUse, expiresAt } = breakpoints[consoleType] || breakpoints[consoleTypes.ADMIN]
  let columns = [...baseColumns]

  if (windowWidth < datasetsAndDataUse) {
    columns = columns.filter(col => !dataUseGroupColumns.has(col))
  }
  if (windowWidth < expiresAt) {
    columns = columns.filter(col => col !== DarCollectionTableColumnOptions.EXPIRES_AT)
  }
  return columns
}
