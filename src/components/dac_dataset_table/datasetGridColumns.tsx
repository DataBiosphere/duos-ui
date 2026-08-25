import React from 'react'
import { GridColDef } from '@mui/x-data-grid'
import { DatasetTerm } from 'src/types/model'
import { DataSet } from 'src/libs/ajax/DataSet'
import { DATA_USE_GRID_COLUMN } from 'src/components/dataUseGridColumn'
import { Notifications } from 'src/libs/utils'
import { extractError } from 'src/utils/ErrorUtils'
import DACDatasetApprovalStatus from 'src/components/dac_dataset_table/DACDatasetApprovalStatus'
import { DACDatasetTableColumnOptions } from 'src/components/dac_dataset_table/DACDatasetConstants'

const downloadInstitutionalCertification = (dataset: DatasetTerm) => {
  DataSet.getNIHInstitutionalCertification(dataset.datasetId).catch((error: unknown) => {
    Notifications.showError({ text: `Error downloading the NIH Institutional Certification for ${dataset.datasetIdentifier}: ${extractError(error)}` })
  })
}

const dacDatasetGridColumns: Partial<Record<string, GridColDef<DatasetTerm>>> = {
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
    ...DATA_USE_GRID_COLUMN,
    flex: 1,
    // Matches the Data Library's fixed 230 for the same chip, which its longest
    // code sequences need before they ellipsize
    minWidth: 230,
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
              type="button"
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
