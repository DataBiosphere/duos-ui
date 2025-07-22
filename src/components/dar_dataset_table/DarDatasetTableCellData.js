import {styles} from '../../utils/darDatasetUtils';

export function dataUseGroupCellData({dataUseGroup, label= 'data-use'}) {
  return {
    data: label,
    id: dataUseGroup,
    style : {
      color: '#354052',
      fontSize: styles.fontSize.dataUseGroup,
      fontWeight: 'bold',
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
      fontWeight: 'bold',
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
  numberOfDatasetsCellData,
  datasetsCellData,
};
