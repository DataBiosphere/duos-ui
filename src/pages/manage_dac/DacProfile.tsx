import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { Box, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import { DAC } from 'src/libs/ajax/DAC'
import { DataSet } from 'src/libs/ajax/DataSet'
import { DATA_USE_GRID_COLUMN } from 'src/components/dataUseGridColumn'
import { Notifications } from 'src/libs/utils'
import { Styles } from 'src/libs/theme'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { Spinner } from 'src/components/Spinner'
import EditDac from 'src/pages/manage_dac/EditDac'
import { DACBotComponent } from 'src/components/dac_bot/DACBotComponent'
import { DacProfileSection } from 'src/pages/manage_dac/DacProfileSection'
import { validateHttpUrl } from 'src/utils/UrlUtils'
import type { DacObject, Dataset, DatasetProperty, DataUseSummary } from 'src/types/model'
import type { ElasticsearchQuery } from 'src/types/elastic'
import backArrowIcon from 'src/images/back_arrow.svg'
import editDACIcon from 'src/images/dac_icon.svg'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

const PAGE_MAX_WIDTH = '1100px'

// 37em fits 50 all-caps characters on one line; 104px is the header's left padding plus icon column
const TITLE_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: 'clamp(2rem, calc((100cqi - 104px) / 37), 2.8rem)',
  overflowWrap: 'anywhere',
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

// Data use comes from the search index so codes match the Data Library and DAC Datasets chips
const fetchIndexedDataUse = async (dacId: number): Promise<Map<number, DataUseSummary>> => {
  const query = { from: 0, size: 10000, query: { terms: { dacId: [dacId] } } } as unknown as ElasticsearchQuery
  const terms = await DataSet.searchDatasetIndex(query)
  return new Map(terms.map(term => [term.datasetId, term.dataUse]))
}

const loadProfile = async (dacId: number) => {
  const [dac, allDatasets, dataUse] = await Promise.all([
    DAC.get(dacId),
    DAC.datasets(dacId),
    fetchIndexedDataUse(dacId).catch(() => {
      Notifications.showError({ text: 'Failed to load data use limitations.' })
      return new Map<number, DataUseSummary>()
    }),
  ])
  return { dac, datasets: allDatasets.filter((d: Dataset) => d.dacApproval), dataUse }
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
  { field: 'name', headerName: 'Dataset Name', flex: 1, minWidth: 160 },
  {
    field: 'url',
    headerName: 'URL',
    width: 80,
    renderCell: params => (
      params.value
        ? <a href={params.value} target="_blank" rel="noreferrer" style={{ color: '#216fb4' }}>Link</a>
        : <span style={{ color: '#999' }}>---</span>
    ),
  },
  {
    ...DATA_USE_GRID_COLUMN,
    flex: 1,
    // Same minimum as the DAC Datasets grid, which its longest code sequences need
    minWidth: 230,
  },
  { field: 'dataType', headerName: 'Data Type', width: 120 },
  { field: 'pi', headerName: 'Principal Investigator', width: 160 },
  { field: 'participants', headerName: '# of Participants', width: 130 },
]

export const DacProfile: React.FC = () => {
  const { dacId: dacIdParam } = useParams<{ dacId: string }>()
  const parsedId = dacIdParam === undefined ? Number.NaN : Number.parseInt(dacIdParam, 10)
  const dacId = Number.isNaN(parsedId) ? undefined : parsedId

  const [dac, setDac] = useState<DacObject | null>(null)
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [dataUseById, setDataUseById] = useState<Map<number, DataUseSummary>>(new Map())
  const [isLoading, setIsLoading] = useState(dacId !== undefined)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [sectionKey, setSectionKey] = useState(0)

  const dacTitle = dac?.name ?? 'DAC Profile'
  usePageTitle(dacTitle)

  // Load DAC data on mount. isLoading starts as true; all setState calls happen after the await.
  useEffect(() => {
    if (dacId === undefined) return
    let cancelled = false
    ;(async () => {
      try {
        const profile = await loadProfile(dacId)
        if (cancelled) return
        setDac(profile.dac)
        setDatasets(profile.datasets)
        setDataUseById(profile.dataUse)
      }
      catch {
        if (!cancelled) Notifications.showError({ text: 'Failed to load DAC profile.' })
      }
      finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dacId])

  // After EditDac saves or cancels: re-fetch fresh data, then re-mount sections
  const handleEditClose = useCallback(async () => {
    if (dacId === undefined) return
    try {
      const profile = await loadProfile(dacId)
      setDac(profile.dac)
      setDatasets(profile.datasets)
      setDataUseById(profile.dataUse)
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
      dataUse: dataUseById.get(dataset.datasetId),
    }
  }), [datasets, dataUseById])

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
        </Box>
      )

  if (isLoading) {
    return <Spinner />
  }

  return (
    <div style={{ ...Styles.PAGE, maxWidth: PAGE_MAX_WIDTH }}>

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
        <div style={{ flex: 1, minWidth: 0, containerType: 'inline-size' }}>
          <TableHeaderSection
            icon={{ src: editDACIcon }}
            title={<span style={TITLE_STYLE}>{dacTitle}</span>}
            description={dac?.description}
          />
        </div>
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

      <DacProfileSection
        title="Rule Automation for DARs (RADAR)"
        description="Set rules that automate steps of the Data Access Request (DAR) review process for this DAC. Only Chairpersons can change these settings, and changes are saved as soon as a box is checked or unchecked."
      >
        {dacId !== undefined && <DACBotComponent dacId={dacId} />}
      </DacProfileSection>

      <DacProfileSection
        title="Datasets Managed by this DAC"
        description="Datasets this DAC has approved to manage. Data Access Requests for these datasets are routed to this DAC for review."
      >
        {datasetsContent}
      </DacProfileSection>
    </div>
  )
}

export default DacProfile
