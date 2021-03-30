import { isEmpty, isNil, filter } from 'lodash/fp';
import { useState, useEffect, useCallback } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Election, User, Votes } from '../libs/ajax';
import { DataUseTranslation } from '../libs/dataUseTranslation';
import TableTextButton from '../components/TableTextButton';
import TableIconButton from '../components/TableIconButton';
import { Notifications, getDatasetNames, applyTextHover, removeTextHover, getElectionDate, processElectionStatus, updateLists, calcFilteredListPosition } from '../libs/utils';
import { Styles } from '../libs/theme';
import DarModal from '../components/modals/DarModal';
import PaginationBar from '../components/PaginationBar';
import { Storage } from "../libs/storage";
import { Block } from '@material-ui/icons';
import ConfirmationModal from "../components/modals/ConfirmationModal";

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

const calcPageCount = (tableSize, filteredList) => {
  if(isEmpty(filteredList)) {
    return 1;
  }
  return Math.ceil(filteredList.length / tableSize);
};

//////////////////
//SUB-COMPONENTS//
//////////////////
const ElectionRecords = (props) => {
  //NOTE: currentPage is not zero-indexed
  const { openModal, currentPage, tableSize, openConfirmation } = props;
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
  }, [openConfirmation, props.history]);

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

//////////////////
//MAIN COMOPNENT//
//////////////////
export default function DarTable(props) {

  const initialTableSize = 10;
  const initialPage = 1;

  const { filteredList = [], history, getElectionDate } = props;
  const [tableSize, setTableSize] = useState(initialTableSize);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [darDetails, setDarDetails] = useState({});
  const [researcher, setResearcher] = useState({});
  const [visibleWindow, setVisibleWindow] = useState(calcVisibleWindow(currentPage, initialTableSize));
  const [pageCount, setPageCount] = useState(calcPageCount(initialTableSize, filteredList));
  //NOTE: see if modal can be created within this component. If not, get setShowModal from props
  const [showModal, setShowModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [createElectionInfo, setCreateElectionInfo] = useState({});

  const updateLists = props.getUpdateLists();

  useEffect(() => {
    setPageCount(calcPageCount(tableSize, filteredList));
    const updatedWindow = calcVisibleWindow(currentPage, tableSize, filteredList);
    setVisibleWindow(updatedWindow);
  }, [currentPage, tableSize, filteredList]);

  const openModal = useCallback(async(darInfo) => {
    let darData = darInfo.data;
    if (!isNil(darData)) {
      setShowModal(true);
      darData.researchType = DataUseTranslation.generateResearchTypes(darData);
      if(!darData.datasetNames) {
        darData.datasetNames = getDatasetNames(darData.datasets);
      }
      setDarDetails(darData);
      const researcher = await User.getById(darInfo.userId);
      setResearcher(researcher);
    }
  }, []);

  const closeModal = () => setShowModal(false);

  const openConfirmation = useCallback((dar, index) => {
    const darData = dar.data;
    if (!isNil(darData)) {
      setShowConfirmation(true);
      setCreateElectionInfo({id: darData.referenceId, name: darData.darCode, index});
    } else {
      Notifications.showError({text:"Cannot open this election. Please contact us for support."});
    }
  }, []);

  const closeConfirmation = () => {
    setShowConfirmation(false);
  };

  const changeTableSize = (newTableSize) => {
    if(!isEmpty(newTableSize) && newTableSize > 0) {
      setTableSize(newTableSize);
    }
  };

  const goToPage = (currentPage) => {
    if(currentPage > 0 && currentPage < pageCount + 1) {
      setCurrentPage(currentPage);
    }
  };

  //NOTE: method used in the confirmation modal
  const createElection = async (darId, index) => {
    if (!isNil(darId)) {
      try{
        const updatedElection = await Election.createDARElection(darId);
        const votes = await Votes.getDarVotes(darId);
        const successMsg = 'Election successfully opened';
        const filterListIndex = calcFilteredListPosition(index, currentPage, tableSize);
        updateLists(updatedElection, darId, filterListIndex, successMsg, votes);
        setShowConfirmation(false);
      } catch(error) {
        const errorReturn = {text: 'Error: Failed to create election!'};
        if(error.status === 500) {
          errorReturn.text = "Email Service Error! The election was created but the participants couldnt be notified by Email.";
        }
        Notifications.showError(errorReturn);
      }
    }
  };

  return div({className: 'dar-table-component'}, [
    div({style: Styles.TABLE.CONTAINER}, [
      div({style: Styles.TABLE.HEADER_ROW}, [
        div({style: Styles.TABLE.DATA_ID_CELL}, ["Data Request ID"]),
        div({style: Styles.TABLE.TITLE_CELL}, ["Project title"]),
        div({style: Styles.TABLE.SUBMISSION_DATE_CELL}, ["Last Updated"]),
        div({style: Styles.TABLE.DAC_CELL}, ["DAC"]),
        div({style: Styles.TABLE.ELECTION_STATUS_CELL}, ["Election status"]),
        div({style: Styles.TABLE.ELECTION_ACTIONS_CELL}, ["Election actions"])
      ]),
      h(ElectionRecords, {isRendered: !isEmpty(filteredList), filteredList, openModal, currentPage, tableSize, history, openConfirmation, updateLists, visibleWindow, getElectionDate}),
      h(PaginationBar, {pageCount, currentPage, tableSize, goToPage, changeTableSize})
    ]),
    h(DarModal, {showModal, closeModal, darDetails, researcher}),
    h(ConfirmationModal, {
      showConfirmation,
      closeConfirmation,
      title: "Open Election?",
      message: "Are you sure you want the DAC to vote on this data access request?",
      header: createElectionInfo.name,
      onConfirm: createElection,
      id: createElectionInfo.id,
      index: createElectionInfo.index
    })
  ]);
}