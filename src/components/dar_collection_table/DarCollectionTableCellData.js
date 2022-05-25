import {isEmpty, isNil} from 'lodash/fp';
import {formatDate} from '../../libs/utils';
import {h} from 'react-hyperscript-helpers';
import {styles} from './DarCollectionTable';
import AdminActions from './AdminActions';
import ChairActions from './ChairActions';
import MemberActions from './MemberActions';
import ResearcherActions from './ResearcherActions';

export function projectTitleCellData({projectTitle = '- -', darCollectionId, label = 'project-title'}) {
  return {
    data: projectTitle,
    id: darCollectionId,
    style : {
      color: '#354052',
      fontSize: styles.fontSize.projectTitle,
      paddingRight: '2%'
    },
    label
  };
}

export function darCodeCellData({darCode = '- -', darCollectionId, label = 'dar-code'}) {
  return {
    data: darCode,
    id: darCollectionId,
    style: {
      color: styles.color.darCode,
      fontSize: styles.fontSize.darCode,
      fontWeight: '500'
    },
    label
  };
}

export function submissionDateCellData({createDate, darCollectionId, label = 'submission-date'}) {
  return {
    data: isNil(createDate) ? '- - ' : formatDate(createDate),
    id: darCollectionId,
    style: {
      color: '#354052',
      fontSize: styles.fontSize.submissionDate,
    },
    label,
  };
}

export function piCellData({piName, darCollectionId, label = 'pi'}) {
  return {
    data: !isEmpty(piName) ? piName : '- -',
    id: darCollectionId,
    style: {
      color: '#354052',
      fontSize: styles.fontSize.pi
    },
    label
  };
}

export function institutionCellData({institution = '- -', darCollectionId, label = 'institution'}) {
  return {
    data: institution,
    id: darCollectionId,
    style: {
      color: '#354052',
      fontSize: styles.fontSize.institution,
      paddingRight: '1%',
    },
    label,
  };
}

export function datasetCountCellData({datasets = '- -', darCollectionId, label = 'datasets'}) {
  return {
    data: datasets.length,
    id: darCollectionId,
    style: {
      color: '#333F52',
      fontSize: styles.fontSize.datasetCount,
      fontWeight: 600,
    },
    label
  };
}

export function statusCellData({status = '- -', darCollectionId, label = 'status'}) {
  return {
    data: status,
    id: darCollectionId,
    style: {
      color: '#333F52',
      fontWeight: 600,
      fontSize: styles.fontSize.status
    },
    label
  };
}

export function consoleActionsCellData({collection, openCollection, reviewCollection, goToVote, showConfirmationModal, consoleType, relevantDatasets}) {
  let actionComponent;

  switch (consoleType) {
    case 'admin':
      actionComponent = h(AdminActions, {collection, showConfirmationModal});
      break;
    case 'chairperson':
      actionComponent = h(ChairActions, {collection, showConfirmationModal, goToVote, relevantDatasets});
      break;
    case 'member':
      actionComponent = h(MemberActions, {collection, openCollection, showConfirmationModal, goToVote});
      break;
    case 'researcher':
    default:
      actionComponent = h(ResearcherActions, {collection, openCollection, showConfirmationModal, reviewCollection});
      break;
  }

  return {
    isComponent: true,
    id: collection.darCollectionId,
    style: {
      color: styles.color.actions,
      fontSize: styles.fontSize.actions
    },
    label: 'table-actions',
    data: actionComponent
  };
}

export default {
  projectTitleCellData,
  darCodeCellData,
  submissionDateCellData,
  piCellData,
  institutionCellData,
  datasetCountCellData,
  statusCellData,
  consoleActionsCellData
};