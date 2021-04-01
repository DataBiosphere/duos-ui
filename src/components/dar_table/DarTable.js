import { isEmpty, isNil } from 'lodash/fp';
import { useState, useEffect, useCallback } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Election, User, Votes } from '../../libs/ajax';
import { DataUseTranslation } from '../../libs/dataUseTranslation';
import { Notifications, getDatasetNames, calcFilteredListPosition } from '../../libs/utils';
import { Styles } from '../../libs/theme';
import DarModal from '../modals/DarModal';
import PaginationBar from '../PaginationBar';
import ConfirmationModal from "../modals/ConfirmationModal";
import DarElectionRecords from './DarElectionRecords';

////////////////////
//HELPER FUNCTIONS//
////////////////////

const calcPageCount = (tableSize, filteredList) => {
  if(isEmpty(filteredList)) {
    return 1;
  }
  return Math.ceil(filteredList.length / tableSize);
};

//////////////////
//MAIN COMOPNENT//
//////////////////
export default function DarTable(props) {

  const { filteredList, history, consoleType, extraOptions, currentPage, setCurrentPage, tableSize, setTableSize } = props;
  const [darDetails, setDarDetails] = useState({});
  const [researcher, setResearcher] = useState({});
  const [pageCount, setPageCount] = useState(calcPageCount(tableSize, filteredList));
  const [showModal, setShowModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [createElectionInfo, setCreateElectionInfo] = useState({});

  const updateLists = props.getUpdateLists();

  useEffect(() => {
    setPageCount(calcPageCount(tableSize, filteredList));
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
      h(DarElectionRecords, {
        isRendered: !isEmpty(filteredList),
        filteredList,
        openModal,
        currentPage,
        tableSize,
        history,
        openConfirmation,
        updateLists,
        consoleType,
        extraOptions
      }),
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