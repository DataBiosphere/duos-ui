import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router'
import { AssetType, LibraryVersionNew, ALL_LIBRARY_TABS } from 'src/types/library'
import { DatasetTerm } from 'src/types/model'
import { applyForAccess } from 'src/utils/accessUtils'
import { getBrandedLibrary } from 'src/libs/libraryVersions'
import { Storage } from 'src/libs/storage'
import { isRestrictedToPublicVisibility, Notifications } from 'src/libs/utils'
import { Metrics } from 'src/libs/ajax/Metrics'
import eventList from 'src/libs/events'
import { getRadarEnabledDatasetIds, getSoApprovalModelByDatasetId } from 'src/utils/DatasetUtils'
import { useLibraryPageState } from 'src/hooks/useLibraryPageState'
import { useLibraryExportableDatasets } from 'src/hooks/useLibraryExportableDatasets'
import LibraryPageShell from 'src/components/data_library/LibraryPageShell'
import LibraryFooter from 'src/components/data_library/LibraryFooter'
import { selectedStudyIds as studyIdsForSelection, studyIdByDatasetId } from 'src/components/data_library/selectionStudyMap'
import LibraryDataGrid from 'src/components/data_library/LibraryDataGrid'
import StudyCardGrid from 'src/components/data_library/StudyCardGrid'
import TableHeaderSection from 'src/components/TableHeaderSection'
import SearchBar from 'src/components/SearchBar'

export const DataLibrary: React.FC = () => {
  const { query } = useParams()
  const navigate = useNavigate()

  const user = Storage.getCurrentUser()
  const institutionId = user?.institution?.id
  const institutionName = user?.institution?.name

  const restrictToPublicVisibility = isRestrictedToPublicVisibility(user)

  useEffect(() => {
    const key = query === undefined ? '/datalibrary' : query.toLowerCase()
    if (key === 'myinstitution' && !institutionId) {
      Notifications.showError({ text: 'You must set an institution in your profile to view the `myinstitution` data library' })
      navigate('/profile')
      return
    }
    if (key === '/datalibrary') {
      Metrics.captureEvent(eventList.dataLibrary)
    }
    else {
      Metrics.captureEvent(eventList.dataLibrary, { brand: key.replaceAll('/', '').toLowerCase() })
    }
  }, [query, institutionId, navigate])

  const libraryConfig: LibraryVersionNew = useMemo(() => {
    const brand = getBrandedLibrary(institutionId, institutionName, query)
    const description = 'Search, filter, and select datasets, then click \'Apply for Access\' to request access'

    if (brand) {
      return {
        key: query || 'default',
        query: brand.query,
        icon: brand.icon || undefined,
        title: brand.title,
        description,
        featured: brand.featured,
        order: brand.order,
        restrictToPublicVisibility,
      }
    }

    return {
      key: 'duos',
      title: 'DUOS Data Library',
      description,
      featured: true,
      order: 0,
      restrictToPublicVisibility,
    }
  }, [query, institutionId, institutionName, restrictToPublicVisibility])

  const pageState = useLibraryPageState(libraryConfig, AssetType.STUDIES)
  const { urlState, data, currentAsset, handleSearchChange } = pageState

  const [selectedDatasetIds, setSelectedDatasetIds] = useState<number[]>([])

  // Keyed on `data` rather than `data?.items`: React Compiler cannot preserve the narrower
  // optional-access dependency, and the mismatch makes it skip optimizing this component.
  const datasets = useMemo(
    () => (urlState.tab === AssetType.DATASETS && data?.items ? data.items as DatasetTerm[] : []),
    [data, urlState.tab],
  )
  const { data: exportableDatasets = {} } = useLibraryExportableDatasets(
    datasets,
    urlState.tab === AssetType.DATASETS,
  )

  const soApprovalModelByDatasetId = useMemo(
    () => getSoApprovalModelByDatasetId(datasets),
    [datasets],
  )

  const radarEnabledDatasetIds = useMemo(
    () => getRadarEnabledDatasetIds(datasets),
    [datasets],
  )

  // Selection is global, so a footer counting only the current page's rows under-reports studies
  // as soon as a selection spans pages. Rows are kept per asset: row ids mean different things
  // across tabs, and each asset reads only its own row shape.
  // Learned from the rows on screen as the user selects, because a study's datasets can sit on
  // different pages: counting studies from the visible page alone drops one whose remaining
  // selected datasets live elsewhere.
  const [studyByDataset, setStudyByDataset] = useState<Map<number, number>>(new Map())

  const handleSelectionChange = useCallback((datasetIds: number[]) => {
    setSelectedDatasetIds(datasetIds)
    setStudyByDataset(previous => new Map([
      ...previous,
      ...studyIdByDatasetId(currentAsset, data?.items ?? []),
    ]))
  }, [data, currentAsset])

  const selectedStudyIds = useMemo(
    () => studyIdsForSelection(studyByDataset, selectedDatasetIds),
    [studyByDataset, selectedDatasetIds],
  )

  const handleApplyForAccess = () => {
    applyForAccess(selectedDatasetIds, navigate)
  }

  const renderGrid = useCallback((gridProps: React.ComponentProps<typeof LibraryDataGrid>) =>
    gridProps.assetType === AssetType.STUDIES
      ? <StudyCardGrid {...gridProps} />
      : <LibraryDataGrid {...gridProps} />, [])

  const header = (
    <>
      <TableHeaderSection
        icon={libraryConfig.icon ? { src: libraryConfig.icon } : undefined}
        title={libraryConfig.title}
        description={libraryConfig.description}
      />
      <SearchBar
        handleSearchChange={handleSearchChange}
        initialValue={urlState.query ?? ''}
        style={{ paddingTop: '10px' }}
      />
    </>
  )

  return (
    <LibraryPageShell
      pageState={pageState}
      tabs={ALL_LIBRARY_TABS}
      header={header}
      showSoApprovalReminder
      renderGrid={renderGrid}
      gridExtras={{
        selectedDatasetIds,
        onSelectionChange: handleSelectionChange,
        exportableDatasets,
        radarEnabledDatasetIds: urlState.tab === AssetType.DATASETS ? radarEnabledDatasetIds : undefined,
        soApprovalModelByDatasetId: urlState.tab === AssetType.DATASETS ? soApprovalModelByDatasetId : undefined,
      }}
      footer={(
        <LibraryFooter
          selectedDatasetIds={selectedDatasetIds}
          selectedStudyIds={selectedStudyIds}
          onApplyForAccess={handleApplyForAccess}
        />
      )}
    />
  )
}
