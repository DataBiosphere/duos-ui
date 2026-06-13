import ManageDacTable from 'src/components/manage_dac_table/ManageDacTable'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Styles } from 'src/libs/theme'
import { DAC } from 'src/libs/ajax/DAC'
import { Storage } from 'src/libs/storage'
import { Notifications } from 'src/libs/utils'
import ConfirmationModal from 'src/components/modals/ConfirmationModal'
import EditDac from 'src/pages/manage_dac/EditDac'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'
import AddObjectButton from 'src/components/AddObjectButton'
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined'
import type { DacObject, Dataset, DatasetProperty } from 'src/types/model'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { Box, CircularProgress, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { DataUseTranslation } from 'src/libs/dataUseTranslation'
import { validateHttpUrl } from 'src/utils/UrlUtils'

const CHAIR = 'Chairperson'
const ADMIN = 'Admin'
type ManageDacRole = typeof CHAIR | typeof ADMIN

const PAGE_SIZE_OPTIONS = [10, 25, 50]

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

const DATAGRID_SX = {
  '& .MuiDataGrid-cell:focus': { outline: 'none' },
  '& .MuiDataGrid-cell:focus-within': { outline: 'none' },
  '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
  '& .MuiDataGrid-columnHeader:focus-within': { outline: 'none' },
}

const getDatasetProperty = (properties: DatasetProperty[], propName: string): string => {
  const prop = properties?.find(p => p.propertyName.toLowerCase() === propName.toLowerCase())
  return prop?.propertyValue ?? ''
}

const translateDataset = async (dataset: Dataset): Promise<[number, string]> => {
  const translations = await DataUseTranslation.translateDataUseRestrictions(dataset.dataUse)
  const text = (translations as Array<{ description: string }>).map(t => t.description).join('\n')
  return [dataset.datasetId, text]
}

const DATASET_COLUMNS: GridColDef[] = [
  {
    field: 'datasetIdentifier',
    headerName: 'Dataset ID',
    width: 140,
    renderCell: params => (
      params.value
        ? <Link to={`/dataset/${params.value}`} style={{ color: '#216fb4' }}>{params.value}</Link>
        : <span style={{ color: '#999' }}>---</span>
    ),
  },
  { field: 'name', headerName: 'Dataset Name', flex: 1, minWidth: 180 },
  {
    field: 'url',
    headerName: 'URL',
    width: 100,
    renderCell: params => (
      params.value
        ? <a href={params.value} target="_blank" rel="noreferrer" style={{ color: '#216fb4' }}>Link</a>
        : <span style={{ color: '#999' }}>---</span>
    ),
  },
  {
    field: 'dataUseText',
    headerName: 'Data Use Limitations',
    flex: 1,
    minWidth: 220,
    renderCell: (params) => {
      const text = params.value as string
      if (!text) {
        return <span style={{ color: '#999' }}>---</span>
      }
      const short = text.length >= 75 ? `${text.slice(0, 75)}...` : text
      return <span title={text}>{short}</span>
    },
  },
  { field: 'dataType', headerName: 'Data Type', width: 130 },
  { field: 'pi', headerName: 'Principal Investigator', width: 200 },
  { field: 'participants', headerName: '# of Participants', width: 150 },
]

export const ManageDac = function ManageDac() {
  usePageTitle('DACs')
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

  const [showEditPage, setShowEditPage] = useState<boolean>(false)
  const [showDatasetsPage, setShowDatasetsPage] = useState<boolean>(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false)

  const [selectedDac, setSelectedDac] = useState<DacObject | null>(null)
  const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>([])
  const [translatedDataUse, setTranslatedDataUse] = useState<Map<number, string>>(new Map())
  const [datasetPaginationModel, setDatasetPaginationModel] = useState({ page: 0, pageSize: 10 })

  const initializeDACs = useCallback(async () => {
    const allDacs = await DAC.list()
    if (roles.includes(ADMIN)) {
      setDacs(allDacs)
    }
    else {
      setDacs(allDacs.filter((dac: DacObject) => dac.dacId !== undefined && chairDACIds.has(dac.dacId)))
    }
    setIsLoading(false)
  }, [chairDACIds, roles])

  useEffect(() => {
    let isMounted = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    initializeDACs().catch((error) => {
      if (isMounted) {
        Notifications.showError({ text: 'Failed to load DACs.' })
        console.error('Error loading DACs:', error)
      }
    })
    return () => {
      isMounted = false
    }
  }, [initializeDACs])

  // Show notification when datasets section opens with no datasets
  useEffect(() => {
    if (showDatasetsPage && selectedDac !== null && selectedDatasets.length === 0) {
      Notifications.showError({ text: 'DAC has no datasets.' })
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowDatasetsPage(false)
    }
  }, [showDatasetsPage, selectedDac, selectedDatasets])

  // Translate data use restrictions whenever the dataset list changes
  useEffect(() => {
    if (selectedDatasets.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTranslatedDataUse(new Map())
      return
    }
    const translateAll = async () => {
      const entries = await Promise.all(selectedDatasets.map(translateDataset))
      setTranslatedDataUse(new Map(entries))
    }
    void translateAll()
  }, [selectedDatasets])

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

  const handleEditClose = useCallback(async () => {
    setShowEditPage(false)
    setSelectedDac(null)
    await initializeDACs()
  }, [initializeDACs])

  const handleOpenEdit = useCallback((show: boolean) => {
    setShowEditPage(show)
    if (show) {
      setShowDatasetsPage(false)
      setTimeout(() => {
        document.getElementById('dac-configurations-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }
  }, [])

  const handleOpenDatasets = useCallback((show: boolean) => {
    setShowDatasetsPage(show)
    if (show) {
      setShowEditPage(false)
      setTimeout(() => {
        document.getElementById('dac-datasets-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }
  }, [])

  const addDac = () => {
    setSelectedDac(null)
    handleOpenEdit(true)
  }

  const handleDatasetsClose = useCallback(() => {
    setShowDatasetsPage(false)
    setSelectedDatasets([])
    setSelectedDac(null)
  }, [])

  const datasetRows = useMemo(() => selectedDatasets.map((dataset) => {
    const props = dataset.properties ?? []
    const rawUrl = getDatasetProperty(props, 'url')
    return {
      id: dataset.datasetId,
      datasetIdentifier: dataset.datasetIdentifier,
      name: dataset.name ?? '',
      url: validateHttpUrl(rawUrl) ?? '',
      dataType: getDatasetProperty(props, 'Data Type'),
      pi: dataset.study?.piName || getDatasetProperty(props, 'Principal Investigator(PI)'),
      participants: getDatasetProperty(props, '# of participants'),
      dataUseText: translatedDataUse.get(dataset.datasetId) ?? '',
    }
  }), [selectedDatasets, translatedDataUse])

  const isTranslating = selectedDatasets.length > 0 && translatedDataUse.size < selectedDatasets.length

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
        setShowDatasetsPage={handleOpenDatasets}
        setShowConfirmationModal={setShowConfirmationModal}
        setSelectedDac={setSelectedDac}
        setSelectedDatasets={setSelectedDatasets}
        setShowEditPage={handleOpenEdit}
      />

      <ConfirmationModal
        showConfirmation={showConfirmationModal}
        closeConfirmation={() => setShowConfirmationModal(false)}
        title="Delete DAC?"
        message="Are you sure you want to delete this Data Access Committee?"
        header={selectedDac?.name}
        onConfirm={handleDeleteDac}
      />

      {/* ── Section 2: DAC Configurations ── */}
      {showEditPage && (
        <div id="dac-configurations-section">
          <hr style={SECTION_DIVIDER} />
          <Typography sx={SECTION_TITLE_SX}>DAC Configurations</Typography>
          <EditDac
            dacId={selectedDac?.dacId}
            onClose={handleEditClose}
            hideHeader
          />
        </div>
      )}

      {/* ── Section 3: DAC Datasets associated with DAC: ── */}
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
          {isTranslating
            ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '12rem' }}>
                  <CircularProgress />
                </Box>
              )
            : (
                <Box sx={{ width: '100%', mt: 1 }}>
                  <DataGrid
                    rows={datasetRows}
                    columns={DATASET_COLUMNS}
                    pageSizeOptions={PAGE_SIZE_OPTIONS}
                    paginationModel={datasetPaginationModel}
                    onPaginationModelChange={setDatasetPaginationModel}
                    disableRowSelectionOnClick
                    autoHeight
                    sx={DATAGRID_SX}
                  />
                </Box>
              )}
        </div>
      )}
    </div>
  )
}

export default ManageDac
