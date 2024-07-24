import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton
} from '@mui/material';
import { isEmpty, isNil } from 'lodash/fp';
import { DataSet } from '../../libs/ajax/DataSet';
import { DAA } from '../../libs/ajax/DAA';
import { User } from '../../libs/ajax/User';
import { Storage } from '../../libs/storage';

const listStyle = {
  listStyle: 'none',
  padding: '0',
  fontSize:'1rem'
};

function FormattedDatasets({ datasets }) {
  return (
    <div style={{border: '0.5px solid #cccccc', borderRadius: '10px'}}>
      <ul key='dulUnorderedList' style={{...listStyle, border: '0.5px solid #cccccc', borderRadius: '10px', padding: '10px'}} id="txt_translatedRestrictions" className="row no-margin translated-restriction">
        {datasets.map((dataset) => (
          <li key={dataset.dataSetId} className="translated-restriction" style={{display: 'grid', gridTemplateColumns: '1fr 1fr'}}>
          <span style={{fontWeight: 'bold'}}>{dataset.datasetIdentifier}</span>
          <span style={{wordWrap: 'break-word'}}>
            {dataset.datasetName.length > 50 
              ? `${dataset.datasetName.substring(0, 50)}...` 
              : dataset.datasetName}
          </span>
        </li>
        ))}
      </ul>
    </div>
  );
}

export default function DatasetModal(props) {
  const { showModal, onCloseRequest, onApply, datasetIds } = props;

  const allDatasets = datasetIds.map((id) => parseInt(id.replace('dataset-', '')));
  console.log('allDatasets', allDatasets);

  const [datasets, setDatasets] = useState([]);
  const [user, setUser] = useState(null);
  const [libraryCard, setLibraryCard] = useState({});
  console.log('datasets',datasets);

  const closeHandler = () => {
    onCloseRequest();
  };

  const applyHandler = (filteredDatasets) => {
    // take the filteredDatasets and convert it to a list of strings with are prefaced with 'dataset-' and the datasetId
    const datasetStrings = filteredDatasets.map(dataset => `dataset-${dataset.dataSetId}`);
    onApply(datasetStrings);
  };

  const fetchAllDatasets = async (datasetIds) => {
    const filteredDatasetIds = datasetIds.filter((id) => !isNil(id) && Number.isInteger(id) && id > 0);
    if (isEmpty(filteredDatasetIds)) {
      return [];
    }
    return DataSet.getDatasetsByIds(filteredDatasetIds);
  };

  useEffect(() => {
    const getData = async () => {
      const user = Storage.getCurrentUser();
      setUser(user);
      console.log('user',Storage.getCurrentUser());
      const libraryCard = !isEmpty(user.libraryCards) ? user.libraryCards[0] : {};
      setLibraryCard(libraryCard);
      const fetchedDatasets = await fetchAllDatasets(allDatasets);
      console.log('fetchedDatasets',fetchedDatasets);
      const daas = await DAA.getDaas();
      console.log('daas', daas);

      const filteredDatasets = fetchedDatasets.filter((dataset) => {
        const datasetDacId = dataset.dacId;
        const daa = daas.find((daa) => daa.dacs?.some((d) => d.dacId === datasetDacId));
        console.log('daa',daa);
        if (libraryCard.daaIds.includes(daa?.daaId)) {
          return dataset;
        }
      });

      console.log('filteredDatasets', filteredDatasets);
      setDatasets(filteredDatasets);
    };

    getData();
  }, [datasetIds]);

  return (
    <Dialog
      open={showModal}
      onClose={closeHandler}
      aria-labelledby='Datasets available for Data Access Request'
      aria-describedby='Dialog Description'
      sx={{ transform: 'scale(1.2)'}}
      PaperProps={{
        style: {
          maxWidth: '500px',
          width: '100%'
        },
      }}
      fullWidth
    >
      <DialogTitle id='dialog-title'>
        <span style={{ fontFamily: 'Montserrat', fontWeight: 600, fontSize: '2.0rem', color:'#1E1E1E'}}>Datasets available for Data Access Request</span>
        {/* <IconButton
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
        </IconButton> */}
      </DialogTitle>
      <DialogContent id='dialog-content'>
        <div>
          <div style={{ fontFamily: 'Montserrat', fontSize: '1.2rem', paddingBottom: '15px'}}>Based on your credentials you can fill out a Data Access Request form for these dataset(s):</div>
          <FormattedDatasets datasets={datasets} />
        </div>
      </DialogContent>
      <DialogActions id='dialog-footer'>
        <Button onClick={closeHandler}>Cancel</Button>
        <Button onClick={() => applyHandler(datasets)} variant='contained' style={{borderRadius: '0'}}>Apply</Button>
      </DialogActions>
    </Dialog>
  );
}
