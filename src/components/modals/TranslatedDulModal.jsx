import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import isEmpty from 'lodash/fp/isEmpty';

const listStyle = {
  listStyle: 'none',
  padding: '0',
  fontSize:'1rem'
};

//NOTE: li partial can be used in components that only need the list
async function GenerateUseRestrictionStatements(dataUse) {
  if (!dataUse || isEmpty(dataUse)) {
    return (
      <li key="restriction-none" className="translated-restriction">
        None
      </li>
    );
  }

  return dataUse.map((restriction) => {
    return (
      <li key={`${restriction.code}-statement`} className="translated-restriction">
        <span style={{fontWeight: 'bold'}}>{restriction.code}: </span>
        {restriction.description}
      </li>
    );
  });
}

export default function TranslatedDulModal(props) {
  const { showModal, onCloseRequest, dataUse } = props;
  const [translatedDulList, setTranslatedDulList] = useState([]);

  const closeHandler = () => {
    onCloseRequest();
  };

  useEffect(() => {
    const getTranslatedDulList = async () => {
      const dulList = await GenerateUseRestrictionStatements(dataUse || []);
      setTranslatedDulList(dulList);
    };

    getTranslatedDulList();
  }, [dataUse]);

  return (
    <Dialog
      open={showModal}
      onClose={closeHandler}
      aria-labelledby='Data Use Terms'
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
          {translatedDulList}
        </ul>
      </DialogContent>
      <DialogActions id='dialog-footer'>
        <Button onClick={closeHandler} variant='outlined'>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
