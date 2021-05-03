import { isEmpty, isNil, assign } from 'lodash/fp';
import { useState, useEffect, useCallback } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Election, User } from '../../libs/ajax';
import { DataUseTranslation } from '../../libs/dataUseTranslation';
import { Notifications, getDatasetNames } from '../../libs/utils';
import { Styles } from '../../libs/theme';
import DarModal from '../modals/DarModal';
import PaginationBar from '../PaginationBar';
import ConfirmationModal from "../modals/ConfirmationModal";
import DarElectionRecords from './DarElectionRecords';
import ReactTooltip from 'react-tooltip';

////////////////////
//EXPORTED PARTIAL//
////////////////////
export const tableHeaderTemplate = [
  div({style: Styles.TABLE.DATA_ID_CELL}, ["Data Request ID"]),
  div({style: Styles.TABLE.TITLE_CELL}, ["Project Title"]),
  div({style: Styles.TABLE.DATASET_CELL}, ["Dataset Name"]),
  div({style: Styles.TABLE.SUBMISSION_DATE_CELL}, ["Last Updated"]),
  div({style: Styles.TABLE.DAC_CELL}, ["DAC"]),
  div({style: Styles.TABLE.ELECTION_STATUS_CELL}, ["Election Status"]),
  div({style: Styles.TABLE.ELECTION_ACTIONS_CELL}, ["Election Actions"])
];
const loadingMarginOverwrite = {margin: '1rem 2%'};

export const tableRowLoadingTemplate = [
  div({style: assign(Styles.TABLE.DATA_ID_CELL, loadingMarginOverwrite), className: 'text-placeholder'}),
  div({style: assign(Styles.TABLE.TITLE_CELL, loadingMarginOverwrite), className: 'text-placeholder'}),
  div({style: assign(Styles.TABLE.DATASET_CELL, loadingMarginOverwrite), className: 'text-placeholder'}),
  div({style: assign(Styles.TABLE.SUBMISSION_DATE_CELL, loadingMarginOverwrite), className: 'text-placeholder'}),
  div({style: assign(Styles.TABLE.DAC_CELL, loadingMarginOverwrite), className: 'text-placeholder'}),
  div({style: assign(Styles.TABLE.ELECTION_STATUS_CELL, loadingMarginOverwrite), className: 'text-placeholder'}),
  div({style: assign(Styles.TABLE.ELECTION_ACTIONS_CELL, loadingMarginOverwrite), className: 'text-placeholder'})
];


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
//MAIN COMPONENT//
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
    //NOTE: The old ManageAdminAccess used ReactTooltip incorrectly
    //Code had created four tooltip instances for all records
    //ReactTooltip only needs one instance (placed on the parent)
    //any DOM element with the attribute "data-tip" will have a tooltip rendered
    //If dealing with dynamic content, you'll have to rebind new elements to the ReactTooltip instance
    //Therefore call ReactTooltip.rebuild on the parent component
    //Use timeout to ensure that the rebuild fires after the child component has rendered
    //clear timeout after callback function fires to avoid side-effects
    ReactTooltip.rebuild();
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
        //updatedElection is the new access election
        const updatedElection = await Election.createDARElection(darId);
        const accessVotes = await Election.getElectionVotes(updatedElection.electionId);
        const successMsg = 'Election successfully opened';
        updateLists(updatedElection, darId, index, successMsg, accessVotes);
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
      div({style: Styles.TABLE.HEADER_ROW}, [tableHeaderTemplate]),
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
    }),
    //You only need one instance of ReactTooltip rendered for all tooltips (if they follow the same styling)
    //Only create multiple instances if there is enough of a difference in appearance to warrant it
    //ReactTooltip instance only needs to be rendered on a higher level component
    //Theory: If all tooltips in this app are the same, you could just initialize this element on the highest level of the app
    //Above theory requires more research into the current usage within the app
    h(ReactTooltip, {
      place: 'left',
      effect: 'solid',
      multiline: true,
      className: 'tooltip-wrapper'
    })
  ]);
}