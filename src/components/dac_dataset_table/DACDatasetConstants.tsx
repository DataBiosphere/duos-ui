export const styles = {
  cellWidths: {
    // Only the Data Use width survives: it is the default cell width for dataUseCellData, which
    // the Dataset Search table still renders through SimpleTable.
    dataUse: '10%',
  },
}

export const DACDatasetTableColumnOptions = {
  DUOS_ID: 'duosId',
  CERTIFICATION_LINK: 'certificationLink',
  PHS_ID: 'phsId',
  DATASET_NAME: 'datasetName',
  STUDY_NAME: 'studyName',
  DATA_SUBMITTER: 'dataSubmitter',
  DATA_CUSTODIAN: 'dataCustodian',
  DATA_USE: 'dataUse',
  STATUS: 'status',
}
