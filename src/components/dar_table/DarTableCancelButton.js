import { Election } from '../../libs/ajax';
import { Notifications } from '../../libs/utils';
import TableTextButton from '../TableTextButton';
import TableIconButton from '../TableIconButton';
import { Styles } from '../../libs/theme';
import { h } from 'react-hyperscript-helpers';
import { Block } from '@material-ui/icons';

const cancelElectionHandler = async (election, darId, updateLists, index) => {
  const electionId = election.electionId;
  const electionPayload = Object.assign({}, election, {status: 'Canceled', finalAccessVote: 'false'});

  try {
    const updatedElection = await Election.updateElection(electionId, electionPayload);
    const notification = 'Election has been cancelled';
    updateLists(updatedElection, darId, index, notification);
  } catch(error) {
    Notifications.showError({text: 'Error: Failed to cancel selected Election'});
  }
};

export default function DarTableCancelButton(props) {
  const {election, darReferenceId, index, updateLists, isIcon, addHoverStyle = {}, addBaseStyle = {}, disabled} = props;
  const TargetComponent = isIcon ? TableIconButton : TableTextButton;
  const baseHoverStyle = isIcon ? Styles.TABLE.TABLE_BUTTON_ICON_HOVER : Styles.TABLE.TABLE_BUTTON_TEXT_HOVER;
  const baseStyle = isIcon ? Styles.TABLE.TABLE_ICON_BUTTON : Styles.TABLE.TABLE_TEXT_BUTTON;

  const attributes = {
    key: `cancel-button-${election.referenceId}`,
    disabled,
    dataTip: disabled ? 'You do not have permision to cancel this election' : 'Cancel Election',
    onClick: () => cancelElectionHandler(election, darReferenceId, updateLists, index),
    style: Object.assign({}, baseStyle, addBaseStyle),
    hoverStyle: Object.assign({}, baseHoverStyle, addHoverStyle)
  };
  if(isIcon) {
    attributes.icon = Block;
  } else {
    attributes.label = 'Cancel';
  }
  return h(TargetComponent, attributes);
}