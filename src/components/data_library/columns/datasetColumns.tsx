import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Link, Chip, Box, Tooltip } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { DatasetTerm } from 'src/types/model'
import { AccessManagement, ExportableDatasets, SoApprovalModel } from 'src/types/library'
import DatasetExportButton from 'src/components/data_search/DatasetExportButton'
import RequestAccessButton from 'src/components/data_library/RequestAccessButton'
import { getAccessManagementColor, getAccessManagementLabel } from 'src/components/data_library/accessManagementDisplay'
import BoltIcon from '@mui/icons-material/Bolt'
import { validateHttpUrl } from 'src/utils/UrlUtils'
import { DATA_USE_GRID_COLUMN } from 'src/components/dataUseGridColumn'

const makeSoApprovalColumn = (soApprovalModelByDatasetId: Map<number, SoApprovalModel>): GridColDef<DatasetTerm> => ({
  field: 'soApprovalModel',
  headerName: 'SO Approval',
  // Wide enough for the full 'Pre-Authorized Researchers' chip, which truncates below ~240
  width: 250,
  sortable: false,
  renderCell: (params) => {
    const model = soApprovalModelByDatasetId.get(params.row.datasetId)
    // Blank beats a guess when the DAC's rules couldn't be loaded
    if (model === undefined || model === 'unknown') return null
    const isPerRequestApproval = model === 'per-request'
    const label = isPerRequestApproval ? 'Per-Request Approval' : 'Pre-Authorized Researchers'
    const tooltipTitle = isPerRequestApproval
      ? 'This dataset\'s DAC requires the Signing Official named in each Data Access Request to approve that specific request before the DAC reviews it.'
      : 'This dataset\'s DAC allows Signing Officials to pre-authorize researchers in advance, so approved researchers don\'t need separate per-request SO approval.'
    const colorSx = isPerRequestApproval
      ? { bgcolor: '#cfe2ff', color: '#084298' }
      : { bgcolor: '#d4edda', color: '#155724' }
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {/* describeChild keeps the chip label as the accessible name, not the tooltip text */}
        <Tooltip title={tooltipTitle} describeChild>
          <Chip label={label} size="small" sx={{ ...colorSx, fontWeight: 600 }} />
        </Tooltip>
      </Box>
    )
  },
})

/**
 * Column definitions for dataset view
 */
export const makeDatasetColumns = (
  exportableDatasets: ExportableDatasets = {},
  radarEnabledDatasetIds: Set<number> = new Set(),
  soApprovalModelByDatasetId?: Map<number, SoApprovalModel>,
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
      const label = getAccessManagementLabel(params.value)
      const color = getAccessManagementColor(params.value)
      const tooltipTitle = isRadarEnabled
        ? 'Automatic request approvals available for datasets clearly within the data use terms.'
        : ''
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          {/* describeChild keeps the access label as the accessible name, not the tooltip text */}
          <Tooltip title={tooltipTitle} describeChild>
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
    ...DATA_USE_GRID_COLUMN,
    width: 230,
  },
  {
    field: 'dac',
    headerName: 'DAC',
    width: 150,
    valueGetter: (_value, row) => row.dac?.dacName || '',
  },
  ...(soApprovalModelByDatasetId ? [makeSoApprovalColumn(soApprovalModelByDatasetId)] : []),
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
