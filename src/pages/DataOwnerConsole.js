import { Component, Fragment } from 'react';
import { div, hr, span, input, i, a, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';

class DataOwnerConsole extends Component {

    constructor(props) {
        super(props);
        this.state = {
            dataOwnerUnreviewedCases: []
        };
        this.handleOpenModal = this.handleOpenModal.bind(this);
        this.handleCloseModal = this.handleCloseModal.bind(this);
    }

    mockData() {
        this.setState({
            dataOwnerUnreviewedCases: [
                { dataSetId: "DS001", dataSetName: 'DS Name 001', darCode: 'DAR001', alreadyVoted: true, hasConcerns: true },
                { dataSetId: "DS002", dataSetName: 'DS Name 002', darCode: 'DAR002', alreadyVoted: true, hasConcerns: false },
                { dataSetId: "DS003", dataSetName: 'DS Name 003', darCode: 'DAR003', alreadyVoted: false, hasConcerns: true },
                { dataSetId: "DS004", dataSetName: 'DS Name 004', darCode: 'DAR004', alreadyVoted: false, hasConcerns: false },
            ]
        })
    }

    componentDidMount() {
        this.mockData();
    }

    handleOpenModal() {
        this.setState({ showModal: true });
    }

    handleCloseModal() {
        this.setState({ showModal: false });
    }

    render() {
        let currentUser = {
            displayName: 'Nadya Lopez Zalba'
        }

        return (
            div({ className: "container" }, [

                div({ className: "row no-margin" }, [
                    div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
                        PageHeading({
                            color: "common",
                            title: "Welcome " + currentUser.displayName + "!",
                            description: "These are your pending cases for review"
                        }),

                    ]),
                    div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-12 search-reviewed no-padding" }, [
                        div({ className: "search-text" }, [
                            i({ className: "glyphicon glyphicon-search dataset-color" }),
                            input({
                                type: "search", className: "form-control users-search",
                                placeholder: "Enter search term..."
                            }),
                        ]),
                    ]),
                ]),
                hr({ className: "section-separator" }),
                div({ className: "jumbotron box-vote-singleresults box-vote-no-margin" }, [
                    div({ className: "row" }, [
                        div({ className: "pvotes-box-head row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                            div({ className: "col-lg-2 col-md-2 col-sm-3 col-xs-3 pvotes-box-subtitle dataset-color" }, ["Dataset ID"]),
                            div({ className: "col-lg-6 col-md-6 col-sm-5 col-xs-5 pvotes-box-subtitle dataset-color" }, ["Dataset Name"]),
                            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 pvotes-box-subtitle dataset-color" }, ["Data Request ID"]),
                            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 center-text pvotes-box-subtitle dataset-color" }, ["Review/Vote"]),
                        ]),
                        hr({ className: "pvotes-main-separator" }),
                        div({ className: "pvotes-box-body" }, [
                            // div({ "ng-repeat": "pendingCase in DataOwnerConsole.dataOwnerUnreviewedCases" }, [
                            this.state.dataOwnerUnreviewedCases.map(pendingCase => {
                                return h(Fragment, {}, [
                                    hr({ className: "pvotes-separator" }),
                                    div({ className: "row pvotes-main-list" }, [
                                        div({ className: "col-lg-2 col-md-2 col-sm-3 col-xs-3 pvotes-list-id" }, [pendingCase.dataSetId]),
                                        div({ className: "col-lg-6 col-md-6 col-sm-5 col-xs-5 pvotes-list-id" }, [pendingCase.dataSetName]),
                                        div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 pvotes-list-id" }, [pendingCase.darCode]),
                                        a({
                                            "ui-sref": "data_owner_review({voteId: 'this.pendingCase.voteId ', referenceId: 'this.pendingCase.referenceId ', dataSetId: 'this.pendingCase.dataSetId '})",
                                            className: "col-lg-2 col-md-2 col-sm-2 col-xs-2"
                                        }, [
                                                div({ className: !pendingCase.alreadyVoted ? 'enabled hover-color' : pendingCase.alreadyVoted ? 'editable default-color' : '' }, [
                                                    span({ isRendered: !pendingCase.alreadyVoted && (pendingCase.hasConcerns === null || !pendingCase.hasConcerns) }, ["Vote"]),
                                                    span({ isRendered: pendingCase.alreadyVoted || pendingCase.hasConcerns }, ["Edit"]),
                                                ]),

                                            ]),
                                    ]),

                                ])
                            }),
                        ]),
                    ]),
                ])
            ])
        );
    }
}

export default DataOwnerConsole;