import { isEmpty, isNil, filter } from 'lodash/fp';
import { useCallback } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Election } from '../libs/ajax';
import TableTextButton from '../components/TableTextButton';
import TableIconButton from '../components/TableIconButton';
import { Notifications, applyTextHover, removeTextHover, getElectionDate, processElectionStatus } from '../libs/utils';
import { Styles} from '../libs/theme';
import {Storage} from "../libs/storage";
import { Block } from '@material-ui/icons';

export default function DarElectionRecords (props) {
  //NOTE: currentPage is not zero-indexed
  const {openModal, currentPage, tableSize, openConfirmation, updateLists } = props;
  const startIndex = (currentPage - 1) * tableSize;
  const endIndex = currentPage * tableSize; //NOTE: endIndex is exclusive, not inclusive
  const visibleWindow = props.filteredList.slice(startIndex, endIndex);
  const dataIDTextStyle = Styles.TABLE.DATA_REQUEST_TEXT;
  const recordTextStyle = Styles.TABLE.RECORD_TEXT;

  const createActionButtons = useCallback((electionInfo, index) => {
    const e = electionInfo.election;
    const dar = electionInfo.dar;
    const currentUserId = Storage.getCurrentUser().dacUserId;

    const cancelElectionHandler = async (electionData, darId, index) => {
      const targetElection = electionData.election;
      const electionId = targetElection.electionId;
      const electionPayload = Object.assign({}, electionData.election, {status: 'Canceled', finalAccessVote: 'false'});

      try {
        const updatedElection = await Election.updateElection(electionId, electionPayload);
        const notification = 'Election has been cancelled';
        updateLists(updatedElection, darId, index, notification);
      } catch(error) {
        Notifications.showError({text: 'Error: Failed to cancel selected Election'});
      }
    };

    if (!isNil(e)) {
      switch (e.status) {
        case 'Open' : {
          const votes = filter((v) => {
            const belongsToUser = (currentUserId === v.dacUserId);
            const targetTypes = (v.type === 'Chairperson' || v.type === 'DAC');
            return belongsToUser && targetTypes;
          })(electionInfo.votes);
          return [
            h(TableTextButton, {
              key: `vote-button-${e.referenceId}`,
              onClick: () => props.history.push(`access_review/${dar.referenceId}`),
              label: 'Vote',
              disabled: isEmpty(votes)
            }),
            h(TableIconButton, {
              icon: Block,
              key: `cancel-button-${e.referenceId}`,
              onClick: () => cancelElectionHandler(electionInfo, dar.referenceId, index)
            })
          ];
        }
        default :
          return h(TableTextButton, {
            key: `reopen-button-${e.referenceId}`,
            onClick: () => openConfirmation(dar, index),
            label: 'Re-Open'
          });
      }
    }
    return h(TableTextButton, {
      onClick: () => openConfirmation(dar, index),
      key: `open-election-dar-${dar.referenceId}`,
      label: 'Open Election'
    });
  }, [updateLists, openConfirmation, props.history]);

  return visibleWindow.map((electionInfo, index) => {
    const {dar, dac, election, votes} = electionInfo;
    const borderStyle = index > 0 ? {borderTop: "1px solid rgba(109,110,112,0.2)"} : {};
    return div({style: Object.assign({}, borderStyle, Styles.TABLE.RECORD_ROW), key: `${dar.data.referenceId}-${index}`}, [
      div({
        style: Object.assign({}, Styles.TABLE.DATA_ID_CELL, dataIDTextStyle),
        onClick: () => openModal(dar),
        onMouseEnter: applyTextHover,
        onMouseLeave: (e) => removeTextHover(e, Styles.TABLE.DATA_REQUEST_TEXT.color)
      }, [dar && dar.data ? dar.data.darCode : '- -']),
      div({style: Object.assign({}, Styles.TABLE.TITLE_CELL, recordTextStyle)}, [dar && dar.data ? dar.data.projectTitle : '- -']),
      div({style: Object.assign({}, Styles.TABLE.SUBMISSION_DATE_CELL, recordTextStyle)}, [getElectionDate(election)]),
      div({style: Object.assign({}, Styles.TABLE.DAC_CELL, recordTextStyle)}, [dac ? dac.name : '- -']),
      div({style: Object.assign({}, Styles.TABLE.ELECTION_STATUS_CELL, recordTextStyle)}, [election ? processElectionStatus(election, votes) : '- -']),
      div({style: Object.assign({}, Styles.TABLE.ELECTION_ACTIONS_CELL, recordTextStyle)}, [createActionButtons(electionInfo, index)]),
    ]);
  });
};