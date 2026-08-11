/* oxlint-disable react-refresh/only-export-components */
import React, { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Box } from '@mui/material'
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined'
import { Notifications } from 'src/libs/utils'
import SearchBar from 'src/components/SearchBar'
import { DataSet } from 'src/libs/ajax/DataSet'
import { Storage } from 'src/libs/storage'
import TableHeaderSection from 'src/components/TableHeaderSection'
import AddObjectButton from 'src/components/AddObjectButton'
import { useLibraryPageState } from 'src/hooks/useLibraryPageState'
import { LIBRARY_DATA_QUERY_KEY } from 'src/hooks/useLibraryData'
import { LIBRARY_TAB_COUNTS_QUERY_KEY } from 'src/hooks/useLibraryTabCounts'
import LibraryPageShell from 'src/components/data_library/LibraryPageShell'
import { makeSubmissionColumns } from 'src/components/data_library/columns/submissionColumns'
import { ConfirmationDialog } from 'src/components/modals/ConfirmationDialog'
import { useQueryClient } from '@tanstack/react-query'
import { AssetType, ALL_LIBRARY_TABS, LibraryVersionNew, TabConfig } from 'src/types/library'
import { DuosUser } from 'src/types/model'

export const SUBMISSION_TAB_TYPES = new Set<AssetType>([
  AssetType.STUDIES,
  AssetType.DATASETS,
  AssetType.MODELS,
  AssetType.WORKSPACES,
  AssetType.CLINICAL_TRIALS,
  AssetType.BIOSPECIMENS,
  AssetType.PUBLICATIONS,
  AssetType.PRESENTATIONS,
  AssetType.INTELLECTUAL_PROPERTY,
])
const SUBMISSION_TABS: TabConfig[] = ALL_LIBRARY_TABS.filter(t => SUBMISSION_TAB_TYPES.has(t.key))

// Scopes a library query to datasets/studies the user submitted or is the data custodian for.
// Shared with ResearcherDashboard so its Data Submissions stat counts the same records this page lists.
export const buildSubmissionOwnershipQuery = (user: Pick<DuosUser, 'userId' | 'email'> | undefined): unknown => {
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
          ? [{ term: { 'study.dataCustodianEmail': user.email } }]
          : []),
      ],
      minimum_should_match: 1,
    },
  }
}

interface DeleteDialogTerm {
  datasetId: number
  datasetName: string
}

export default function DatasetSubmissions() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean, term: DeleteDialogTerm | null }>(
    { open: false, term: null },
  )

  const user = Storage.getCurrentUser()

  const userOwnershipQuery = useMemo(
    () => buildSubmissionOwnershipQuery(user),
    [user],
  )

  const libraryConfig: LibraryVersionNew = useMemo(() => ({
    key: `submissions-${user?.userId ?? 'anonymous'}`,
    title: 'My Data Submissions',
    description: 'View the status of datasets registered in DUOS',
    featured: true,
    order: 0,
    query: userOwnershipQuery,
    showAllControlled: true,
  }), [userOwnershipQuery, user?.userId])

  const pageState = useLibraryPageState(libraryConfig)
  const { urlState, handleSearchChange, handleTabChange: pageHandleTabChange } = pageState

  const handleTabChange = useCallback((newAssetType: AssetType) => {
    setDeleteDialog({ open: false, term: null })
    pageHandleTabChange(newAssetType)
  }, [pageHandleTabChange])

  const handleDeleteClick = useCallback((term: DeleteDialogTerm) => {
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
      // Refetch both the grid rows and the tab-count badges: they are backed by
      // separate queries, so invalidating only the data query drops the deleted
      // row while the Datasets badge keeps showing the stale pre-delete count for
      // up to its 5-minute staleTime.
      queryClient.invalidateQueries({ queryKey: [LIBRARY_DATA_QUERY_KEY, libraryConfig.key] })
      queryClient.invalidateQueries({ queryKey: [LIBRARY_TAB_COUNTS_QUERY_KEY, libraryConfig.key] })
    }
    catch {
      Notifications.showError({ text: `Error removing dataset '${term.datasetName}'` })
    }
  }, [deleteDialog, libraryConfig, queryClient])

  const extraColumns = useMemo(
    () => makeSubmissionColumns(handleDeleteClick),
    [handleDeleteClick],
  )

  const header = (
    <>
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
    </>
  )

  return (
    <>
      <LibraryPageShell
        pageState={{ ...pageState, handleTabChange }}
        tabs={SUBMISSION_TABS}
        header={header}
        gridExtras={{
          checkboxSelection: false,
          extraColumns: urlState.tab === AssetType.DATASETS ? extraColumns : undefined,
        }}
      />
      <ConfirmationDialog
        title="Delete dataset"
        openState={deleteDialog.open}
        close={handleDeleteClose}
        action={handleDeleteConfirm}
        description={`Are you sure you want to delete the dataset '${deleteDialog.term?.datasetName}'?`}
      />
    </>
  )
}
