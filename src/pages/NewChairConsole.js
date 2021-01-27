import {filter, isEmpty, isNil, find, cloneDeep} from 'lodash/fp';
import Modal from 'react-modal';
import { useState, useEffect, useRef} from 'react';
import { div, h, img } from 'react-hyperscript-helpers';
// import { SearchBox } from '../components/SearchBox';
import { DAR, DataSet, PendingCases, User } from '../libs/ajax';
import { Storage } from '../libs/storage';
// import { NavigationUtils, USER_ROLES } from '../libs/utils';
import { DataUseTranslation } from '../libs/dataUseTranslation';
import {Notifications, formatDate} from '../libs/utils';
import { Theme } from '../libs/theme';

const styles = {
  PAGE: {
    width: "90%",
    margin: "0 auto"
  },
  TITLE: {
    fontFamily: "Montserrat",
    fontWeight: Theme.font.weight.semibold,
    fontSize: Theme.font.size.title,
  },
  SMALL: {
    fontFamily: 'Montserrat',
    fontWeight: Theme.font.weight.regular,
    fontSize: Theme.font.size.small
  },
  HEADER_IMG: {
    width: '60px',
    height: '60px',
  },
  HEADER_CONTAINER: {
    display: 'flex',
    flexDirection: "column"
  },
  ICON_CONTAINER: {
    flexBasis: '76px',
    height: '60px',
    paddingRight: '16px'
  },
  RIGHT_HEADER_SECTION: {
    display: 'flex',
    alignItems: 'flex-end'
  },
  LEFT_HEADER_SECTION: {
    display: 'flex',
    flexDirection: 'row',
    paddingTop: "3rem"
  },
  TABLE: {
    CONTAINER: {
      margin: "3rem auto"
    },
    HEADER_ROW: {
      fontFamily: "Montserrat",
      fontSize: "14px",
      color: "#00243C",
      fontWeight: Theme.font.weight.medium,
      backgroundColor: "#f3f6f7",
      display: "flex",
      justifyContent: "center",
      height: "51px"
    },
    RECORD_ROW: {
      fontFamily: 'Montserrat',
      fontWeight: Theme.font.weight.regular,
      fontSize: "14px",
      display: "flex",
      justifyContent: "center",
      height: "48px",
    },
    RECORD_TEXT: {
      color: "#00243C"
    },
    DAR_TEXT_HOVER: {
      cursor: 'pointer',
      color: '#0cabc5d9'
    },
    DATA_REQUEST_TEXT: {
      color: "#00609F",
      fontWeight: Theme.font.weight.semibold
    },
    //NOTE: play around with the cell measurements
    TITLE_CELL: {
      width: "18%",
      display: "flex",
      justifyContent: "left",
      alignItems: "center",
      margin: "0 2%"
    },
    DATA_ID_CELL: {
      width: "10%",
      margin: "0 2%",
      display: "flex",
      justifyContent: "left",
      alignItems: "center",
    },
    SUBMISSION_DATE_CELL: {
      width: "10%",
      margin: "0 2%",
      display: "flex",
      justifyContent: "left",
      alignItems: "center",
    },
    DAC_CELL: {
      width: "10%",
      margin: "0 2%",
      display: "flex",
      justifyContent: "left",
      alignItems: "center",
    },
    ELECTION_STATUS_CELL: {
      width: "10%",
      margin: "0 2%",
      display: "flex",
      justifyContent: "left",
      alignItems: "center",
    },
    ELECTION_ACTIONS_CELL: {
      width: "23%",
      margin: "0 2%",
      display: "flex",
      justifyContent: "left",
      alignItems: "center",
    }
  },
  MODAL: {
    CONTENT: {
      height: "auto",
      top: "20%",
      bottom: "20%",
      left: "20%",
      right: "20%",
      fontFamily: 'Montserrat',
      padding: "2%"
    },
    DAR_SUBHEADER: {
      display: 'flex',
      fontFamily: 'Montserrat',
      fontSize: '16px',
      fontWeight: Theme.font.weight.semibold,
      justifyContent: 'left',
      color: "#777"
    },
    TITLE_HEADER: {
      display: 'flex',
      fontFamily: 'Montserrat',
      fontSize: Theme.font.size.title,
      fontWeight: Theme.font.weight.regular,
      justifyContent: 'left',
      marginBottom: '4%'
    },
    DAR_DETAIL_ROW: {
      padding: '0 3%',
      margin: '2% 0',
      display: 'flex',
      justifyContent: 'space-between'
    },
    DAR_LABEL: {
      color: "#777777",
      fontSize: '14px',
      fontWeight: Theme.font.weight.semibold,
      width: "25%",
      textAlign: 'right'
    },
    DAR_DETAIL: {
      fontSize: '16px',
      fontWeight: Theme.font.weight.medium,
      width: "70%"
    }
  }
};

const getDatasetNames = async(datasetIds) => {
  let datasetNames = [];
  if(!isEmpty(datasetIds)) {
    try{
      const datasetPromises = datasetIds.map(datasetId => {
        return DataSet.getDataSetsByDatasetId(datasetId);
      });
      const datasets = await Promise.all(datasetPromises);
      datasetNames = datasets.map((dataset) => {
        let nameProperty = find((property) => {
          return property.propertyName === "Dataset Name";
        }, dataset.properties);
        return nameProperty.propertyValue;
      });
    } catch(error) {
      Notifications.showError({text: 'Error: Failed to initilize datasets for modal'});
    }
  }
  return datasetNames.join('\n');
};

const getResearcherProperties = async(userId) => {
  if(!isNil(userId)) {
    let researcherProperties = {};
    try{
      const researcherInfo = await User.getById(userId);
      researcherInfo.researcherProperties.forEach((property) => {
        researcherProperties[property.propertyKey] = property.propertyValue;
      });
      return Object.assign({}, researcherInfo, researcherProperties);
    }catch(error){
      Notifications.showError({text: 'Error: Failed to initialize researcher information'});
      return {};
    }
  }
};

const processResearchTypes = (researchTypes) => {
  let researchStatements = '';
  if(!isEmpty(researchTypes)) {
    researchStatements = researchTypes.map(type => {
      return `${type.description} ${type.manualReview ? 'Requires manual review.' : ''}`;
    });
  }
  return researchStatements;
};

const Records = (props) => {
  const {openModal} = props;
  const dataIDTextStyle = styles.TABLE.DATA_REQUEST_TEXT;
  const recordTextStyle = styles.TABLE.RECORD_TEXT;

  const applyDarTextHover = (e) => {
    e.target.style.color = styles.TABLE.DAR_TEXT_HOVER.color;
    e.target.style.cursor = styles.TABLE.DAR_TEXT_HOVER.cursor;
  };

  const removeDarTextHover = (e) => {
    e.target.style.color = styles.TABLE.DATA_REQUEST_TEXT.color;
  };

  return props.electionList.map((election, index) => {
    const borderStyle = index > 0 ? {borderTop: "1px solid rgba(109,110,112,0.2)"} : {};
    return div({style: Object.assign({}, borderStyle, styles.TABLE.RECORD_ROW), key: `${election.frontEndId}`}, [
      div({
        style: Object.assign({}, styles.TABLE.DATA_ID_CELL, dataIDTextStyle),
        onClick: (e) => openModal(election.referenceId),
        isRendered: !isNil(election.frontEndId),
        onMouseEnter: applyDarTextHover,
        onMouseLeave: removeDarTextHover
      }, [election.frontEndId]),
      div({style: Object.assign({}, styles.TABLE.TITLE_CELL, recordTextStyle)}, [election.projectTitle]),
      div({style: Object.assign({}, styles.TABLE.SUBMISSION_DATE_CELL, recordTextStyle)}, [formatDate(election.createDate)]),
      div({style: Object.assign({}, styles.TABLE.DAC_CELL, recordTextStyle)}, [election.dac.name]),
      div({style: Object.assign({}, styles.TABLE.ELECTION_STATUS_CELL, recordTextStyle)}, [election.electionStatus]),
      div({style: Object.assign({}, styles.TABLE.ELECTION_ACTIONS_CELL, recordTextStyle)}, ['Placeholder for buttons. (font style is placeholder as well)'])
    ]);
  });
};

const ModalDetailRow = (props) => {
  return (
    div({style: styles.MODAL.DAR_DETAIL_ROW}, [
      div({style: styles.MODAL.DAR_LABEL}, [props.label]),
      div({style: styles.MODAL.DAR_DETAIL}, [props.detail])
    ])
  );
};

const returnPIName = (havePI, isThePI, displayName, piName) => {
  let returnName;
  if(isThePI === "true") {
    returnName = displayName;
  }else if(havePI === "true") {
    returnName = piName;
  }
  return returnName || '- -';
};

const NewChairConsole = (props) => {
  const [showModal, setShowModal] = useState(false);
  // const [darLimit, setDarLimit] = useState(5);
  // const [currentPage, setCurrentPage] = useState(1);
  // const [totalPendingVotes, setTotalPendingVotes] = useState(0);
  // const [filteredList, setFilteredList] = useState([]);
  // const [visibleList, setVisibleList] = useState([]);
  const [electionList, setElectionList] = useState([]);
  const [darDetails, setDarDetails] = useState({});
  const [detailLoadingStatus, setDetailLoadingStatus] = useState(false);
  const [researcherDetails, setResearcherDetails] = useState({});
  const darCache = useRef({});

  //NOTE: skeleton function for pagination feature, to be implemented/expanded/revised in later PR
  // const goToPage = useCallback((targetPage, currentPage, filteredList, darLimit) => {
  //   const targetStartIndex = targetPage * currentPage - darLimit;
  //   if(targetStartIndex + 1 < filteredList.length) {
  //     const targetEndIndex = targetPage * currentPage;
  //     setCurrentPage(targetPage);
  //     setVisibleList(filteredList.slice(targetStartIndex, targetEndIndex));
  //   }
  // }, [setCurrentPage, setVisibleList]);

  useEffect(() => {
    const init = async() => {
      try {
        const currentUser = Storage.getCurrentUser();
        const caseList = await PendingCases.findDataRequestPendingCasesByUser(currentUser.dacUserId);
        const pendingList = filter((e) => { return e.electionStatus !== 'Closed'; }, caseList.access);

        //NOTE: commented out code below are thoughts/pseudocode for pagination/search initialization
        // setTotalPendingVotes(pendingList.length);
        setElectionList(pendingList);
        // setFilteredList(pendingList);
        // if(pendingList.length > 0) {
        //   const endIndex = darLimit > pendingList.length ? darLimit : pendingList.length;
        //   setVisibleList(filteredList.slice(0, endIndex));
        // }
      } catch(error) {
        Notifications.showError({text: 'Error: Unable to retreive data requests from server'});
      };
    };
    init();
  }, []);

  const openModal = async (referenceId) => {
    let darInfo, researcherInfo, datasetNames;
    const cachedDar = darCache.current[referenceId];
    setDetailLoadingStatus(true);
    setShowModal(true);
    if(isNil(cachedDar)) {
      try {
        darInfo = await DAR.getPartialDarRequest(referenceId);
        darInfo.researchType = DataUseTranslation.generateResearchTypes(darInfo);
        const researcherPromise = getResearcherProperties(darInfo.userId);
        const datasetPromises = getDatasetNames(darInfo.datasetIds);
        [researcherInfo, datasetNames] = await Promise.all([researcherPromise, datasetPromises]);
        darInfo.datasetNames = datasetNames;
        darInfo.researcherInfo = researcherInfo;
        darCache.current[referenceId] = cloneDeep(darInfo);
      } catch(error) {
        Notifications.showError({text: 'Error: Failed to initialize dar information for modal'});
      }
    } else {
      darInfo = cachedDar;
      researcherInfo = darInfo.researcherInfo;
    }
    setDarDetails(darInfo);
    setResearcherDetails(researcherInfo);
    setDetailLoadingStatus(false);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    div({style: styles.PAGE}, [
      div({ style: {display: "flex", justifyContent: "space-between"}}, [
        div({className: "left-header-section", style: styles.LEFT_HEADER_SECTION}, [
          div({style: styles.ICON_CONTAINER}, [
            img({
              id: 'lock-icon',
              src: '/images/lock-icon.png',
              style: styles.HEADER_IMG
            })
          ]),
          div({style: styles.HEADER_CONTAINER}, [
            div({style: styles.TITLE}, ["Manage Data Access Request"]),
            div({style: styles.SMALL}, ["Select and manage Data Access Requests for DAC review"])
          ])
        ]),
        div({className: "right-header-section", style: styles.RIGHT_HEADER_SECTION}, [
          //NOTE:search bar should be added here, will implement alongside pagination since it has its hooks in it
        ])
      ]),
      div({style: styles.TABLE.CONTAINER}, [
        div({style: styles.TABLE.HEADER_ROW}, [
          div({style: styles.TABLE.DATA_ID_CELL}, ["Data Request ID"]),
          div({style: styles.TABLE.TITLE_CELL}, ["Project Title"]),
          div({style: styles.TABLE.SUBMISSION_DATE_CELL}, ["Submission date"]),
          div({style: styles.TABLE.DAC_CELL}, ["DAC"]),
          div({style: styles.TABLE.ELECTION_STATUS_CELL}, ["Election status"]),
          div({style: styles.TABLE.ELECTION_ACTIONS_CELL}, ["Election Actions"])
        ]),
        //NOTE: for now table is rendering electionList (the full list), will implement controlled view as part of pagination PR
        h(Records, {isRendered: !isEmpty(electionList), electionList: electionList, openModal})
      ]),
      //NOTE: TODO -> continue working/styling out modal
      //NOTE: add loading placeholders for content
      h(Modal, {
        isRendered: !detailLoadingStatus,
        isOpen: showModal,
        onRequestClose: closeModal,
        shouldCloseOnOverlayClick: true,
        style: {
          content: styles.MODAL.CONTENT
        }
      }, [
        div({style: styles.MODAL.CONTENT, isRendered: !detailLoadingStatus}, [
          div({style: styles.MODAL.DAR_SUBHEADER}, [`${darDetails.darCode}`]),
          div({style: styles.MODAL.TITLE_HEADER}, [`${darDetails.projectTitle}`]),
          h(ModalDetailRow, {
            label: 'Primary Investigator',
            detail: returnPIName(
              darDetails.havePI,
              researcherDetails.isThePI,
              researcherDetails.displayName,
              researcherDetails.piName || researcherDetails.investigator
            )
          }),
          h(ModalDetailRow, {
            label: 'Researcher',
            detail:researcherDetails.displayName || '- -'
          }),
          h(ModalDetailRow, {
            label: 'Institution',
            detail: researcherDetails.institution || '- -'
          }),
          h(ModalDetailRow, {
            label: 'Dataset(s)',
            detail: darDetails.datasetNames
          }),
          h(ModalDetailRow, {
            label: 'Type of Research',
            detail: processResearchTypes(darDetails.researchType)
          })
        ])
      ])
    ])
  );
};

export default NewChairConsole;