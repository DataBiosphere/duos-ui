import { isEmpty } from 'lodash/fp';
import { div, h } from 'react-hyperscript-helpers';
import { applyTextHover, removeTextHover, getElectionDate, processElectionStatus } from '../../libs/utils';
import { Styles } from '../../libs/theme';
import DarTableActions from './DarTableActions';

////////////////////
//HELPER FUNCTIONS//
////////////////////
const calcVisibleWindow = (currentPage, tableSize, filteredList) => {
  if(!isEmpty(filteredList)) {
    const startIndex = (currentPage - 1) * tableSize;
    const endIndex = (currentPage * tableSize);
    return filteredList.slice(startIndex, endIndex);
  }
};

export default function DarElectionRecords(props) {
  //NOTE: currentPage is not zero-indexed
  //NOTE: addExtraButtons -> base output is perfectly formatted for DAC Chair. Other consoles (AdminManageAccess for example), has extra buttons
  //Also does not show vote button (since that's a DAC Chair specific feature)
  const { openModal, currentPage, tableSize, openConfirmation, updateLists, filteredList, consoleType, extraOptions, history } = props;
  const visibleWindow = calcVisibleWindow(currentPage, tableSize, filteredList);
  const dataIDTextStyle = Styles.TABLE.DATA_REQUEST_TEXT;
  const recordTextStyle = Styles.TABLE.RECORD_TEXT;
  const showVotes = (consoleType === 'chair' || (!isEmpty(extraOptions) && extraOptions.showVote)) ? true : false;

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
      div({style: Object.assign({}, Styles.TABLE.ELECTION_STATUS_CELL, recordTextStyle)}, [election ? processElectionStatus(election, votes, showVotes) : '- -']),
      h(DarTableActions, {
        baseStyle: Object.assign({}, Styles.TABLE.ELECTION_ACTIONS_CELL, recordTextStyle),
        updateLists,
        openConfirmation,
        history,
        electionInfo,
        index,
        consoleType,
        extraOptions
      })
    ]);
  });
}