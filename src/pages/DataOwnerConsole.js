import { Component, Fragment } from 'react';
import { div, hr, input, i, h, button } from 'react-hyperscript-helpers';
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
          div({ className: "col-lg-8 col-md-8 col-sm-7 col-xs-12 no-padding" }, [
            PageHeading({
              id: "dataOwnerConsole",
              color: "dataset",
              title: "Welcome " + currentUser.displayName + "!",
              description: "These are your pending cases for review"
            }),

          ]),
          div({ className: "col-lg-4 col-md-4 col-sm-5 col-xs-12 search-reviewed no-padding" }, [
            div({ className: "search-text" }, [
              i({ className: "glyphicon glyphicon-search dataset-color" }),
              input({
                type: "search", className: "form-control users-search",
                placeholder: "Enter search term..."
              }),
            ]),
          ]),
        ]),

        div({ className: "jumbotron table-box" }, [
          div({ className: "row no-margin" }, [
            div({ className: "col-lg-2 col-md-2 col-sm-3 col-xs-3 cell-header dataset-color" }, ["Dataset ID"]),
            div({ className: "col-lg-6 col-md-6 col-sm-5 col-xs-5 cell-header dataset-color" }, ["Dataset Name"]),
            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header dataset-color" }, ["Data Request ID"]),
            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header f-center dataset-color" }, ["Review/Vote"]),
          ]),

          hr({ className: "pvotes-main-separator" }),
          this.state.dataOwnerUnreviewedCases.map(pendingCase => {
            return h(Fragment, {}, [
              div({ key: pendingCase.darCode, id: pendingCase.darCode, className: "row pvotes-main-list" }, [
                div({ id: pendingCase.darCode + "_dataSetId", className: "col-lg-2 col-md-2 col-sm-3 col-xs-3 cell-body text" }, [pendingCase.dataSetId]),
                div({ id: pendingCase.darCode + "_dataSetName", className: "col-lg-6 col-md-6 col-sm-5 col-xs-5 cell-body text" }, [pendingCase.dataSetName]),
                div({ id: pendingCase.darCode + "_darCode", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text" }, [pendingCase.darCode]),

                div({ id: pendingCase.darCode + "_actions", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body f-center" }, [
                  button({
                    id: pendingCase.darCode + "_btn_vote",
                    className: "cell-button cancel-color",
                    isRendered: !pendingCase.alreadyVoted && (pendingCase.hasConcerns === null || !pendingCase.hasConcerns),
                    onClick: this.voteReview()
                  }, ["Vote"]),
                  button({
                    id: pendingCase.darCode + "_btn_edit",
                    className: "cell-button default-color",
                    isRendered: pendingCase.alreadyVoted || pendingCase.hasConcerns,
                    onClick: this.editReview()
                  }, ["Edit"]),
                ]),
              ]),
              hr({ className: "pvotes-separator" }),
            ])
          }),
        ]),
      ])
    );
  }
}

export default DataOwnerConsole;