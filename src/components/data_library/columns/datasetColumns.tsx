import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Link, Chip, Box, Tooltip } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { DatasetTerm } from 'src/types/model'
import { AccessManagement, ExportableDatasets, SoApprovalModel } from 'src/types/library'
import DatasetExportButton from 'src/components/data_search/DatasetExportButton'
import RequestAccessButton from 'src/components/data_library/RequestAccessButton'
import BoltIcon from '@mui/icons-material/Bolt'
import { validateHttpUrl } from 'src/utils/UrlUtils'
import { DataUseCode, processDataUseCodes } from 'src/utils/DataUseUtils'

/**
 * A dataset's data use codes as one hyphenated string (`HMB-GSO-PUB`): the
 * primary codes lead in the order the dataset declares them, then the secondary
 * conditions alphabetically. Uses `shortCode` so a DS primary reads as `DS`
 * rather than dragging its disease list into the middle of the sequence — the
 * full text stays in the tooltip.
 */
const orderDataUseCodes = (dataset: DatasetTerm): DataUseCode[] => {
  const terms = processDataUseCodes(dataset).codesAndDescriptions.filter(term => Boolean(term.shortCode))
  return [
    ...terms.filter(term => term.type === 'primary'),
    ...terms
      .filter(term => term.type === 'secondary')
      .sort((a, b) => a.shortCode.localeCompare(b.shortCode)),
  ]
}

// Codes alone are opaque; name the tier so a secondary condition isn't read as a primary use
const dataUseTooltip = ({ code, description, type }: DataUseCode): string => {
  const tier = type === 'primary' ? 'Primary' : 'Secondary'
  return description ? `${tier} — ${code}: ${description}` : `${tier} — ${code}`
}

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
    field: 'dataUse',
    headerName: 'Data Use',
    width: 230,
    // Keep the cell's value identical to what the chip shows, so the two cannot
    // disagree if the grid ever gains export or quick-filter.
    valueGetter: (_value, row) => orderDataUseCodes(row).map(term => term.shortCode).join('-'),
    renderCell: (params) => {
      const terms = orderDataUseCodes(params.row)
      if (terms.length === 0) return null

      return (
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', maxWidth: '100%' }}>
          {/* One chip, so the tier of each code lives in the tooltip rather than in chip styling */}
          <Tooltip
            title={(
              <Box component="ul" sx={{ m: 0, pl: 2 }}>
                {terms.map((term, index) => (
                  <li key={`${term.shortCode}-${index}`}>{dataUseTooltip(term)}</li>
                ))}
              </Box>
            )}
            describeChild
          >
            <Chip
              // Derived here rather than read from params.value so the cell renders
              // correctly on its own; valueGetter builds the identical string from the
              // same helper. Both passes are a map over a handful of codes.
              label={terms.map(term => term.shortCode).join('-')}
              size="small"
              variant="outlined"
              color="primary"
              // The tooltip is the only place the tier of each code and a DS primary's
              // disease list appear, so it has to be reachable without a pointer. An
              // unclickable Chip renders a plain div, which never receives focus.
              tabIndex={0}
              // A long sequence ellipsizes at the cell edge instead of overflowing it
              sx={{ maxWidth: '100%' }}
            />
          </Tooltip>
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
