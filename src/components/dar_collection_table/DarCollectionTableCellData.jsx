import React from 'react';
import {includes, isEmpty, isNil, toLower, uniq} from 'lodash/fp';
import {formatDate} from '../../libs/utils';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import {styles} from './DarCollectionTable';
import Actions from './Actions';
import DarCollectionAdminReviewLink from './DarCollectionAdminReviewLink';
import {Link} from 'react-router-dom';

export const consoleTypes = {
  ADMIN: 'admin',
  MEMBER: 'member',
  MANAGE_ACCESS: 'manageAccess',
  CHAIR: 'chair',
  SIGNING_OFFICIAL: 'signingOfficial',
  RESEARCHER: 'researcher',
};

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

export function darCodeCellData({darCode = '- -', darCollectionId, collectionIsExpanded, updateCollectionIsExpanded, status, consoleType, label = 'dar-code'}) {
  let darCodeData;

  switch (consoleType) {
    case consoleTypes.ADMIN:
      darCodeData = <DarCollectionAdminReviewLink darCollectionId={darCollectionId} darCode={darCode} />;
      break;
    case consoleTypes.CHAIR:
    case consoleTypes.MEMBER:
    case consoleTypes.SIGNING_OFFICIAL:
      darCodeData = dacLinkToCollection(darCode, status, darCollectionId);
      break;
    default :
      darCodeData = darCode;
  }

  const ExpandComponent = collectionIsExpanded ? ExpandLess : ExpandMore;

  return {
    data: (
      <div style={{display: 'flex', alignItems: 'center'}}>
        {toLower(status) !== 'draft' && <ExpandComponent
          id={`${darCollectionId}_dropdown`}
          className={`sort-icon dar-expand-dropdown-arrow ${collectionIsExpanded ? 'sort-icon-up' : 'sort-icon-down'}`}
          onClick={() => {
            updateCollectionIsExpanded(!collectionIsExpanded);
          }}
        />}
        {darCodeData}
      </div>
    ),
    value: darCode,
    id: darCollectionId,
    style: {
      color: styles.color.darCode,
      fontSize: styles.fontSize.darCode,
      fontWeight: '500',
      overflowWrap: 'break-word'
    },
    label
  };
}

const dacLinkToCollection = (darCode, status  = '', darCollectionId) => {
  const hasOpenElections = includes('open')(toLower(status));
  const path = hasOpenElections ?
    `/dar_collection/${darCollectionId}` :
    `/dar_vote_review/${darCollectionId}`;

  return <Link to={path}>{darCode}</Link>;
};

export function DacCellData({dacNames, darCollectionId, label = 'dacNames'}) {
  const dacString = uniq(dacNames).join('\n');

  return {
    data: dacString,
    id: darCollectionId,
    style: {
      color: '#354052',
      fontSize: styles.fontSize.dacNames,
    },
    label
  };
}

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

export function datasetCountCellData({collection, darCollectionId, label = 'datasets'}) {
  return {
    data: collection.datasetCount || '- -',
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

export function consoleActionsCellData({collection, reviewCollection, goToVote, showConfirmationModal, consoleType, resumeCollection, actions, status}) {
  let actionComponent;

  actionComponent = <Actions
    collection={collection}
    consoleType={consoleType}
    showConfirmationModal={showConfirmationModal}
    goToVote={goToVote}
    reviewCollection={reviewCollection}
    resumeCollection={resumeCollection}
    actions={actions}
    status={status}
  />;

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
  DacCellData,
  darCodeCellData,
  submissionDateCellData,
  researcherCellData,
  institutionCellData,
  datasetCountCellData,
  statusCellData,
  consoleActionsCellData,
};