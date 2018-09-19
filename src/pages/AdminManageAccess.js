import { Component, Fragment } from 'react';
import { div, hr, span, a, h, button } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { Purpose, Election } from '../libs/ajax';
import { PaginatorBar } from "../components/PaginatorBar";
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import ReactTooltip from 'react-tooltip';
import * as Utils from '../libs/utils';
import { ApplicationSummaryModal } from '../components/modals/ApplicationSummaryModal';
import { SearchBox } from '../components/SearchBox';

const limit = 10;

class AdminManageAccess extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      value: '',
      darElectionList: [],
      currentPage: 1,
      limit: limit,
      showDialogCancel: false,
      showDialogCreate: false,
    }
    this.getElectionDarList = this.getElectionDarList.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.okApplicationSummaryModal = this.okApplicationSummaryModal.bind(this);
  }

  async getElectionDarList() {
    let darElection = [];
    const elections = await Purpose.dataAccessRequestManageResource();
    elections.map(dar => {
      darElection.push(dar);
      return dar;
    });

    this.setState(prev => {
      prev.currentPage = 1;
      prev.darElectionList = darElection;
      return prev;
    });
  };

  componentWillMount() {
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
    this.setState({ showDialogCreate: true, dataRequestId: dataRequestId});
  };

  dialogHandlerCancel = (answer) => (e) => {
    if(answer === true) {
      let electionToUpdate = {};
      electionToUpdate.status = 'Canceled';
      electionToUpdate.referenceId = this.state.dataRequestId;
      electionToUpdate.electionId = this.state.electionId;
      Election.updateElection(this.state.electionId, electionToUpdate).then(response =>{
         this.getElectionDarList();
         this.setState({ showDialogCancel: false });
      });
    } else {
      this.setState({ showDialogCancel: false });
    }
  };

  dialogHandlerCreate = (answer) => (e) => {
    if (answer === true) {
      Election.DarElectionResourcePost(this.state.dataRequestId)
        .then(value => {
          this.getElectionDarList();
          this.setState({ showDialogCreate: false });
        })
        .catch(errorResponse => {
          if (errorResponse.status === 500) {
            this.setState({ alertTitle: 'Email Service Error!', alertMessage: 'The election was created but the participants couldnt be notified by Email.' });
          } else {
            errorResponse.json().then(error =>
              this.setState({ alertTitle: 'Election cannot be created!', alertMessage: error.message })
            );
          }
        });
    } else {
      this.setState({ showDialogCreate: false });
    }
  };

  openApplicationSummaryModal(dataRequestId, electionStatus) {
    this.setState({ showModal: true, dataRequestId: dataRequestId, calledFromAdmin: true });
  };

  handleCloseModal() {
    this.setState({ showModal: false });
  };

  open(page, electionId, dataRequestId) {
    this.props.history.push(`${page}/${dataRequestId}?electionId=${electionId}`);
  }

  openAccessReview(page, electionId, dataRequestId) {
    this.props.history.push(`${page}/${electionId}/${dataRequestId}`)
  }

  openAccessResultRecord(page, electionId, dataRequestId) {
    this.props.history.push(`${page}/${dataRequestId}/${electionId}`)
  }

  okApplicationSummaryModal() {
    this.setState({ showModal: false });
  };

  openResearcherReview(page, dacUserId) {
    this.props.history.push(`${page}/${dacUserId}`);
  };

  handleSearchDar = (query) => {
    this.setState({ searchDarText: query });
  }

  searchTable = (query) => (row) => {
    if (query && query !== undefined) {
      let text = JSON.stringify(row);
      return text.includes(query);
    }
    return true;
  }

  render() {

    const { searchDarText, currentPage, limit } = this.state;

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
            SearchBox({ id: 'manageAccess', searchHandler: this.handleSearchDar, color: 'access' })
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
          .slice((currentPage - 1) * limit, currentPage * limit)
          .map(dar => {
            return h(Fragment, { key: dar.frontEndId }, [
              div({ id: dar.frontEndId, className: "row no-margin " + (dar.needsApproval ? "list-highlighted" : "") }, [
                div({ id: dar.frontEndId + "_darId", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text", title: dar.frontEndId }, [
                  div({ id: dar.frontEndId + "_flag_darId", isRendered: dar.needsApproval, className: "glyphicon glyphicon-exclamation-sign " + (dar.needsApproval ? "access-color" : dar.dataSetElectionResult === 'Denied' ? "cancel-color" : dar.dataSetElectionResult === 'Approved' ? "dataset-color" : ""), "data-tip": "", "data-for": "tip_flag" }, []),
                  h(ReactTooltip, { id: "tip_flag", place: 'right', effect: 'solid', multiline: true, className: 'tooltip-wrapper' }, [dar.dataSetElectionResult]),
                  span({ id: dar.frontEndId + "_name_darId", className: "list-highlighted-item" }, [dar.frontEndId])
                ]),

                div({ id: dar.frontEndId + "_projectTitle", className: "col-lg-3 col-md-3 col-sm-3 col-xs-3 cell-body text", title: dar.projectTitle }, [dar.projectTitle]),

                div({ id: dar.frontEndId + "_createDate", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text" }, [Utils.formatDate(dar.createDate)]),

                div({ id: dar.frontEndId + "_btn_summary", href: "", className: "col-lg-1 col-md-1 col-sm-1 col-xs-1 cell-body f-center" }, [
                  button({ className: "cell-button hover-color", onClick: () => this.openApplicationSummaryModal(dar.dataRequestId, dar.electionStatus) }, ["Summary"]),
                ]),

                div({ id: dar.frontEndId + "_link_electionStatus", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text bold f-center" }, [
                  span({ isRendered: dar.electionStatus === 'un-reviewed' }, [
                    a({ onClick: () => this.open('access_preview', dar.electionId, dar.dataRequestId) }, ["Un-reviewed"]),
                  ]),
                  span({ isRendered: (dar.electionStatus === 'Open') || (dar.electionStatus === 'Final') }, [
                    a({ onClick: () => this.openAccessReview('access_review', dar.electionId, dar.dataRequestId) }, ["Open"]),
                  ]),
                  span({ isRendered: dar.electionStatus === 'Canceled' }, [
                    a({ onClick: () => this.open('access_preview', dar.electionId, dar.dataRequestId) }, ["Canceled"]),
                  ]),
                  span({ isRendered: dar.electionStatus === 'Closed' || dar.electionStatus === 'PendingApproval' }, [
                    a({ onClick: () => this.openAccessResultRecord('access_result_records', dar.electionId, dar.dataRequestId) }, ["Reviewed"]),
                  ]),
                ]),
                div({ id: dar.frontEndId + "_actions", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 no-padding cell-body text" }, [
                  div({ className: "row no-margin" }, [
                    div({ isRendered: (dar.electionStatus !== 'Open') && (dar.electionStatus !== 'Final') && (dar.electionStatus !== 'PendingApproval'), id: dar.frontEndId + "_btn_action", href: "", className: "col-lg-10 col-md-10 col-sm-10 col-xs-9 cell-body f-center", disabled: dar.electionStatus === 'PendingApproval' }, [
                      button({ onClick: () => this.openDialogCreate(dar.dataRequestId), className: "cell-button hover-color" }, ["Create"]),
                    ]),
                    div({ isRendered: (dar.electionStatus === 'Open') || (dar.electionStatus === 'Final'), id: dar.frontEndId + "_btn_action", href: "", className: "col-lg-10 col-md-10 col-sm-10 col-xs-9 cell-body f-center" }, [
                      button({ onClick: () => this.openDialogCancel(dar.dataRequestId, dar.electionId), className: "cell-button cancel-color" }, ["Cancel"]),
                    ]),

                    div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 bonafide-icon cell-body text" }, [
                      a({ id: dar.frontEndId + "_flag_bonafide", onClick: () => this.openResearcherReview('researcher_review', dar.ownerUser.dacUserId) }, [
                        span({ className: "glyphicon glyphicon-thumbs-up dataset-color",  "data-tip": "", "data-for": "tip_bonafide" }),
                        h(ReactTooltip, { id: "tip_bonafide", place: 'left', effect: 'solid', multiline: true, className: 'tooltip-wrapper' }, ["Bonafide researcher"]),

                        span({ className: "glyphicon glyphicon-thumbs-down cancel-color", isRendered: dar.status === 'rejected', "data-tip": "", "data-for": "tip_nonBonafide" }),
                        h(ReactTooltip, { id: "tip_nonBonafide", place: 'left', effect: 'solid', multiline: true, className: 'tooltip-wrapper' }, ["Non-Bonafide researcher"]),

                        span({ className: "glyphicon glyphicon-hand-right hover-color", isRendered: dar.status === 'pending', "data-tip": "", "data-for": "tip_pendingReview" }),
                        h(ReactTooltip, { id: "tip_pendingReview", place: 'left', effect: 'solid', multiline: true, className: 'tooltip-wrapper' }, ["Researcher review pending"]),

                        span({ className: "glyphicon glyphicon-hand-right dismiss-color", isRendered: dar.status === null }),
                      ])
                    ])
                  ])
                ])
              ]),
              hr({ className: "table-body-separator" })
            ]);
          }),
          ApplicationSummaryModal({
            showModal: this.state.showModal,
            onCloseRequest: this.handleCloseModal,
            dataRequestId: this.state.dataRequestId
          }),
          ConfirmationDialog({
            title: 'Create election?',
            color: 'access',
            showModal: this.state.showDialogCreate,
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
        ])
      ])
    );
  }
}

export default AdminManageAccess;


