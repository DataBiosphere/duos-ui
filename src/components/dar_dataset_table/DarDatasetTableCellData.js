import {styles} from './DarDatasetTable';

export function dataUseGroupCellData({dataUseGroup, label= 'data-use'}) {
  return {
    data: dataUseGroup,
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

export function votesCellData({elections, votes, dataUseGroup, label= 'votes'}) {
  const dataAccess = elections?.find((election) => election.electionType === 'DataAccess');

  let status = dataAccess?.status || 'N/A';

  if (status === 'Closed') {
    status = votes?.finalVotes?.some((v) => v.vote === true) ? 'Approved' : 'Denied';
  }

  return {
    data: status,
    id: dataUseGroup,
    style : {
      color: '#354052',
      fontSize: styles.fontSize.votes,
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
  votesCellData,
  numberOfDatasetsCellData,
  datasetsCellData,
};
