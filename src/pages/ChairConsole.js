import {filter, isEmpty, isNil, find} from 'lodash/fp';
import Modal from 'react-modal';
import { useState, useEffect, useCallback, useRef} from 'react';
import { div, h, img } from 'react-hyperscript-helpers';
// import { SearchBox } from '../components/SearchBox';
import { DAR, DataSet, PendingCases } from '../libs/ajax';
import { Storage } from '../libs/storage';
// import { NavigationUtils, USER_ROLES } from '../libs/utils';
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
      top: "10%",
      bottom: "10%",
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
          return property.propertyName === "Dataset Name"
        }, dataset.properties);
        return nameProperty.propertyValue;
      });
    } catch(error) {
      Notifications.showError({text: 'Error: Failed to initilize datasets for modal'})
    }
  }
  return datasetNames.join('\n');
}

const processResearchTypes = (researchTypes) => {
  let researchStatements = '';
  if(!isEmpty(researchTypes)) {
    researchStatements = researchTypes.map(type => {
      return `${type.description} ${type.manualReview ? 'Requires manual review.' : ''}`;
    })
  }
  return researchStatements;
};

const Records = (props) => {
  const {openModal} = props;
  const dataIDTextStyle = styles.TABLE.DATA_REQUEST_TEXT;
  const recordTextStyle = styles.TABLE.RECORD_TEXT;
  return props.electionList.map((election, index) => {
    const borderStyle = index > 0 ? {borderTop: "1px solid rgba(109,110,112,0.2)"} : {};
    return div({style: Object.assign({}, borderStyle, styles.TABLE.RECORD_ROW), key: `${election.frontEndId}`}, [
      div({
        style: Object.assign({}, styles.TABLE.DATA_ID_CELL, dataIDTextStyle),
        onClick: (e) => openModal(election.referenceId)
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

export const ChairConsole = (props) => {
  const [showModal, setShowModal] = useState(false);
  const [darLimit, setDarLimit] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPendingVotes, setTotalPendingVotes] = useState(0);
  const [filteredList, setFilteredList] = useState([]);
  const [visibleList, setVisibleList] = useState([]);
  const [electionList, setElectionList] = useState([]);
  const [darDetails, setDarDetails] = useState({});
  const darCache = useRef({});

  //NOTE: skeleton function for pagination feature, to be implemented/expanded/revised in later PR
  const goToPage = useCallback((targetPage, currentPage, filteredList, darLimit) => {
    const targetStartIndex = targetPage * currentPage - darLimit;
    if(targetStartIndex + 1 < filteredList.length) {
      const targetEndIndex = targetPage * currentPage;
      setCurrentPage(targetPage);
      setVisibleList(filteredList.slice(targetStartIndex, targetEndIndex));
    }
  }, [setCurrentPage, setVisibleList]);

  useEffect(() => {
    const init = async() => {
      try {
        const currentUser = Storage.getCurrentUser();
        //NOTE: this endpoint needs to be adjusted so that it searches based on server side user data rather than a front-end argument
        const caseList = await PendingCases.findDataRequestPendingCasesByUser(currentUser.dacUserId);
        const pendingList = filter((e) => { return e.electionStatus !== 'Closed'; }, caseList.access);
        setTotalPendingVotes(pendingList.length);
        setElectionList(pendingList);
        setFilteredList(pendingList);
        if(pendingList.length > 0) {
          const endIndex = darLimit > pendingList.length ? darLimit : pendingList.length;
          setVisibleList(filteredList.slice(0, endIndex));
        }
        // this.setState(prev => {
        //   prev.currentUser = currentUser;
        //   // Filter vote-able elections. See https://broadinstitute.atlassian.net/browse/DUOS-789
        //   // for more work related to ensuring closed elections aren't displayed here.
        //   prev.electionList = _.filter(pendingList.access, (e) => { return e.electionStatus !== 'Closed'; });
        //   prev.totalAccessPendingVotes = pendingList.totalAccessPendingVotes;
        //   return prev;
        // });
      } catch(error) {
        Notifications.showError({text: 'Error: Unable to retreive data requests from server'});
      };
    };
    init();
  }, []);

  const openModal = async (referenceId) => {
    const cachedDar = darCache.current[referenceId];
    let darInfo;
     setShowModal(true);
    if(isNil(cachedDar)) {
      try {
        darInfo = await DAR.describeDar(referenceId);
        const datasetNames = await getDatasetNames(darInfo.datasetIds);
        darInfo.datasetNames = datasetNames;
        darCache.current[referenceId] = darInfo;
      } catch(error) {
        Notifications.showError('Error: Failed to initialize dar information for modal');
      }
    } else {
      darInfo = cachedDar;
    }
    setDarDetails(darInfo);
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
        h(Records, {isRendered: !isEmpty(electionList), electionList: filteredList, openModal})
      ]),
      //NOTE: TODO -> continue working/styling out modal 
      //NOTE: add loading placeholders for content
      h(Modal, {
        isRendered: !isEmpty(electionList), 
        isOpen: showModal, 
        onRequestClose: closeModal,
        shouldCloseOnOverlayClick: true,
        style: {
          content: styles.MODAL.CONTENT
        }
      }, [
        div({style: styles.MODAL.CONTENT}, [
          div({style: styles.MODAL.DAR_SUBHEADER}, [`${darDetails.darCode}`]),
          div({style: styles.MODAL.TITLE_HEADER}, [`${darDetails.projectTitle}`]),
          h(ModalDetailRow, {
            label: 'Primary Investigator', 
            detail: (darDetails.havePI ? darDetails.pi || darDetails.profileName : 'N/A')
          }),
          h(ModalDetailRow, {
            label: 'Researcher',
            detail: darDetails.profileName
          }),
          h(ModalDetailRow, {
            label: 'Institution',
            detail: darDetails.institution || 'N/A'
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

//NOTE: old code, will use as reference for building out new code
  // constructor(props) {
  //   super(props);
  //   this.state = {
  //     showModal: false,
  //     currentUser: {},
  //     darLimit: 5,
  //     currentDarPage: 1,
  //     totalAccessPendingVotes: 0,
  //     electionList: []
  //   };
  //   this.handleOpenModal = this.handleOpenModal.bind(this);
  //   this.handleCloseModal = this.handleCloseModal.bind(this);
  // }

  // handleAccessPageChange = page => {
  //   this.setState(prev => {
  //     prev.currentDarPage = page;
  //     return prev;
  //   });
  // };

  // handleAccessSizeChange = size => {
  //   this.setState(prev => {
  //     prev.darLimit = size;
  //     prev.currentDarPage = 1;
  //     return prev;
  //   });
  // };

  // async componentDidMount() {
  //   await this.init();
  // }

  // async init() {
  //   try {
  //     const currentUser = Storage.getCurrentUser();
  //     const pendingList = await PendingCases.findDataRequestPendingCasesByUser(currentUser.dacUserId);
  //     this.setState(prev => {
  //       prev.currentUser = currentUser;
  //       // Filter vote-able elections. See https://broadinstitute.atlassian.net/browse/DUOS-789
  //       // for more work related to ensuring closed elections aren't displayed here.
  //       prev.electionList = _.filter(pendingList.access, (e) => { return e.electionStatus !== 'Closed'; });
  //       prev.totalAccessPendingVotes = pendingList.totalAccessPendingVotes;
  //       return prev;
  //     });
  //   } catch(error) {
  //     Notifications.showError({text: 'Error: Unable to retreive data requests from server'});
  //   };
  // };

  // openFinalAccessReview = (referenceId, electionId, rpElectionId) => (e) => {
  //   this.props.history.push(`${'final_access_review'}/${referenceId}/${electionId}`);
  // };

  // openAccessReview = (referenceId, voteId, rpVoteId, alreadyVoted) => async (e) => {
  //   const pathStart = await NavigationUtils.accessReviewPath();
  //   let chairFinal = false;
  //   if(this.state.currentUser && alreadyVoted) {
  //     chairFinal = this.state.currentUser.isChairPerson;
  //   }
  //   if (rpVoteId !== null) {
  //     this.props.history.push(
  //       `${pathStart}/${referenceId}/${voteId}/${rpVoteId}`,
  //       {chairFinal}
  //     );
  //   } else {
  //     this.props.history.push(
  //       `${pathStart}/${referenceId}/${voteId}`,
  //       {chairFinal}
  //     );
  //   }
  // };

  // isAccessCollectEnabled = (pendingCase) => {
  //   const pendingCaseAccessCollectStatus =
  //     (pendingCase.alreadyVoted === true) &&
  //     (!pendingCase.isFinalVote) &&
  //     (pendingCase.electionStatus !== 'Final');
  //   const dacId = _.get(pendingCase, 'dac.dacId', 0);
  //   // if the pending case doesn't have a DAC, then any chair should be able to collect votes:
  //   if (dacId === 0) { return pendingCaseAccessCollectStatus; }
  //   const dacChairRoles = _.filter(this.state.currentUser.roles, { 'name': USER_ROLES.chairperson, 'dacId': dacId });
  //   return (!_.isEmpty(dacChairRoles)) && pendingCaseAccessCollectStatus;
  // };

  // openAccessCollect = (referenceId, electionId) => (e) => {
  //   this.props.history.push(`access_collect/${electionId}/${referenceId}`);
  // };


  // handleOpenModal() {
  //   this.setState({ showModal: true });
  // }

  // handleCloseModal() {
  //   this.setState({ showModal: false });
  // }

  // handleSearchDar = (query) => {
  //   this.setState({ searchDarText: query });
  // };

  // searchTable = (query) => (row) => {
  //   if (query) {
  //     let text = JSON.stringify(row);
  //     return text.toLowerCase().includes(query.toLowerCase());
  //   }
  //   return true;
  // };
