import { Component, Fragment } from 'react';
import { div, button, hr, i, input, span, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { PageSubHeading } from '../components/PageSubHeading';
import { PaginatorBar } from '../components/PaginatorBar';

class ReviewedCases extends Component {

  dulPageCount = 5;
  accessPageCount = 5;

  searchAccessCases = '';

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      currentUser: {},
      dulLimit: 5,
      accessLimit: 5,
      currentDulPage: 1,
      currentAccessPage: 1,
    };

  }

  componentWillMount() {

    let dul = [];
    let access = [];
    for (var i = 0; i < 77; i++) {
      dul.push(this.createPendingCase(i));
      access.push(this.createPendingCase(i));
    }

    console.log('dul', dul);
    console.log('access', access);

    this.setState(prev => {
      prev.totalAccessPendingVotes = 5;
      prev.totalDulPendingVotes = 6;
      prev.currentUser = {
        displayName: 'Nadya Lopez Zalba',
      };
      prev.electionsList = {
        dul: dul,
        access: access,
      };
      return prev;
    });
  }

  createPendingCase(ix) {
    return {
      displayId: 'displayId-' + ix,
      frontEndId: 'Front ID-' + ix,
      refrenceId: 'Ref ID' + ix,
      version: ix % 11,
      finalVoteDate: '2018-01-01',
      finalVoteString: ix % 2 === 0 ? 'Yes' : 'No',
      finalVote: ix % 2 === 0 ? true : false,
      alreadyVoted: ix % 2 === 0 ? true : false,
      logged: ix % 2 === 0 ? 'Yes' : 'No',
      consentGroupName: 'ORS-222',
      voteId: 'XX' + ix,
      projectTitle: 'Project Title ' + ix,
      rpVoteId: 'rpVote ID' + ix,
      electionStatus: ix % 6 === 0 ? 'Open' :
        ix % 6 === 1 ? 'Closed' :
          ix % 6 === 2 ? 'Canceled' :
            ix % 6 === 3 ? 'un-reviewed' :
              ix % 6 === 4 ? 'PendingApproval' :
                ix % 6 === 5 ? 'Final' : '',
      isFinalVote: ix % 2 === 0 ? true : false,
    }
  }

  render() {


    const { currentDulPage, currentAccessPage } = this.state;

    return (


      div({ className: "container " }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({ id: "reviewedCases", imgSrc: "../images/icon_reviewed.png", iconSize: "medium", color: "common", title: "Reviewed Cases Record", description: "List of Reviewed cases and their results" }),
          ]),
        ]),
        hr({ className: "section-separator" }),

        div({ className: "row no-margin" }, [
          div({ className: "col-lg-8 col-md-8 col-sm-8 col-xs-12 no-padding" }, [
            PageSubHeading({ imgSrc: "/images/icon_dul.png", color: "dul", title: "Data Use Limitations Reviewed Cases", description: "List of Data Use Limitations Reviewed Cases and their results" }),
          ]),
          div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-12 search-reviewed" }, [
            div({ className: "search-text" }, [
              i({ className: "glyphicon glyphicon-search dul-color" }),
              input({ type: "search", className: "form-control", placeholder: "Enter search term...", value: this.searchDULcases }),
            ]),
          ])
        ]),

        div({ className: "jumbotron table-box" }, [
          div({ className: "grid-row" }, [
            div({ className: "col-2 cell-header cell-sort dul-color", onClick: "sort('displayId')" }, [
              "Consent id",
              span({ className: "glyphicon sort-icon glyphicon-sort" }),
            ]),
            div({ className: "col-2 cell-header cell-sort dul-color", onClick: "sort('election.consentGroupName')" }, [
              "Consent Group Name",
              span({ className: "glyphicon sort-icon glyphicon-sort" }),
            ]),
            div({ className: "col-1 cell-header cell-sort dul-color", onClick: "sort('version')" }, [
              "Election N°",
              span({ className: "glyphicon sort-icon glyphicon-sort" }),
            ]),
            div({ className: "col-1 cell-header dul-color" }, ["Result Date"]),
            div({ className: "col-1 cell-header f-center dul-color" }, ["Final Result"]),
            div({ className: "col-1 cell-header f-center dul-color" }, ["Record"]),
          ]),
          hr({ className: "pvotes-separator" }),

          this.state.electionsList.dul.slice((currentDulPage - 1) * this.state.dulLimit, currentDulPage * this.state.dulLimit).map((election, rIndex) => {
            return h(Fragment, { key: rIndex }, [
              div({ className: "grid-row" }, [
                div({ className: "col-2 cell-body text " + (election.archived ? 'flagged' : ''), title: election.displayId }, [election.displayId]),
                div({ className: "col-2 cell-body text " + (!election.consentGroupName ? 'empty' : ''), title: election.consentGroupName }, [election.consentGroupName]),
                div({ className: "col-1 cell-body text" }, [election.version < 10 ? '0' + election.version : election.version]),
                div({ className: "col-1 cell-body text" }, [election.finalVoteDate /* | date:dateFormat */]),
                div({ className: "col-1 cell-body text f-center bold" }, [
                  span({ isRendered: election.finalVoteString === 'Yes', className: "dul-color" }, ["YES"]),
                  span({ isRendered: election.finalVoteString === 'No' }, ["NO"]),
                ]),
                div({ className: "col-1 cell-body f-center" }, [
                  button({ className: "cell-button hover-color", "ui-sref": "dul_results_record({electionId: 'this.election.electionId '})" }, ["Record"]),
                ]),
              ]),
              hr({ className: "pvotes-separator" }),
            ]);
          }),
          // //----
          PaginatorBar({
            name: 'dul',
            total: this.state.electionsList.dul.length,
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
            PageSubHeading({ imgSrc: "/images/icon_access.png", color: "access", title: "Data Access Reviewed Cases", description: "List of Data Access Request Reviewed Cases and their results" }),
          ]),
          div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-12 search-reviewed" }, [
            div({ className: "search-text" }, [
              i({ className: "glyphicon glyphicon-search access-color" }),
              input({ type: "search", className: "form-control", placeholder: "Enter search term...", "value": "searchAccessCases" }),
            ]),
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
          hr({ className: "pvotes-separator" }),

          this.state.electionsList.access.slice((currentAccessPage - 1) * this.state.accessLimit, currentAccessPage * this.state.accessLimit).map((election, rIndex) => {
            return h(Fragment, { key: rIndex }, [
              div({ className: "grid-row" }, [
                div({ className: "col-2 cell-body text", title: "this.election.displayId " }, [election.displayId]),
                div({ className: "col-3 cell-body text", title: "this.election.projectTitle " }, [election.projectTitle]),
                div({ className: "col-1 cell-body text" }, [election.finalVoteDate /* | date:dateFormat*/]),
                div({ className: "col-1 cell-body text f-center bold" }, [
                  span({ isRendered: election.finalVote === true, className: "access-color" }, ["YES"]),
                  span({ isRendered: election.finalVote === false }, ["NO"]),
                ]),
                div({ className: "col-1 cell-body f-center" }, [
                  button({ className: "cell-button hover-color", "ui-sref": "access_results_record({electionId: 'this.election.electionId ', referenceId: 'this.election.referenceId '})" }, ["Record"]),
                ]),
              ]),
              hr({ className: "pvotes-separator" }),
            ])
          }),

          PaginatorBar({
            name: 'access',
            total: this.state.electionsList.access.length,
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

