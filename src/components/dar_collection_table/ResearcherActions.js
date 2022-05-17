import { useState, useEffect } from 'react';
import {Styles, Theme} from '../../libs/theme';
import ResubmitCollectionButton from './ResubmitCollectionButton';
import { h, div } from 'react-hyperscript-helpers';
import TableIconButton from '../TableIconButton';
import { Block } from '@material-ui/icons';
import { every, lowerCase, flow, map, filter, flatMap, isEmpty } from 'lodash/fp';
import SimpleButton from "../SimpleButton";

/*
  Researcher -> Review: go to dar application page with disabled fields
             -> Revise: use existing revise button functionality
             -> Cancel: show modal to confirm collection cancellation
  Since researcher console only gets collections that the user has made, we don't need
  to do the sort of validations that are seen on the Chair or member actions.
*/

const hoverCancelButtonStyle = Styles.TABLE.TABLE_BUTTON_ICON_HOVER;
const baseCancelButtonStyle = Object.assign({}, Styles.TABLE.TABLE_ICON_BUTTON, {alignItems: 'center'});

//Function to determine if collection is resubmittable
//Should only show up if all of the DARs have a canceled status
const isCollectionRevisable = (dars = {}) => {
  return every(dar => lowerCase(dar.data.status) === 'canceled')(dars);
};

//Function to determine if collection is cancelable
//Should only show up if none of the DARs have elections and not all DARs in the collection are canceled
const isCollectionCancelable = (dars = {}) => {
  const hasDars = !isEmpty(dars);
  const allCanceled = every(dar => lowerCase(dar.data.status) === 'canceled')(dars);
  const hasNoElections = flow(
    filter(dar => lowerCase(dar.data.status) !== 'canceled'),
    map(dar => dar.elections),
    flatMap((electionMap = {}) => Object.values(electionMap)),
    isEmpty
  )(dars);
  return hasDars && !allCanceled && hasNoElections;
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

  //NOTE: minimal placeholder, adjust as needed for console implementation
  const cancelOnClick = (collection) => {
    showConfirmationModal(collection, 'cancel');
  };

  const reviewButtonAttributes = {
    keyProp: `researcher-review-${collectionId}`,
    label: 'Review',
    isRendered: true,
    onClick: () => reviewCollection(collection),
    baseColor: Theme.palette.secondary,
    additionalStyle: {
      padding: '5px 10px',
      fontSize: '1.45rem'
    },
  };

  const cancelButtonAttributes = {
    keyProp: `researcher-cancel-${collectionId}`,
    label: 'Cancel',
    isRendered: cancelEnabled,
    onClick: () => cancelOnClick(collection),
    dataTip: 'Cancel Collection',
    style: baseCancelButtonStyle,
    hoverStyle: hoverCancelButtonStyle,
    icon: Block
  };

  return div(
    {
      className: 'researcher-actions',
      key: `researcher-actions-${collectionId}`,
      id: `researcher-actions-${collectionId}`,
      style: {
        display: 'flex',
        padding: '10px 5px',
        justifyContent: 'space-around',
        alignItems: 'end'
      }
    },
    //placeholder template, adjust for console implementation
    [
      h(ResubmitCollectionButton, {isRendered: reviseEnabled, showConfirmationModal, collection}),
      h(SimpleButton, reviewButtonAttributes),
      h(TableIconButton, cancelButtonAttributes)
    ]
  );
}