import ManageDacTable from 'src/components/manage_dac_table/ManageDacTable'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Styles } from 'src/libs/theme'
import { DAC } from 'src/libs/ajax/DAC'
import { Storage } from 'src/libs/storage'
import { Notifications } from 'src/libs/utils'
import ConfirmationModal from 'src/components/modals/ConfirmationModal'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'
import AddObjectButton from 'src/components/AddObjectButton'
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined'
import type { DacObject, Dataset, DataUseSummary } from 'src/types/model'
import { DataGrid } from '@mui/x-data-grid'
import { Box, Typography } from '@mui/material'
import { useNavigate } from 'react-router'
import {
  DAC_DATASET_COLUMNS,
  DAC_DATASET_GRID_SX,
  DAC_DATASET_PAGE_SIZE_OPTIONS,
  DATA_USE_LOAD_ERROR,
  fetchIndexedDataUse,
  toDacDatasetRow,
} from 'src/pages/manage_dac/dacDatasetGrid'

const CHAIR = 'Chairperson'
const ADMIN = 'Admin'
type ManageDacRole = typeof CHAIR | typeof ADMIN

const SECTION_DIVIDER: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid #e0e0e0',
  margin: '3rem 0 0 0',
}

const SECTION_TITLE_SX = {
  fontFamily: 'Montserrat',
  fontWeight: 600,
  fontSize: '2rem',
  color: '#1f3b50',
  mt: 3,
  mb: 2,
}

export const ManageDac = function ManageDac() {
  usePageTitle('DACs')
  const navigate = useNavigate()
  const currentUser = useMemo(() => Storage.getCurrentUser(), [])
  const roles = useMemo(() => currentUser.roles?.map((r: { name: string }) => r.name) ?? [], [currentUser])
  const userRole: ManageDacRole = roles.includes(ADMIN) ? ADMIN : CHAIR
  const chairDACIds = useMemo(() => new Set(
    currentUser.roles
      .filter((roleItem: { name: string, dacId?: number }) => roleItem.name === CHAIR && roleItem.dacId !== undefined)
      .map((roleItem: { dacId?: number }) => roleItem.dacId as number),
  ), [currentUser])

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [dacs, setDacs] = useState<DacObject[]>([])

  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false)

  const [dacToDelete, setDacToDelete] = useState<DacObject | null>(null)
  const [viewedDac, setViewedDac] = useState<DacObject | null>(null)
  const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>([])
  const [indexedDataUse, setIndexedDataUse] = useState<{ dacId: number, dataUseById: Map<number, DataUseSummary> } | null>(null)
  const [datasetPaginationModel, setDatasetPaginationModel] = useState({ page: 0, pageSize: 10 })

  const initializeDACs = useCallback(async () => {
    try {
      const allDacs = await DAC.list()
      if (roles.includes(ADMIN)) {
        setDacs(allDacs)
      }
      else {
        setDacs(allDacs.filter((dac: DacObject) => dac.dacId !== undefined && chairDACIds.has(dac.dacId)))
      }
      setIsLoading(false)
    }
    catch {
      Notifications.showError({ text: 'Failed to load DACs.' })
    }
  }, [chairDACIds, roles])

  // Load DACs on mount / when role/chair set changes.
  // All setState calls happen after the await, so no synchronous state update in the effect body.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const allDacs = await DAC.list()
        if (cancelled) return
        const filteredDacs = roles.includes(ADMIN)
          ? allDacs
          : allDacs.filter((dac: DacObject) => dac.dacId !== undefined && chairDACIds.has(dac.dacId))
        setDacs(filteredDacs)
      }
      catch {
        if (!cancelled) Notifications.showError({ text: 'Failed to load DACs.' })
      }
      finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [chairDACIds, roles])

  const handleDatasetsClose = useCallback(() => {
    setSelectedDatasets([])
    setViewedDac(null)
  }, [])

  const handleDeleteDac = async () => {
    if (dacToDelete?.dacId === undefined) {
      Notifications.showError({ text: 'DAC could not be deleted.' })
      return
    }
    const { status } = await DAC.delete(dacToDelete.dacId)
    if (Number(status) === 200) {
      Notifications.showSuccess({ text: 'DAC successfully deleted.' })
      setShowConfirmationModal(false)
      if (viewedDac?.dacId === dacToDelete.dacId) handleDatasetsClose()
      await initializeDACs()
    }
    else {
      Notifications.showError({ text: 'DAC could not be deleted.' })
    }
  }

  // Combined callback for ManageDacTable: validates datasets and opens the datasets section.
  const handleViewDatasets = useCallback((dac: DacObject, datasets: Dataset[]) => {
    if (datasets.length === 0) {
      Notifications.showError({ text: 'DAC has no datasets.' })
      return
    }
    setViewedDac(dac)
    setSelectedDatasets(datasets)
    setTimeout(() => {
      document.getElementById('dac-datasets-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
  }, [])

  // Data use fills in after the grid renders; closing or switching DACs aborts the request
  const viewedDacId = viewedDac?.dacId
  useEffect(() => {
    if (viewedDacId === undefined) return
    const controller = new AbortController()
    fetchIndexedDataUse(viewedDacId, controller.signal)
      .then((dataUseById) => {
        if (!controller.signal.aborted) setIndexedDataUse({ dacId: viewedDacId, dataUseById })
      })
      .catch(() => {
        if (!controller.signal.aborted) Notifications.showError({ text: DATA_USE_LOAD_ERROR })
      })
    return () => controller.abort()
  }, [viewedDacId])

  const addDac = () => {
    navigate('/manage_add_dac_daa')
  }

  const datasetRows = useMemo(() => {
    const dataUseById = indexedDataUse?.dacId === viewedDacId ? indexedDataUse?.dataUseById : undefined
    return selectedDatasets.map(dataset => toDacDatasetRow(dataset, dataUseById?.get(dataset.datasetId)))
  }, [selectedDatasets, indexedDataUse, viewedDacId])

  return (
    <div style={{ ...Styles.PAGE, ...Styles.PAGE_BOTTOM_SPACING }}>

      {/* ── Section 1: Manage My Data Access Committee ── */}
      <TableHeaderSection
        title="Manage My Data Access Committee"
        description="Create and manage Data Access Committee"
      />
      <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION, justifyContent: 'flex-end' }}>
        <AddObjectButton
          id="btn_addDAC"
          label="ADD DAC"
          onClick={addDac}
          icon={<AddCircleOutlineOutlinedIcon />}
          className="button button-blue"
        />
      </div>
      <ManageDacTable
        isLoading={isLoading}
        dacs={dacs}
        userRole={userRole}
        onViewDatasets={handleViewDatasets}
        setShowConfirmationModal={setShowConfirmationModal}
        setSelectedDac={setDacToDelete}
      />

      <ConfirmationModal
        showConfirmation={showConfirmationModal}
        closeConfirmation={() => setShowConfirmationModal(false)}
        title="Delete DAC?"
        message="Are you sure you want to delete this Data Access Committee?"
        header={dacToDelete?.name}
        onConfirm={handleDeleteDac}
      />

      {/* ── Section 2: DAC Datasets associated with DAC: ── */}
      {viewedDac && selectedDatasets.length > 0 && (
        <div id="dac-datasets-section">
          <hr style={SECTION_DIVIDER} />
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Typography sx={SECTION_TITLE_SX}>
              {`DAC Datasets associated with DAC: ${viewedDac.name ?? ''}`}
            </Typography>
            <button
              className="btn btn-link"
              style={{ fontSize: '1.4rem', whiteSpace: 'nowrap' }}
              onClick={handleDatasetsClose}
            >
              Close
            </button>
          </Box>
          <Box sx={{ width: '100%', mt: 1 }}>
            <DataGrid
              rows={datasetRows}
              columns={DAC_DATASET_COLUMNS}
              pageSizeOptions={DAC_DATASET_PAGE_SIZE_OPTIONS}
              paginationModel={datasetPaginationModel}
              onPaginationModelChange={setDatasetPaginationModel}
              disableRowSelectionOnClick
              autoHeight
              sx={DAC_DATASET_GRID_SX}
            />
          </Box>
        </div>
      )}
    </div>
  )
}

export default ManageDac
