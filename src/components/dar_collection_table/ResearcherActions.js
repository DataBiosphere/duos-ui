import { useState, useEffect } from 'react';
import {Styles, Theme} from '../../libs/theme';
import { h, div } from 'react-hyperscript-helpers';
import TableIconButton from '../TableIconButton';
import { Block } from '@material-ui/icons';
import { every, lowerCase, flow, map, filter, flatMap, isEmpty } from 'lodash/fp';
import SimpleButton from '../SimpleButton';

/*
  Researcher -> Review: go to dar application page with disabled fields
             -> Revise: use existing revise button functionality
             -> Cancel: show modal to confirm collection cancellation
  Since researcher console only gets collections that the user has made, we don't need
  to do the sort of validations that are seen on the Chair or member actions.
*/

const hoverCancelButtonStyle = Styles.TABLE.TABLE_BUTTON_ICON_HOVER;
const baseCancelButtonStyle = Object.assign({}, Styles.TABLE.TABLE_ICON_BUTTON, {alignItems: 'center', marginLeft: '4%'});

//Function to determine if collection is revisable
//Should only show up if all of the DARs have a canceled status
const isCollectionRevisable = (dars = {}) => {
  return allCanceledDars(dars);
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
  const { collection, showConfirmationModal, reviewCollection } = props;
  const collectionId = collection.darCollectionId;
  const { dars } = collection;

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
    onClick: () => reviewCollection(collection),
    baseColor: 'white',
    additionalStyle: {
      padding: '3%',
      fontSize: '1.45rem',
      fontWeight: 600,
      color: Theme.palette.secondary,
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

  const resumeButtonAttributes = {
    keyProp: `resume-draft-${collectionId}`,
    isRendered: collection.isDraft,
    onClick: () => history.push(`/dar_application/${collectionId}`),
    label: 'Resume',
    baseColor: 'white',
    additionalStyle: {
      width: '37%',
      padding: '3%',
      marginRight: '2%',
      fontSize: '1.45rem',
      fontWeight: 600,
      border: `1px solid ${Theme.palette.secondary}`,
      color: Theme.palette.secondary
    },
  };

  const deleteButtonAttributes = {
    keyProp: `delete-draft-${collectionId}`,
    label: 'Delete',
    isRendered: collection.isDraft === true,
    baseColor: Theme.palette.error,
    additionalStyle: {
      width: '37%',
      padding: '3%',
      fontSize: '1.45rem',
      fontWeight: 600
    },
    onClick: () => showConfirmationModal(collection, 'delete'),
  };

  const reviseButtonAttributes = {
    keyProp: `revise-collection-${collectionId}`,
    label: 'Revise',
    baseColor: Theme.palette.secondary,
    additionalStyle: {
      padding: '3%',
      fontSize: '1.45rem',
      fontWeight: 600
    },
    isRendered: !collection.isDraft && reviseEnabled,
    onClick: () => showConfirmationModal(collection, 'revise')
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
      h(SimpleButton, collection.isDraft ? resumeButtonAttributes : reviewButtonAttributes),
      h(SimpleButton, reviseButtonAttributes), //NOTE: figure out when this should be rendered
      h(SimpleButton, deleteButtonAttributes),
      h(TableIconButton, cancelButtonAttributes)
    ]
  );
}