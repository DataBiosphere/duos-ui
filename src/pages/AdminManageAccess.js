import { Component } from 'react';
import { div, button, hr, span, input, img, h2, br, i, a, } from 'react-hyperscript-helpers';

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
                    // TBD PageHeading goes here ...
                    div({ className: "col-lg-8 col-md-8 col-sm-12 col-xs-12 no-padding title-wrapper" }, [
                        img({ src: "/images/icon_manage_access.png", alt: "Manage DAR icon", className: "cm-icons main-icon-title" }),
                        h2({ className: "main-title margin-sm access-color" }, [
                            "Manage Data Access Request",
                            br(),
                            div({ className: "main-title-description" }, ["Select and manage Data Access Request for DAC review"]),
                        ]),
                    ]),
                    div({ className: "col-lg-4 col-md-4 col-sm-12 col-xs-12 search-reviewed no-padding" }, [
                        div({ className: "search-text" }, [
                            i({ className: "glyphicon glyphicon-search access-color" }),
                            input({ type: "search", className: "form-control users-search", placeholder: "Enter search term...", "value": "searchAccess" }),
                        ]),
                    ]),
                ]),
                div({ className: "jumbotron box-vote-singleresults box-vote-no-margin" }, [
                    div({ className: "row" }, [
                        div({ className: "pvotes-box-head" }, [
                            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 pvotes-box-subtitle access-color" }, ["Data Request id"]),
                            div({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-3 pvotes-box-subtitle access-color" }, ["Project title"]),
                            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 pvotes-box-subtitle access-color" }, ["Date"]),
                            div({ className: "col-lg-1 col-md-1 col-sm-1 col-xs-1 pvotes-box-subtitle f-center access-color" }, ["+ Info"]),
                            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 pvotes-box-subtitle f-center access-color" }, ["Election status"]),
                            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 pvotes-box-subtitle f-center access-color" }, ["Election actions"]),
                        ]),
                        div({ className: "admin-box-body" }, [
                            hr({ className: "pvotes-main-separator" }),
                            div({ "dir-paginate": "dar in AdminManageAccess.dars | filter: searchAccess | itemsPerPage:10", "current-page": "AdminManageAccess.currentDARPage" }, [
                                div({ isRendered: "!dar.isCanceled", className: "row pvotes-main-list" }, [
                                    div({ className: "row pvotes-main-list", "ng-class": "{'list-highlighted': dar.needsApproval}" }, [
                                        div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 pvotes-list-id", title: "this.dar.frontEndId " }, [
                                            div({
                                                "ng-class": "{'access-color': dar.needsApproval, 'cancel-color': dar.dataSetElectionResult :: 'Denied','dataset-color': dar.dataSetElectionResult :: 'Approved'}",
                                                className: "glyphicon glyphicon-exclamation-sign", "tooltip": "this.dar.dataSetElectionResult ", "tooltip-class": "tooltip-class"
                                                , "tooltip-trigger": "true", "tooltip-placement": "right", "ng-show": "dar.needsApproval"
                                            }, []),
                                            span({ className: "list-highlighted-item" }, ["this.dar.frontEndId "]),
                                        ]),
                                        div({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-3 pvotes-list-id", title: "this.dar.projectTitle " }, ["this.dar.projectTitle "]),
                                        div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 pvotes-list-id" }, ["this.dar.createDate | date:'yyyy-MM-dd' "]),
                                        a({ href: "", className: "admin-manage-buttons col-lg-1 col-md-1 col-sm-1 col-xs-1 no-padding" }, [
                                            div({ className: "enabled hover-color", onClick: "AdminManageAccess.openApplication(dar.dataRequestId, dar.electionStatus)" }, [
                                                span({}, ["Summary"]),
                                            ]),
                                        ]),
                                        div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 pvotes-list bold" }, [
                                            span({ isRendered: "dar.electionStatus :: 'un-reviewed'" }, [a({ onClick: this.open("access_preview_results, dar.electionId, dar.dataRequestId") }, ["Un-reviewed"]),]),
                                            span({ isRendered: "dar.electionStatus :: 'Open' || dar.electionStatus :: 'Final'" }, [a({ onClick: "AdminManageAccess.open('access_review_results', dar.electionId, dar.dataRequestId)" }, ["Open"]),]),
                                            span({ isRendered: "dar.electionStatus :: 'Canceled'" }, [a({ onClick: "AdminManageAccess.open('access_preview_results', dar.electionId, dar.dataRequestId)" }, ["Canceled"]),]),
                                            span({ isRendered: "dar.electionStatus :: 'Closed' || dar.electionStatus :: 'PendingApproval'" }, [a({ onClick: "AdminManageAccess.open('access_results_record', dar.electionId, dar.dataRequestId)" }, ["Reviewed"]),]),
                                        ]),
                                        div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 no-padding" }, [
                                            div({ className: "row no-margin" }, [
                                                a({ href: "", className: "admin-manage-buttons col-lg-10 col-md-10 col-sm-10 col-xs-9" }, [
                                                    div({
                                                        isRendered: "dar.electionStatus !: 'Open' &&  dar.electionStatus !: 'Final' && dar.electionStatus !: 'PendingApproval'", className: "create hover-color"
                                                        , onClick: "AdminManageAccess.openCreate(dar.dataRequestId)"
                                                    }, ["Create"]),
                                                    div({ isRendered: "dar.electionStatus :: 'PendingApproval'", className: "disabled" }, [
                                                        span({}, ["Create"]),
                                                    ]),
                                                    div({ isRendered: "dar.electionStatus :: 'Open'||  dar.electionStatus :: 'Final'", className: "cancel hover-color", onClick: "AdminManageAccess.openCancel(dar)" }, [
                                                        span({}, ["Cancel"]),
                                                    ]),
                                                ]),
                                                div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 bonafide-icon" }, [
                                                    a({ isRendered: "dar.status !:: null", onClick: "AdminManageAccess.openResearcherReview('researcher_review', dar.ownerUser.dacUserId)" }, [
                                                        span({ className: "glyphicon glyphicon-thumbs-up dataset-color", isRendered: "dar.status ::: 'approved'", "tooltip": "Bonafide researcher", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "left" }, []),
                                                        span({ className: "glyphicon glyphicon-thumbs-down cancel-color", isRendered: "dar.status ::: 'rejected'", "tooltip": "Non-Bonafide researcher", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "left" }, []),
                                                        span({ className: "glyphicon glyphicon-hand-right hover-color", isRendered: "dar.status ::: 'pending'", "tooltip": "Researcher review pending", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "left" }, []),
                                                        span({ className: "glyphicon glyphicon-hand-right dismiss-color", isRendered: "dar.status ::: null" }, []),
                                                    ]),
                                                ]),
                                            ]),
                                        ]),
                                    ]),
                                    hr({ className: "pvotes-separator" }),
                                ]),
                                div({ "dir-pagination-controls": "true", "max-size": "10", "direction-links": "true", "boundary-links": "true", className: "pvotes-pagination" }, [
                                ]),
                            ]),
                        ]),
                    ]),
                ])
            ])
        );
    }
}

export default AdminManageAccess;

