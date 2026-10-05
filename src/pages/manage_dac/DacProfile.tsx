import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { Box, CircularProgress, Typography } from '@mui/material'
import { DataGrid, GridAutosizeOptions, GridColDef } from '@mui/x-data-grid'
import { DAC } from 'src/libs/ajax/DAC'
import { ControlledAccessType, DataUseTranslation, TranslationEntry } from 'src/libs/dataUseTranslation'
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
import backArrowIcon from 'src/images/back_arrow.svg'
import editDACIcon from 'src/images/dac_icon.svg'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

// Caps the page column so the profile cards size to their content on wide screens
const PAGE_MAX_WIDTH = '1100px'

// Fit 50 characters of the DAC name on the first line; longer names wrap. Montserrat semibold
// averages under 0.7em per character, so the line needs 35em: the header width less its
// 2em left padding and 76px icon column (~104px). Never larger than the standard 2.8rem title.
const TITLE_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: 'clamp(2rem, calc((100cqi - 104px) / 35), 2.8rem)',
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

// Permissions are primary data use terms and modifiers are secondary, matching the search index
// summary the Data Library's chip is built from
const toDataUseSummary = (translations: TranslationEntry[]): DataUseSummary => ({
  primary: translations.filter(t => t.type === ControlledAccessType.permissions),
  secondary: translations.filter(t => t.type === ControlledAccessType.modifiers),
})

const translateDataset = async (dataset: Dataset): Promise<[number, DataUseSummary]> => {
  const translations = await DataUseTranslation.translateDataUseRestrictions(dataset.dataUse)
  return [dataset.datasetId, toDataUseSummary(translations)]
}

// Size the ID column to its widest value so identifiers are never truncated
const AUTOSIZE_OPTIONS: GridAutosizeOptions = { columns: ['datasetIdentifier'], includeHeaders: true, includeOutliers: true }

const DATASET_COLUMNS: GridColDef[] = [
  {
    field: 'datasetIdentifier',
    headerName: 'Dataset ID',
    width: 150,
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
    // Same chip as the Data Library's Data Use column; the shared renderer only reads row.dataUse
    ...(DATA_USE_GRID_COLUMN as GridColDef),
    headerName: 'Data Use Limitations',
    flex: 1,
    minWidth: 200,
  },
  { field: 'dataType', headerName: 'Data Type', width: 120 },
  { field: 'pi', headerName: 'Principal Investigator', width: 170 },
  { field: 'participants', headerName: '# of Participants', width: 140 },
]

export const DacProfile: React.FC = () => {
  const { dacId: dacIdParam } = useParams<{ dacId: string }>()
  const parsedId = dacIdParam === undefined ? Number.NaN : Number.parseInt(dacIdParam, 10)
  const dacId = Number.isNaN(parsedId) ? undefined : parsedId

  const [dac, setDac] = useState<DacObject | null>(null)
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [translatedDataUse, setTranslatedDataUse] = useState<Map<number, DataUseSummary>>(new Map())
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
        const [fetchedDac, allDatasets] = await Promise.all([
          DAC.get(dacId),
          DAC.datasets(dacId),
        ])
        if (cancelled) return
        setDac(fetchedDac)
        setDatasets(allDatasets.filter((d: Dataset) => d.dacApproval))
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

  // Translate data use restrictions whenever the dataset list changes.
  // Promise.all([]) resolves to [] when datasets is empty, yielding an empty Map.
  useEffect(() => {
    let cancelled = false
    const translateAll = async () => {
      const entries = await Promise.all(datasets.map(translateDataset))
      if (!cancelled) setTranslatedDataUse(new Map(entries))
    }
    void translateAll()
    return () => {
      cancelled = true
    }
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
      dataUse: translatedDataUse.get(dataset.datasetId),
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
                  autosizeOnMount
                  autosizeOptions={AUTOSIZE_OPTIONS}
                  sx={DATAGRID_SX}
                />
              )}
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
