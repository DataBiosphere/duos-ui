import React from 'react';
import TableIconButton from '../TableIconButton';
import { Styles, Theme } from '../../libs/theme';
import { Block, Delete } from '@mui/icons-material';
import SimpleButton from '../SimpleButton';
import { useHistory } from 'react-router-dom';
import { Notifications } from '../../libs/utils';
import { includes, toLower } from 'lodash/fp';

const duosBlue = '#0948B7';
const cancelGray = '#333F52';

const hoverCancelButtonStyle = Styles.TABLE.TABLE_BUTTON_ICON_HOVER;
const baseCancelButtonStyle = Object.assign(
  {},
  Styles.TABLE.TABLE_ICON_BUTTON,
  {color: cancelGray},
  { alignItems: 'center' },
  { marginRight: '5px' }
);

const hoverPrimaryButtonStyle = {
  backgroundColor: 'rgb(38 138 204)',
  color: 'white'
};

//redirect function on researcher collections to view the collection's initial DAR application
const redirectToDARApplication = (darCollectionId, history) => {
  try {
    history.push(`/dar_application_review/${darCollectionId}`);
  } catch (error) {
    Notifications.showError({
      text: 'Error: Cannot view target Data Access Request'
    });
  }
};

//redirect function on DAR draft to resume DAR application
const resumeDARApplication = (referenceId, history) => {
  history.push(`/dar_application/${referenceId}`);
};

export default function Actions(props) {
  const { showConfirmationModal, collection, goToVote, consoleType, actions = [], status } = props;
  const collectionId = collection.darCollectionId;
  const uniqueId = (collectionId ? collectionId : collection.referenceIds[0]);

  const history = useHistory();

  const openButtonAttributes = {
    keyProp: `${consoleType}-open-${uniqueId}`,
    label: includes(toLower(status), ['complete', 'canceled']) ? 'Re-Open' : 'Open',
    onClick: () => showConfirmationModal(collection, 'open'),
    baseColor: duosBlue,
    hoverStyle: {
      backgroundColor: duosBlue,
      color: 'white'
    },
    additionalStyle: {
      padding: '3% 7%',
      fontSize: '1.45rem',
      fontWeight: 600,
      color: 'white',
      marginRight: 5
    }
  };

  const cancelButtonAttributes = {
    keyProp: `${consoleType}-cancel-${uniqueId}`,
    onClick: () => showConfirmationModal(collection, 'cancel'),
    style: baseCancelButtonStyle,
    hoverStyle: hoverCancelButtonStyle,
    dataTip: `Cancel ${consoleType === 'researcher' ? 'Collection' : 'Elections'}`,
    icon: Block,
  };

  const voteButtonAttributes = {
    keyProp: `${consoleType}-vote-${uniqueId}`,
    label: 'Vote',
    onClick: () => goToVote(collectionId),
    baseColor: duosBlue,
    hoverStyle: {
      backgroundColor: duosBlue,
      color: 'white',
    },
    additionalStyle: {
      padding: '3% 7%',
      fontSize: '1.45rem',
      fontWeight: 600,
      color: 'white',
      marginRight: 5,
      border: `1px ${duosBlue} solid`,
    },
  };

  const updateButtonAttributes = {
    keyProp: `${consoleType}-update-${collectionId}`,
    label: 'Update',
    onClick: () => goToVote(collectionId),
    baseColor: 'white',
    hoverStyle: {
      backgroundColor: 'white',
      color: duosBlue
    },
    additionalStyle: {
      padding: '3% 7%',
      fontSize: '1.45rem',
      fontWeight: 600,
      color: duosBlue,
      marginRight: 5,
      border: `1px ${duosBlue} solid`
    }
  };

  const reviewButtonAttributes = {
    keyProp: `${consoleType}-review-${uniqueId}`,
    label: 'Review',
    onClick: () => redirectToDARApplication(collectionId, history),
    baseColor: 'white',
    fontColor: Theme.palette.secondary,
    hoverStyle: {
      backgroundColor: Theme.palette.secondary,
      color: 'white'
    },
    additionalStyle: {
      padding: '3%',
      fontSize: '1.45rem',
      fontWeight: 600,
      border: `1px solid ${Theme.palette.secondary}`,
      marginRight: 5
    },
  };

  const deleteButtonAttributes = {
    keyProp: `${consoleType}-delete-${uniqueId}`,
    label: 'Delete',
    onClick: () => showConfirmationModal(collection, 'delete'),
    dataTip: 'Delete Collection Draft',
    style: baseCancelButtonStyle,
    hoverStyle: hoverCancelButtonStyle,
    icon: Delete,
  };


  const resumeButtonAttributes = {
    keyProp: `${consoleType}-resume-${uniqueId}`,
    onClick: () => resumeDARApplication(collection.referenceIds[0], history),
    label: 'Resume',
    baseColor: Theme.palette.secondary,
    fontColor: 'white',
    hoverStyle: hoverPrimaryButtonStyle,
    additionalStyle: {
      padding: '3%',
      marginRight: 5,
      fontSize: '1.45rem',
      fontWeight: 600,
      border: `1px solid ${Theme.palette.secondary}`,
    },
  };

  const reviseButtonAttributes = {
    keyProp: `${consoleType}-revise-${uniqueId}`,
    label: 'Revise',
    baseColor: Theme.palette.secondary,
    additionalStyle: {
      padding: '3%',
      fontSize: '1.45rem',
      fontWeight: 600,
      marginRight: 5
    },
    hoverStyle: hoverPrimaryButtonStyle,
    onClick: () => showConfirmationModal(collection, 'revise'),
  };

  return (
    <div
      className={`${consoleType}-actions`}
      key={`${consoleType}-actions-${collectionId}`}
      id={`${consoleType}-actions-${collectionId}`}
      style={{
        display: 'flex',
        padding: '10px 5px',
        justifyContent: 'flex-start',
        alignItems: 'center',
      }}
    >
      {actions.includes('Open') && <SimpleButton {...openButtonAttributes} />}
      {actions.includes('Vote') && <SimpleButton {...voteButtonAttributes} />}
      {actions.includes('Update') && <SimpleButton {...updateButtonAttributes} />}
      {actions.includes('Revise') && <SimpleButton {...reviseButtonAttributes} />}
      {actions.includes('Resume') && <SimpleButton {...resumeButtonAttributes} />}
      {actions.includes('Review') && <SimpleButton {...reviewButtonAttributes} />}
      {actions.includes('Delete') && <TableIconButton {...deleteButtonAttributes} />}
      {actions.includes('Cancel') && <TableIconButton {...cancelButtonAttributes} />}
    </div>
  );
}
