import { isEmpty, isNil, includes, map, toLower, filter, cloneDeep, find } from 'lodash/fp';
import { useState, useEffect, useRef } from 'react';
import { div, h, img, input } from 'react-hyperscript-helpers';
import { DAR, Election, User, Votes } from '../libs/ajax';
import { DataUseTranslation } from '../libs/dataUseTranslation';
import TableTextButton from '../components/TableTextButton';
import TableIconButton from '../components/TableIconButton';
import {Notifications, formatDate, getDatasetNames, applyTextHover, removeTextHover} from '../libs/utils';
import { Styles} from '../libs/theme';
import DarModal from '../components/modals/DarModal';
import PaginationBar from '../components/PaginationBar';
import {Storage} from "../libs/storage";
import { Block } from '@material-ui/icons';
import ConfirmationModal from "../components/modals/ConfirmationModal";
import lockIcon from '../images/lock-icon.png';

const wasVoteSubmitted = (vote) => {
  //NOTE: as mentioned elsewhere, legacy code has resulted in multiple sources for timestamps
  //current code will always provide lastUpdate
  const targetDate = vote.lastUpdate || vote.createDate || vote.updateDate || vote.lastUpdateDate;
  return !isNil(targetDate);
};

const wasFinalVoteTrue = (voteData) => {
  const {type, vote} = voteData;
  //vote status capitalizes final, election status does not
  return type === 'FINAL' && vote === true;
};

const processElectionStatus = (election, votes) => {
  let output;
  const electionStatus = election.status;

  if(!isEmpty(votes) && isNil(electionStatus)) {
    output = '- -';
  } else if(electionStatus === 'Open') {
    //Null check since react doesn't necessarily perform prop updates immediately
    if(!isEmpty(votes) && !isNil(election)) {
      const dacVotes = filter((vote) => vote.type === 'DAC' && vote.electionId === election.electionId)(votes);
      const completedVotes = (filter(wasVoteSubmitted)(dacVotes)).length;
      output = `Open (${completedVotes} / ${dacVotes.length} votes)`;
    }
    //some databases have Closed set as electionStatus, some have Final
    //they effectively mean the same thing, however string check needs to be done on both
  } else if (electionStatus === 'Final' || electionStatus === 'Closed') {
    const finalVote = find(wasFinalVoteTrue)(votes);
    output = finalVote ? 'Accepted' : 'Closed';
  } else {
    output = electionStatus;
  }
  return output;
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
    const e = electionInfo.election;
    const dar = electionInfo.dar;
    const dacId = isNil(electionInfo.dac) ? null: electionInfo.dac.dacId;
    const currentUser = Storage.getCurrentUser();
    const chairDacIds = map((role) => {return role.dacId;})(filter({roleId: 2})(currentUser.roles));
    const currentUserId = currentUser.dacUserId;
    const isChairForThisDAC = chairDacIds.includes(dacId);
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
              isRendered: isChairForThisDAC,
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
            label: 'Re-Open',
            isRendered: isChairForThisDAC
          });
      }
    }
    return h(TableTextButton, {
      onClick: () => openConfirmation(dar, index),
      key: `open-election-dar-${dar.referenceId}`,
      label: 'Open Election',
      isRendered: isChairForThisDAC
    });
  };

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
      const researcher = await User.getById(darInfo.userId);
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

  const closeConfirmation = () => {
    setShowConfirmation(false);
  };

  const updateLists = (updatedElection, darId, index, successText, votes = undefined) => {
    const i = index + ((currentPage - 1) * tableSize);
    let filteredListCopy = cloneDeep(filteredList);
    let electionListCopy = cloneDeep(electionList);
    const targetFilterRow = filteredListCopy[parseInt(i, 10)];
    const targetElectionRow = electionListCopy.find((element) => element.dar.referenceId === darId);
    targetFilterRow.election = updatedElection;
    targetElectionRow.election = cloneDeep(updatedElection);
    if(!isNil(votes)) {
      targetFilterRow.votes = votes;
      targetElectionRow.votes = cloneDeep(votes);
    }
    setFilteredList(filteredListCopy);
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
            const { election, dac, votes} = electionData;
            const dar = electionData.dar ? electionData.dar.data : undefined;
            const targetDarAttrs = !isNil(dar) ? JSON.stringify([toLower(dar.projectTitle), toLower(dar.darCode)]) : [];
            const targetDacAttrs = !isNil(dac) ? JSON.stringify([toLower(dac.name)]) : [];
            const targetElectionAttrs = !isNil(election) ? JSON.stringify([toLower(processElectionStatus(election, votes)), getElectionDate(election)]) : [];
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
        const votes = await Votes.getDarVotes(darId);
        const successMsg = 'Election successfully opened';
        updateLists(updatedElection, darId, index, successMsg, votes);
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
              src: lockIcon,
              style: Styles.HEADER_IMG
            })
          ]),
          div({style: Styles.HEADER_CONTAINER}, [
            div({style: Styles.TITLE}, ["DAC Chair Console"]),
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
            onChange:() => handleSearchChange(searchTerms.current),
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
        h(Records, {isRendered: !isEmpty(filteredList), filteredList, openModal, currentPage, tableSize, applyTextHover, removeTextHover, history: props.history, openConfirmation, updateLists}),
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
    ])
  );
}
