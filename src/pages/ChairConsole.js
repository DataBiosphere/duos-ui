import { Component, Fragment } from 'react';
import { div, hh, h, hr, i, input, span, button } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { PageSubHeading } from '../components/PageSubHeading';

import { PaginatorBar } from '../components/PaginatorBar';

export const ChairConsole = hh(class ChairConsole extends Component {

  dulPageCount = 5;
  accessPageCount = 5;

  searchDulCases = '';
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
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
  }


  handleDulPageChange = page => {
    this.setState(prev => {
      prev.currentDulPage = page;
      return prev;
    });
  };

  handleAccessPageChange = page => {
    this.setState(prev => {
      prev.currentAccessPage = page;
      return prev;
    });
  };

  handleDulSizeChange = size => {
    this.setState(prev => {
      prev.dulLimit = size;
      return prev;
    });
  };

  handleAccessSizeChange = size => {
    this.setState(prev => {
      prev.accessLimit = size;
      return prev;
    });
  };

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
      frontEndId: 'Front ID' + ix,
      refrenceId: 'Ref ID' + ix,
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

  openAccessReview = (e) => {
    const value = e.target.getAttribute('value');
    console.log('---------openAccessReview----------', value);
    //(pendingCase.referenceId, pendingCase.voteId, pendingCase.rpVoteId)"
  }

  openDULReview = (e) => {
    let pendingCase = e.target.getAttribute('value');
    console.log('---------openDulReview----------', pendingCase);
    //pendingCase.referenceId, pendingCase.voteId)",
  }

  openFinalAccessReviewResults = (e) => {
    let pendingCase = e.target.getAttribute('value');
    console.log('---------openFinalAccessReviewResults----------', pendingCase);
    //  (pendingCase.referenceId, pendingCase.electionId, pendingCase.rpElectionId)",
  }

  openAccessReviewResult = (e) => {
    let pendingCase = e.target.getAttribute('value');
    console.log('---------openAccessReviewResult----------', pendingCase);
    //  (pendingCase.referenceId, pendingCase.electionId)"
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

    const { currentDulPage, currentAccessPage } = this.state;

    return (

      div({ className: "container" }, [
        div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [
          PageHeading({ color: "common", title: "Welcome " + currentUser.displayName + "!", description: "These are your pending cases for review" }),

          hr({ className: "section-separator" }),

          div({ className: "row no-margin" }, [
            div({ className: "col-lg-8 col-md-8 col-sm-8 col-xs-12 no-padding" }, [
              PageSubHeading({ imgSrc: "/images/icon_dul.png", color: "dul", title: "Data Use Limitations Review", description: "Were data use limitations accurately converted to a structured format?" }),
            ]),
            div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-12 search-reviewed no-padding" }, [
              div({ className: "search-text" }, [
                i({ className: "glyphicon glyphicon-search dul-color" }),
                input({ type: "search", className: "form-control users-search", placeholder: "Enter search term...", value: this.searchDULCases }),
              ]),
            ]),
          ]),

          div({ className: "jumbotron table-box" }, [
            div({ className: "row no-margin" }, [
              div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 cell-header dul-color" }, ["Consent id"]),
              div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-3 cell-header dul-color" }, ["Consent Group Name"]),
              div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header f-center dul-color" }, [
                "Review/Vote",
                div({ isRendered: this.state.totalDulPendingVotes > 0, id: "dulPendingVoteCases", className: "pcases-small-tag" }, [
                  this.state.totalDulPendingVotes
                ]),
              ]),
              div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header f-center dul-color" }, ["Logged"]),
              div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header f-center dul-color" }, ["Actions"]),
            ]),

            hr({ className: "table-head-separator" }),

            this.state.electionsList.dul.slice((currentDulPage - 1) * this.state.dulLimit, currentDulPage * this.state.dulLimit).map((pendingCase, rIndex) => {
              return h(Fragment, { key: rIndex }, [
                div({ className: "row no-margin" }, [
                  div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 cell-body text", title: pendingCase.frontEndId }, [pendingCase.frontEndId]),

                  div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-3 cell-body text " + (!pendingCase.consentGroupName ? 'empty' : ''), title: pendingCase.consentGroupName }, [pendingCase.consentGroupName]),

                  div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body f-center" }, [
                    button({ onClick: this.openDULReview, className: "cell-button " + (pendingCase.alreadyVoted ? 'default-color' : 'cancel-color') }, [
                      span({ isRendered: pendingCase.alreadyVoted === false, value: JSON.stringify(pendingCase) }, ["Vote"]),
                      span({ isRendered: pendingCase.alreadyVoted === true, value: JSON.stringify(pendingCase) }, ["Edit"]),
                    ]),
                  ]),

                  div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text f-center" }, [pendingCase.logged]),

                  div({ isRendered: pendingCase.alreadyVoted === true, className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body f-center" }, [
                    button({ onClick: this.openDULReviewResult, className: "cell-button cancel-color" }, ["Collect Votes"]),
                  ]),
                  div({ isRendered: pendingCase.alreadyVoted === false, className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text empty f-center" }, []),
                ]),
                hr({ className: "table-body-separator" })
              ]);
            }),
            PaginatorBar({
              name: 'dul',
              total: this.state.electionsList.dul.length,
              limit: this.state.dulLimit,
              pageCount: this.dulPageCount,
              currentPage: this.state.currentDulPage,
              onPageChange: this.handleDulPageChange,
              changeHandler: this.handleDulSizeChange,
            }),
          ]),

          div({ className: "row no-margin" }, [
            div({ className: "col-lg-8 col-md-8 col-sm-8 col-xs-12 no-padding" }, [
              PageSubHeading({ imgSrc: "/images/icon_access.png", color: "access", title: "Data Access Request Review", description: "Should data access be granted to this applicant?" }),
            ]),
            div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-12 search-reviewed no-padding" }, [
              div({ className: "search-text" }, [
                i({ className: "glyphicon glyphicon-search access-color" }),
                input({ type: "search", className: "form-control users-search", placeholder: "Enter search term...", value: this.searchDULCases }),
              ]),
            ]),
          ]),

          div({ className: "jumbotron table-box" }, [
            div({ className: "row no-margin" }, [
              div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 cell-header access-color" }, ["Data Request Id"]),
              div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-3 cell-header access-color" }, ["Project Title"]),
              div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header f-center access-color" }, [
                "Review/Vote",
                div({ isRendered: this.state.totalAccessPendingVotes > 0, id: "accessPendingVoteCases", className: "pcases-small-tag" }, [
                  this.state.totalAccessPendingVotes
                ]),
              ]),
              div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header f-center access-color" }, ["Logged"]),
              div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header f-center access-color" }, [
                "Actions"
              ])
            ]),

            hr({ className: "table-head-separator" }),

            this.state.electionsList.access.slice((currentAccessPage - 1) * this.state.accessLimit, currentAccessPage * this.state.accessLimit).map((pendingCase, rIndex) => {
              return h(Fragment, { key: rIndex }, [
                div({ className: "row no-margin" }, [
                  div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 cell-body text", title: pendingCase.frontEndId }, [pendingCase.frontEndId]),

                  div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-3 cell-body text", title: pendingCase.projectTitle }, [pendingCase.projectTitle]),

                  div({ isRendered: pendingCase.electionStatus !== 'Final', className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body f-center" }, [
                    button({ onClick: this.openAccessReview, className: "cell-button " + (pendingCase.alreadyVoted === true ? 'default-color' : 'cancel-color') }, [
                      span({ isRendered: (pendingCase.alreadyVoted === false) && (pendingCase.electionStatus !== 'Final'), value: JSON.stringify(pendingCase) }, ["Vote"]),
                      span({ isRendered: pendingCase.alreadyVoted === true, value: JSON.stringify(pendingCase) }, ["Edit"])
                    ])
                  ]),
                  div({ isRendered: pendingCase.electionStatus === 'Final', className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text f-center empty" }, []),

                  div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text f-center" }, [pendingCase.logged]),

                  div({ isRendered: (pendingCase.alreadyVoted === true) && (!pendingCase.isFinalVote) && (pendingCase.electionStatus !== 'Final'), className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 cell-body f-center" }, [
                    button({ onClick: this.openAccessReviewResult, value: pendingCase, className: "cell-button cancel-color"}, ["Collect Votes"])
                  ]),
                  div({ isRendered: (pendingCase.alreadyVoted === true) && (pendingCase.electionStatus === 'Final'), className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 cell-body f-center" }, [
                    button({ onClick: this.openFinalAccessReviewResults, value: pendingCase, className: "cell-button cancel-color"}, ["FINAL VOTE"])
                  ]),
                  div({ isRendered: (!pendingCase.alreadyVoted) && (pendingCase.electionStatus !== 'Final'), className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 cell-body text f-center empty" }, [])
                ]),
                hr({ className: "table-body-separator" })
              ]);
            }),
            PaginatorBar({
              name: 'access',
              total: this.state.electionsList.dul.length,
              limit: this.state.accessLimit,
              pageCount: this.accessPageCount,
              currentPage: this.state.currentAccessPage,
              onPageChange: this.handleAccessPageChange,
              changeHandler: this.handleAccessSizeChange,
            })
          ])
        ])
      ])
    );
  }
});
