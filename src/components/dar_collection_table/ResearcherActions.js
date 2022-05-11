import { useState, useEffect } from 'react';
import { Styles } from '../../libs/theme';
import ResubmitCollectionButton from './ResubmitCollectionButton';
import { h, div } from 'react-hyperscript-helpers';
import TableTextButton from '../TableTextButton';
import TableIconButton from '../TableIconButton';
import { Block } from '@material-ui/icons';
import { every, lowerCase, flow, map, filter, flatMap } from 'lodash/fp';
import { isEmpty } from 'lodash';

/*
  Researcher -> Review: go to dar collection page
             -> Revise: use existing revise button functionality
             -> Cancel: show modal to confirm collection cancellation
  Since researcher console only gets collections that the user has made, we don't need
  to do the sort of validations that are seen on the Chair or member actions.
*/

const hoverTextButtonStyle = Styles.TABLE.TABLE_BUTTON_TEXT_HOVER;
const baseTextButtonStyle = Object.assign({}, Styles.TABLE.TABLE_TEXT_BUTTON, {fontFamily: 'Montserrant', margin: '0%'});

const hoverCancelButtonStyle = Styles.TABLE.TABLE_BUTTON_ICON_HOVER;
const baseCancelButtonStyle = Object.assign({}, Styles.TABLE.TABLE_ICON_BUTTON, {alignItems: 'center'});

//Function to determine if collection is resubmittable
//Should only show up if all of the dars have a canceled status
const isCollectionRevisable = (dars = {}) => {
  return every(dar => lowerCase(dar.status) === 'canceled')(dars);
};

//Function to detmine if collection is cancelable
//Should only show up if none of the DARs have Open or Closed Elections
const isCollectionCancelable = (dars = {}) => {
  const hasDars = !isEmpty(dars);
  const allCanceled = every(dar => lowerCase(dar.status) === 'canceled')(dars);
  const hasNoOpenOrClosedElections = flow(
    filter(dar => lowerCase(dar.status) !== 'canceled'),
    map(dar => dar.elections),
    flatMap((electionMap = {}) => Object.values(electionMap)),
    filter((election) => lowerCase(election.status) === 'open' || lowerCase(election.status) === 'closed'),
    isEmpty
  )(dars);
  // eslint-disable-next-line no-debugger
  debugger;
  return hasDars && !allCanceled && hasNoOpenOrClosedElections;
};

export default function ResearcherActions(props) {
  const { collection, showConfirmationModal, history } = props;
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

  const reviewOnClick = (collectionId) => {
    history.push(`/dar_collection/${collectionId}`);
  };

  //NOTE: minimal placeholder, adjust as needed for console implementation
  const cancelOnClick = (collection) => {
    showConfirmationModal(collection);
  };

  const reviewButtonAttributes = {
    keyProp: `researcher-review-${collectionId}`,
    label: 'Review',
    isRendered: true,
    onClick: () => reviewOnClick(collectionId),
    style: baseTextButtonStyle,
    hoverStyle: hoverTextButtonStyle
  };

  const cancelButtonAttributes = {
    keyProp: `researcher-cancel-${collectionId}`,
    label: 'Cancel',
    isRendered: cancelEnabled,
    onClick: () => cancelOnClick(collection),
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
      h(TableTextButton, reviewButtonAttributes),
      h(TableIconButton, cancelButtonAttributes)
    ]
  );
}