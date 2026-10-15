import ManageDacTable from 'src/components/manage_dac_table/ManageDacTable'
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
import { Box, CircularProgress, Typography } from '@mui/material'
import { useNavigate } from 'react-router'
import {
  DAC_DATASET_COLUMNS,
  DAC_DATASET_GRID_SX,
  DAC_DATASET_PAGE_SIZE_OPTIONS,
  loadIndexedDataUse,
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

  const [showDatasetsPage, setShowDatasetsPage] = useState<boolean>(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false)

  const [selectedDac, setSelectedDac] = useState<DacObject | null>(null)
  const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>([])
  const [dataUseById, setDataUseById] = useState<Map<number, DataUseSummary> | null>(null)
  const dataUseRequest = useRef(0)
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

  const handleDeleteDac = async () => {
    if (selectedDac?.dacId === undefined) {
      Notifications.showError({ text: 'DAC could not be deleted.' })
      return
    }
    const { status } = await DAC.delete(selectedDac.dacId)
    if (Number(status) === 200) {
      Notifications.showSuccess({ text: 'DAC successfully deleted.' })
      setShowConfirmationModal(false)
      await initializeDACs()
    }
    else {
      Notifications.showError({ text: 'DAC could not be deleted.' })
    }
  }

  // Combined callback for ManageDacTable: validates datasets and opens the datasets section.
  const handleViewDatasets = useCallback(async (dac: DacObject, datasets: Dataset[]) => {
    if (datasets.length === 0) {
      Notifications.showError({ text: 'DAC has no datasets.' })
      return
    }
    setSelectedDac(dac)
    setSelectedDatasets(datasets)
    setDataUseById(null)
    setShowDatasetsPage(true)
    setTimeout(() => {
      document.getElementById('dac-datasets-section')?.scrollIntoView({ behavior: 'smooth' })
    }, 50)
    // Ignore a slow response for a DAC that is no longer selected
    const request = ++dataUseRequest.current
    const dataUse = dac.dacId === undefined ? new Map<number, DataUseSummary>() : await loadIndexedDataUse(dac.dacId)
    if (request === dataUseRequest.current) setDataUseById(dataUse)
  }, [])

  const addDac = () => {
    navigate('/manage_add_dac_daa')
  }

  const handleDatasetsClose = useCallback(() => {
    setShowDatasetsPage(false)
    setSelectedDatasets([])
    setSelectedDac(null)
  }, [])

  const datasetRows = useMemo(
    () => selectedDatasets.map(dataset => toDacDatasetRow(dataset, dataUseById?.get(dataset.datasetId))),
    [selectedDatasets, dataUseById],
  )

  return (
    <div style={Styles.PAGE}>

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
        setSelectedDac={setSelectedDac}
      />

      <ConfirmationModal
        showConfirmation={showConfirmationModal}
        closeConfirmation={() => setShowConfirmationModal(false)}
        title="Delete DAC?"
        message="Are you sure you want to delete this Data Access Committee?"
        header={selectedDac?.name}
        onConfirm={handleDeleteDac}
      />

      {/* ── Section 2: DAC Datasets associated with DAC: ── */}
      {showDatasetsPage && selectedDac && selectedDatasets.length > 0 && (
        <div id="dac-datasets-section">
          <hr style={SECTION_DIVIDER} />
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Typography sx={SECTION_TITLE_SX}>
              {`DAC Datasets associated with DAC: ${selectedDac.name ?? ''}`}
            </Typography>
            <button
              className="btn btn-link"
              style={{ fontSize: '1.4rem', whiteSpace: 'nowrap' }}
              onClick={handleDatasetsClose}
            >
              Close
            </button>
          </Box>
          {dataUseById === null
            ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '12rem' }}>
                  <CircularProgress />
                </Box>
              )
            : (
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
              )}
        </div>
      )}
    </div>
  )
}

export default ManageDac
