import {styles} from './DarDatasetTable';
import {filter, flatMap, flow, get, isEmpty, isUndefined, map, uniq} from 'lodash/fp';

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

export function votesCellData({elections, votes, dataUseGroup, label= 'votes'}) {
  let displayValue = '-/-';
  if (!isEmpty(elections)) {
    const datasetIds = flow(
      filter(e => e.electionType === 'DataAccess'),
      map(e => e.dataSetId),
      uniq
    )(elections);
    const memberVotes = flow(
      map(v => v.dataAccess),
      flatMap(v => v.memberVotes)
    )(votes);
    const voteValues = flow(
      filter(v => !isUndefined(v.vote)),
      map(v => get('vote')(v))
    )(memberVotes);
    const numerator = voteValues.length / datasetIds.length;
    const denominator = memberVotes.length / datasetIds.length;
    displayValue = numerator + '/' + denominator;
  }

  return {
    data: displayValue,
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
