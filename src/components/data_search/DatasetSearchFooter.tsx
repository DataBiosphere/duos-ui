import * as _ from 'lodash';
import {Button} from '@mui/material';
import * as React from 'react';
import {Dataset} from 'src/types/model';

interface DatasetSearchFooterProps {
  selectedDatasets: number[];
  datasets: Dataset[];
  onClick: () => void;
}
export const DatasetSearchFooter = (props: DatasetSearchFooterProps) => {
  const { selectedDatasets, datasets, onClick } = props;
  const selectedStudies = _.uniq(
    _.filter(datasets, dataset => selectedDatasets.includes(dataset.datasetId))
      .map(dataset => dataset.study.studyId));
  return <div style={{
    position: 'fixed',
    bottom: 0,
    zIndex: 999,
    width: '100vw',
    height: 60,
    display: 'flex',
    justifyContent: 'flex-end',
    backgroundColor: 'white',
    border: '1px solid #DEDEDE',
    alignItems: 'center'
  }}>
    {selectedDatasets.length > 1 && selectedStudies.length > 1 && (<div style={{paddingRight: 15}}> {selectedDatasets.length} Datasets selected from {selectedStudies.length} Studies </div>)}
    {selectedDatasets.length > 1 && selectedStudies.length === 1 && (<div style={{paddingRight: 15}}> {selectedDatasets.length} Datasets selected from 1 Study </div>)}
    {selectedDatasets.length === 1 && (<div style={{paddingRight: 15}}> 1 Dataset selected from 1 Study </div>)}
    <Button
      variant='contained'
      onClick={onClick}
      sx={{fontSize: 14, height: 35, marginRight: 5}}
    >
            Apply for Access
    </Button>
  </div>;
};
