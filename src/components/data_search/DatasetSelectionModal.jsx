import React, { useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';

const listStyle = {
  listStyle: 'none',
  padding: '0',
  fontSize:'1rem'
};

function FormattedDatasets({ datasets }) {
  return (
    <div style={{border: '0.5px solid #cccccc', borderRadius: '10px', overflow: 'auto', maxHeight: '150px'}}>
      <ul key='dulUnorderedList' style={{...listStyle, border: '0.5px solid #cccccc', borderRadius: '10px', padding: '10px'}} id="txt_translatedRestrictions" className="row no-margin translated-restriction">
        {datasets.map((dataset) => {
          const displayName = dataset.datasetName.length > 50
            ? `${dataset.datasetName.substring(0, 50)}...`
            : dataset.datasetName;
          return <li key={dataset.dataSetId} className="translated-restriction"
            style={{display: 'grid', gridTemplateColumns: '1fr 3.5fr'}}>
            <span style={{fontWeight: 'bold'}}>{dataset.datasetIdentifier}</span>
            <span style={{wordWrap: 'break-word'}}>{displayName}</span>
          </li>;
        })}
      </ul>
    </div>
  );
}

export default function DatasetSelectionModal(props) {
  const { showModal, onCloseRequest, onApply, allowableTermSelections, openTermSelections, externalTermSelections, unselectableTermSelections } = props;

  useEffect(() => {
    // console.log('allowableTermSelections:', allowableTermSelections);
    // console.log('openTermSelections:', openTermSelections);
    // console.log('externalTermSelections:', externalTermSelections);
    // console.log('unselectableTermSelections:', unselectableTermSelections);
  }, [allowableTermSelections, openTermSelections, unselectableTermSelections]);

  const closeHandler = () => {
    onCloseRequest();
  };

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
      </DialogTitle>
      <DialogContent id='dialog-content'>
        {(allowableTermSelections.length > 0) &&
          <div>
            <div style={{fontFamily: 'Montserrat', fontSize: '1.2rem', paddingBottom: '15px'}}>Based on your credentials
              you can fill out a Data Access Request form for these dataset(s):
            </div>
            <FormattedDatasets datasets={allowableTermSelections}/>
          </div>
        }
        {(unselectableTermSelections.length > 0) &&
          <div>
            <div style={{fontFamily: 'Montserrat', fontSize: '1.2rem', paddingBottom: '15px'}}>The requested datasets
              require that your Signing Official issues you a Library Card before proceeding.
            </div>
            <FormattedDatasets datasets={unselectableTermSelections}/>
          </div>
        }
        {(openTermSelections.length > 0) &&
          <div>
            <div style={{fontFamily: 'Montserrat', fontSize: '1.2rem', paddingBottom: '15px'}}>The following datasets
              are Open Access and do not require a Data Access Request.
            </div>
            <FormattedDatasets datasets={openTermSelections}/>
          </div>
        }
        {(externalTermSelections.length > 0) &&
          <div>
            <div style={{fontFamily: 'Montserrat', fontSize: '1.2rem', paddingBottom: '15px'}}>The following datasets
              are External Access and do not require a Data Access Request.
            </div>
            <FormattedDatasets datasets={externalTermSelections}/>
          </div>
        }
      </DialogContent>
      <DialogActions id="dialog-footer">
        <Button onClick={closeHandler} style={{fontSize: '1.1rem'}}>Cancel</Button>
        {(allowableTermSelections.length > 0) &&
          <Button onClick={() => onApply()} variant="contained" style={{fontSize: '1.1rem'}}>Apply</Button>}
      </DialogActions>
    </Dialog>
  );
}
