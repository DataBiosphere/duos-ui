import { Component } from 'react';
import { div, button, hr, span, i, a, input, } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';

class AdminManageDul extends Component {

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

    render() {
        return (

            div({ className: "container" }, [
                div({ className: "row no-margin" }, [
                    // TBD PageHeading goes here ...
                    div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
                        PageHeading({ imgSrc: "../images/icon_manage_dul.png", iconSize: "medium", color: "dul-color", title: "Manage Data Use Limitations", description: "Select and manage Data Use Limitations for DAC review" }),
                    ]),
                    div({ className: "col-lg-5 col-md-5 col-sm-12 col-xs-12 search-reviewed no-padding" }, [
                        div({ className: "col-lg-6 col-md-6 col-sm-7 col-xs-7" }, [
                            div({ className: "search-text" }, [
                                i({ className: "glyphicon glyphicon-search dul-color" }),
                                input({ type: "search", className: "form-control users-search", placeholder: "Enter search term...", "value": "searchDUL" }),
                            ]),
                        ]),
                        a({ className: "col-lg-6 col-md-6 col-sm-5 col-xs-5 admin-add-button dul-background no-margin", onClick: "AdminManage.addDul()" }, [
                            div({ className: "all-icons add-dul_white" }, []),
                            span({}, ["Add Data Use Limitations"]),
                        ]),
                    ]),
                ]),

                div({ className: "jumbotron box-vote-singleresults box-vote-no-margin" }, [
                    div({ className: "grid-9-row pushed-2" }, [
                        div({ className: "col-2 cell-header dul-color" }, ["Consent id"]),
                        div({ className: "col-2 cell-header dul-color" }, ["Consent Group Name"]),
                        div({ className: "col-1 cell-header dul-color" }, ["Election N°"]),
                        div({ className: "col-1 cell-header dul-color" }, ["Date"]),
                        div({ className: "col-1 cell-header f-center dul-color" }, ["Edit Record"]),
                        div({ className: "col-1 cell-header f-center dul-color" }, ["Election status"]),
                        div({ className: "col-1 cell-header f-center dul-color" }, ["Election actions"]),
                    ]),

                    hr({ className: "pvotes-main-separator" }),
                    div({ "dir-paginate": "election in AdminManage.electionsList.dul | filter: searchDUL | itemsPerPage:10", "current-page": "AdminManage.currentDULPage" }, [
                        div({ className: "grid-9-row pushed-2", "ng-class": "{'list-highlighted': election.updateStatus}" }, [
                            div({ className: "col-2 cell-body text", "ng-class": "{flagged : election.archived}", title: "this.election.consentName " }, [
                                span({ isRendered: "election.updateStatus", className: "glyphicon glyphicon-exclamation-sign list-highlighted-item dul-color", "tooltip": "Consent has been updated", "aria-hidden": "true", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right" }, []),
                                a({ onClick: "AdminManage.open(election.consentId, 'dul_preview_results', null, true)" }, ["this.election.consentName"]),
                            ]),
                            div({ className: "col-2 cell-body text", "ng-class": "{empty : !election.groupName}", title: "this.election.groupName " }, ["this.election.groupName"]),
                            div({ className: "col-1 cell-body text", "ng-class": "{empty : !election.version}" }, ["this.election.version "]),
                            div({ className: "col-1 cell-body text" }, ["this.election.createDate | date:'yyyy-MM-dd' "]),
                            div({ className: "col-1 cell-body f-center" }, [
                                button({ className: "cell-button hover-color", "ng-disabled": "election.electionStatus !: 'un-reviewed' || !election.editable", onClick: "AdminManage.editDul(election.consentId)" }, ["Edit"]),
                            ]),
                            div({ className: "col-1 cell-body text f-center bold" }, [
                                span({ isRendered: "election.electionStatus :: 'un-reviewed'" }, [a({ onClick: "AdminManage.open(election.consentId, 'dul_preview_results', null, false)" }, ["Un-reviewed"])]),
                                span({ isRendered: "election.electionStatus :: 'Open'" }, [a({ onClick: "AdminManage.open(election.consentId, 'dul_review_results', null, false)" }, ["Open"]),]),
                                span({ isRendered: "election.electionStatus :: 'Canceled'" }, [a({ onClick: "AdminManage.open(election.consentId, 'dul_preview_results', null, false)" }, ["Canceled"]),]),
                                span({ isRendered: "election.electionStatus :: 'Closed'" }, [a({ onClick: "AdminManage.open(null, 'dul_results_record', election.electionId, false)" }, ["Reviewed"]),]),
                            ]),
                            div({ className: "col-1 cell-body f-center" }, [
                                button({ isRendered: "election.electionStatus !: 'Open'", "ng-disabled": "!election.editable", className: "cell-button hover-color", onClick: "AdminManage.openCreate(election)" }, ["Create"]),
                                button({ isRendered: "election.electionStatus :: 'Open'", className: "cell-button cancel-color", onClick: "AdminManage.openCancel(election)" }, ["Cancel"]),
                            ]),
                            div({ className: "icon-actions" }, [
                                button({ "ng-disabled": "election.electionStatus :: 'un-reviewed' || election.archived", onClick: "AdminManage.openArchive(election)" }, [
                                    span({ className: "glyphicon glyphicon-inbox caret-margin", "ng-class": "{activated : election.archived}", "aria-hidden": "true", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right", "tooltip": "Archive election" }, []),
                                ]),
                                button({ "ng-disabled": "election.electionStatus !: 'un-reviewed'", onClick: "AdminManage.openDelete(election.consentId)" }, [
                                    span({ className: "glyphicon glyphicon-trash caret-margin", "aria-hidden": "true", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right", "tooltip": "Delete record" }, []),
                                ]),
                            ]),
                        ]),
                        hr({ className: "pvotes-separator" }),
                        div({
                            "dir-pagination-controls": "true"
                            , "max-size": "10"
                            , "direction-links": "true"
                            , "boundary-links": "true"
                            , className: "pvotes-pagination"
                        }, []),
                    ])
                ])
            ])
        );
    }
}

export default AdminManageDul;

