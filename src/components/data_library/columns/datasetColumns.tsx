import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Link, Chip, Box, Tooltip } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { DatasetTerm } from 'src/types/model'
import { AccessManagement, ExportableDatasets } from 'src/types/library'
import DatasetExportButton from 'src/components/data_search/DatasetExportButton'
import RequestAccessButton from 'src/components/data_library/RequestAccessButton'
import BoltIcon from '@mui/icons-material/Bolt'
import { validateHttpUrl } from 'src/utils/UrlUtils'

/**
 * Column definitions for dataset view
 */
export const makeDatasetColumns = (
  exportableDatasets: ExportableDatasets = {},
  radarEnabledDatasetIds: Set<number> = new Set(),
  hasSelection: boolean = false,
): GridColDef<DatasetTerm>[] => [
  {
    field: 'datasetName',
    headerName: 'Dataset Name',
    flex: 1.5,
    minWidth: 200,
    renderCell: params => (
      <Link component={RouterLink} to={`/dataset/${params.row.datasetIdentifier}`} underline="hover">
        {params.value}
      </Link>
    ),
  },
  {
    field: 'studyName',
    headerName: 'Study Name',
    flex: 1,
    minWidth: 150,
    valueGetter: (_value, row) => row.study?.studyName || '',
    renderCell: params => (
      <Link component={RouterLink} to={`/studies/${params.row.study?.studyId}`} underline="hover">
        {params.value}
      </Link>
    ),
  },
  {
    field: 'datasetIdentifier',
    headerName: 'Identifier',
    width: 150,
  },
  {
    field: 'accessManagement',
    headerName: 'Access',
    width: 150,
    renderCell: (params) => {
      const isRadarEnabled = radarEnabledDatasetIds.has(params.row.datasetId)
      const label = (() => {
        switch (params.value) {
          case 'open': return 'Open Access'
          case 'controlled': return 'via DUOS'
          case 'external': return 'External to DUOS'
          default: return params.value
        }
      })()
      const color = (() => {
        switch (params.value) {
          case AccessManagement.CONTROLLED: return 'primary'
          case AccessManagement.OPEN: return 'success'
          case AccessManagement.EXTERNAL: return 'secondary'
          default: return 'default'
        }
      })()
      const tooltipTitle = isRadarEnabled
        ? 'Automatic request approvals available for datasets clearly within the data use terms.'
        : ''
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Tooltip title={tooltipTitle}>
            <Chip
              label={(
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {label}
                  {isRadarEnabled && <BoltIcon sx={{ color: 'gold' }} />}
                </Box>
              )}
              size="small"
              color={color}
            />
          </Tooltip>
        </Box>
      )
    },
  },
  {
    field: 'requestLocation',
    headerName: 'Request Path',
    width: 180,
    sortable: false,
    renderCell: (params) => {
      if (params.row.accessManagement === AccessManagement.OPEN) {
        return '-'
      }
      if (params.row.accessManagement === AccessManagement.CONTROLLED) {
        return <RequestAccessButton datasetId={params.row.datasetId} disabledForSelection={hasSelection} />
      }
      return params.value
        ? (
            <Link href={validateHttpUrl(params.value) ? params.value : undefined} target="_blank" rel="noopener noreferrer" underline="hover">
              {params.value}
            </Link>
          )
        : null
    },
  },
  {
    field: 'participantCount',
    headerName: 'Participants',
    width: 120,
    type: 'number',
    align: 'right',
    headerAlign: 'right',
  },
  {
    field: 'dataUse',
    headerName: 'Data Use',
    width: 150,
    valueGetter: (_value, row) => row.dataUse?.primary?.[0]?.code || '',
    renderCell: (params) => {
      const codes = params.row.dataUse?.primary?.map(du => du.code).filter(Boolean) || []
      if (codes.length === 0) return null

      return (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', height: '100%' }}>
          {codes.slice(0, 2).map(code => (
            <Chip key={code} label={code} size="small" variant="outlined" />
          ))}
          {codes.length > 2 && (
            <Tooltip title={codes.slice(2).join(', ')}>
              <Chip label={`+${codes.length - 2}`} size="small" variant="outlined" />
            </Tooltip>
          )}
        </Box>
      )
    },
    sortable: false,
  },
  {
    field: 'dac',
    headerName: 'DAC',
    width: 150,
    valueGetter: (_value, row) => row.dac?.dacName || '',
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 120,
    sortable: false,
    renderCell: (params) => {
      const exportableSnapshots = exportableDatasets[params.row.datasetIdentifier] || []
      if (exportableSnapshots.length === 0) return null
      return (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          <DatasetExportButton snapshots={exportableSnapshots} />
        </Box>
      )
    },
  },
]
