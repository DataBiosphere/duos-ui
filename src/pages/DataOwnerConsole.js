import { Component, Fragment } from 'react';
import { div, hr, h, button } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { PageSubHeading } from '../components/PageSubHeading';
import { PaginatorBar } from '../components/PaginatorBar';
import { PendingCases } from '../libs/ajax';
import { Storage } from '../libs/storage';
import { SearchBox } from '../components/SearchBox';
import datasetReviewIcon from "../images/icon_dataset_review.png";

class DataOwnerConsole extends Component {

  constructor(props) {
    super(props);
    let currentUser = Storage.getCurrentUser();

    this.state = {
      currentUser: currentUser,
      dataOwnerUnreviewedCases: [],
      limit: 5,
      currentPage: 1
    };

    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.voteReview = this.voteReview.bind(this);
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

  componentDidMount() {
    let currentUser = Storage.getCurrentUser();
    this.setState({ currentUser: currentUser }, () => {
      PendingCases.findDataOwnerUnReviewed(currentUser.dacUserId).then(
        dars => {
          this.setState({
            dataOwnerUnreviewedCases: dars,
          });
        }
      );
    });
  }

  handleOpenModal() {
    this.setState({ showModal: true });
  }

  handleCloseModal() {
    this.setState({ showModal: false });
  }

  editReview = () => {
    // const data = e.target.getAttribute('data');
  };

  voteReview = (pendingCase) => {
    this.props.history.push(`${'data_owner_review'}/${pendingCase.voteId}/${pendingCase.referenceId}/${pendingCase.dataSetId}`);
  };

  handleSearchDul = (query) => {
    this.setState({ searchDulText: query });
  };

  searchTable = (query) => (row) => {
    if (query && query !== undefined) {
      let text = JSON.stringify(row);
      return text.toLowerCase().includes(query.toLowerCase());
    }
    return true;
  };

  render() {

    const { currentUser, currentPage, limit, searchDulText } = this.state;

    return (
      div({ className: "container" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({
              id: "dataOwnerConsole",
              color: "common",
              title: "Welcome to your Data Owner Console, " + currentUser.displayName + "!",
              description: "These are your pending cases for review"
            }),
            hr({ className: "section-separator" })
          ]),

          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
            div({ className: "row no-margin" }, [
              div({ className: "col-lg-8 col-md-8 col-sm-7 col-xs-12 no-padding" }, [
                PageSubHeading({
                  id: "dataOwnerConsole",
                  imgSrc: datasetReviewIcon,
                  iconSize: "large",
                  color: "dataset",
                  title: "Dataset Access Request Review",
                  description: "Should data access be granted to this applicant?"
                })
              ]),

              div({ className: "col-lg-4 col-md-4 col-sm-5 col-xs-12 search-wrapper no-padding" }, [
                h(SearchBox, { id: 'dataOwnerConsole', searchHandler: this.handleSearchDul, pageHandler: this.handlePageChange, color: 'dataset' })
              ])
            ]),

            div({ className: "jumbotron table-box" }, [
              div({ className: "row no-margin" }, [
                div({ className: "col-lg-2 col-md-2 col-sm-3 col-xs-3 cell-header dataset-color" }, ["Dataset ID"]),
                div({ className: "col-lg-6 col-md-6 col-sm-5 col-xs-5 cell-header dataset-color" }, ["Dataset Name"]),
                div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header dataset-color" }, ["DAR ID"]),
                div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header f-center dataset-color" }, ["Review/Vote"]),
              ]),

              hr({ className: "table-head-separator" }),

              this.state.dataOwnerUnreviewedCases.filter(this.searchTable(searchDulText)).slice((currentPage - 1) * limit, currentPage * limit).map(pendingCase => {
                return h(Fragment, { key: pendingCase.darCode }, [
                  div({ id: pendingCase.darCode, className: "row no-margin tableRow" }, [

                    div({ id: pendingCase.darCode + "_dataSetId", name: "datasetId", className: "col-lg-2 col-md-2 col-sm-3 col-xs-3 cell-body text" }, [pendingCase.alias]),
                    div({ id: pendingCase.darCode + "_dataSetName", name: "datasetName", className: "col-lg-6 col-md-6 col-sm-5 col-xs-5 cell-body text" }, [pendingCase.dataSetName]),
                    div({ id: pendingCase.darCode + "_darCode", name: "darCode", className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text" }, [pendingCase.darCode]),

                    div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body f-center" }, [

                      button({
                        id: pendingCase.darCode + "_btnVote",
                        name: "btn_vote",
                        className: "cell-button cancel-color",
                        isRendered: !pendingCase.alreadyVoted && (pendingCase.hasConcerns === null || !pendingCase.hasConcerns),
                        data: pendingCase.darCode,
                        onClick: () => this.voteReview(pendingCase)
                      }, ["Vote"]),
                      button({
                        id: pendingCase.darCode + "_btnEdit",
                        name: "btn_edit",
                        className: "cell-button default-color",
                        isRendered: pendingCase.alreadyVoted || pendingCase.hasConcerns,
                        data: pendingCase.darCode,
                        onClick: () => this.voteReview(pendingCase)
                      }, ["Edit"]),
                    ]),
                  ]),
                  hr({ className: "table-body-separator" }),
                ]);
              }),
              PaginatorBar({
                total: this.state.dataOwnerUnreviewedCases.length,
                limit: limit,
                pageCount: this.pageCount,
                currentPage: currentPage,
                onPageChange: this.handlePageChange,
                changeHandler: this.handleSizeChange,
              })
            ])
          ])
        ])
      ])
    );
  }
}

export default DataOwnerConsole;
