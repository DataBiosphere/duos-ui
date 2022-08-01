import {includes, isEmpty, isNil, toLower} from 'lodash/fp';
import {formatDate} from '../../libs/utils';
import {h} from 'react-hyperscript-helpers';
import {styles} from './DarCollectionTable';
import Actions from './Actions';
import DarCollectionAdminReviewLink from './DarCollectionAdminReviewLink';
import {Link} from 'react-router-dom';
import { consoleTypes } from '../dar_table/DarTableActions';

export function projectTitleCellData({name = '- -', darCollectionId, label= 'project-title'}) {
  return {
    data: isEmpty(name) ? '- -' : name,
    id: darCollectionId,
    style : {
      color: '#354052',
      fontSize: styles.fontSize.projectTitle,
      paddingRight: '2%'
    },
    label
  };
}

export function darCodeCellData({darCode = '- -', darCollectionId, status, consoleType, label = 'dar-code'}) {
  let darCodeData;

  switch (consoleType) {
    case consoleTypes.CHAIR:
    case consoleTypes.MEMBER:
    case consoleTypes.SIGNING_OFFICIAL:
      darCodeData = dacLinkToCollection(darCode, status, darCollectionId);
      break;
    default :
      darCodeData = darCode;
  }

  return {
    data: darCodeData,
    value: darCode,
    id: darCollectionId,
    style: {
      color: styles.color.darCode,
      fontSize: styles.fontSize.darCode,
      fontWeight: '500'
    },
    label
  };
}

//Redirect for admin review page, only used in admin manage dar collections table
export function darCodeAdminCellData({darCode = '- -', darCollectionId, label = 'dar-code'}) {
  return {
    isComponent: true,
    data: h(DarCollectionAdminReviewLink, { darCollectionId, darCode }),
    label,
    id: darCollectionId,
    value: darCode
  };
}
const dacLinkToCollection = (darCode, status  = '', darCollectionId) => {
  const hasOpenElections = includes('open')(toLower(status));
  const path = hasOpenElections ?
    `/dar_collection/${darCollectionId}` :
    `/dar_vote_review/${darCollectionId}`;

  return h(Link, { to: path }, [darCode]);
};

export function submissionDateCellData({submissionDate, darCollectionId, label = 'submission-date'}) {
  const dateString = isNil(submissionDate) ? '- -' :
    toLower(submissionDate) === 'unsubmitted' ? '- -' : formatDate(submissionDate);
  return {
    data: dateString,
    id: darCollectionId,
    style: {
      color: '#354052',
      fontSize: styles.fontSize.submissionDate,
    },
    label,
  };
}

export function researcherCellData({researcherName = '- -', darCollectionId, label = 'researcher'}) {
  return {
    data: researcherName,
    id: darCollectionId,
    style: {
      color: '#354052',
      fontSize: styles.fontSize.researcher
    },
    label
  };
}

export function institutionCellData({institutionName = '- -', darCollectionId, label = 'institution'}) {
  return {
    data: institutionName,
    id: darCollectionId,
    style: {
      color: '#354052',
      fontSize: styles.fontSize.institution,
      paddingRight: '1%',
    },
    label,
  };
}

export function datasetCountCellData({datasetIds = [], darCollectionId, label = 'datasets'}) {
  return {
    data: datasetIds.length > 0 ? datasetIds.length : '- -',
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

export function consoleActionsCellData({collection, reviewCollection, goToVote, showConfirmationModal, consoleType, resumeCollection, actions}) {
  let actionComponent;

  actionComponent = h(Actions, {
    collection, consoleType,
    showConfirmationModal, goToVote,
    reviewCollection, resumeCollection,
    actions
  });

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
  researcherCellData,
  institutionCellData,
  datasetCountCellData,
  statusCellData,
  consoleActionsCellData,
  darCodeAdminCellData
};