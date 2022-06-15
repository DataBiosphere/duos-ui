import {includes, isEmpty, isNil, toLower} from 'lodash/fp';
import {formatDate} from '../../libs/utils';
import {h} from 'react-hyperscript-helpers';
import {styles} from './DarCollectionTable';
import AdminActions from './AdminActions';
import ChairActions from './ChairActions';
import MemberActions from './MemberActions';
import ResearcherActions from './ResearcherActions';
import DarCollectionAdminReviewLink from './DarCollectionAdminReviewLink';
import {Link} from 'react-router-dom';
import { consoleTypes } from '../dar_table/DarTableActions';

export function projectTitleCellData({projectTitle = '- -', darCollectionId, label= 'project-title'}) {
  return {
    data: isEmpty(projectTitle) ? '- -' : projectTitle,
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

export function submissionDateCellData({createDate, darCollectionId, label = 'submission-date'}) {
  const dateString = isNil(createDate) ? '- -' :
    toLower(createDate) === 'unsubmitted' ? '- -' : formatDate(createDate);
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

export function datasetCountCellData({datasets = [], darCollectionId, label = 'datasets'}) {
  return {
    data: datasets.length > 0 ? datasets.length : '- -',
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

export function consoleActionsCellData({collection, reviewCollection, goToVote, showConfirmationModal, consoleType, relevantDatasets, resumeCollection}) {
  let actionComponent;

  switch (consoleType) {
    case consoleTypes.ADMIN:
      actionComponent = h(AdminActions, {collection, showConfirmationModal});
      break;
    case consoleTypes.CHAIR:
      actionComponent = h(ChairActions, {collection, showConfirmationModal, goToVote, relevantDatasets});
      break;
    case consoleTypes.MEMBER:
      actionComponent = h(MemberActions, {collection, showConfirmationModal, goToVote});
      break;
    case consoleTypes.RESEARCHER:
    default:
      actionComponent = h(ResearcherActions, {collection, showConfirmationModal, reviewCollection, resumeCollection});
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
  consoleActionsCellData,
  darCodeAdminCellData
};