import {styles} from './DarDatasetTable';

export function dataUseGroupCellData({dataUseGroup, label= 'data-use'}) {
  return {
    data: '',
    id: dataUseGroup,
    style : {
      color: '#354052',
      fontSize: styles.fontSize.dataUseGroup,
      paddingRight: '2%'
    },
    label
  };
}

export function votes({dataUseGroup, label= 'votes'}) {
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

export function votes({numberOfDatasets = 0, label= 'votes'}) {
  return {
    data: `${numberOfDatasets}`,
    id: dataUseGroup,
    style : {
      color: '#354052',
      fontSize: styles.fontSize.votes,
      paddingRight: '2%'
    },
    label
  };
}

/*
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
    case consoleTypes.CHAIR:
    case consoleTypes.MEMBER:
    case consoleTypes.SIGNING_OFFICIAL:
      darCodeData = dacLinkToCollection(darCode, status, darCollectionId);
      break;
    default :
      darCodeData = darCode;
  }

  return {
    data: div({}, [
      h((collectionIsExpanded ? ArrowDropUp : ArrowDropDown), {
        id: `${darCollectionId}_dropdown`,
        className: `sort-icon dar-expand-dropdown-arrow ${collectionIsExpanded ? 'sort-icon-up' : 'sort-icon-down'}`,
        onClick: () => {
          updateCollectionIsExpanded(!collectionIsExpanded);
        },
      }),
      darCodeData,
    ]),
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
*/