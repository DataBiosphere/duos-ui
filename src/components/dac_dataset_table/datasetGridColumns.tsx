import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Box, Chip, Tooltip } from '@mui/material'
import { DatasetTerm } from 'src/types/model'
import { DataSet } from 'src/libs/ajax/DataSet'
import { processDataUseCodes } from 'src/utils/DataUseUtils'
import DACDatasetApprovalStatus from 'src/components/dac_dataset_table/DACDatasetApprovalStatus'
import { DACDatasetTableColumnOptions } from 'src/components/dac_dataset_table/DACDatasetConstants'

const dacDatasetGridColumns: Record<string, GridColDef<DatasetTerm>> = {
  [DACDatasetTableColumnOptions.DUOS_ID]: {
    field: 'datasetIdentifier',
    headerName: 'DUOS ID',
    flex: 0.7,
    minWidth: 110,
  },
  [DACDatasetTableColumnOptions.PHS_ID]: {
    field: 'phsId',
    headerName: 'PHS ID',
    flex: 0.7,
    minWidth: 110,
    valueGetter: (_value, row) => row.study?.phsId ?? '',
  },
  [DACDatasetTableColumnOptions.DATASET_NAME]: {
    field: 'datasetName',
    headerName: 'Dataset Name',
    flex: 1.5,
    minWidth: 200,
  },
  [DACDatasetTableColumnOptions.STUDY_NAME]: {
    field: 'studyName',
    headerName: 'Study Name',
    flex: 1.2,
    minWidth: 180,
    valueGetter: (_value, row) => row.study?.studyName ?? '',
  },
  [DACDatasetTableColumnOptions.DATA_SUBMITTER]: {
    field: 'dataSubmitter',
    headerName: 'Data Submitter',
    flex: 1,
    minWidth: 160,
    valueGetter: (_value, row) => row.submitter?.displayName ?? '',
  },
  [DACDatasetTableColumnOptions.DATA_CUSTODIAN]: {
    field: 'dataCustodian',
    headerName: 'Data Custodian',
    flex: 1,
    minWidth: 160,
    valueGetter: (_value, row) => row.study?.dataCustodianEmail?.join(', ') ?? '',
  },
  [DACDatasetTableColumnOptions.DATA_USE]: {
    field: 'dataUse',
    headerName: 'Data Use',
    flex: 1,
    minWidth: 160,
    sortable: false,
    renderCell: (params) => {
      const { codesAndDescriptions } = processDataUseCodes(params.row)
      if (codesAndDescriptions.length === 0) return null
      const visible = codesAndDescriptions.slice(0, 2)
      const overflow = codesAndDescriptions.slice(2)
      return (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', height: '100%' }}>
          {visible.map(du => (
            <Tooltip key={du.code} title={du.description}>
              <Chip label={du.code} size="small" variant="outlined" />
            </Tooltip>
          ))}
          {overflow.length > 0 && (
            <Tooltip title={overflow.map(du => `${du.code}: ${du.description}`).join(', ')}>
              <Chip label={`+${overflow.length}`} size="small" variant="outlined" />
            </Tooltip>
          )}
        </Box>
      )
    },
  },
  [DACDatasetTableColumnOptions.CERTIFICATION_LINK]: {
    field: 'hasInstitutionCertification',
    headerName: 'NIH Institutional Certification',
    flex: 1,
    minWidth: 160,
    sortable: false,
    renderCell: params => (
      params.row.hasInstitutionCertification
        ? (
            <button
              onClick={() => { DataSet.getNIHInstitutionalCertification(params.row.datasetId) }}
              className="button button-white"
              style={{ padding: '10px 12px' }}
            >
              <span className="glyphicon glyphicon-download-alt" />
            </button>
          )
        : null
    ),
  },
  [DACDatasetTableColumnOptions.STATUS]: {
    field: 'dacApproval',
    headerName: 'Status',
    flex: 1,
    minWidth: 180,
    sortable: false,
    renderCell: params => <DACDatasetApprovalStatus dataset={params.row} />,
  },
}

export const defaultDACDatasetGridColumnKeys = Object.keys(dacDatasetGridColumns)

export const makeDACDatasetGridColumns = (columnKeys: string[] = defaultDACDatasetGridColumnKeys): GridColDef<DatasetTerm>[] =>
  columnKeys.map(key => dacDatasetGridColumns[key])
