import { Component, Fragment } from 'react';
import { div, hr, input, i, h, button } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { PaginatorBar } from '../components/PaginatorBar';
import { PendingCases } from '../libs/ajax';
import { Storage } from '../libs/storage';
import { SearchBox } from '../components/SearchBox';

class DataOwnerConsole extends Component {

  constructor(props) {
    super(props);
    this.state = {
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

  componentWillMount() {
    let currentUser = Storage.getCurrentUser().displayName;
    this.setState({ currentUser: currentUser }, () => {
      PendingCases.findDataOwnerUnReviewed(Storage.getCurrentUser().dacUserId).then(
        dars => {
          this.setState({ dataOwnerUnreviewedCases: dars });
        }
      )
    });
  }

  handleOpenModal() {
    this.setState({ showModal: true });
  }

  handleCloseModal() {
    this.setState({ showModal: false });
  }

  editReview = (e) => {
    const data = e.target.getAttribute('data');

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
      return text.includes(query);
    }
    return true;
  }

  render() {

    const { currentUser, currentPage, limit, searchDulText } = this.state;

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

          div({ className: "col-lg-4 col-md-4 col-sm-5 col-xs-12 search-wrapper no-padding" }, [
            SearchBox({ id: 'dataOwnerConsole', searchHandler: this.handleSearchDul, color: 'dataset' })
          ]),
        ]),

        div({ className: "jumbotron table-box" }, [
          div({ className: "row no-margin" }, [
            div({ className: "col-lg-2 col-md-2 col-sm-3 col-xs-3 cell-header dataset-color" }, ["Dataset ID"]),
            div({ className: "col-lg-6 col-md-6 col-sm-5 col-xs-5 cell-header dataset-color" }, ["Dataset Name"]),
            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header dataset-color" }, ["Data Request ID"]),
            div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header f-center dataset-color" }, ["Review/Vote"]),
          ]),

          hr({ className: "table-head-separator" }),

          this.state.dataOwnerUnreviewedCases.filter(this.searchTable(searchDulText)).slice((currentPage - 1) * limit, currentPage * limit).map(pendingCase => {
            return h(Fragment, { key: pendingCase.darCode }, [
              div({ id: pendingCase.darCode, className: "row no-margin tableRow" }, [

                div({ id: pendingCase.darCode + "_dataSetId", name: "datasetId", className: "col-lg-2 col-md-2 col-sm-3 col-xs-3 cell-body text" }, [pendingCase.dataSetId]),
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
// review this  vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
                  button({
                    id: pendingCase.darCode + "_btnEdit",
                    name: "btn_edit",
                    className: "cell-button default-color",
                    isRendered: pendingCase.alreadyVoted || pendingCase.hasConcerns,
                    data: pendingCase.darCode,
                    onClick: () => this.voteReview(pendingCase)
                  }, ["Edit"]),
// review this ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                ]),
              ]),
              hr({ className: "table-body-separator" }),
            ])
          }),
          PaginatorBar({
            total: this.state.dataOwnerUnreviewedCases.length,
            limit: limit,
            pageCount: this.pageCount,
            currentPage: currentPage,
            onPageChange: this.handlePageChange,
            changeHandler: this.handleSizeChange,
          }),
        ]),
      ])
    );
  }
}

export default DataOwnerConsole;