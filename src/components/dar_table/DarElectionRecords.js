import { isEmpty } from 'lodash/fp';
import { div, h, a } from 'react-hyperscript-helpers';
import {
  applyTextHover,
  removeTextHover,
  getElectionDate,
  processElectionStatus,
  getNameOfDatasetForThisDAR,
  calcVisibleWindow
} from '../../libs/utils';
import { Styles } from '../../libs/theme';
import DarTableActions, {consoleTypes} from './DarTableActions';
import { Theme } from '../../libs/theme';
import { ReadMore } from '../ReadMore';

////////////////////
//HELPER FUNCTIONS//
////////////////////
const goToReviewResults = (dar, history, status) => {
  if(dar && dar.referenceId) {
    if (status === 'Unreviewed') {
      history.push(`review_results/${dar.referenceId}/${status}`);
    } else {
      history.push(`review_results/${dar.referenceId}`);
    }
  }
};
const electionStatusTemplate = (consoleType, dar, election, recordTextStyle, votes, showVotes, history) =>{
  const linkedStatuses = ['Unreviewed', 'Approved', 'Denied', 'Canceled'];
  const status = processElectionStatus(election, votes, showVotes);
  const includeLink = (consoleType === consoleTypes.MANAGE_ACCESS ||
    consoleType === consoleTypes.SIGNING_OFFICIAL ||
    linkedStatuses.includes(status));
  const tag = includeLink ? a : div;
  return tag({
    style: Object.assign({}, Styles.TABLE.ELECTION_STATUS_CELL, recordTextStyle, {
      color: includeLink ? Theme.palette.link : Styles.TABLE.ELECTION_STATUS_CELL.color //color adjustment for manage console
    }),
    onClick: () => includeLink && goToReviewResults(dar, history, status)
  }, [status]);
};

export default function DarElectionRecords(props) {
  //NOTE: currentPage is not zero-indexed
  const { openModal, currentPage, tableSize, openConfirmation, updateLists, filteredList, consoleType, extraOptions, history } = props;
  const visibleWindow = calcVisibleWindow(currentPage, tableSize, filteredList);
  const dataIDTextStyle = Styles.TABLE.DATA_REQUEST_TEXT;
  const recordTextStyle = Styles.TABLE.RECORD_TEXT;
  const showVotes = !!(consoleType === consoleTypes.CHAIR || (!isEmpty(extraOptions) && extraOptions.showVote));

  return visibleWindow.map((electionInfo, index) => {
    const {dar, dac, election, votes} = electionInfo;
    const borderStyle = index > 0 ? {borderTop: '1px solid rgba(109,110,112,0.2)'} : {};
    return div({style: Object.assign({}, borderStyle, Styles.TABLE.RECORD_ROW), key: `${dar.data.referenceId}-${index}`}, [
      div({
        style: Object.assign({}, Styles.TABLE.DATA_ID_CELL, dataIDTextStyle),
        onClick: () => openModal(dar),
        onMouseEnter: applyTextHover,
        onMouseLeave: (e) => removeTextHover(e, Styles.TABLE.DATA_REQUEST_TEXT.color)
      }, [dar && dar.data ? dar.data.darCode : '- -']),
      div({style: Object.assign({}, Styles.TABLE.TITLE_CELL, recordTextStyle)}, [ReadMore({
        expanded: false,
        inline: true,
        hideUnderLimit: true,
        readLessText: ' Read Less',
        content: dar && dar.data ? dar.data.projectTitle : '- -'
      })]),
      div({style: Object.assign({}, Styles.TABLE.TITLE_CELL, recordTextStyle)}, [ReadMore({
        expanded: false,
        inline: true,
        hideUnderLimit: true,
        readLessText: ' Read Less',
        // Dataset IDs should be on the DAR, but if not, pull from the dar.data
        content: dar && dar.data ? getNameOfDatasetForThisDAR(dar.data.datasets, isEmpty(dar.datasetIds) ? dar.data.datasetIds : dar.datasetIds) : '- -'
      })]),
      div({style: Object.assign({}, Styles.TABLE.SUBMISSION_DATE_CELL, recordTextStyle)}, [getElectionDate(election)]),
      div({style: Object.assign({}, Styles.TABLE.DAC_CELL, recordTextStyle)}, [dac ? dac.name : '- -']),
      electionStatusTemplate(consoleType, dar, election, recordTextStyle, votes, showVotes, history),
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
