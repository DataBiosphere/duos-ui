import { useQuery } from '@tanstack/react-query'
import { TerraDataRepo } from 'src/libs/ajax/TerraDataRepo'
import { ExportableDatasets } from 'src/types/library'
import { DatasetTerm } from 'src/types/model'
import { EnumerateSnapshotModel, SnapshotSummaryModel } from 'src/types/tdrModel'
import { chain, intersection } from 'src/utils/NodashUtil'

export const LIBRARY_EXPORTS_QUERY_KEY = 'library-exports'

const EMPTY_EXPORTABLE_DATASETS: ExportableDatasets = {}

export const useLibraryExportableDatasets = (
  datasets: DatasetTerm[],
  enabled: boolean,
) => {
  const datasetIdentifiers = [...new Set(
    datasets
      .map(dataset => dataset.datasetIdentifier)
      .filter((identifier): identifier is string => Boolean(identifier)),
  )].sort((a, b) => a.localeCompare(b))

  return useQuery({
    queryKey: [LIBRARY_EXPORTS_QUERY_KEY, datasetIdentifiers],
    enabled: enabled && datasetIdentifiers.length > 0,
    queryFn: async (): Promise<ExportableDatasets> => {
      try {
        const snapshots: EnumerateSnapshotModel = await TerraDataRepo.listSnapshotsByDatasetIds(datasetIdentifiers)
        if (snapshots.filteredTotal === 0) return EMPTY_EXPORTABLE_DATASETS

        return chain(snapshots.items)
          .filter((snapshot: SnapshotSummaryModel) =>
            intersection(snapshots.roleMap?.[snapshot.id] ?? [], ['steward', 'reader']).length > 0)
          .groupBy('duosId')
          .value()
      }
      catch {
        return EMPTY_EXPORTABLE_DATASETS
      }
    },
    staleTime: 5 * 60 * 1000,
  })
}
