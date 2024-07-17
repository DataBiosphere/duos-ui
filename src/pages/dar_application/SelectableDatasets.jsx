import React, {useState} from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import ReactTooltip from 'react-tooltip';
import RestoreFromTrashIcon from '@mui/icons-material/RestoreFromTrash';

export default function SelectableDatasets(props) {
  const {datasets, setSelectedDatasets} = props;
  const [removedIds, setRemovedIds] = useState([]);

  const updateLocalState = (ds) => {
    if (removedIds.includes(ds.dataSetId)) {
      setRemovedIds(removedIds.toSpliced(removedIds.indexOf(ds.dataSetId), 1));
    } else {
      setRemovedIds(removedIds.concat(ds.dataSetId));
    }
    const newSelectedDatasets = datasets.filter(ds => !removedIds.includes(ds.dataSetId));
    // Populate parent state with the current state of datasets to be saved to the DAR
    setSelectedDatasets(newSelectedDatasets);
  };

  const deletableStyled = (ds, isLastDeletable) => {
    return <div
      key={'selectable_dataset_' + ds.dataSetId}
      id={ds.datasetIdentifier + '_summary'}
      className="collaborator-summary-card"
      style={{cursor: 'pointer'}}
      onClick={() => updateLocalState(ds)}>
      <div id={ds.datasetIdentifier + '_name'}
        style={{display: 'flex', alignItems: 'center', flex: '1 1 100%', marginRight: '1.5rem'}}>
        <div style={{fontWeight: 'bold', marginRight: '0.5rem'}}>{ds.datasetIdentifier}</div>
        <div>|</div>
        <div style={{marginLeft: '0.5rem'}}>{ds.datasetName}</div>
      </div>
      <a id={'remove_dataset_' + ds.dataSetId} style={{marginLeft: 10}}>
        <>
          <DeleteIcon
            data-tip="Delete dataset"
            data-for={removedIds.length === (datasets.length - 1) && !removedIds.includes(ds.dataSetId) ? 'tip_last' : ''}
            style={{
              color: '#0948B7',
              fontSize: '2.3rem',
              verticalAlign: 'middle',
              opacity: removedIds.length === (datasets.length - 1) && !removedIds.includes(ds.dataSetId) ? 0.5 : 1
            }}
          />
          {isLastDeletable &&
            <ReactTooltip id="tip_last" place="right" effect="solid">
              The last dataset can not be deleted
            </ReactTooltip>}
        </>
        <span style={{marginLeft: '1rem'}}></span>
      </a>
    </div>;
  };

  const unDeletableStyled = (ds) => {
    return <div
      key={'selectable_dataset_' + ds.dataSetId}
      id={ds.datasetIdentifier + '_summary'}
      className="collaborator-summary-card"
      style={{cursor: 'pointer', backgroundColor: 'lightgray', opacity: .5}}
      onClick={() => updateLocalState(ds)}>
      <div id={ds.datasetIdentifier + '_name'}
        style={{display: 'flex', alignItems: 'center', flex: '1 1 100%', marginRight: '1.5rem'}}>
        <div style={{fontWeight: 'bold', marginRight: '0.5rem'}}>{ds.datasetIdentifier}</div>
        <div>|</div>
        <div style={{marginLeft: '0.5rem'}}>{ds.datasetName}</div>
      </div>
      <a id={'restore_dataset_' + ds.dataSetId} style={{marginLeft: 10}}>
        <RestoreFromTrashIcon style={{color: '#0948B7', fontSize: '2.3rem', verticalAlign: 'middle'}}/>
        <span style={{marginLeft: '1rem'}}></span>
      </a>
    </div>;
  };

  const datasetList = () => {
    return datasets.map((ds) => {
      const toBeRemoved = removedIds.includes(ds.dataSetId);
      const isLastDeletable = toBeRemoved.length === (datasets.length - 1);
      return removedIds.includes(ds.dataSetId) ?
        unDeletableStyled(ds) :
        deletableStyled(ds, isLastDeletable);
    });

  };

  return (
    <div>
      {datasetList()}
    </div>
  );

}
