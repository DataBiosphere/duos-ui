import { useState, useEffect } from 'react';
import {Styles, Theme} from '../../libs/theme';
import { h, div } from 'react-hyperscript-helpers';
import TableIconButton from '../TableIconButton';
import { Block, Delete } from '@material-ui/icons';
import { every, lowerCase, flow, map, filter, flatMap, isEmpty } from 'lodash/fp';
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
const resumeDARApplication = (referenceId, history) => {
  history.push(`/dar_application/${referenceId}`);
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

//Function to determine if collection is revisable
//Should only show up if all of the DARs have a canceled status
const isCollectionRevisable = (dars = {}) => {
  const elections = flow(
    flatMap(dar => !isEmpty(dar.elections) ? Object.values(dar.elections) : [])
  )(dars);
  return isEmpty(elections) && allCanceledDars(dars);
};

//Function to determine if collection is cancelable
//Should only show up if none of the DARs have elections and not all DARs in the collection are canceled
const isCollectionCancelable = (dars = {}) => {
  const hasDars = !isEmpty(dars);
  const hasNoElections = flow(
    filter(dar => lowerCase(dar.data.status) !== 'canceled'),
    map(dar => dar.elections),
    flatMap((electionMap = {}) => Object.values(electionMap)),
    isEmpty
  )(dars);
  return hasDars && !allCanceledDars(dars) && hasNoElections;
};

const allCanceledDars = (dars = {}) => {
  return every(dar => lowerCase(dar.data.status) === 'canceled')(dars);
};

export default function ResearcherActions(props) {
  const { collection, showConfirmationModal } = props;
  const collectionId = collection.darCollectionId;
  const { dars } = collection;
  const history = useHistory();

  const [cancelEnabled, setCancelEnabled] = useState(false);
  const [reviseEnabled, setReviseEnabled] = useState(false);

  useEffect(() => {
    const isCancelable = isCollectionCancelable(dars);
    const isRevisable = isCollectionRevisable(dars);
    setCancelEnabled(isCancelable);
    setReviseEnabled(isRevisable);
  }, [dars]);

  const reviewButtonAttributes = {
    keyProp: `researcher-review-${collectionId}`,
    label: 'Review',
    isRendered: true,
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
    keyProp: `researcher-cancel-${collectionId}`,
    label: 'Cancel',
    isRendered: cancelEnabled && !collection.isDraft,
    onClick: () => showConfirmationModal(collection, 'cancel'),
    dataTip: 'Cancel Collection',
    style: baseCancelButtonStyle,
    hoverStyle: hoverCancelButtonStyle,
    icon: Block
  };

  const deleteButtonAttributes = {
    keyProp: `researcher-delete-${collectionId}`,
    label: 'Delete',
    isRendered: collection.isDraft === true,
    onClick: () => showConfirmationModal(collection, 'delete'),
    dataTip: 'Delete Collection Draft',
    style: baseCancelButtonStyle,
    hoverStyle: hoverCancelButtonStyle,
    icon: Delete,
  };

  const resumeButtonAttributes = {
    keyProp: `researcher-resume-${collectionId}`,
    isRendered: collection.isDraft,
    onClick: () => resumeDARApplication(collection.referenceId, history),
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
    keyProp: `revise-collection-${collectionId}`,
    label: 'Revise',
    baseColor: Theme.palette.secondary,
    additionalStyle: {
      padding: '3%',
      fontSize: '1.45rem',
      fontWeight: 600,
    },
    hoverStyle: hoverPrimaryButtonStyle,
    isRendered: !collection.isDraft && reviseEnabled,
    onClick: () => showConfirmationModal(collection, 'revise'),
  };

  return div(
    {
      className: 'researcher-actions',
      key: `researcher-actions-${collectionId}`,
      id: `researcher-actions-${collectionId}`,
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
      h(SimpleButton, collection.isDraft ? resumeButtonAttributes : reviewButtonAttributes),
      h(TableIconButton, deleteButtonAttributes),
      h(TableIconButton, cancelButtonAttributes)
    ]
  );
}