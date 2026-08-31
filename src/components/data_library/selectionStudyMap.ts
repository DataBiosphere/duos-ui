import { AssetDefinition, LibraryRow } from 'src/components/data_library/assets/definition'

/**
 * Maps every dataset id a row covers to the study it belongs to, via the asset's own accessors so
 * both the dataset rows and the study rows work without special-casing either.
 */
export const studyIdByDatasetId = (asset: AssetDefinition, rows: LibraryRow[]): Map<number, number> => {
  const mapping = new Map<number, number>()

  rows.forEach((row) => {
    const datasetIds = asset.selectionToDatasetIds([row], [asset.getRowId(row)])
    const [studyId] = asset.getStudyIdsForSelection([row], datasetIds)
    if (studyId !== undefined) {
      datasetIds.forEach(datasetId => mapping.set(datasetId, studyId))
    }
  })

  return mapping
}

/**
 * Distinct studies behind a selection. Resolved per dataset rather than per visible row: one
 * study's datasets can sit on different pages, so a study stays counted while any of them remain.
 */
export const selectedStudyIds = (mapping: Map<number, number>, selectedDatasetIds: number[]): number[] =>
  Array.from(new Set(
    selectedDatasetIds
      .map(datasetId => mapping.get(datasetId))
      .filter((studyId): studyId is number => studyId !== undefined),
  ))
