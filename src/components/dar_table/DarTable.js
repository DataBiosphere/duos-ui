import { isEmpty, isNil, assign } from 'lodash/fp';
import { useState, useEffect, useCallback } from 'react';
import { div, h, span } from 'react-hyperscript-helpers';
import { Election, User } from '../../libs/ajax';
import { DataUseTranslation } from '../../libs/dataUseTranslation';
import { Notifications, getDatasetNames } from '../../libs/utils';
import { Styles } from '../../libs/theme';
import DarModal from '../modals/DarModal';
import PaginationBar from '../PaginationBar';
import ConfirmationModal from "../modals/ConfirmationModal";
import DarElectionRecords from './DarElectionRecords';
import ReactTooltip from 'react-tooltip';
import * as Utils from '../../libs/utils';
import {consoleTypes} from "./DarTableActions";

////////////////////
//EXPORTED PARTIAL//
////////////////////
export const getTableHeaderTemplateWithSort = (sortFunc, descOrder, consoleType) => {
  return [
    div({style: Styles.TABLE.DATA_ID_CELL, key: "data_id_cell", className: 'cell-sort', onClick: sortFunc({
      sortKey: 'dar.data.darCode',
      descendantOrder: descOrder
    })}, [
      "DAR ID",
      span({ className: 'glyphicon sort-icon glyphicon-sort' })
    ]),
    div({style: Styles.TABLE.TITLE_CELL, key: "project_title_cell", className: 'cell-sort', onClick: sortFunc({
      sortKey: 'dar.data.projectTitle',
      descendantOrder: descOrder
    })}, [
      "Project Title",
      span({ className: 'glyphicon sort-icon glyphicon-sort' })
    ]),
    div({style: Styles.TABLE.DATASET_CELL, key: "dataset_name_cell", className: 'cell-sort', onClick: sortFunc({
      getValue: (a) => {
        return a.dar && a.dar.data ? Utils.getNameOfDatasetForThisDAR(a.dar.data.datasets, a.dar.data.datasetIds) : '- -';
      },
      descendantOrder: descOrder
    })}, [
      "Dataset Name",
      span({ className: 'glyphicon sort-icon glyphicon-sort' })
    ]),
    div({style: Styles.TABLE.SUBMISSION_DATE_CELL, key: "submission_date_cell", className: 'cell-sort', onClick: sortFunc({
      getValue: (a) => {
        return Utils.getElectionDate(a.election);
      },
      descendantOrder: descOrder
    })}, [
      "Last Updated",
      span({ className: 'glyphicon sort-icon glyphicon-sort' })
    ]),
    div({style: Styles.TABLE.DAC_CELL, key: "dac_name_cell", className: 'cell-sort', onClick: sortFunc({
      sortKey: 'dac.name',
      descendantOrder: descOrder
    })}, [
      "DAC",
      span({ className: 'glyphicon sort-icon glyphicon-sort' })
    ]),
    div({style: Styles.TABLE.ELECTION_STATUS_CELL, key: "election_status_cell" }, [
      "Status"
    ]),
    div({style: Styles.TABLE.ELECTION_ACTIONS_CELL, key: "election_actions_cell", isRendered: consoleType !== consoleTypes.SIGNING_OFFICIAL}, ["Action"])
  ];
};

export const tableHeaderTemplate = (consoleType) =>  {
  return [
    div({style: Styles.TABLE.DATA_ID_CELL, className: 'cell-sort'}, [
      "DAR ID",
      span({ className: 'glyphicon sort-icon glyphicon-sort' })
    ]),
    div({style: Styles.TABLE.TITLE_CELL, className: 'cell-sort'}, [
      "Project Title",
      span({ className: 'glyphicon sort-icon glyphicon-sort' })
    ]),
    div({style: Styles.TABLE.DATASET_CELL, className: 'cell-sort'}, [
      "Dataset Name",
      span({ className: 'glyphicon sort-icon glyphicon-sort' })
    ]),
    div({style: Styles.TABLE.SUBMISSION_DATE_CELL, className: 'cell-sort'}, [
      "Last Updated",
      span({ className: 'glyphicon sort-icon glyphicon-sort' })
    ]),
    div({style: Styles.TABLE.DAC_CELL, className: 'cell-sort'}, [
      "DAC",
      span({ className: 'glyphicon sort-icon glyphicon-sort' })
    ]),
    div({style: Styles.TABLE.ELECTION_STATUS_CELL, className: 'cell-sort'}, ["Status"]),
    div({style: Styles.TABLE.ELECTION_ACTIONS_CELL,
      isRendered: consoleType !== consoleTypes.SIGNING_OFFICIAL}, ["Action"])
  ];
};

const loadingMarginOverwrite = {margin: '1rem 2%'};

export const tableRowLoadingTemplate = (consoleType) => {
  return [
    div({style: assign(Styles.TABLE.DATA_ID_CELL, loadingMarginOverwrite), className: 'text-placeholder'}),
    div({style: assign(Styles.TABLE.TITLE_CELL, loadingMarginOverwrite), className: 'text-placeholder'}),
    div({style: assign(Styles.TABLE.DATASET_CELL, loadingMarginOverwrite), className: 'text-placeholder'}),
    div({style: assign(Styles.TABLE.SUBMISSION_DATE_CELL, loadingMarginOverwrite), className: 'text-placeholder'}),
    div({style: assign(Styles.TABLE.DAC_CELL, loadingMarginOverwrite), className: 'text-placeholder'}),
    div({style: assign(Styles.TABLE.ELECTION_STATUS_CELL, loadingMarginOverwrite),
      isRendered: consoleType !== consoleTypes.SIGNING_OFFICIAL, className: 'text-placeholder'})
  ];
};


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

  const { filteredList, setFilteredList, descendantOrder, setDescendantOrder, history, consoleType, extraOptions, currentPage, setCurrentPage, tableSize, setTableSize } = props;
  const [darDetails, setDarDetails] = useState({});
  const [researcher, setResearcher] = useState({});
  const [pageCount, setPageCount] = useState(calcPageCount(tableSize, filteredList));
  const [showModal, setShowModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [createElectionInfo, setCreateElectionInfo] = useState({});

  const updateLists = props.getUpdateLists();

  const sortDars = Utils.getColumnSort(() => { return filteredList; }, (sortedData, descOrder) => {
    setFilteredList(sortedData);
    setDescendantOrder(!descOrder);
  });

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
    const id = dar.referenceId;
    if (!isNil(darData)) {
      setShowConfirmation(true);
      setCreateElectionInfo({id, name: darData.darCode, index});
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
      div({style: Styles.TABLE.HEADER_ROW}, [getTableHeaderTemplateWithSort(sortDars, descendantOrder, consoleType)]),
      h(DarElectionRecords, {
        isRendered: !isEmpty(filteredList),
        filteredList,
        descendantOrder,
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
      onConfirm: () => createElection(createElectionInfo.id, createElectionInfo.index)
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
