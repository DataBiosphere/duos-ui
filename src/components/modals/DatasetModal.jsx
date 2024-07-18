import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { isEmpty, isNil } from 'lodash/fp';
import { DataSet } from '../../libs/ajax/DataSet';

const listStyle = {
  listStyle: 'none',
  padding: '0',
  fontSize:'1rem'
};

async function FormattedDatasets(datasets) {

  return datasets.map((dataset) => {
    return (
      <li key={dataset.dataSetId} className="translated-restriction">
        <span style={{fontWeight: 'bold'}}>{dataset.datasetName}: </span>
        {dataset.datasetName}
      </li>
    );
  });
}

export default function DatasetModal(props) {
  const { showModal, onCloseRequest, datasetIds } = props;
  const allDatasets = datasetIds.map((id) => parseInt(id.replace('dataset-', '')));
  const [formattedDatasets, setFormattedDatasets] = useState([]);
  const [datasets, setDatasets] = useState([]);

  

  const closeHandler = () => {
    onCloseRequest();
  };

  const fetchAllDatasets = async (datasets) => {
    const filteredDatasetIds = datasets.filter((id) => !isNil(id) && Number.isInteger(id) && id > 0);
    if (isEmpty(filteredDatasetIds)) {
      return [];
    }
    // filter just for safety
    return DataSet.getDatasetsByIds(filteredDatasetIds);
  };

  useEffect(() => {
    console.log('allDatasets', allDatasets);
    fetchAllDatasets(datasetIds).then((datasets) => {
      setDatasets(datasets);
    });
    const getFormattedDatasets = async () => {
      const datasetList = await FormattedDatasets(allDatasets);
      setFormattedDatasets(datasetList);
    };

    getFormattedDatasets();
  }, [datasets]);

  return (
    <Dialog
      open={showModal}
      onClose={closeHandler}
      aria-labelledby='Datasets available for Data Access Request'
      aria-describedby='Dialog Description'
      sx={{ transform: 'scale(1.5)' }}
    >
      <DialogTitle id='dialog-title'>
        <span style={{ color: '#1976d2' }}>Data Use Terms</span>
        <IconButton
          aria-label="close"
          onClick={closeHandler}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent id='dialog-content'>
        <ul key='dulUnorderedList' style={listStyle} id="txt_translatedRestrictions" className="row no-margin translated-restriction">
          {formattedDatasets}
        </ul>
      </DialogContent>
      <DialogActions id='dialog-footer'>
        <Button onClick={closeHandler} variant='outlined'>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
