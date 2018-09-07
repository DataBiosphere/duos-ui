import { Component, Fragment } from 'react';
import { div, hr, span, a, h, button } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { Purpose } from '../libs/ajax';
import { PaginatorBar } from "../components/PaginatorBar";
import { ConfirmationDialog } from '../components/ConfirmationDialog';

const limit = 10;


class AdminManageAccess extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      darElectionList: [],
      currentPage: 1,
      limit: limit,
      showDialogCancel: false,
      showDialogCreate: false,
    }

    this.getElectionDarList = this.getElectionDarList.bind(this);
    this.myHandler = this.myHandler.bind(this);
  }

  myHandler(event) {
    // TBD
  }

  async getElectionDarList() {
    let darElection = [];
    const elections = await Purpose.dataAccessRequestManageResource();
    elections.map(dar => {
      console.log(dar);
      darElection.push(dar);
      return dar;
    });

    this.setState(prev => {
      prev.currentPage = 1;
      prev.darElectionList = darElection;
      return prev;
    });
  }

  componentWillMount() {
    this.getElectionDarList().then(data => { return data });
  }


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

  openDialogCancel = (e) => {
    this.setState({ showDialogCancel: true });
  };

  openDialogCreate = (e) => {
    this.setState({ showDialogCreate: true });
  };

  dialogHandlerCancel = (answer) => (e) => {
    this.setState({ showDialogCancel: false });
  };

  dialogHandlerCreate = (answer) => (e) => {
    this.setState({ showDialogCreate: false });
  };

  open(data) {

  }

  render() {

    return (

      div({ className: "container" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({ id: "manageAccess", imgSrc: "/images/icon_manage_access.png", iconSize: "medium", color: "access", title: "Manage Data Access Request", description: "Select and manage Data Access Request for DAC review" }),
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

          hr({ className: "pvotes-main-separator" }),

          this.state.darElectionList.map(dar => {
            return h(Fragment, { key: dar.frontEndId }, [
              div({ id: dar.frontEndId, className: "row no-margin " + (dar.needsApproval ? "list-highlighted" : "") }, [
                div({ id: dar.frontEndId + "_darId", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text", title: dar.frontEndId }, [
                  div({ id: dar.frontEndId + "_flag_darId", isRendered: dar.needsApproval, className: "glyphicon glyphicon-exclamation-sign " + (dar.needsApproval ? "access-color" : dar.dataSetElectionResult === 'Denied' ? "cancel-color" : dar.dataSetElectionResult === 'Approved' ? "dataset-color" : "") }, []),
                  //  "tooltip": "this.dar.dataSetElectionResult ", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right"
                  span({ id: dar.frontEndId + "_name_darId", className: "list-highlighted-item" }, [dar.frontEndId])
                ]),

                div({ id: dar.frontEndId + "_projectTitle", className: "col-lg-3 col-md-3 col-sm-3 col-xs-3 cell-body text", title: dar.projectTitle }, [dar.projectTitle]),

                div({ id: dar.frontEndId + "_createDate", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text" }, [dar.createDate | "date:'yyyy-MM-dd'"]),

                div({ id: dar.frontEndId + "_btn_summary", href: "", className: "col-lg-1 col-md-1 col-sm-1 col-xs-1 cell-body f-center" }, [
                  button({ className: "cell-button hover-color", onClick: "this.openApplication(dar.dataRequestId, dar.electionStatus)" }, ["Summary"]),
                ]),

                div({ id: dar.frontEndId + "_link_electionStatus", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text bold f-center" }, [
                  span({ isRendered: dar.electionStatus === 'un-reviewed' }, [
                    a({ onClick: this.open('access_preview_results', dar.electionId, dar.dataRequestId) }, ["Un-reviewed"]),
                  ]),
                  span({ isRendered: (dar.electionStatus === 'Open') || (dar.electionStatus === 'Final') }, [
                    a({ onClick: this.open('access_review_results', dar.electionId, dar.dataRequestId) }, ["Open"]),
                  ]),
                  span({ isRendered: dar.electionStatus === 'Canceled' }, [
                    a({ onClick: this.open('access_preview_results', dar.electionId, dar.dataRequestId) }, ["Canceled"]),
                  ]),
                  span({ isRendered: dar.electionStatus === 'Closed' || dar.electionStatus === 'PendingApproval' }, [
                    a({ onClick: this.open('access_results_record', dar.electionId, dar.dataRequestId) }, ["Reviewed"]),
                  ]),
                ]),

                div({ id: dar.frontEndId + "_actions", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 no-padding cell-body text" }, [
                  div({ className: "row no-margin" }, [
                    div({ isRendered: (dar.electionStatus !== 'Open') && (dar.electionStatus !== 'Final') && (dar.electionStatus !== 'PendingApproval'), id: dar.frontEndId + "_btn_action", href: "", className: "col-lg-10 col-md-10 col-sm-10 col-xs-9 cell-body f-center", disabled: dar.electionStatus === 'PendingApproval' }, [
                      button({ onClick: this.openDialogCreate, className: "cell-button hover-color" }, ["Create"]),
                    ]),
                    div({ isRendered: (dar.electionStatus === 'Open') || (dar.electionStatus === 'Final'), id: dar.frontEndId + "_btn_action", href: "", className: "col-lg-10 col-md-10 col-sm-10 col-xs-9 cell-body f-center" }, [
                      button({ onClick: this.openDialogCancel, className: "cell-button cancel-color" }, ["Cancel"]),
                    ]),

                    div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 bonafide-icon cell-body text" }, [
                      a({ id: dar.frontEndId + "_flag_bonafide", onClick: "this.openResearcherReview('researcher_review', dar.ownerUser.dacUserId)" }, [
                        span({
                          className: "glyphicon glyphicon-thumbs-up dataset-color", isRendered: dar.status === 'approved'
                          // , "tooltip": "Bonafide researcher", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "left"
                        }, []),
                        span({
                          className: "glyphicon glyphicon-thumbs-down cancel-color", isRendered: dar.status === 'rejected'
                          // , "tooltip": "Non-Bonafide researcher", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "left" 
                        }, []),
                        span({
                          className: "glyphicon glyphicon-hand-right hover-color", isRendered: dar.status === 'pending'
                          // , "tooltip": "Researcher review pending", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "left" 
                        }, []),
                        span({ className: "glyphicon glyphicon-hand-right dismiss-color", isRendered: dar.status === null }, []),
                      ])
                    ])
                  ])
                ])
              ]),
              hr({ className: "pvotes-separator" }),

              ConfirmationDialog({
                title: 'Cancel election?', color: 'cancel', showModal: this.state.showDialogCancel, action: { label: "Yes", handler: this.dialogHandlerCancel }
              }, [
                  div({ className: "dialog-description" }, [
                    span({}, ["Are you sure you want to cancel the current election process? "]),
                  ]),
                ]),

              ConfirmationDialog({
                title: 'Create election?', color: 'access', showModal: this.state.showDialogCreate, action: { label: "Yes", handler: this.dialogHandlerCreate }
              }, [
                  div({ className: "dialog-description" }, [
                    span({}, ["Are you sure you want the DAC to vote on this case? "]),
                  ])
                ]),
            ]);
          }),
          PaginatorBar({
            total: this.state.darElectionList.length,
            limit: this.state.limit,
            pageCount: this.pageCount,
            currentPage: this.state.currentPage,
            onPageChange: this.handlePageChange,
            changeHandler: this.handleSizeChange,
          }),
        ])
      ])
    );
  }
}

export default AdminManageAccess;


