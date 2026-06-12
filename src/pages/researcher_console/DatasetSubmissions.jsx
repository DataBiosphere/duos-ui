import React, { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Skeleton, Typography } from '@mui/material'
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined'
import { Notifications } from 'src/libs/utils'
import SearchBar from 'src/components/SearchBar'
import { DataSet } from 'src/libs/ajax/DataSet'
import { Storage } from 'src/libs/storage'
import TableHeaderSection from 'src/components/TableHeaderSection'
import AddObjectButton from 'src/components/AddObjectButton.tsx'
import LibraryTabs from 'src/components/data_library/LibraryTabs'
import LibraryFilters from 'src/components/data_library/LibraryFilters'
import LibraryDataGrid from 'src/components/data_library/LibraryDataGrid'
import { useLibraryData, useLibraryMetadata } from 'src/hooks/useLibraryData'
import { useLibraryUrlState } from 'src/hooks/useLibraryUrlState'
import { AssetType } from 'src/types/library'
import {
  EMPTY_FILTERS,
  getFilterSectionsForAsset,
  sanitizeFiltersForAsset,
} from 'src/components/data_library/filterRegistry'
import { makeSubmissionColumns } from 'src/components/data_library/columns/submissionColumns'
import { ConfirmationDialog } from 'src/components/modals/ConfirmationDialog'
import { useQueryClient } from '@tanstack/react-query'
import {
  clinicalTrialInterventionSelectOptions,
  clinicalTrialPhaseSelectOptions,
  clinicalTrialStatusSelectOptions,
} from 'src/utils/ClinicalTrialEnumUtils'
import { BioSpecimenType, PostMortemIntervalUnit } from 'src/types/model'
import { assetRegistry } from 'src/components/data_library/assets'

const SUBMISSION_TABS = [
  { key: AssetType.STUDIES, label: 'Studies' },
  { key: AssetType.DATASETS, label: 'Datasets' },
  { key: AssetType.MODELS, label: 'AI Models' },
  { key: AssetType.WORKSPACES, label: 'Workspaces' },
  { key: AssetType.CLINICAL_TRIALS, label: 'Clinical Trials' },
  { key: AssetType.BIOSPECIMENS, label: 'Biospecimens' },
  { key: AssetType.PUBLICATIONS, label: 'Publications' },
  { key: AssetType.PRESENTATIONS, label: 'Presentations' },
  { key: AssetType.INTELLECTUAL_PROPERTY, label: 'Intellectual Property' },
]

export default function DatasetSubmissions() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [urlState, updateUrlState] = useLibraryUrlState()
  const [hideFilters, setHideFilters] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, term: null })

  const user = Storage.getCurrentUser()

  // Inject user-ownership filter so every tab only shows the user's own assets.
  const userOwnershipQuery = useMemo(() => {
    if (!user?.userId && !user?.email) return undefined
    return {
      bool: {
        should: [
          ...(user.userId
            ? [
                { term: { createUserId: user.userId } },
                { term: { 'study.dataSubmitterId': user.userId } },
              ]
            : []),
          ...(user.email
            ? [
                { term: { 'study.dataCustodianEmail': user.email } },
              ]
            : []),
        ],
        minimum_should_match: 1,
      },
    }
  }, [user?.userId, user?.email])

  const libraryConfig = useMemo(() => ({
    key: 'submissions',
    title: 'My Data Submissions',
    description: 'View the status of datasets registered in DUOS',
    featured: true,
    order: 0,
    query: userOwnershipQuery,
  }), [userOwnershipQuery])

  const { data: metadata, isLoading: isMetadataLoading } = useLibraryMetadata(libraryConfig)

  const { data, isFetching, error } = useLibraryData(
    libraryConfig,
    urlState.tab,
    urlState.filters,
    urlState.query ?? '',
    { page: urlState.page, pageSize: urlState.pageSize },
    urlState.sortField && urlState.sortOrder
      ? { field: urlState.sortField, order: urlState.sortOrder }
      : undefined,
  )

  const availableFilters = useMemo(() => {
    const dacAgg = metadata?.dac?.buckets || []
    const dataTypeAgg = metadata?.data_type?.buckets || []

    const uniqueValues = values =>
      [...new Set(values.map(v => v?.trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b))
        .map(value => ({ value, label: value }))

    const workspaceItems = urlState.tab === AssetType.WORKSPACES ? (data?.items || []) : []
    const clinicalTrialItems = urlState.tab === AssetType.CLINICAL_TRIALS ? (data?.items || []) : []
    const biospecimenItems = urlState.tab === AssetType.BIOSPECIMENS ? (data?.items || []) : []

    return {
      accessManagement: [
        { value: 'controlled', label: 'Controlled' },
        { value: 'open', label: 'Open' },
        { value: 'external', label: 'External' },
      ],
      dataUse: [
        { value: 'HMB', label: 'Health/Medical/Biomedical' },
        { value: 'GRU', label: 'General Research Use' },
        { value: 'DS', label: 'Disease Specific' },
        { value: 'OTHER', label: 'Other Restriction' },
        { value: 'NRES', label: 'No Restrictions' },
      ],
      dataType: dataTypeAgg
        .map(bucket => ({ value: bucket.key, label: bucket.key, count: bucket.doc_count }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      dac: dacAgg
        .map(bucket => ({ value: bucket.key, label: bucket.key, count: bucket.doc_count }))
        .sort((a, b) => a.label.localeCompare(b.label)),
      workspaceTools: uniqueValues(workspaceItems.flatMap(item => item.tools || [])),
      workspacePlatform: uniqueValues(workspaceItems.map(item => item.platform)),
      clinicalTrialStatus: clinicalTrialStatusSelectOptions.map(o => ({ value: o.key, label: o.displayText })),
      clinicalTrialPhase: clinicalTrialPhaseSelectOptions.map(o => ({ value: o.key, label: o.displayText })),
      clinicalTrialInterventionType: clinicalTrialInterventionSelectOptions.map(o => ({ value: o.key, label: o.displayText })),
      clinicalTrialRegistry: uniqueValues(clinicalTrialItems.map(item => item.registry)),
      biospecimenType: Object.values(BioSpecimenType).map(value => ({ value, label: value })),
      biospecimenDataUse: uniqueValues(biospecimenItems.map(item => item.optionalDataUse)),
      biospecimenPostMortemIntervalUnit: Object.values(PostMortemIntervalUnit).map(value => ({ value, label: value })),
      datasetsCited: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' },
      ],
      biospecimenPostMortemIntervalRange: { min: 0, max: 1000000 },
      participantCountRange: { min: 0, max: 100000 },
    }
  }, [metadata, data?.items, urlState.tab])

  const currentAsset = useMemo(() => assetRegistry[urlState.tab], [urlState.tab])
  const sanitizedFilters = useMemo(
    () => sanitizeFiltersForAsset(urlState.tab, urlState.filters),
    [urlState.tab, urlState.filters],
  )
  const filterSections = useMemo(
    () => getFilterSectionsForAsset(urlState.tab, availableFilters),
    [urlState.tab, availableFilters],
  )

  const sortModel = useMemo(() => {
    if (urlState.sortField && urlState.sortOrder) {
      return [{ field: urlState.sortField, sort: urlState.sortOrder }]
    }
    return []
  }, [urlState.sortField, urlState.sortOrder])

  const handleTabChange = useCallback((newAssetType) => {
    updateUrlState({
      tab: newAssetType,
      page: 0,
      filters: sanitizeFiltersForAsset(newAssetType, urlState.filters),
    })
  }, [updateUrlState, urlState.filters])

  const handleSearchChange = useCallback((query) => {
    updateUrlState({ query, page: 0 })
  }, [updateUrlState])

  const handleFiltersChange = useCallback((newFilters) => {
    updateUrlState({ filters: sanitizeFiltersForAsset(urlState.tab, newFilters) })
  }, [updateUrlState, urlState.tab])

  const handleClearFilters = useCallback(() => {
    updateUrlState({ filters: sanitizeFiltersForAsset(urlState.tab, EMPTY_FILTERS), page: 0 })
  }, [updateUrlState, urlState.tab])

  const handleSortChange = useCallback((model) => {
    if (model.length > 0 && model[0].sort) {
      updateUrlState({ sortField: model[0].field, sortOrder: model[0].sort })
    }
    else {
      updateUrlState({ sortField: undefined, sortOrder: undefined })
    }
  }, [updateUrlState])

  const handleToggleFilters = useCallback(() => {
    setHideFilters(h => !h)
  }, [])

  const handleDeleteClick = useCallback((term) => {
    setDeleteDialog({ open: true, term })
  }, [])

  const handleDeleteClose = useCallback(() => {
    setDeleteDialog({ open: false, term: null })
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    const { term } = deleteDialog
    if (!term) return
    setDeleteDialog({ open: false, term: null })
    try {
      await DataSet.deleteDataset(term.datasetId)
      Notifications.showSuccess({ text: `Removed dataset '${term.datasetName}' successfully.` })
      queryClient.invalidateQueries({ queryKey: ['library-data', 'submissions'] })
    }
    catch {
      Notifications.showError({ text: `Error removing dataset '${term.datasetName}'` })
    }
  }, [deleteDialog, queryClient])

  const extraColumns = useMemo(
    () => makeSubmissionColumns(handleDeleteClick),
    [handleDeleteClick],
  )

  if (error) {
    return (
      <Box sx={{ px: 3, py: 4 }}>
        <Box sx={{ textAlign: 'center', color: 'error.main' }}>
          <h2>Error Loading Data</h2>
          <p>{error instanceof Error ? error.message : 'An unexpected error occurred'}</p>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', pb: 5 }}>
      {/* Header */}
      <Box>
        <TableHeaderSection
          title="My Data Submissions"
          description={(
            <div>
              <div>View the status of datasets registered in DUOS</div>
              <div style={{ marginTop: '0.6rem' }}>
                DUOS accepts registration of either <strong>Open Access</strong> or <strong>Controlled Access data</strong>.
                Controlled access data registered in DUOS can be managed by a DAC within DUOS or by an external system.
              </div>
              <div style={{ marginTop: '0.4rem' }}>
                To register controlled access data with a DAC in DUOS, the data submitter may need to
                provide documentation and/or agreements to the receiving DAC.
              </div>
            </div>
          )}
        />
        <Box sx={{ px: 3, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <SearchBar
            handleSearchChange={handleSearchChange}
            initialValue={urlState.query ?? ''}
          />
          <AddObjectButton
            id="add-dataset-btn"
            label="ADD DATASET"
            onClick={() => navigate('/data_submission_form')}
            icon={<AddCircleOutlineOutlinedIcon />}
            className="button button-blue"
            disabled={!user?.isDataSubmitter}
          />
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ px: 3, pt: 1 }}>
        <LibraryTabs
          value={urlState.tab}
          onChange={handleTabChange}
          tabs={SUBMISSION_TABS}
        />
      </Box>

      {/* Main content: filters sidebar + data grid */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', px: 3, pt: 2 }}>
        {/* Filters sidebar */}
        <Box
          sx={{
            width: hideFilters ? 40 : 280,
            flexShrink: 0,
            pr: hideFilters ? 0 : 2,
            overflowY: hideFilters ? 'hidden' : 'auto',
            overflowX: 'hidden',
            transition: 'width 0.2s ease',
          }}
        >
          <LibraryFilters
            filters={sanitizedFilters}
            onChange={handleFiltersChange}
            onClear={handleClearFilters}
            sections={filterSections}
            loading={isMetadataLoading}
            isOpen={!hideFilters}
            onToggle={handleToggleFilters}
          />
        </Box>

        {/* Grid area */}
        <Box sx={{ flex: 1, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {isFetching
            ? <Skeleton variant="text" width={120} sx={{ fontSize: '15px', mb: 1 }} />
            : (
                <Typography
                  sx={{
                    color: '#00609f',
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    mb: 1,
                  }}
                >
                  {(data?.total ?? 0).toLocaleString()}
                  {' '}
                  {data?.total === 1 ? currentAsset.label.singular : currentAsset.label.plural}
                </Typography>
              )}
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <LibraryDataGrid
              assetType={urlState.tab}
              data={data?.items || []}
              loading={isFetching}
              total={data?.total || 0}
              paginationModel={{ page: urlState.page, pageSize: urlState.pageSize }}
              onPaginationChange={(model) => {
                updateUrlState({ page: model.page, pageSize: model.pageSize })
              }}
              sortModel={sortModel}
              onSortChange={handleSortChange}
              selectedDatasetIds={[]}
              onSelectionChange={() => {}}
              checkboxSelection={false}
              extraColumns={extraColumns}
            />
          </Box>
        </Box>
      </Box>

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        title="Delete dataset"
        openState={deleteDialog.open}
        close={handleDeleteClose}
        action={handleDeleteConfirm}
        description={`Are you sure you want to delete the dataset '${deleteDialog.term?.datasetIdentifier}'?`}
      />
    </Box>
  )
}
