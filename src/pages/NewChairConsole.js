import {isEmpty, isNil, includes, toLower, filter} from 'lodash/fp';
import { useState, useEffect, useRef} from 'react';
import { div, h, img, input } from 'react-hyperscript-helpers';
import { DAR} from '../libs/ajax';
import { DataUseTranslation } from '../libs/dataUseTranslation';
import {Notifications, formatDate} from '../libs/utils';
import { Styles} from '../libs/theme';
import DarModal from '../components/modals/DarModal';

const getDatasetNames = (datasets) => {
  if(!datasets){return '';}
  const datasetNames = datasets.map((dataset) => {
    return dataset.label;
  });
  return datasetNames.join('\n');
};

const Records = (props) => {
  const {openModal, currentPage, tableSize} = props;
  const startIndex = (currentPage - 1) * tableSize;
  const endIndex = currentPage * tableSize; //NOTE: endIndex is exclusive, not inclusive
  const visibleWindow = props.filteredList.slice(startIndex, endIndex);
  const dataIDTextStyle = Styles.TABLE.DATA_REQUEST_TEXT;
  const recordTextStyle = Styles.TABLE.RECORD_TEXT;

  const applyDarTextHover = (e) => {
    e.target.style.color = Styles.TABLE.DAR_TEXT_HOVER.color;
    e.target.style.cursor = Styles.TABLE.DAR_TEXT_HOVER.cursor;
  };

  const removeDarTextHover = (e) => {
    e.target.style.color = Styles.TABLE.DATA_REQUEST_TEXT.color;
  };

  return visibleWindow.map((electionInfo, index) => {
    const {dar, dac, election} = electionInfo;
    const borderStyle = index > 0 ? {borderTop: "1px solid rgba(109,110,112,0.2)"} : {};
    return div({style: Object.assign({}, borderStyle, Styles.TABLE.RECORD_ROW), key: `${dar.data.darCode}`}, [
      div({
        style: Object.assign({}, Styles.TABLE.DATA_ID_CELL, dataIDTextStyle),
        onClick: (e) => openModal(dar),
        onMouseEnter: applyDarTextHover,
        onMouseLeave: removeDarTextHover
      }, [dar && dar.data ? dar.data.darCode : '- -']),
      div({style: Object.assign({}, Styles.TABLE.TITLE_CELL, recordTextStyle)}, [dar && dar.data ? dar.data.projectTitle : '- -']),
      div({style: Object.assign({}, Styles.TABLE.SUBMISSION_DATE_CELL, recordTextStyle)}, [election ? formatDate(election.lastUpdate) : '- -']),
      div({style: Object.assign({}, Styles.TABLE.DAC_CELL, recordTextStyle)}, [dac ? dac.name : '- -']),
      div({style: Object.assign({}, Styles.TABLE.ELECTION_STATUS_CELL, recordTextStyle)}, [election ? election.status : '- -']),
      div({style: Object.assign({}, Styles.TABLE.ELECTION_ACTIONS_CELL, recordTextStyle)}, ['Placeholder for buttons. (font style is placeholder as well)'])
    ]);
  });
};

const NewChairConsole = () => {
  const [showModal, setShowModal] = useState(false);
  const [electionList, setElectionList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [tableSize, setTableSize] = useState(15);
  const [darDetails, setDarDetails] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const searchTerms = useRef();

  useEffect(() => {
    const init = async() => {
      try {
        const pendingList = await DAR.getDataAccessManageV2();
        setElectionList(pendingList);
        setFilteredList(pendingList);
      } catch(error) {
        Notifications.showError({text: 'Error: Unable to retreive data requests from server'});
      };
    };
    init();
  }, []);

  const openModal = async (darInfo) => {
    let darData = darInfo.data;
    if(!isNil(darData)) {
      setShowModal(true);
      darData.researchType = DataUseTranslation.generateResearchTypes(darData);
      if(!darData.datasetNames) {
        darData.datasetNames = getDatasetNames(darData.datasets);
      }
      setDarDetails(darData);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSearchChange = () => {
    const searchTermValue = toLower(searchTerms.current.value);
    if(isEmpty(searchTermValue)) {
      setFilteredList(electionList);
    } else {
      const newFilteredList = filter(electionData => {
        const { election, dac} = electionData;
        const dar = electionData.dar ? election.dar.data : undefined;
        const targetDarAttrs = !isNil(dar) ? JSON.stringify([toLower(dar.projectTitle), toLower(dar.darCode)]) : [];
        const targetDacAttrs = !isNil(dac) ? JSON.stringify([toLower(dac.name)]) : [];
        const targetElectionAttrs = !isNil(election) ? JSON.stringify([toLower(election.status), election.lastUpdate]) : [];
        return includes(searchTermValue, targetDarAttrs) || includes(searchTermValue, targetDacAttrs) || includes(searchTermValue, targetElectionAttrs);
      }, electionList);
      setFilteredList(newFilteredList);
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
            onChange: handleSearchChange,
            ref: searchTerms
          })
        ])
      ]),
      div({style: Styles.TABLE.CONTAINER}, [
        div({style: Styles.TABLE.HEADER_ROW}, [
          div({style: Styles.TABLE.DATA_ID_CELL}, ["Data Request ID"]),
          div({style: Styles.TABLE.TITLE_CELL}, ["Project title"]),
          div({style: Styles.TABLE.SUBMISSION_DATE_CELL}, ["Submission date"]),
          div({style: Styles.TABLE.DAC_CELL}, ["DAC"]),
          div({style: Styles.TABLE.ELECTION_STATUS_CELL}, ["Election status"]),
          div({style: Styles.TABLE.ELECTION_ACTIONS_CELL}, ["Election actions"])
        ]),
        //NOTE: for now table is rendering electionList (the full list), will implement controlled view as part of pagination PR
        h(Records, {isRendered: !isEmpty(filteredList), filteredList, openModal, currentPage, tableSize})
      ]),
      //NOTE: TODO -> continue working/styling out modal
      h(DarModal, {showModal, closeModal, darDetails})
    ])
  );
};

export default NewChairConsole;