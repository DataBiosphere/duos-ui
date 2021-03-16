import _ from 'lodash';
import { Component, Fragment } from 'react';
import {a, button, div, h, img, span} from 'react-hyperscript-helpers';
import ReactTooltip from 'react-tooltip';
import { SearchBox } from '../components/SearchBox';
import {DAC, DAR, Election, User } from '../libs/ajax';
import * as Utils from '../libs/utils';
import {Styles} from "../libs/theme";
import PaginationBar from "../components/PaginationBar";
import ConfirmationModal from "../components/modals/ConfirmationModal";
import {DataUseTranslation} from '../libs/dataUseTranslation';
import { Notifications, applyTextHover, removeTextHover, getDatasetNames } from '../libs/utils';
import { cloneDeep, isNil } from "lodash/fp";
import lockIcon from "../images/lock-icon.png";
import DarModal from '../components/modals/DarModal';


class AdminManageAccess extends Component {

  constructor(props) {
    super(props);
    this.state = {
      disableBtn: false,
      disableCancelBtn: false,
      showModal: false,
      value: '',
      darElectionList: [],
      currentPage: 1,
      limit: 10,
      showDialogCreate: false,
      dacList: []
    };
  }

  closeCreateConfirmation = () => {
    this.setState({ showDialogCreate : false });
  };

  getElectionDarList = async () => {
    let darElection = [];

    const elections = await DAR.getDataAccessManage();
    elections.map(dar => {
      darElection.push(dar);
      return dar;
    });

    await this.setState(prev => {
      prev.currentPage = 1;
      prev.darElectionList = darElection;
      return prev;
    });
  };

  async componentDidMount() {
    await this.getElectionDarList();
    await this.getDACs();
    ReactTooltip.rebuild();
  }

  getDACs = async () => {
    const dacs = await DAC.list();
    this.setState(prev => {
      prev.dacList = dacs;
      return prev;
    });
  };

  handlePageChange = page => {
    this.setState(prev => {
      prev.currentPage = page;
      return prev;
    });
  };

  handleSizeChange = size => {
    this.setState(prev => {
      prev.limit = size;
      prev.currentPage = 1;
      return prev;
    });
  };

  openDialogCreate(dataRequestId, frontEndId) {
    this.setState({ showDialogCreate: true, dataRequestId: dataRequestId, frontEndId: frontEndId });
  }

  dialogHandlerCancel = async (dataRequestId, electionId) => {
    const CANCEL = "Canceled";
    this.setState({dataRequestId: dataRequestId, electionId: electionId });
    let electionToUpdate = {};
    electionToUpdate.status = 'Canceled';
    electionToUpdate.referenceId = dataRequestId;
    electionToUpdate.electionId = electionId;
    try {
      const updatedElection = await Election.updateElection(electionId, electionToUpdate);
      this.updateLists(updatedElection, CANCEL);
      Notifications.showSuccess({text: "Election has been cancelled."});
    } catch (error) {
      Notifications.showError({text: 'Error: Failed to cancel selected Election'});
    }
    this.setState({ showDialogCancel: false });
  };

  dialogHandlerCreate = async () => {
    const CREATE = "Open";
    try {
      const updatedElection = await Election.createDARElection(this.state.dataRequestId);
      this.updateLists(updatedElection, CREATE);
      Notifications.showSuccess({text: "Election successfully created."});
    } catch (errorResponse) {
      let errorMsg = '';
      if (errorResponse.status === 500) {
        errorMsg = "Email Service Error! The election was created but the participants couldnt be notified by Email.";
      } else {
        errorMsg = "Election cannot be created!";
      }
      Notifications.showError(errorMsg);
    }
    this.setState({ showDialogCreate: false });
  };

  updateLists = (updatedElection, typeOfAction) => {
    const electionListCopy = cloneDeep(this.state.darElectionList);
    const targetElectionRow = electionListCopy.find((dar) => dar.referenceId === this.state.dataRequestId);
    targetElectionRow.election = cloneDeep(updatedElection);
    targetElectionRow.electionStatus = typeOfAction;
    this.setState( {darElectionList: electionListCopy });
  };

  openReview = (dataRequestId) => {
    this.props.history.push(`review_results/${dataRequestId}`);
  };

  openResearcherReview(page, dacUserId) {
    this.props.history.push(`${page}/${dacUserId}`);
  }

  handleSearchDar = (query) => {
    this.setState({ searchDarText: query });
  };

  searchTable = (query) => (row) => {
    if (query) {
      let text = JSON.stringify(row);
      return text.toLowerCase().includes(query.toLowerCase());
    }
    return true;
  };

  findDacNameForDacId = (dacId) => {
    if (_.isNil(dacId)) {
      return '---';
    }
    const foundDac = _.findLast(this.state.dacList, (d) => { return d.dacId === dacId; });
    if (_.isNil(foundDac)) {
      return '---';
    }
    return foundDac.name;
  };

  render() {
    const { showModal, searchDarText, currentPage, limit, darDetails, researcher } = this.state;
    const pageCount = Math.ceil((this.state.darElectionList.filter(this.searchTable(searchDarText)).filter(row => !row.isCanceled).length).toFixed(1) / limit);
    const handleCloseModal = () => {
      this.setState({ showModal: false });
    };
    const openSummaryModal = async (dar) => {
      let darDetails = await DAR.getDarModalSummary(dar.dataRequestId);
      let researcherPromise;
      if (!isNil(darDetails)) {
        darDetails.researchType = DataUseTranslation.generateResearchTypes(darDetails);
        researcherPromise = await User.getById(darDetails.userId);
        if (!darDetails.datasetNames) {
          darDetails.datasetNames = getDatasetNames(darDetails.datasets);
        }
      }
      this.setState({showModal: true, darDetails: darDetails, researcher: researcherPromise });
    };

    return (
      div({style: Styles.PAGE}, [
        div({style: {display: "flex", justifyContent: "space-between"}}, [
          div({className: "left-header-section", style: Styles.LEFT_HEADER_SECTION}, [
            div({style: Styles.ICON_CONTAINER}, [
              img({
                id: 'lock-icon',
                src: lockIcon,
                style: Styles.HEADER_IMG
              })
            ]),
            div({style: Styles.HEADER_CONTAINER}, [
              div({style: Styles.TITLE}, ["Manage Data Access Request"]),
              div({style: Styles.SMALL}, ["Select and manage Data Access Requests for DAC review"])
            ]),
          ]),
          div({className: "right-header-section", style: Styles.RIGHT_HEADER_SECTION}, [
            h(SearchBox, {searchHandler: this.handleSearchDar, pageHandler: this.handlePageChange})
          ]),
        ]),
        div({style: Styles.TABLE.CONTAINER}, [
          div({style: Styles.TABLE.HEADER_ROW}, [
            div({ style: Styles.TABLE.DATA_ID_CELL }, ["Data Request ID"]),
            div({ style: Styles.TABLE.TITLE_CELL }, ["Project Title"]),
            div({ style: Styles.TABLE.SUBMISSION_DATE_CELL }, ["Date"]),
            div({ style: Styles.TABLE.DAC_CELL }, ['DAC']),
            div({ style: Styles.TABLE.ELECTION_STATUS_CELL }, ["Election Status"]),
            div({ style: Styles.TABLE.ELECTION_ACTIONS_CELL }, ["Election Actions"]),
          ]),
          this.state.darElectionList
            .filter(this.searchTable(searchDarText))
            .filter(row => !row.isCanceled)
            .slice((currentPage - 1) * limit, currentPage * limit)
            .map((dar, index) => {
              const borderStyle = index > 0 ? {borderTop: "1px solid rgba(109,110,112,0.2)"} : {};
              return h(Fragment, { key: dar.frontEndId }, [
                div({ style: Object.assign({}, borderStyle, Styles.TABLE.RECORD_ROW), paddingtop: '1rem' }, [
                  div({
                    style: Object.assign({}, Styles.TABLE.DATA_ID_CELL,  Styles.TABLE.DATA_REQUEST_TEXT),
                    onClick: () => openSummaryModal(dar),
                    onMouseEnter: applyTextHover,
                    onMouseLeave: (e) => removeTextHover(e, Styles.TABLE.DATA_REQUEST_TEXT.color)
                  }, [dar.frontEndId]),
                  div({ style: Object.assign({}, Styles.TABLE.RECORD_TEXT, Styles.TABLE.TITLE_CELL)}, [dar.projectTitle]),
                  div({ style: Object.assign({}, Styles.TABLE.RECORD_TEXT, Styles.TABLE.SUBMISSION_DATE_CELL)}, [Utils.formatDate(dar.createDate)]),
                  div({ style: Object.assign({}, Styles.TABLE.RECORD_TEXT, Styles.TABLE.DATA_ID_CELL) }, [this.findDacNameForDacId(dar.dacId)]),
                  div({ style: Object.assign({}, Styles.TABLE.RECORD_TEXT, Styles.TABLE.ELECTION_STATUS_CELL)}, [
                    span({ isRendered: dar.electionStatus === 'un-reviewed' }, [
                      a({ id: dar.frontEndId + "_linkUnreviewed", name: "link_unreviewed",
                        onClick: () => this.openReview(dar.referenceId)
                      }, ["Un-reviewed"]),
                    ]),
                    span({ isRendered: (dar.electionStatus === 'Open') || (dar.electionStatus === 'Final') }, [
                      a({ id: dar.frontEndId + "_linkOpen", name: "link_open",
                        onClick: () => this.openReview(dar.referenceId)
                      }, ["Open"]),
                    ]),
                    span({ isRendered: dar.electionStatus === 'Canceled' }, [
                      a({ id: dar.frontEndId + "_linkCanceled", name: "link_canceled",
                        onClick: () => this.openReview(dar.referenceId)
                      }, ["Canceled"]),
                    ]),
                    span({ isRendered: dar.electionStatus === 'Closed' || dar.electionStatus === 'PendingApproval' }, [
                      a({ id: dar.frontEndId + "_linkReviewed", name: "link_reviewed",
                        onClick: () => this.openReview(dar.referenceId)
                      }, [!dar.electionVote ? 'Denied' : 'Approved']),
                    ]),
                  ]),
                  div({style: Object.assign({}, Styles.TABLE.RECORD_TEXT, Styles.TABLE.ELECTION_ACTIONS_CELL, {paddingTop: "0.5rem"})}, [
                    div({
                      isRendered: (dar.electionStatus !== 'Open') && (dar.electionStatus !== 'Final'),
                      disabled: dar.electionStatus === 'PendingApproval'
                    }, [button({
                      style: {margin: "0 15px 5px 0"},
                      onClick: () => this.openDialogCreate(dar.dataRequestId, dar.frontEndId),
                      className: "cell-button hover-color"
                    }, ["Create"]),
                    ]),
                    div({
                      isRendered: (dar.electionStatus === 'Open') || (dar.electionStatus === 'Final'),
                    }, [button({
                      style: {margin: "0 15px 5px 0"},
                      onClick: () => this.dialogHandlerCancel(dar.dataRequestId, dar.electionId),
                      className: "cell-button cancel-color"
                    }, ["Cancel"]),
                    ]),

                    div({ style: {margin: "0 15px 8px"}, className: "bonafide-icon" }, [
                      a({
                        id: dar.frontEndId + "_flagBonafide",
                        name: "flag_bonafide",
                        onClick: () => this.openResearcherReview('researcher_review', dar.ownerUser.dacUserId)
                      }, [
                        span({
                          className: "glyphicon glyphicon-thumbs-up dataset-color",
                          isRendered: dar.status === 'approved',
                          "data-tip": "Bonafide researcher",
                          "data-for": "tip_bonafide"
                        }),
                        span({
                          className: "glyphicon glyphicon-thumbs-down cancel-color",
                          isRendered: dar.status === 'rejected',
                          "data-tip": "Non-Bonafide researcher",
                          "data-for": "tip_nonBonafide"
                        }),
                        span({
                          className: "glyphicon glyphicon-hand-right hover-color",
                          isRendered: dar.status === 'pending',
                          "data-tip": "Researcher review pending",
                          "data-for": "tip_pendingReview"
                        }),
                        span({
                          className: "glyphicon glyphicon-hand-right dismiss-color",
                          isRendered: dar.status === null
                        }),
                      ])
                    ])
                  ])
                ])
              ]);
            }),
          h(DarModal, { showModal, closeModal: handleCloseModal, darDetails, researcher }),
          h(ConfirmationModal, {
            showConfirmation: this.state.showDialogCreate,
            closeConfirmation: this.closeCreateConfirmation,
            title: "Create Election?",
            message: "Are you sure you want the DAC to vote on this data access request?",
            header: this.state.frontEndId,
            onConfirm: this.dialogHandlerCreate,
          }),
          h(ConfirmationModal, {
            showConfirmation: this.state.showDialogCancel,
            closeConfirmation: this.closeCancelConfirmation,
            title: "Create Election?",
            message: "Are you sure you want to cancel the current election process?",
            header: this.state.frontEndId,
            onConfirm: this.dialogHandlerCancel,
          }),
          h(PaginationBar, {pageCount: pageCount, currentPage: this.state.currentPage, tableSize: this.state.limit, goToPage: this.handlePageChange, changeTableSize: this.handleSizeChange}),
          h(ReactTooltip, {
            id: "tip_flag",
            place: 'right',
            effect: 'solid',
            multiline: true,
            className: 'tooltip-wrapper',
          }),
          h(ReactTooltip, {
            id: "tip_bonafide",
            place: 'left',
            effect: 'solid',
            multiline: true,
            className: 'tooltip-wrapper'
          }),
          h(ReactTooltip, {
            id: "tip_pendingReview",
            place: 'left',
            effect: 'solid',
            multiline: true,
            className: 'tooltip-wrapper'
          }),
          h(ReactTooltip, {
            id: "tip_nonBonafide",
            place: 'left',
            effect: 'solid',
            multiline: true,
            className: 'tooltip-wrapper'
          }),
        ])
      ])
    );
  }
}

export default AdminManageAccess;
