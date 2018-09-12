import { Component, Fragment } from 'react';
import { div, hh, h, hr, i, input, span, button } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { PageSubHeading } from '../components/PageSubHeading';
import { Storage } from '../libs/storage';
import { PaginatorBar } from '../components/PaginatorBar';
import { PendingCases } from '../libs/ajax';

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
      darLimit: 5,
      currentDulPage: 1,
      currentDarPage: 1,
      totalDulPendingVotes: 0,
      totalAccessPendingVotes: 0,
      electionsList: {
        dul: [],
        access: []
      }
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
      prev.currentDarPage = page;
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
      prev.darLimit = size;
      return prev;
    });
  };

  componentWillMount() {
    let currentUser = Storage.getCurrentUser();
    this.setState({ currentUser: currentUser }, () => {
      this.init(currentUser);
    });
  }

  async init(currentUser) {

    let duls = await PendingCases.findConsentPendingCasesByUser(currentUser.dacUserId);
    this.setState(prev => {
      prev.electionsList.dul = duls.dul;
      prev.totalDulPendingVotes = duls.totalDulPendingVotes
      return prev;
    });

    let dars = await PendingCases.findDataRequestPendingCasesByUser(currentUser.dacUserId);
    this.setState(prev => {
      prev.electionsList.access = dars.access;
      prev.totalAccessPendingVotes = dars.totalAccessPendingVotes;
      return prev;
    });
  }

  openDULReview = (voteId, referenceId) => (e) => {
    this.props.history.push(`dul_review/${voteId}/${referenceId}`);
  }

  openDulCollect = (consentId) => (e) => {
    this.props.history.push(`dul_collect/${consentId}`);
  }

  openFinalAccessReview = (referenceId, electionId, rpElectionId) => (e) => {
    this.props.history.push({ pathname: 'final_access_review', props:  { referenceId: referenceId, electionId: electionId, rpElectionId: rpElectionId } });
  }

  openAccessReview = (darId, voteId, rpVoteId) => (e) => {
   this.props.history.push({ pathname: 'access_review', props: { darId: darId, voteId: voteId, rpVoteId: rpVoteId } });
 }

  openAccessCollect = (referenceId, electionId) => (e) => {
    this.props.history.push({ pathname: 'access_collect', props: { referenceId: referenceId, electionId: electionId } });
  }

  handleOpenModal() {
    this.setState({ showModal: true });
  }

  handleCloseModal() {
    this.setState({ showModal: false });
  }

  render() {

    const { currentUser, currentDulPage, dulLimit, currentDarPage, darLimit } = this.state;

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

            hr({ className: "pvotes-main-separator" }),

            this.state.electionsList.dul.slice((currentDulPage - 1) * dulLimit, currentDulPage * dulLimit).map((pendingCase, rIndex) => {
              return h(Fragment, { key: rIndex }, [
                div({ className: "row no-margin" }, [
                  div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 cell-body text", title: pendingCase.frontEndId }, [pendingCase.frontEndId]),

                  div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-3 cell-body text " + (!pendingCase.consentGroupName ? 'empty' : ''), title: pendingCase.consentGroupName }, [pendingCase.consentGroupName]),

                  div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body f-center" }, [
                    button({
                      onClick: this.openDULReview (pendingCase.voteId, pendingCase.referenceId),
                      className: "cell-button " + (pendingCase.alreadyVoted ? 'default-color' : 'cancel-color')
                    }, [
                        span({ isRendered: pendingCase.alreadyVoted === false }, ["Vote"]),
                        span({ isRendered: pendingCase.alreadyVoted === true }, ["Edit"]),
                      ]),
                  ]),

                  div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text f-center" }, [pendingCase.logged]),

                  div({ isRendered: pendingCase.alreadyVoted === true, className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body f-center" }, [
                    button({ onClick: this.openDulCollect(pendingCase.referenceId), className: "cell-button cancel-color" }, ["Collect Votes"]),
                  ]),
                  div({ isRendered: pendingCase.alreadyVoted === false, className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text empty f-center" }, []),
                ]),
                hr({ className: "pvotes-separator" })
              ]);
            }),
            PaginatorBar({
              name: 'dul',
              total: this.state.electionsList.dul.length,
              limit: dulLimit,
              pageCount: this.dulPageCount,
              currentPage: currentDulPage,
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

            hr({ className: "pvotes-main-separator" }),

            this.state.electionsList.access.slice((currentDarPage - 1) * darLimit, currentDarPage * darLimit).map((pendingCase, rIndex) => {
              return h(Fragment, { key: rIndex }, [
                div({ className: "row no-margin" }, [
                  div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 cell-body text", title: pendingCase.frontEndId }, [pendingCase.frontEndId]),

                  div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-3 cell-body text", title: pendingCase.projectTitle }, [pendingCase.projectTitle]),

                  div({ isRendered: pendingCase.electionStatus !== 'Final', className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body f-center" }, [
                    button({ onClick: this.openAccessReview(pendingCase.darId, pendingCase.voteId, pendingCase.rpVoteId), 
                      className: "cell-button " + (pendingCase.alreadyVoted === true ? 'default-color' : 'cancel-color') }, [
                      span({ isRendered: (pendingCase.alreadyVoted === false) && (pendingCase.electionStatus !== 'Final') }, ["Vote"]),
                      span({ isRendered: pendingCase.alreadyVoted === true }, ["Edit"])
                    ])
                  ]),
                  div({ isRendered: pendingCase.electionStatus === 'Final', className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text f-center empty" }, []),

                  div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text f-center" }, [pendingCase.logged]),

                  div({ isRendered: (pendingCase.alreadyVoted === true) && (!pendingCase.isFinalVote) && (pendingCase.electionStatus !== 'Final'), className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 cell-body f-center" }, [
                    button({ onClick: this.openAccessCollect(pendingCase.referenceId, pendingCase.electionId),
                       className: "cell-button cancel-color" }, ["Collect Votes"])
                  ]),
                  div({ isRendered: (pendingCase.alreadyVoted === true) && (pendingCase.electionStatus === 'Final'), className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 cell-body f-center" }, [
                    button({ onClick: this.openFinalAccessReview(pendingCase.referenceId, pendingCase.electionId, pendingCase.rpElectionId), 
                      className: "cell-button cancel-color" }, ["FINAL VOTE"])
                  ]),
                  div({ isRendered: (!pendingCase.alreadyVoted) && (pendingCase.electionStatus !== 'Final'), className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 cell-body text f-center empty" }, [])
                ]),
                hr({ className: "pvotes-separator" })
              ]);
            }),
            PaginatorBar({
              name: 'access',
              total: this.state.electionsList.dul.length,
              limit: darLimit,
              pageCount: this.accessPageCount,
              currentPage: currentDarPage,
              onPageChange: this.handleAccessPageChange,
              changeHandler: this.handleAccessSizeChange,
            })
          ])
        ])
      ])
    );
  }
});
