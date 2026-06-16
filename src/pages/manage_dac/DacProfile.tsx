import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Box, CircularProgress, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { DAC } from 'src/libs/ajax/DAC'
import { DataUseTranslation } from 'src/libs/dataUseTranslation'
import { Notifications } from 'src/libs/utils'
import { Styles } from 'src/libs/theme'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { Spinner } from 'src/components/Spinner'
import EditDac from 'src/pages/manage_dac/EditDac'
import { DACBotComponent } from 'src/components/dac_bot/DACBotComponent'
import { validateHttpUrl } from 'src/utils/UrlUtils'
import type { DacObject, Dataset, DatasetProperty } from 'src/types/model'
import backArrowIcon from 'src/images/back_arrow.svg'
import editDACIcon from 'src/images/dac_icon.svg'

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

export const DacProfile: React.FC = () => {
  const { dacId: dacIdParam } = useParams<{ dacId: string }>()
  const dacId = dacIdParam ? Number.parseInt(dacIdParam, 10) : undefined

  const [dac, setDac] = useState<DacObject | null>(null)
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [translatedDataUse, setTranslatedDataUse] = useState<Map<number, string>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [sectionKey, setSectionKey] = useState(0)

  usePageTitle(dac?.name ?? 'DAC Profile')

  const loadDacData = useCallback(async () => {
    if (dacId === undefined) return
    setIsLoading(true)
    try {
      const [fetchedDac, allDatasets] = await Promise.all([
        DAC.get(dacId),
        DAC.datasets(dacId),
      ])
      setDac(fetchedDac)
      setDatasets(allDatasets.filter((d: Dataset) => d.dacApproval))
    }
    catch {
      Notifications.showError({ text: 'Failed to load DAC profile.' })
    }
    finally {
      setIsLoading(false)
    }
  }, [dacId])

  useEffect(() => {
    void loadDacData()
  }, [loadDacData])

  // Translate data use restrictions whenever the dataset list changes
  useEffect(() => {
    if (datasets.length === 0) {
      setTranslatedDataUse(new Map())
      return
    }
    const translateAll = async () => {
      const entries = await Promise.all(datasets.map(translateDataset))
      setTranslatedDataUse(new Map(entries))
    }
    void translateAll()
  }, [datasets])

  // After EditDac saves or cancels: re-fetch fresh data, then re-mount sections
  const handleEditClose = useCallback(async () => {
    if (dacId === undefined) return
    try {
      const [fetchedDac, allDatasets] = await Promise.all([
        DAC.get(dacId),
        DAC.datasets(dacId),
      ])
      setDac(fetchedDac)
      setDatasets(allDatasets.filter((d: Dataset) => d.dacApproval))
    }
    catch {
      // EditDac already surfaces errors; silently continue
    }
    finally {
      setSectionKey(k => k + 1)
    }
  }, [dacId])

  const datasetRows = useMemo(() => datasets.map((dataset) => {
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
  }), [datasets, translatedDataUse])

  const isTranslating = datasets.length > 0 && translatedDataUse.size < datasets.length

  const datasetCountLabel = `${datasets.length.toLocaleString()} ${datasets.length === 1 ? 'dataset' : 'datasets'}`

  const datasetsContent = datasets.length === 0
    ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography color="text.secondary">No datasets are associated with this DAC.</Typography>
        </Box>
      )
    : (
        <Box sx={{ width: '100%', mt: 1 }}>
          <Typography sx={{ color: '#00609f', fontFamily: 'Montserrat, sans-serif', fontSize: '15px', fontWeight: 'bold', mb: 1 }}>
            {datasetCountLabel}
          </Typography>
          {isTranslating
            ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '12rem' }}>
                  <CircularProgress />
                </Box>
              )
            : (
                <DataGrid
                  rows={datasetRows}
                  columns={DATASET_COLUMNS}
                  pageSizeOptions={PAGE_SIZE_OPTIONS}
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                  disableRowSelectionOnClick
                  autoHeight
                  sx={DATAGRID_SX}
                />
              )}
        </Box>
      )

  if (isLoading) {
    return <Spinner />
  }

  return (
    <div style={Styles.PAGE}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <Link
          to="/manage_dac"
          className="navbar-brand"
          style={{ paddingRight: '16px', marginTop: '3rem' }}
          aria-label="Back to Manage DAC"
        >
          <img src={backArrowIcon} style={{ ...Styles.HEADER_IMG, width: '30px' }} alt="Back" />
        </Link>
        <TableHeaderSection
          icon={{ src: editDACIcon }}
          title={dac?.name ?? 'DAC Profile'}
          description={dac?.description}
        />
      </div>

      {/* DAC Membership, DAC Info, and Select a Data Access Agreement sections */}
      {dacId !== undefined && (
        <EditDac
          key={sectionKey}
          dacId={dacId}
          onClose={handleEditClose}
          hideHeader
          profileMode
        />
      )}

      {/* ── Rule Automation for DARs (RADAR) ── */}
      <hr style={SECTION_DIVIDER} />
      <Typography sx={SECTION_TITLE_SX}>Rule Automation for DARs (RADAR)</Typography>
      {dacId !== undefined && <DACBotComponent dacId={dacId} />}

      {/* ── Datasets Managed by this DAC ── */}
      <hr style={SECTION_DIVIDER} />
      <Typography sx={SECTION_TITLE_SX}>Datasets Managed by this DAC</Typography>
      {datasetsContent}
    </div>
  )
}

export default DacProfile
