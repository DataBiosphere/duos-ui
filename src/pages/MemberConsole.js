import { Component, Fragment } from 'react';
import { div, hr, i, input, span, h, button } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { PageSubHeading } from '../components/PageSubHeading';
import { PaginatorBar } from '../components/PaginatorBar';
import { Storage } from '../libs/storage';
import { PendingCases } from '../libs/ajax';

class MemberConsole extends Component {

  dulPageCount = 5;
  accessPageCount = 5;

  searchDulCases = '';
  searchAccessCases = '';

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
        rp: []
      },
      totalDulPendingVotes: 0,
      totalAccessPendingVotes: 0,
      totalResearchPurposePendingVotes: 0,

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

  handleOpenModal() {
    this.setState({ showModal: true });
  }

  handleCloseModal() {
    this.setState({ showModal: false });
  }

  componentWillMount() {
    let currentUser = Storage.getCurrentUser();

    this.setState({ currentUser: currentUser });

    PendingCases.findConsentPendingCasesByUser(currentUser.dacUserId).then(
      resp => {
        this.setState(prev => {
          prev.totalDulPendingVotes = resp.totalDulPendingVotes;
          prev.electionsList.dul = resp.dul;
          return prev;
        });
      });

    PendingCases.findDataRequestPendingCasesByUser(currentUser.dacUserId).then(
      resp => {
        this.setState(prev => {
          prev.totalAccessPendingVotes = resp.totalAccessPendingVotes;
          prev.electionsList.access = resp.access;
          return prev;
        });
      });

  }

  openAccessReview = (referenceId, voteId, rpVoteId) => (e) => {
    this.props.history.push({ pathname: 'access_review', props: { darId: referenceId, voteId: voteId, rpVoteId: rpVoteId } })
  };

  openDULReview = (consentId, voteId) => (e) => {
    this.props.history.push(`dul_review/${voteId}/${consentId}`);
  };

  render() {

    const { currentUser, currentDulPage, currentAccessPage } = this.state;

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
              div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header f-center dul-color" }, ["Status"]),
              div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header f-center dul-color" }, ["Logged"]),
              div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header f-center dul-color" }, [
                "Review/Vote",
                div({ isRendered: this.state.totalDulPendingVotes > 0, className: "pcases-small-tag" }, [this.state.totalDulPendingVotes]),
              ])
            ]),
            hr({ className: "pvotes-main-separator" }),

            this.state.electionsList.dul.slice((currentDulPage - 1) * this.state.dulLimit, currentDulPage * this.state.dulLimit).map((pendingCase, rIndex) => {
              return h(Fragment, { key: rIndex }, [
                div({ className: "row no-margin" }, [
                  div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 cell-body text", title: pendingCase.frontEndId }, [pendingCase.frontEndId]),
                  div({
                    className: "col-lg-4 col-md-4 col-sm-4 col-xs-3 cell-body text " + (!pendingCase.consentGroupName ? 'empty' : ""),
                    title: pendingCase.consentGroupName
                  }, [pendingCase.consentGroupName]),
                  div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text bold f-center" }, [
                    span({ isRendered: pendingCase.isReminderSent === true }, ["URGENT!"]),
                    span({ isRendered: (pendingCase.status === 'pending') && (pendingCase.isReminderSent !== true) }, ["Pending"]),
                    span({ isRendered: (pendingCase.status === 'editable') && (pendingCase.isReminderSent !== true) }, ["Editable"]),
                  ]),
                  div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text f-center" }, [pendingCase.logged]),
                  div({ onClick: this.openDULReview(pendingCase.referenceId, pendingCase.voteId), className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body f-center" }, [
                    button({ className: "cell-button " + (pendingCase.alreadyVoted ? 'default-color' : 'cancel-color') }, [
                      span({ isRendered: pendingCase.alreadyVoted === false }, ["Vote"]),
                      span({ isRendered: pendingCase.alreadyVoted === true }, ["Edit"]),
                    ]),
                  ]),
                ]),
                hr({ className: "pvotes-separator" })
              ])
            }),
            PaginatorBar({
              name: 'dul',
              total: this.state.electionsList.dul.length,
              limit: this.state.dulLimit,
              pageCount: this.dulPageCount,
              currentPage: this.state.currentDulPage,
              onPageChange: this.handleDulPageChange,
              changeHandler: this.handleDulSizeChange,
            })
          ]),

          div({ className: "row no-margin" }, [
            div({ className: "col-lg-8 col-md-8 col-sm-8 col-xs-12 no-padding" }, [
              PageSubHeading({ imgSrc: "/images/icon_access.png", color: "access", title: "Data Access Request Review", description: "Should data access be granted to this applicant?" }),
            ]),

            div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-12 search-reviewed no-padding" }, [
              div({ className: "search-text" }, [
                i({ className: "glyphicon glyphicon-search access-color" }),
                input({ type: "search", className: "form-control users-search", placeholder: "Enter search term...", value: this.searchAccessCases }),
              ]),
            ]),
          ]),
          div({ className: "jumbotron table-box" }, [
            div({ className: "row no-margin" }, [
              div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 cell-header access-color" }, ["Data Request Id"]),
              div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-3 cell-header access-color" }, ["Project Title"]),
              div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header access-color f-center" }, ["Status"]),
              div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header access-color f-center" }, ["Logged"]),
              div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-header access-color f-center" }, ["Review/Vote",
                div({ isRendered: this.state.totalAccessPendingVotes > 0, className: "pcases-small-tag" }, [this.state.totalAccessPendingVotes]),
              ]),
            ]),

            hr({ className: "pvotes-main-separator" }),

            this.state.electionsList.access.slice((currentAccessPage - 1) * this.state.accessLimit, currentAccessPage * this.state.accessLimit).map((pendingCase, rIndex) => {
              return h(Fragment, { key: rIndex }, [
                div({ className: "row no-margin" }, [
                  div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 cell-body text", title: pendingCase.frontEndId }, [pendingCase.frontEndId]),
                  div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-3 cell-body text", title: pendingCase.projectTitle }, [pendingCase.projectTitle]),
                  div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text f-center bold" }, [
                    span({ isRendered: pendingCase.isReminderSent === true }, ["URGENT!"]),
                    span({ isRendered: (pendingCase.status === 'pending') && (pendingCase.isReminderSent !== true) }, ["Pending"]),
                    span({ isRendered: (pendingCase.status === 'editable') && (pendingCase.isReminderSent !== true) }, ["Editable"]),
                  ]),
                  div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body text f-center" }, [pendingCase.logged]),
                  div({
                    onClick: this.openAccessReview(pendingCase.referenceId, pendingCase.voteId, pendingCase.rpVoteId),
                    className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 cell-body f-center"
                  }, [
                      button({ className: "cell-button " + (pendingCase.alreadyVoted ? 'default-color' : 'cancel-color') }, [
                        span({ isRendered: pendingCase.alreadyVoted === false }, ["Vote"]),
                        span({ isRendered: pendingCase.alreadyVoted === true }, ["Edit"]),
                      ]),
                    ]),
                ]),
                hr({ className: "pvotes-separator" })
              ])
            }),
            PaginatorBar({
              name: 'access',
              total: this.state.electionsList.access.length,
              limit: this.state.accessLimit,
              pageCount: this.accessPageCount,
              currentPage: this.state.currentAccessPage,
              onPageChange: this.handleAccessPageChange,
              changeHandler: this.handleAccessSizeChange,
            }),
          ]),
        ]),
      ])
    );
  }
}

export default MemberConsole;
