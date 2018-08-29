import { Component, Fragment } from 'react';
import { div, hr, span, a, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';

class AdminManageAccess extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: ''
    }

    this.myHandler = this.myHandler.bind(this);
  }

  myHandler(event) {
    // TBD
  }

  open(data) {

  }

  render() {
    return (
      
      div({ className: "container" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({ imgSrc: "/images/icon_manage_access.png", iconSize: "medium", color: "access", title: "Manage Data Access Request", description: "Select and manage Data Access Request for DAC review" }),
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

          // div({ "dir-paginate": "dar in AdminManageAccess.dars | filter: searchAccess | itemsPerPage:10", "current-page": "AdminManageAccess.currentDARPage" }, [
            // this.state.userList.map(dar => {
              // return h(Fragment, {}, [
                // div({ key: dar.frontEndId, id: dar.frontEndId, className: "row no-margin " + (dar.needsApproval ? "list-highlighted" : ""), }, [
                //   div({ id: dar.frontEndId + "_darId", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text", title: "this.dar.frontEndId" }, [
                //     div({
                //       id: dar.frontEndId + "_flag_darId", className: "glyphicon glyphicon-exclamation-sign " + (dar.needsApproval ? "access-color" : dar.needsApproval ? "access-color" : dar.needsApproval ? "access-color" : ""),
                //       // "ng-class": "{'access-color': dar.needsApproval, 'cancel-color': dar.dataSetElectionResult :: 'Denied','dataset-color': dar.dataSetElectionResult :: 'Approved'}",
                //       //  "tooltip": "this.dar.dataSetElectionResult ", "tooltip-class": "tooltip-class"
                //       // , "tooltip-trigger": "true", "tooltip-placement": "right", "ng-show": "dar.needsApproval"
                //     }, []),
                //     span({ id: dar.frontEndId + "_name_darId", className: "list-highlighted-item" }, ["this.dar.frontEndId "]),
                //   ]),

                //   div({ id: dar.frontEndId + "_projectTitle", className: "col-lg-3 col-md-3 col-sm-3 col-xs-3 cell-body text", title: "this.dar.projectTitle" }, [dar.projectTitle]),

                //   div({ id: dar.frontEndId + "_createDate", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text" }, [dar.createDate | "date:'yyyy-MM-dd'"]),

                //   a({ id: dar.frontEndId + "_btn_summary", href: "", className: "admin-manage-buttons col-lg-1 col-md-1 col-sm-1 col-xs-1 no-padding" }, [
                //     div({ className: "enabled hover-color", onClick: "AdminManageAccess.openApplication(dar.dataRequestId, dar.electionStatus)" }, ["Summary"]),
                //   ]),

                //   div({ id: dar.frontEndId + "_link_electionStatus", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text bold" }, [
                //     span({ isRendered: "dar.electionStatus :: 'un-reviewed'" }, [
                //       a({ onClick: this.open("access_preview_results, dar.electionId, dar.dataRequestId") }, ["Un-reviewed"]),
                //     ]),
                //     span({ isRendered: "dar.electionStatus :: 'Open' || dar.electionStatus :: 'Final'" }, [
                //       a({ onClick: "AdminManageAccess.open('access_review_results', dar.electionId, dar.dataRequestId)" }, ["Open"]),
                //     ]),
                //     span({ isRendered: "dar.electionStatus :: 'Canceled'" }, [
                //       a({ onClick: "AdminManageAccess.open('access_preview_results', dar.electionId, dar.dataRequestId)" }, ["Canceled"]),
                //     ]),
                //     span({ isRendered: "dar.electionStatus :: 'Closed' || dar.electionStatus :: 'PendingApproval'" }, [
                //       a({ onClick: "AdminManageAccess.open('access_results_record', dar.electionId, dar.dataRequestId)" }, ["Reviewed"]),
                //     ]),
                //   ]),

                //   div({ id: dar.frontEndId + "_actions", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 no-padding cell-body text" }, [
                //     div({ className: "row no-margin" }, [
                //       a({ id: dar.frontEndId + "_btn_action", href: "", className: "admin-manage-buttons col-lg-10 col-md-10 col-sm-10 col-xs-9" }, [
                //         div({ isRendered: "dar.electionStatus !: 'Open' &&  dar.electionStatus !: 'Final' && dar.electionStatus !: 'PendingApproval'", className: "create hover-color", onClick: "AdminManageAccess.openCreate(dar.dataRequestId)" }, ["Create"]),
                //         div({ isRendered: "dar.electionStatus :: 'PendingApproval'", className: "disabled" }, ["Create"]),
                //         div({ isRendered: "dar.electionStatus :: 'Open'||  dar.electionStatus :: 'Final'", className: "cancel hover-color", onClick: "AdminManageAccess.openCancel(dar)" }, ["Cancel"]),
                //       ]),
                //       div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 bonafide-icon cell-body text" }, [
                //         a({ id: dar.frontEndId + "_flag_bonafide", isRendered: "dar.status !:: null", onClick: "AdminManageAccess.openResearcherReview('researcher_review', dar.ownerUser.dacUserId)" }, [
                //           span({ className: "glyphicon glyphicon-thumbs-up dataset-color", isRendered: "dar.status ::: 'approved'", "tooltip": "Bonafide researcher", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "left" }, []),
                //           span({ className: "glyphicon glyphicon-thumbs-down cancel-color", isRendered: "dar.status ::: 'rejected'", "tooltip": "Non-Bonafide researcher", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "left" }, []),
                //           span({ className: "glyphicon glyphicon-hand-right hover-color", isRendered: "dar.status ::: 'pending'", "tooltip": "Researcher review pending", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "left" }, []),
                //           span({ className: "glyphicon glyphicon-hand-right dismiss-color", isRendered: "dar.status ::: null" }, []),
                //         ]),
                //       ]),
                //     ]),
                //   ]),

                //   hr({ className: "pvotes-separator" }),
                  // ]),
                  // div({ "dir-pagination-controls": "true", "max-size": "10", "direction-links": "true", "boundary-links": "true", className: "pvotes-pagination" }, [
                  // ]),
                // ]),
              // ])
            // })
        ])
      ])
    );
  }
}

export default AdminManageAccess;


