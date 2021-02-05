import {isEmpty, isNil} from 'lodash/fp';
import React, { useState, useEffect} from 'react';
import {div, button, h, img, span} from 'react-hyperscript-helpers';
import {DAR, Election} from '../libs/ajax';
import { DataUseTranslation } from '../libs/dataUseTranslation';
import {Notifications, formatDate} from '../libs/utils';
import { Styles} from '../libs/theme';
import DarModal from '../components/modals/DarModal';
import {ConfirmationDialog} from "../components/ConfirmationDialog";

const getDatasetNames = (datasets) => {
  if(!datasets){return '';}
  const datasetNames = datasets.map((dataset) => {
    return dataset.label;
  });
  return datasetNames.join('\n');
};

const Records = (props) => {
  let showCreateDialog = false;
  const history = props.history;
  const {openModal} = props;
  const dataIDTextStyle = Styles.TABLE.DATA_REQUEST_TEXT;
  const recordTextStyle = Styles.TABLE.RECORD_TEXT;

  const applyDarTextHover = (e) => {
    e.target.style.color = Styles.TABLE.DAR_TEXT_HOVER.color;
    e.target.style.cursor = Styles.TABLE.DAR_TEXT_HOVER.cursor;
  };

  const removeDarTextHover = (e) => {
    e.target.style.color = Styles.TABLE.DATA_REQUEST_TEXT.color;
  };

  const confirm = (dar) => ConfirmationDialog({
    title: 'Open election?',
    color: 'access',
    isRendered: showCreateDialog,
    showModal: showCreateDialog,
    disableOkBtn: false,
    disableNoBtn: false,
    action: {
      label: "Yes",
      handler: createElection(dar)
    },
    alertMessage: "",
    alertTitle: ""
  }, [
    div({ className: "dialog-description" }, [
      span({}, ["Are you sure you want to open this election?"]),
    ])
  ])

  function createElection(dar) {
    if (window.confirm("Are you sure you would like to open this election?")) {
      Election.createDARElection(dar.referenceId)
        .then()
        .catch(errorResponse => {
          if (errorResponse.status === 500) {
            alert("Email Service Error! The election was created but the participants couldnt be notified by Email.");
          } else {
            errorResponse.json().then(error =>
              alert("Election cannot be created! " + error.message));
          }
        })
      window.location.reload();
    }
  }

  const createActionButton = (props, dar, e) => {
    const name = "cell-button hover-color";
    if (e !== null && e !== undefined) {
      switch (e.status) {
        case "Open" :
          return button({
            className: name,
            onClick: () => history.push(`access_preview/${dar.referenceId}/?electionId=${e.electionId}`)
            //href: `new_access_review/${dar.referenceId}/?electionId=${e.electionId}`,
            // onClick: () => <Redirect
            //   to={{ pathname: `new_access_review/${dar.dataRequestId}/?electionId=${e.electionId}`,
            //   state: { from: props.location} }}>
            // </Redirect>
          }, ["Vote"]);
        case "Final":
          return button({
            className: name,
            onClick: () => createElection(dar)
          }, ["Re-Open"]);
        case "Canceled":
          return button({
            className: name,
            onClick: () => createElection(dar)
          }, ["Re-Open"]);
        case "Closed":
          return button({
            className: name,
            onClick: () => createElection(dar)
          }, ["Re-Open"]);
      }
    }
    return button({
      className: name,
      onClick: () => createElection(dar, e)
    }, ['Open Election']);
  }


  return props.electionList.map((electionInfo, index) => {
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
      div({style: Object.assign({}, Styles.TABLE.ELECTION_ACTIONS_CELL, recordTextStyle)}, [createActionButton(props, dar, election)])
    ]);
  });
};

const NewChairConsole = (props) => {
  const [showModal, setShowModal] = useState(false);
  const [electionList, setElectionList] = useState([]);
  const [darDetails, setDarDetails] = useState({});

  useEffect(() => {
    const init = async() => {
      try {
        const pendingList = await DAR.getDataAccessManageV2();
        setElectionList(pendingList);
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
          //NOTE:search bar should be added here, will implement alongside pagination since it has its hooks in it
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
        h(Records, {isRendered: !isEmpty(electionList), electionList: electionList, openModal, history: props.history})
      ]),
      //NOTE: TODO -> continue working/styling out modal
      h(DarModal, {showModal, closeModal, darDetails})
    ])
  );
};

export default NewChairConsole;