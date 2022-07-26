import {Styles, Theme} from '../../libs/theme';
import { h, div } from 'react-hyperscript-helpers';
import TableIconButton from '../TableIconButton';
import { Block, Delete } from '@material-ui/icons';
import SimpleButton from '../SimpleButton';
import { useHistory } from 'react-router-dom';
import { Notifications } from '../../libs/utils';

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
const resumeDARApplication = (darCollectionId, history) => {
  history.push(`/dar_application/${darCollectionId}`);
};

/*
  Researcher -> Review: go to dar application page with disabled fields
             -> Revise: use existing revise button functionality
             -> Cancel: show modal to confirm collection cancellation
  Since researcher console only gets collections that the user has made, we don't need
  to do the sort of validations that are seen on the Chair or member actions.
*/

const baseCancelButtonStyle = Object.assign({}, Styles.TABLE.TABLE_ICON_BUTTON, {alignItems: 'center', marginLeft: '4%'});
const hoverCancelButtonStyle = {
  backgroundColor: 'red',
  color: 'white'
};

const hoverPrimaryButtonStyle = {
  backgroundColor: 'rgb(38 138 204)',
  color: 'white'
};

export default function ResearcherActions(props) {
  const { collection, showConfirmationModal } = props;
  const collectionId = collection.darCollectionId;

  const uniqueId = (collectionId ? collectionId : collection.referenceIds[0]);

  const history = useHistory();

  const cancelEnabled = collection.actions.includes('Cancel');
  const reviseEnabled = collection.actions.includes('Revise');
  const reviewEnabled = collection.actions.includes('Review');
  const deleteEnabled = collection.actions.includes('Delete');
  const resumeEnabled = collection.actions.includes('Resume');

  const reviewButtonAttributes = {
    keyProp: `researcher-review-${uniqueId}`,
    label: 'Review',
    isRendered: reviewEnabled,
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
      border: `1px solid ${Theme.palette.secondary}`
    },
  };

  const cancelButtonAttributes = {
    keyProp: `researcher-cancel-${uniqueId}`,
    label: 'Cancel',
    isRendered: cancelEnabled,
    onClick: () => showConfirmationModal(collection, 'cancel'),
    dataTip: 'Cancel Collection',
    style: baseCancelButtonStyle,
    hoverStyle: hoverCancelButtonStyle,
    icon: Block
  };

  const deleteButtonAttributes = {
    keyProp: `researcher-delete-${uniqueId}`,
    label: 'Delete',
    isRendered: deleteEnabled,
    onClick: () => showConfirmationModal(collection, 'delete'),
    dataTip: 'Delete Collection Draft',
    style: baseCancelButtonStyle,
    hoverStyle: hoverCancelButtonStyle,
    icon: Delete,
  };

  const resumeButtonAttributes = {
    keyProp: `researcher-resume-${uniqueId}`,
    isRendered: resumeEnabled,
    onClick: () => resumeDARApplication(collection.referenceIds[0], history),
    label: 'Resume',
    baseColor: Theme.palette.secondary,
    fontColor: 'white',
    hoverStyle: hoverPrimaryButtonStyle,
    additionalStyle: {
      width: '37%',
      padding: '3%',
      marginRight: '2%',
      fontSize: '1.45rem',
      fontWeight: 600,
      border: `1px solid ${Theme.palette.secondary}`,
    },
  };

  const reviseButtonAttributes = {
    keyProp: `revise-collection-${uniqueId}`,
    label: 'Revise',
    baseColor: Theme.palette.secondary,
    additionalStyle: {
      padding: '3%',
      fontSize: '1.45rem',
      fontWeight: 600,
    },
    hoverStyle: hoverPrimaryButtonStyle,
    isRendered: reviseEnabled,
    onClick: () => showConfirmationModal(collection, 'revise'),
  };

  return div(
    {
      className: 'researcher-actions',
      key: `researcher-actions-${uniqueId}`,
      id: `researcher-actions-${uniqueId}`,
      style: {
        display: 'flex',
        padding: '10px 5px',
        justifyContent: 'flex-start',
        alignItems: 'center',
        columnGap: '1rem'
      }
    },
    [
      h(SimpleButton, reviseButtonAttributes),
      h(SimpleButton, resumeButtonAttributes),
      h(SimpleButton, reviewButtonAttributes),

      h(TableIconButton, deleteButtonAttributes),
      h(TableIconButton, cancelButtonAttributes)
    ]
  );
}