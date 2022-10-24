import {styles} from './DarDatasetTable';

export function dataUseGroupCellData({dataUseGroup, label= 'data-use'}) {
  return {
    data: dataUseGroup,
    id: dataUseGroup,
    style : {
      color: '#354052',
      fontSize: styles.fontSize.dataUseGroup,
      paddingRight: '2%'
    },
    label
  };
}

export function votesCellData({votes, dataUseGroup, label= 'votes'}) {
  console.log(votes);
  return {
    data: '',
    id: dataUseGroup,
    style : {
      color: '#354052',
      fontSize: styles.fontSize.votes,
      paddingRight: '2%'
    },
    label
  };
}

export function numberOfDatasetsCellData({datasets = [], dataUseGroup, label= 'number-of-datasets'}) {
  return {
    data: `${datasets.length}`,
    id: dataUseGroup,
    style : {
      color: '#354052',
      fontSize: styles.fontSize.numberOfDatasets,
      paddingRight: '2%'
    },
    label
  };
}

export function datasetsCellData({datasets = [], dataUseGroup, label= 'datasets'}) {
  return {
    data: `${datasets.map((ds) => ds.datasetIdentifier).join(', ')}`,
    id: dataUseGroup,
    style : {
      color: '#354052',
      fontSize: styles.fontSize.datasets,
      paddingRight: '2%'
    },
    label
  };
}

export default {
  dataUseGroupCellData,
  votesCellData,
  numberOfDatasetsCellData,
  datasetsCellData,
};
