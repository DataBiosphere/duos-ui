import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { Box, Typography } from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { DAC } from 'src/libs/ajax/DAC'
import { Notifications } from 'src/libs/utils'
import { Styles } from 'src/libs/theme'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { Spinner } from 'src/components/Spinner'
import EditDac from 'src/pages/manage_dac/EditDac'
import { DACBotComponent } from 'src/components/dac_bot/DACBotComponent'
import { DacProfileSection } from 'src/pages/manage_dac/DacProfileSection'
import {
  DAC_DATASET_COLUMNS,
  DAC_DATASET_GRID_SX,
  DAC_DATASET_PAGE_SIZE_OPTIONS,
  loadIndexedDataUse,
  toDacDatasetRow,
} from 'src/pages/manage_dac/dacDatasetGrid'
import type { DacObject, Dataset, DataUseSummary } from 'src/types/model'
import backArrowIcon from 'src/images/back_arrow.svg'
import editDACIcon from 'src/images/dac_icon.svg'

const PAGE_MAX_WIDTH = '1100px'

const loadProfile = async (dacId: number) => {
  const [dac, allDatasets, dataUse] = await Promise.all([
    DAC.get(dacId),
    DAC.datasets(dacId),
    loadIndexedDataUse(dacId),
  ])
  return { dac, datasets: allDatasets.filter((d: Dataset) => d.dacApproval), dataUse }
}

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

  const datasetRows = useMemo(
    () => datasets.map(dataset => toDacDatasetRow(dataset, dataUseById.get(dataset.datasetId))),
    [datasets, dataUseById],
  )

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
            columns={DAC_DATASET_COLUMNS}
            pageSizeOptions={DAC_DATASET_PAGE_SIZE_OPTIONS}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            disableRowSelectionOnClick
            autoHeight
            sx={DAC_DATASET_GRID_SX}
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <TableHeaderSection
            icon={{ src: editDACIcon }}
            // 2.5rem fits 50 all-caps characters on one line at the page cap and scales with zoom
            title={<span style={{ display: 'block', fontSize: '2.5rem', overflowWrap: 'anywhere' }}>{dacTitle}</span>}
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
