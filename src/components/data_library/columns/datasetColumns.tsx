import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Link, Chip, Box, Tooltip } from '@mui/material'
import { DatasetTerm, getAccessManagementSummary } from 'src/types/model'
import { AccessManagement, ExportableDatasets } from 'src/types/library'
import DatasetExportButton from 'src/components/data_search/DatasetExportButton'
import BoltIcon from '@mui/icons-material/Bolt'
import { Link as RouterLink } from 'react-router-dom'

/**
 * Column definitions for dataset view
 */
export const makeDatasetColumns = (
  exportableDatasets: ExportableDatasets = {},
  radarEnabledDatasetIds: Set<number> = new Set(),
  selectedMenuTab?: number,
): GridColDef<DatasetTerm>[] => [
  {
    field: 'datasetName',
    headerName: 'Dataset Name',
    flex: 1.5,
    minWidth: 200,
    renderCell: params => (
      <Link component={RouterLink} to={`/dataset/${params.row.datasetIdentifier}`} state={{ selectedMenuTab }} underline="hover">
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
      <Link component={RouterLink} to={`/studies/${params.row.study?.studyId}`} state={{ selectedMenuTab }} underline="hover">
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
      const summary = getAccessManagementSummary(params.value)
      const isRadarEnabled = radarEnabledDatasetIds.has(params.row.datasetId)
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
          <Tooltip title={summary.description}>
            <Chip
              label={(
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {summary.name}
                  {isRadarEnabled && (
                    <Tooltip title="Automatic request approvals available for datasets clearly within the data use terms.">
                      <BoltIcon sx={{ color: 'gold' }} />
                    </Tooltip>
                  )}
                </Box>
              )}
              size="small"
              color={
                (() => {
                  switch (params.value) {
                    case AccessManagement.CONTROLLED:
                      return 'primary'
                    case AccessManagement.OPEN:
                      return 'success'
                    case AccessManagement.EXTERNAL:
                      return 'secondary'
                    default:
                      return 'default'
                  }
                })()
              }
            />
          </Tooltip>
        </Box>
      )
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
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {codes.slice(0, 2).map((code, idx) => (
            <Chip key={idx} label={code} size="small" variant="outlined" />
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
          {exportableSnapshots.map((snapshot, i) => (
            <DatasetExportButton
              key={i}
              snapshot={snapshot}
              title={`Export snapshot ${snapshot.name}`}
            />
          ))}
        </Box>
      )
    },
  },
]
