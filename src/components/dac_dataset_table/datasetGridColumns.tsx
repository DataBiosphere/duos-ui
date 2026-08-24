import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { Box, Chip, Tooltip } from '@mui/material'
import { DatasetTerm } from 'src/types/model'
import { DataSet } from 'src/libs/ajax/DataSet'
import { processDataUseCodes } from 'src/utils/DataUseUtils'
import { Notifications } from 'src/libs/utils'
import DACDatasetApprovalStatus from 'src/components/dac_dataset_table/DACDatasetApprovalStatus'
import { DACDatasetTableColumnOptions } from 'src/components/dac_dataset_table/DACDatasetConstants'

const downloadInstitutionalCertification = (dataset: DatasetTerm) => {
  DataSet.getNIHInstitutionalCertification(dataset.datasetId).catch(() => {
    Notifications.showError({ text: `Error downloading the NIH Institutional Certification for ${dataset.datasetIdentifier}` })
  })
}

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
    // Wide enough for two `DS (disease)` chips, which processDataUseCodes can make long
    minWidth: 220,
    sortable: false,
    // Without this the raw dataUse object is the cell value, so filtering matches '[object Object]'
    valueGetter: (_value, row) => processDataUseCodes(row).codeList.join(', '),
    renderCell: (params) => {
      const { codesAndDescriptions } = processDataUseCodes(params.row)
      if (codesAndDescriptions.length === 0) return null
      const visible = codesAndDescriptions.slice(0, 2)
      const overflow = codesAndDescriptions.slice(2)
      return (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center', height: '100%' }}>
          {/* Codes are not unique — primary and secondary can carry the same one — so index the key */}
          {visible.map((du, index) => (
            <Tooltip key={`${du.code}-${index}`} title={du.description}>
              {/* processDataUseCodes expands DS into `DS (disease)`, so cap the chip and let it
                  ellipsize rather than overflow the cell's hidden overflow */}
              <Chip label={du.code} size="small" variant="outlined" sx={{ maxWidth: 96 }} />
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
    // The grid truncates long headers instead of wrapping them, so surface the full text on hover
    description: 'NIH Institutional Certification',
    flex: 1,
    minWidth: 160,
    renderCell: params => (
      params.row.hasInstitutionCertification
        ? (
            <button
              onClick={() => downloadInstitutionalCertification(params.row)}
              className="button button-white"
              style={{ padding: '10px 12px' }}
              aria-label={`Download the NIH Institutional Certification for ${params.row.datasetIdentifier}`}
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
    // The undecided state's compact APPROVE + REJECT measure ~149px (Montserrat 500 at 12px,
    // 6px padding, 1px borders, 8px gap) and the cell adds 10px of padding a side.
    minWidth: 180,
    sortable: false,
    // Without this the cell stays in text mode and the button row top-aligns on a 51px line box
    display: 'flex',
    renderCell: params => <DACDatasetApprovalStatus dataset={params.row} />,
  },
}

export const defaultDACDatasetGridColumnKeys = Object.keys(dacDatasetGridColumns)

export const makeDACDatasetGridColumns = (columnKeys: string[] = defaultDACDatasetGridColumnKeys): GridColDef<DatasetTerm>[] =>
  // Drop unrecognized keys: an undefined entry crashes the DataGrid
  columnKeys.map(key => dacDatasetGridColumns[key]).filter(col => col !== undefined)
