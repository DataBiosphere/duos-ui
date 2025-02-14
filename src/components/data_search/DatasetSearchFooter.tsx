import * as _ from 'lodash';
import {Button} from '@mui/material';
import * as React from 'react';
import {DatasetTerm} from 'src/types/model';

interface DatasetSearchFooterProps {
  selectedDatasets: number[];
  datasets: DatasetTerm[];
  onClick: () => void;
}
export const DatasetSearchFooter = (props: DatasetSearchFooterProps) => {
  const { selectedDatasets, datasets, onClick } = props;
  const selectedStudies = _.uniq(
    _.filter(datasets, dataset => selectedDatasets.includes(dataset.datasetId))
      .map(dataset => dataset.study.studyId));
  const datasetText = selectedDatasets.length > 1 ? 'datasets' : 'dataset';
  const studyText = selectedStudies.length > 1 ? 'studies' : 'study';

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
    <div style={{paddingRight: 15}}>{selectedDatasets.length} {datasetText} selected from {selectedStudies.length} {studyText}</div>
    <Button
      variant='contained'
      onClick={onClick}
      sx={{fontSize: 14, height: 35, marginRight: 5}}
    >
            Apply for Access
    </Button>
  </div>;
};
