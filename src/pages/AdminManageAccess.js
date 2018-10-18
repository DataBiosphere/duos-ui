import { Component, Fragment } from 'react';
import { div, hr, span, a, h, button } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { DAR, Election } from '../libs/ajax';
import { PaginatorBar } from "../components/PaginatorBar";
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import ReactTooltip from 'react-tooltip';
import * as Utils from '../libs/utils';
import { ApplicationSummaryModal } from '../components/modals/ApplicationSummaryModal';
import { SearchBox } from '../components/SearchBox';
import { LoadingIndicator } from '../components/LoadingIndicator';

const limit = 10;

class AdminManageAccess extends Component {

  constructor(props) {
    super(props);
    this.state = {
      disableBtn: false,
      disableCancelBtn: false,
      loading: true,
      showModal: false,
      value: '',
      darElectionList: [],
      currentPage: 1,
      limit: limit,
      showDialogCancel: false,
      showDialogCreate: false,
    };
    this.getElectionDarList = this.getElectionDarList.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.okApplicationSummaryModal = this.okApplicationSummaryModal.bind(this);
  }

  async getElectionDarList() {
    let darElection = [];
    const elections = await DAR.getDataAccessManage();
    elections.map(dar => {
      darElection.push(dar);
      return dar;
    });

    this.setState(prev => {
      prev.loading = false;
      prev.currentPage = 1;
      prev.darElectionList = darElection;
      return prev;
    });
  };

  componentDidMount() {
    this.getElectionDarList().then(data => { return data });
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

  openDialogCancel(dataRequestId, electionId) {
    this.setState({ showDialogCancel: true, dataRequestId: dataRequestId, electionId: electionId });
  };

  openDialogCreate(dataRequestId) {
    this.setState({ showDialogCreate: true, dataRequestId: dataRequestId });
  };

  dialogHandlerCancel = (answer) => (e) => {
    this.setState({ disableBtn: answer, disableCancelBtn: answer });
    if (answer === true) {
      let electionToUpdate = {};
      electionToUpdate.status = 'Canceled';
      electionToUpdate.referenceId = this.state.dataRequestId;
      electionToUpdate.electionId = this.state.electionId;
      Election.updateElection(this.state.electionId, electionToUpdate).then(response => {
        this.getElectionDarList();
        this.setState({ showDialogCancel: false, disableBtn: false, disableCancelBtn: false });
      });
    } else {
      this.setState({ showDialogCancel: false });
    }
  };

  dialogHandlerCreate = (answer) => (e) => {
    this.setState({ disableBtn: answer, disableCancelBtn:answer });
    if (answer === true) {
      Election.createDARElection(this.state.dataRequestId)
        .then(value => {
          this.getElectionDarList();
          this.setState({ showDialogCreate: false, disableBtn: false, disableCancelBtn: false});
        })
        .catch(errorResponse => {
          if (errorResponse.status === 500) {
            this.setState({ alertTitle: 'Email Service Error!', alertMessage: 'The election was created but the participants couldnt be notified by Email.', disableCancelBtn: false });
          } else {
            errorResponse.json().then(error =>
              this.setState({ alertTitle: 'Election cannot be created!', alertMessage: error.message, disableCancelBtn: false})
            );
          }
        });
    } else {
      this.setState({ showDialogCreate: false, alertTitle: undefined,  alertMessage: undefined});
    }
  };

  openApplicationSummaryModal(dataRequestId, electionStatus) {
    this.setState({ showModal: true, dataRequestId: dataRequestId, calledFromAdmin: true });
  };

  handleCloseModal() {
    this.setState({ showModal: false });
  };

  open = (page, electionId, dataRequestId) => {
    this.props.history.push(`${page}/${dataRequestId}/?electionId=${electionId}`);
  };

  openAccessCollect = (page, electionId, dataRequestId) => {
    this.props.history.push(`${page}/${dataRequestId}/${electionId}`)
  };

  openAccessResultRecord = (page, electionId, dataRequestId) => {
    this.props.history.push(`${page}/${dataRequestId}/${electionId}`)
  };

  okApplicationSummaryModal() {
    this.setState({ showModal: false });
  };

  openResearcherReview(page, dacUserId) {
    this.props.history.push(`${page}/${dacUserId}`);
  };

  handleSearchDar = (query) => {
    this.setState({ searchDarText: query });
  };

  searchTable = (query) => (row) => {
    if (query && query !== undefined) {
      let text = JSON.stringify(row);
      return text.includes(query);
    }
    return true;
  };

  render() {

    const { searchDarText, currentPage, limit } = this.state;

    if (this.state.loading) { return LoadingIndicator(); }

    return (
      div({ className: "container container-wide" }, [

        div({ className: "row no-margin" }, [

          div({ className: "col-lg-8 col-md-8 col-sm-7 col-xs-12 no-padding" }, [
            PageHeading({
              id: "manageAccess", imgSrc: "/images/icon_manage_access.png", iconSize: "medium", color: "access",
              title: "Manage Data Access Request", description: "Select and manage Data Access Request for DAC review"
            }),
          ]),

          div({ className: "col-lg-4 col-md-4 col-sm-5 col-xs-12 search-wrapper no-padding" }, [
            h(SearchBox, { id: 'manageAccess', searchHandler: this.handleSearchDar, pageHandler: this.handlePageChange, color: 'access' })
          ]),
        ]),


        div({ className: "jumbotron table-box" }, [
          div({ className: "row no-margin" }, [
            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header access-color" }, ["Data Request id"]),
            div({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-3 cell-header access-color" }, ["Project title"]),
            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header access-color" }, ["Date"]),
            div({ className: "col-lg-1 col-md-1 col-sm-1 col-xs-1 cell-header f-center access-color" }, ["+ Info"]),
            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header f-center access-color" }, ["Election status"]),
            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header f-center access-color" }, ["Election actions"]),
          ]),

          hr({ className: "table-head-separator" }),

          this.state.darElectionList
            .filter(this.searchTable(searchDarText))
            .filter(row => !row.isCanceled)
            .slice((currentPage - 1) * limit, currentPage * limit)
            .map((dar) => {
              return h(Fragment, {key: dar.frontEndId}, [
                div({
                  id: dar.frontEndId,
                  className: "row no-margin tableRow " + (dar.needsApproval ? "list-highlighted" : "")
                }, [
                  div({
                    id: dar.frontEndId + "_darId", name: "darId",
                    className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text"
                  }, [
                    div({
                      id: dar.frontEndId + "_flagDarId",
                      name: "flag_darId",
                      isRendered: dar.needsApproval,
                      className: "glyphicon glyphicon-exclamation-sign " +
                      ((dar.dataSetElectionResult === 'Needs Approval') ? "access-color"
                        : (dar.dataSetElectionResult === 'Denied') ? "cancel-color"
                          : (dar.dataSetElectionResult === 'Approved')
                            ? "dataset-color" : "")
                        ,"data-tip": dar.dataSetElectionResult, "data-for": "tip_flag"
                      }, []),
                    span({className: "list-highlighted-item", title: dar.frontEndId}, [dar.frontEndId])
                  ]),
                  div({
                    id: dar.frontEndId + "_projectTitle",
                    name: "projectTitle",
                    className: "col-lg-3 col-md-3 col-sm-3 col-xs-3 cell-body text",
                    title: dar.projectTitle
                  }, [dar.projectTitle]),

                  div({
                    id: dar.frontEndId + "_createDate",
                    name: "createDate",
                    className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text"
                  }, [Utils.formatDate(dar.createDate)]),

                  div({className: "col-lg-1 col-md-1 col-sm-1 col-xs-1 cell-body f-center"}, [
                    button({
                      id: dar.frontEndId + "_btnSummary",
                      name: "btn_summary",
                      className: "cell-button hover-color",
                      onClick: () => this.openApplicationSummaryModal(dar.dataRequestId, dar.electionStatus)
                    }, ["Summary"]),
                  ]),

                  div({className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text bold f-center"}, [
                    span({isRendered: dar.electionStatus === 'un-reviewed'}, [
                      a({
                        id: dar.frontEndId + "_linkUnreviewed",
                        name: "link_unreviewed",
                        onClick: () => this.open('access_preview', dar.electionId, dar.dataRequestId)
                      }, ["Un-reviewed"]),
                    ]),
                    span({isRendered: (dar.electionStatus === 'Open') || (dar.electionStatus === 'Final')}, [
                      a({
                        id: dar.frontEndId + "_linkOpen",
                        name: "link_open",
                        onClick: () => this.openAccessCollect('access_collect', dar.electionId, dar.dataRequestId)
                      }, ["Open"]),
                    ]),
                    span({isRendered: dar.electionStatus === 'Canceled'}, [
                      a({
                        id: dar.frontEndId + "_linkCanceled",
                        name: "link_canceled",
                        onClick: () => this.open('access_preview', dar.electionId, dar.dataRequestId)
                      }, ["Canceled"]),
                    ]),
                    span({isRendered: dar.electionStatus === 'Closed' || dar.electionStatus === 'PendingApproval'}, [
                      a({
                        id: dar.frontEndId + "_linkReviewed",
                        name: "link_reviewed",
                        onClick: () => this.openAccessResultRecord('access_result_records', dar.electionId, dar.dataRequestId)
                      }, [!dar.electionVote ? 'Denied' : 'Approved']),
                    ]),
                  ]),
                  div({className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 no-padding cell-body text"}, [
                    div({className: "row no-margin"}, [
                      div({
                        isRendered: (dar.electionStatus !== 'Open') && (dar.electionStatus !== 'Final'),
                        className: "col-lg-10 col-md-10 col-sm-10 col-xs-9 cell-body f-center",
                        disabled: dar.electionStatus === 'PendingApproval'
                      }, [
                        button({
                          id: dar.frontEndId + "_btnCreate",
                          name: "btn_create",
                          onClick: () => this.openDialogCreate(dar.dataRequestId),
                          className: "cell-button hover-color"
                        }, ["Create"]),
                      ]),
                      div({
                        isRendered: (dar.electionStatus === 'Open') || (dar.electionStatus === 'Final'),
                        className: "col-lg-10 col-md-10 col-sm-10 col-xs-9 cell-body f-center"
                      }, [
                        button({
                          id: dar.frontEndId + "_btnCancel",
                          name: "btn_cancel",
                          onClick: () => this.openDialogCancel(dar.dataRequestId, dar.electionId),
                          className: "cell-button cancel-color"
                        }, ["Cancel"]),
                      ]),

                      div({className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 bonafide-icon cell-body text"}, [
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
                ]),
                hr({ className: "table-body-separator" })
              ]);
            }),
          ApplicationSummaryModal({
            isRendered: this.state.showModal, 
            showModal: this.state.showModal,
            onCloseRequest: this.handleCloseModal,
            dataRequestId: this.state.dataRequestId,
            calledFromAdmin: true
          }),
          ConfirmationDialog({
            title: 'Create election?',
            color: 'access',
            isRendered: this.state.showDialogCreate,
            showModal: this.state.showDialogCreate,
            disableOkBtn: this.state.disableBtn,
            disableNoBtn: this.state.disableCancelBtn,
            action: {
              label: "Yes",
              handler: this.dialogHandlerCreate
            },
            alertMessage: this.state.alertMessage,
            alertTitle: this.state.alertTitle
          }, [
              div({ className: "dialog-description" }, [
                span({}, ["Are you sure you want the DAC to vote on this case? "]),
              ])
            ]),

          ConfirmationDialog({
            title: 'Cancel election?',
            color: 'cancel',
            disableOkBtn: this.state.disableBtn,
            disableNoBtn: this.state.disableCancelBtn,
            isRendered: this.state.showDialogCancel,
            showModal: this.state.showDialogCancel,
            action: {
              label: "Yes",
              handler: this.dialogHandlerCancel
            }
          }, [
              div({ className: "dialog-description" }, [
                span({}, ["Are you sure you want to cancel the current election process? "]),
              ]),
            ]),
          PaginatorBar({
            total: this.state.darElectionList.filter(this.searchTable(searchDarText)).length,
            limit: limit,
            pageCount: this.pageCount,
            currentPage: currentPage,
            onPageChange: this.handlePageChange,
            changeHandler: this.handleSizeChange,
          }),
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


