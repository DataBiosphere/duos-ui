import { Component, Fragment } from 'react';
import { div, button, hr, i, input, span, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { PageSubHeading } from '../components/PageSubHeading';
import { PaginatorBar } from '../components/PaginatorBar';
import { SearchBox } from '../components/SearchBox';
import { Election, DarCases } from '../libs/ajax';
import * as Utils from "../libs/utils";

class ReviewedCases extends Component {

  dulPageCount = 5;
  accessPageCount = 5;

  handleSearchDul = (query) => {
    this.setState({searchDulText: query});
  };
  handleSearchDar = (query) => {
    this.setState({searchDarText: query});
  };
  searchTable = (query) => (row) => {
    if (query && query !== undefined) {
      let text = JSON.stringify(row);
      return text.toLocaleLowerCase().includes(query.toLocaleLowerCase());
    }
    return true;
  };

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      dulLimit: 5,
      accessLimit: 5,
      currentDulPage: 1,
      currentAccessPage: 1,

      electionsList: {
        dul: [],
        access: [],
      }
    };
    this.getReviewedConsents = this.getReviewedConsents.bind(this);
    this.open = this.open.bind(this);
  }

  sort = (val) => {
    const filename = val.target;
  };

  componentWillMount() {
    this.getReviewedConsents();
  };

  async getReviewedConsents() {
    const dul = await Election.findReviewedConsents();
    const access = await DarCases.findReviewedDRs();

    this.setState(prev => {
      prev.electionsList = {
        dul: dul,
        access: access,
      };
      return prev;
    });
  }

  open(electionId, page) {
    this.props.history.push(`${page}/${electionId}`);
  }

  render() {

    const { currentDulPage, currentAccessPage, searchDulText, searchDarText } = this.state;

    return (

      div({ className: "container " }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({
              id: "reviewedCases",
              imgSrc: "../images/icon_reviewed.png",
              iconSize: "medium",
              color: "common",
              title: "Reviewed Cases Record",
              description: "List of Reviewed cases and their results"
            }),
          ]),
        ]),
        hr({ className: "section-separator" }),

        div({ className: "row no-margin" }, [
          div({ className: "col-lg-8 col-md-8 col-sm-8 col-xs-12 no-padding" }, [
            PageSubHeading({
              imgSrc: "/images/icon_dul.png",
              color: "dul",
              title: "Data Use Limitations Reviewed Cases",
              description: "List of Data Use Limitations Reviewed Cases and their results"
            }),
          ]),
          div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-12 search-wrapper" }, [
            SearchBox({ id: 'reviewedCasesDul', searchHandler: this.handleSearchDul, color: 'dul' })
          ])
        ]),

        div({ className: "jumbotron table-box" }, [
          div({ className: "grid-row" }, [
            div({ className: "col-2 cell-header cell-sort dul-color", onClick: this.sort('displayId') }, [
              "Consent id",
              span({ className: "glyphicon sort-icon glyphicon-sort" }),
            ]),
            div({ className: "col-2 cell-header cell-sort dul-color", onClick: this.sort('election.consentGroupName') }, [
              "Consent Group Name",
              span({ className: "glyphicon sort-icon glyphicon-sort" }),
            ]),
            div({ className: "col-1 cell-header cell-sort dul-color", onClick: this.sort('version') }, [
              "Election N°",
              span({ className: "glyphicon sort-icon glyphicon-sort" }),
            ]),
            div({ className: "col-1 cell-header dul-color" }, ["Result Date"]),
            div({ className: "col-1 cell-header f-center dul-color" }, ["Final Result"]),
            div({ className: "col-1 cell-header f-center dul-color" }, ["Record"]),
          ]),
          hr({ className: "table-head-separator" }),

          this.state.electionsList.dul
            .filter(this.searchTable(searchDulText))
            .slice((currentDulPage - 1) * this.state.dulLimit, currentDulPage * this.state.dulLimit).map((election, rIndex) => {
            return h(Fragment, { key: rIndex }, [
              div({ className: "grid-row" }, [
                div({
                  className: "col-2 cell-body text " + (election.archived ? 'flagged' : ''),
                  title: election.displayId
                }, [election.displayId]),
                div({
                  className: "col-2 cell-body text " + (!election.consentGroupName ? 'empty' : ''),
                  title: election.consentGroupName
                }, [election.consentGroupName]),
                div({ className: "col-1 cell-body text" }, [election.version < 10 ? '0' + election.version : election.version]),
                div({ className: "col-1 cell-body text" }, [ Utils.formatDate(election.finalVoteDate)]),
                div({ className: "col-1 cell-body text f-center bold" }, [
                  span({ isRendered: election.finalVoteString === 'Yes', className: "dul-color" }, ["YES"]),
                  span({ isRendered: election.finalVoteString === 'No' }, ["NO"]),
                ]),
                div({ className: "col-1 cell-body f-center" }, [
                  button({
                    className: "cell-button hover-color",
                    "ui-sref": "dul_results_record({electionId: 'this.election.electionId '})",
                    onClick: () => this.open(election.electionId, 'dul_results_record', null, false)
                  }, ["Record"]),
                ]),
              ]),
              hr({ className: "table-body-separator" }),
            ]);
          }),
          PaginatorBar({
            name: 'dul',
            total: this.state.electionsList.dul.filter(this.searchTable(searchDulText)).length,
            limit: this.state.dulLimit,
            pageCount: this.dulPageCount,
            currentPage: this.state.currentDulPage,

            onPageChange: (page) => {
              this.setState(prev => {
                prev.currentDulPage = page;
                return prev;
              });
            },
            changeHandler: (size) => {
              this.setState(prev => {
                  prev.dulLimit = size;
                  prev.currentDulPage = 1;
                  return prev;
                },
              )
            },
          }),
        ]),

        div({ className: "row no-margin" }, [
          div({ className: "col-lg-8 col-md-8 col-sm-8 col-xs-12 no-padding" }, [
            PageSubHeading({
              imgSrc: "/images/icon_access.png",
              color: "access",
              title: "Data Access Reviewed Cases",
              description: "List of Data Access Request Reviewed Cases and their results"
            }),
          ]),
          div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-12 search-wrapper" }, [
            SearchBox({ id: 'reviewedCasesAccess', searchHandler: this.handleSearchDar, color: 'access' })
          ])
        ]),

        div({ className: "jumbotron table-box" }, [
          div({ className: "grid-row" }, [
            div({ className: "col-2 cell-header access-color" }, ["Data Request id"]),
            div({ className: "col-3 cell-header access-color" }, ["Project Title"]),
            div({ className: "col-1 cell-header access-color" }, ["Result Date"]),
            div({ className: "col-1 cell-header f-center access-color" }, ["Final Result"]),
            div({ className: "col-1 cell-header f-center access-color" }, ["Record"]),
          ]),
          hr({ className: "table-head-separator" }),

          this.state.electionsList.access
            .filter(this.searchTable(searchDarText))
            .slice((currentAccessPage - 1) * this.state.accessLimit, currentAccessPage * this.state.accessLimit).map((election, rIndex) => {
            return h(Fragment, { key: rIndex }, [
              div({ className: "grid-row" }, [
                div({ className: "col-2 cell-body text", title: "this.election.displayId " }, [election.displayId]),
                div({ className: "col-3 cell-body text", title: "this.election.projectTitle " }, [election.projectTitle]),
                div({ className: "col-1 cell-body text" }, [ Utils.formatDate(election.finalVoteDate)]),
                div({ className: "col-1 cell-body text f-center bold" }, [
                  span({ isRendered: election.finalVote === true, className: "access-color" }, ["YES"]),
                  span({ isRendered: election.finalVote === false }, ["NO"]),
                ]),
                div({ className: "col-1 cell-body f-center" }, [
                  button({
                    className: "cell-button hover-color",
                    "ui-sref": "access_results_record({electionId: 'this.election.electionId ', referenceId: 'this.election.referenceId '})",
                    onClick: () => this.open(election.electionId, 'dul_results_record')
                  }, ["Record"])
                ]),
              ]),
              hr({ className: "table-body-separator" }),
            ])
          }),
          PaginatorBar({
            name: 'access',
            total: this.state.electionsList.access.filter(this.searchTable(searchDarText)).length,
            limit: this.state.accessLimit,
            pageCount: this.accessPageCount,
            currentPage: this.state.currentAccessPage,

            onPageChange: (page) => {
              this.setState(prev => {
                prev.currentAccessPage = page;
                return prev;
              });
            },

            changeHandler: (size) => {
              this.setState(prev => {
                prev.accessLimit = size;
                prev.currentAccessPage = 1;
                return prev;
              });
            },
          }),
        ]),
      ])
    );
  }
}

export default ReviewedCases;

