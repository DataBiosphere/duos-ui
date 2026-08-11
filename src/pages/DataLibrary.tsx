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
import { getRadarEnabledDatasetsWithRules, getSoDarApprovalRequiredDatasetIds } from 'src/utils/DatasetUtils'
import { useLibraryPageState } from 'src/hooks/useLibraryPageState'
import { useLibraryExportableDatasets } from 'src/hooks/useLibraryExportableDatasets'
import LibraryPageShell from 'src/components/data_library/LibraryPageShell'
import LibraryFooter from 'src/components/data_library/LibraryFooter'
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

  const pageState = useLibraryPageState(libraryConfig)
  const { urlState, data, currentAsset, handleSearchChange } = pageState

  const [selectedDatasetIds, setSelectedDatasetIds] = useState<number[]>([])
  const [radarEnabledDatasetIds, setRadarEnabledDatasetIds] = useState<Set<number>>(new Set())
  const [soDarApprovalRequiredDatasetIds, setSoDarApprovalRequiredDatasetIds] = useState<Set<number>>(new Set())

  const datasets = urlState.tab === AssetType.DATASETS && data?.items ? data.items as DatasetTerm[] : []
  const { data: exportableDatasets = {} } = useLibraryExportableDatasets(
    datasets,
    urlState.tab === AssetType.DATASETS,
  )

  const selectedStudyIds = useMemo(() => {
    if (!data?.items) return []
    return currentAsset.getStudyIdsForSelection(data.items, selectedDatasetIds)
  }, [data, selectedDatasetIds, currentAsset])

  const handleSelectionChange = useCallback((datasetIds: number[]) => {
    setSelectedDatasetIds(datasetIds)
  }, [])

  const handleApplyForAccess = () => {
    applyForAccess(selectedDatasetIds, navigate)
  }

  useEffect(() => {
    const fetchRadarEnabled = async () => {
      if (urlState.tab !== AssetType.DATASETS || !data?.items?.length) {
        setRadarEnabledDatasetIds(new Set())
        return
      }
      const datasetIds = (data.items as DatasetTerm[]).map(d => d.datasetId)
      if (datasetIds.length === 0) {
        setRadarEnabledDatasetIds(new Set())
        return
      }
      try {
        const radarEnabledIds = await getRadarEnabledDatasetsWithRules(data.items as DatasetTerm[])
        setRadarEnabledDatasetIds(new Set(radarEnabledIds))
      }
      catch {
        setRadarEnabledDatasetIds(new Set())
      }
    }

    const fetchSoDarApprovalRequired = async () => {
      if (urlState.tab !== AssetType.DATASETS || !data?.items?.length) {
        setSoDarApprovalRequiredDatasetIds(new Set())
        return
      }
      try {
        const soDarApprovalRequiredIds = await getSoDarApprovalRequiredDatasetIds(data.items as DatasetTerm[])
        setSoDarApprovalRequiredDatasetIds(soDarApprovalRequiredIds)
      }
      catch {
        setSoDarApprovalRequiredDatasetIds(new Set())
      }
    }

    fetchRadarEnabled()
    fetchSoDarApprovalRequired()
  }, [data?.items, urlState.tab])

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
      gridExtras={{
        selectedDatasetIds,
        onSelectionChange: handleSelectionChange,
        exportableDatasets,
        radarEnabledDatasetIds: urlState.tab === AssetType.DATASETS ? radarEnabledDatasetIds : undefined,
        soDarApprovalRequiredDatasetIds: urlState.tab === AssetType.DATASETS ? soDarApprovalRequiredDatasetIds : undefined,
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
