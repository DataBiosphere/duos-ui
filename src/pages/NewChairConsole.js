import { head, isEmpty, isNil, includes, toLower, filter, cloneDeep } from 'lodash/fp';
import { useState, useEffect, useRef } from 'react';
import { div, h, img, input, button } from 'react-hyperscript-helpers';
import { DAR, Election, User } from '../libs/ajax';
import { DataUseTranslation } from '../libs/dataUseTranslation';
import { Notifications, formatDate } from '../libs/utils';
import { Styles} from '../libs/theme';
import DarModal from '../components/modals/DarModal';
import PaginationBar from '../components/PaginationBar';
import {Storage} from "../libs/storage";
import ConfirmationModal from "../components/modals/ConfirmationModal";

const getDatasetNames = (datasets) => {
  if(!datasets){return '';}
  const datasetNames = datasets.map((dataset) => {
    return dataset.label;
  });
  return datasetNames.join('\n');
};

const applyTextHover = (e) => {
  e.target.style.color = Styles.TABLE.DAR_TEXT_HOVER.color;
  e.target.style.cursor = Styles.TABLE.DAR_TEXT_HOVER.cursor;
};

const removeTextHover = (e, color) => {
  e.target.style.color = color;
};

const getElectionDate = (election) => {
  let formattedString = '- -';
  if(election) {
    //NOTE: some elections have a createDate attribute but not a lastUpdate attributes
    const targetDate = election.lastUpdate || election.createDate;
    formattedString = formatDate(targetDate);
  }
  return formattedString;
};

const Records = (props) => {
  //NOTE: currentPage is not zero-indexed
  const {openModal, currentPage, tableSize, applyTextHover, removeTextHover, openConfirmation, updateLists} = props;
  const startIndex = (currentPage - 1) * tableSize;
  const endIndex = currentPage * tableSize; //NOTE: endIndex is exclusive, not inclusive
  const visibleWindow = props.filteredList.slice(startIndex, endIndex);
  const dataIDTextStyle = Styles.TABLE.DATA_REQUEST_TEXT;
  const recordTextStyle = Styles.TABLE.RECORD_TEXT;

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

  const createActionButtons = (electionInfo, index) => {
    const name = "cell-button hover-color";
    const e = electionInfo.election;
    const dar = electionInfo.dar;
    const currentUserId = Storage.getCurrentUser().dacUserId;

    if (!isNil(e)) {
      switch (e.status) {
        case 'Open' :
          const votes = filter({type: 'DAC', dacUserId: currentUserId})(electionInfo.votes);
          const isFinal = !isEmpty(votes.find((voteData) => !isNil(voteData.vote)));
          const vote = head(votes);
          return [
            button({
              key: `vote-button-${e.referenceId}`,
              className: `${name} vote-button`,
              style: {flex: 1},
              onClick: () => props.history.push(`access_review/${dar.referenceId}/${vote.voteId}`)
            }, [`${isFinal ? 'Final' : 'Vote'}`]),
            button({
              key: `cancel-button-${e.referenceId}`,
              className: `${name} cancel-button`,
              style: {flex: 1},
              onClick: (e) => cancelElectionHandler(electionInfo, dar.referenceId, index)
            }, ['Cancel'])
          ];
        case 'Final' :
          return ['- -'];
        default :
          return button({
            key: `reopen-button-${e.referenceId}`,
            className: name,
            onClick: () => openConfirmation(dar, index)
          }, ["Re-Open"]);
      }
    }
    return button({
      key: `open-button-${e.referenceId}`,
      className: name,
      onClick: () => openConfirmation(dar, index)
    }, ["Open Election"]);
  };

  return visibleWindow.map((electionInfo, index) => {
    const {dar, dac, election} = electionInfo;
    const borderStyle = index > 0 ? {borderTop: "1px solid rgba(109,110,112,0.2)"} : {};
    return div({style: Object.assign({}, borderStyle, Styles.TABLE.RECORD_ROW), key: `${dar.data.referenceId}-${index}`}, [
      div({
        style: Object.assign({}, Styles.TABLE.DATA_ID_CELL, dataIDTextStyle),
        onClick: (e) => openModal(dar),
        onMouseEnter: applyTextHover,
        onMouseLeave: (e) => removeTextHover(e, Styles.TABLE.DATA_REQUEST_TEXT.color)
      }, [dar && dar.data ? dar.data.darCode : '- -']),
      div({style: Object.assign({}, Styles.TABLE.TITLE_CELL, recordTextStyle)}, [dar && dar.data ? dar.data.projectTitle : '- -']),
      div({style: Object.assign({}, Styles.TABLE.SUBMISSION_DATE_CELL, recordTextStyle)}, [getElectionDate(election)]),
      div({style: Object.assign({}, Styles.TABLE.DAC_CELL, recordTextStyle)}, [dac ? dac.name : '- -']),
      div({style: Object.assign({}, Styles.TABLE.ELECTION_STATUS_CELL, recordTextStyle)}, [election ? election.status : '- -']),
      div({style: Object.assign({}, Styles.TABLE.ELECTION_ACTIONS_CELL, recordTextStyle)}, [createActionButtons(electionInfo, index)]),
    ]);
  });
};

export default function NewChairConsole(props) {
  const [showModal, setShowModal] = useState(false);
  const [electionList, setElectionList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [tableSize, setTableSize] = useState();
  const [darDetails, setDarDetails] = useState({});
  const [researcher, setResearcher] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const searchTerms = useRef('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [createElectionInfo, setCreateElectionInfo,] = useState({id: null, name: null, index: null});

  useEffect(() => {
    const init = async() => {
      const initTableSize = 10;
      setTableSize(initTableSize);
      try {
        const pendingList = await DAR.getDataAccessManageV2();
        setElectionList(pendingList);
        setFilteredList(pendingList);
        setPageCount(Math.ceil(pendingList.length / initTableSize));
      } catch(error) {
        Notifications.showError({text: 'Error: Unable to retrieve data requests from server'});
      }
    };
    init();
  }, []);

  useEffect(() => {
    if(!isNil(filteredList) && !isNil(tableSize)) {
      setPageCount(Math.ceil(filteredList.length / tableSize));
    }
  }, [filteredList, tableSize]);

  const openModal = async (darInfo) => {
    let darData = darInfo.data;
    if (!isNil(darData)) {
      setShowModal(true);
      darData.researchType = DataUseTranslation.generateResearchTypes(darData);
      if(!darData.datasetNames) {
        darData.datasetNames = getDatasetNames(darData.datasets);
      }
      setDarDetails(darData);
      const researcher = await User.getById(darData.userId);
      setResearcher(researcher);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const openConfirmation = (dar, index) => {
    const darData = dar.data;
    if (!isNil(darData)) {
      setShowConfirmation(true);
      setCreateElectionInfo({id: darData.referenceId, name: darData.darCode, index});
    } else {
      Notifications.showError({text:"Cannot open this election. Please contact us for support."});
    }
  };

  const updateLists = (updatedElection, darId, index, successText) => {
    const i = index + ((currentPage - 1) * tableSize);
    let filteredListCopy = cloneDeep(filteredList);
    let electionListCopy = cloneDeep(electionList);
    filteredListCopy[parseInt(i, 10)].election = updatedElection;
    setFilteredList(filteredListCopy);
    const row = electionListCopy.find((element) => element.dar.referenceId === darId);
    row.election = Object.assign({}, row.election, updatedElection);
    setElectionList(electionListCopy);
    Notifications.showSuccess({text: successText});
  };

  const handleSearchChange = () => {
    setCurrentPage(1);
    const searchTermValues = toLower(searchTerms.current.value).split(/\s|,/);
    if(isEmpty(searchTermValues)) {
      setFilteredList(electionList);
    } else {
      let newFilteredList = cloneDeep(electionList);
      searchTermValues.forEach((splitTerm) => {
        const term = splitTerm.trim();
        if(!isEmpty(term)) {
          newFilteredList = filter(electionData => {
            const { election, dac} = electionData;
            const dar = electionData.dar ? electionData.dar.data : undefined;
            const targetDarAttrs = !isNil(dar) ? JSON.stringify([toLower(dar.projectTitle), toLower(dar.darCode)]) : [];
            const targetDacAttrs = !isNil(dac) ? JSON.stringify([toLower(dac.name)]) : [];
            const targetElectionAttrs = !isNil(election) ? JSON.stringify([toLower(election.status), getElectionDate(election)]) : [];
            return includes(term, targetDarAttrs) || includes(term, targetDacAttrs) || includes(term, targetElectionAttrs);
          }, newFilteredList);
        }
      });
      setFilteredList(newFilteredList);
    }
  };

  const goToPage = (currentPage) => {
    if(currentPage > 0 && currentPage < pageCount + 1) {
      setCurrentPage(currentPage);
    }
  };

  const changeTableSize = (newTableSize) => {
    if(!isEmpty(newTableSize) && newTableSize > 0) {
      setTableSize(newTableSize);
    }
  };

  const createElection = async (darId, index) => {
    if (!isNil(darId)) {
      try{
        const updatedElection = await Election.createDARElection(darId);
        const successMsg = 'Election successfully opened';
        updateLists(updatedElection, darId, index, successMsg);
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

  return (
    div({style: Styles.PAGE}, [
      div({ style: {display: "flex", justifyContent: "space-between"}}, [
        div({className: "left-header-section", style: Styles.LEFT_HEADER_SECTION}, [
          div({style: Styles.ICON_CONTAINER}, [
            img({
              id: 'lock-icon',
              src: '/images/lock-icon.png',
              style: Styles.HEADER_IMG
            })
          ]),
          div({style: Styles.HEADER_CONTAINER}, [
            div({style: Styles.TITLE}, ["Manage Data Access Request"]),
            div({style: Styles.SMALL}, ["Select and manage Data Access Requests for DAC review"])
          ])
        ]),
        div({className: "right-header-section", style: Styles.RIGHT_HEADER_SECTION}, [
          input({
            type: 'text',
            placeholder: 'Enter search terms',
            //Styling seems to only work when defined here, variable reference doesn't work
            //Odds are there's a competing style, need to figure out where it's coming from
            style: {
              width: '100%',
              border: '1px solid #cecece',
              backgroundColor: '#f3f6f7',
              borderRadius: '5px',
              height: '4rem',
              paddingLeft: '2%',
              fontFamily: 'Montserrat'
            },
            onChange:(e) => handleSearchChange(searchTerms.current),
            ref: searchTerms
          })
        ])
      ]),
      div({style: Styles.TABLE.CONTAINER}, [
        div({style: Styles.TABLE.HEADER_ROW}, [
          div({style: Styles.TABLE.DATA_ID_CELL}, ["Data Request ID"]),
          div({style: Styles.TABLE.TITLE_CELL}, ["Project title"]),
          div({style: Styles.TABLE.SUBMISSION_DATE_CELL}, ["Last Updated"]),
          div({style: Styles.TABLE.DAC_CELL}, ["DAC"]),
          div({style: Styles.TABLE.ELECTION_STATUS_CELL}, ["Election status"]),
          div({style: Styles.TABLE.ELECTION_ACTIONS_CELL}, ["Election actions"])
        ]),
        h(Records, {isRendered: !isEmpty(filteredList), filteredList, openModal, currentPage, tableSize, applyTextHover, removeTextHover, history: props.history, openConfirmation, updateLists})
      ]),
      h(PaginationBar, {pageCount, currentPage, tableSize, goToPage, changeTableSize, Styles, applyTextHover, removeTextHover}),
      h(DarModal, {showModal, closeModal, darDetails, researcher}),
      h(ConfirmationModal, {
        showConfirmation,
        setShowConfirmation,
        title: "Open Election?",
        message: "Are you sure you want the DAC to vote on this data access request?",
        header: createElectionInfo.name,
        onConfirm: createElection,
        id: createElectionInfo.id,
        index: createElectionInfo.index
      })
    ])
  );
};
