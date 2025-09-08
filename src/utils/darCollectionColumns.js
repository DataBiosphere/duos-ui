import { DarCollectionTableColumnOptions, consoleTypes } from './DarCollectionUtils'

// Default base columns (most consoles)
const defaultBaseColumns = [
  DarCollectionTableColumnOptions.DAR_CODE,
  DarCollectionTableColumnOptions.NAME,
  DarCollectionTableColumnOptions.SUBMISSION_DATE,
  DarCollectionTableColumnOptions.RESEARCHER,
  DarCollectionTableColumnOptions.INSTITUTION,
  DarCollectionTableColumnOptions.DATASET_COUNT,
  DarCollectionTableColumnOptions.EXPIRES_AT,
  DarCollectionTableColumnOptions.STATUS,
  DarCollectionTableColumnOptions.ACTIONS,
]

// Only specify differences from the default
const baseColumnsOverrides = {
  [consoleTypes.ADMIN]: [DarCollectionTableColumnOptions.DAC],
  [consoleTypes.CHAIR]: [DarCollectionTableColumnOptions.DAC],
  // Add more overrides if needed for other console types
}

function getBaseColumns(consoleType) {
  const overrides = baseColumnsOverrides[consoleType] || []
  // Insert DAC after DAR_CODE if present in overrides
  if (overrides.includes(DarCollectionTableColumnOptions.DAC)) {
    return [
      DarCollectionTableColumnOptions.DAR_CODE,
      DarCollectionTableColumnOptions.DAC,
      ...defaultBaseColumns.slice(1),
    ]
  }
  return [...defaultBaseColumns]
}

// Responsive breakpoints for each console type
const breakpoints = {
  [consoleTypes.ADMIN]: { datasetCount: 1450, expiresAt: 1250 },
  [consoleTypes.CHAIR]: { datasetCount: 1450, expiresAt: 1250 },
  [consoleTypes.MEMBER]: { datasetCount: 1450, expiresAt: 1250 },
  [consoleTypes.SIGNING_OFFICIAL]: { datasetCount: 1450, expiresAt: 1250 },
  [consoleTypes.RESEARCHER]: { datasetCount: 1200, expiresAt: 1000 },
}

export function getDarCollectionColumns(consoleType, windowWidth) {
  const baseColumns = getBaseColumns(consoleType)
  const { datasetCount, expiresAt } = breakpoints[consoleType] || breakpoints[consoleTypes.ADMIN]
  let columns = [...baseColumns]

  if (windowWidth < datasetCount) {
    columns = columns.filter(col => col !== DarCollectionTableColumnOptions.DATASET_COUNT)
  }
  if (windowWidth < expiresAt) {
    columns = columns.filter(col => col !== DarCollectionTableColumnOptions.EXPIRES_AT)
  }
  return columns
}
