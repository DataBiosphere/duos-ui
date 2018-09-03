import { Component, Fragment } from 'react';
import { div, hr, h2, br, i, img, input, span, small, a, h, } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import _ from "lodash/fp";
import { PaginatorBar } from '../components/PaginatorBar';

class MemberConsole extends Component {

  dulPageCount = 10;
  accessPageCount = 10;

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

    let dul = [];
    let access = [];
    for (var i = 0; i < 27; i++) {
      dul.push(this.createPendingCase(i));
      access.push(this.createPendingCase(i));
    }

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
      // status: ix % 2 === 0 ? 'pending' :   ix % 6 === 1 ? 'editable' : '',
      status: 'editable',
      isFinalVote: ix % 2 === 0 ? true : false,
      isReminderSent: ix % 2 === 0 ? false : true,
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
  render() {

    const { currentDulPage, currentAccessPage } = this.state;
    console.log(JSON.stringify(this.state.electionsList.dul, null, 2));
    console.log(this.state.electionsList.dul.length);


    let currentUser = {
      displayName: 'Nadya Lopez Zalba'
    }

    return (

      // div({ className: "container" }, [
      //   div({ className: "row no-margin" }, [
      //     div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
      //       PageHeading({ color: "common", title: "Welcome " + currentUser.displayName + "!", description: "These are your pending cases for review" }),
      //     ]),

      //   ]),
      //   hr({ className: "section-separator" }),

      //   div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
      //     div({ className: "row no-margin" }, [
      //       h2({ className: "col-lg-7 col-md-7 col-sm-8 col-xs-12 pvotes-box-title dul-color" }, [
      //         img({ src: "/images/icon_dul.png", alt: "Data Use Limitations Review icon", className: "pvotes-icons" }),
      //         "Data Use Limitations Review",
      //         br({}),
      //         div({ className: "pvotes-box-title-description" }, [
      //           "Were data use limitations accurately converted to a structured format?"
      //         ])
      //       ]),

      //       div({ className: "col-lg-3 col-md-3 col-sm-4 col-xs-12 search-reviewed no-padding" }, [
      //         div({ className: "search-text" }, [
      //           i({ className: "glyphicon glyphicon-search dul-color" }),
      //           input({ type: "search", className: "form-control users-search", placeholder: "Enter search term...", "ng-model": "searchDULCases" })
      //         ]),
      //       ]),
      //     ]),
      //   ]),
      // ])


      //-------------------------------------
      div({ className: "container" }, [
        div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [
          h2({ className: "cm-title common-color" }, [
            div({ id: "dacUser" }, ["Welcome ", this.state.currentUser.displayName, " !"]),
            small({}, ["These are your pending cases for review"]),
          ]),
          hr({ className: "section-separator" }),
        ]),
        div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [
          div({ className: "row no-margin" }, [
            h2({ className: "col-lg-8 col-md-8 col-sm-8 col-xs-12 pvotes-box-title dul-color" }, [
              img({ src: "/images/icon_dul.png", alt: "Data Use Limitations Review icon", className: "pvotes-icons" }),
              "Data Use Limitations Review",
              br(),
              div({ className: "pvotes-box-title-description" }, ["Were data use limitations accurately converted to a structured format?"]),
            ]),
            div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-12 search-reviewed no-padding" }, [
              div({ className: "search-text" }, [
                i({ className: "glyphicon glyphicon-search dul-color" }),
                input({ type: "search", className: "form-control users-search", placeholder: "Enter search term...", value: this.searchDULCases }),
              ]),
            ]),
          ]),
          div({ className: "jumbotron box-vote-singleresults box-vote-no-margin" }, [
            div({ className: "row" }, [
              div({ className: "pvotes-box-head fsi-row-lg-level fsi-row-md-level" }, [
                div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 pvotes-box-subtitle dul-color" }, ["Consent id"]),
                div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-3 pvotes-box-subtitle dul-color" }, ["Consent Group Name"]),
                div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 center-text pvotes-box-subtitle dul-color" }, ["Status"]),
                div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 center-text pvotes-box-subtitle dul-color" }, ["Logged"]),
                div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 center-text pvotes-box-subtitle dul-color" }, [
                  "Review/Vote",
                  div({ isRendered: this.state.totalDulPendingVotes > 0, className: "pcases-small-tag" }, [this.state.totalDulPendingVotes]),
                ]),
              ]),
              hr({ className: "pvotes-main-separator" }),
              div({ className: "pvotes-box-body" }, [
                this.state.electionsList.dul.slice((currentDulPage - 1) * this.state.dulLimit, currentDulPage * this.state.dulLimit).map((pendingCase, rIndex) => {
                  return h(Fragment, { key: rIndex }, [

                    hr({ className: "pvotes-separator" }),
                    div({ className: "row pvotes-main-list" }, [
                      div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 pvotes-list-id", title: pendingCase.frontEndId }, [pendingCase.frontEndId]),
                      div({
                        className: "col-lg-4 col-md-4 col-sm-4 col-xs-3 pvotes-list-id", "ng-class": "{empty : !pendingCase.consentGroupName}",
                        title: pendingCase.consentGroupName
                      }, [pendingCase.consentGroupName]),
                      div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 pvotes-list bold" }, [
                        span({ isRendered: pendingCase.isReminderSent === true }, ["URGENT!"]),
                        span({ isRendered: pendingCase.status === 'pending' && pendingCase.isReminderSent !== true }, ["Pending"]),
                        span({ isRendered: pendingCase.status === 'editable' }, ["Editable"]),
                      ]),
                      div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 pvotes-list" }, [pendingCase.logged]),
                      a({ onClick: this.openDULReview, /*pendingCase.referenceId, pendingCase.voteId)"*/ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2" }, [
                        div({ className: pendingCase.alreadyVoted ? 'editable' : 'enabled' }, [
                          span({ isRendered: pendingCase.alreadyVoted === false }, ["Vote"]),
                          span({ isRendered: pendingCase.alreadyVoted === true }, ["Edit"]),
                        ]),
                      ]),
                    ]),
                  ]);
                }),
                hr({ className: "pvotes-separator" }),
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
            ]),
          ]),
        ]),

        div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [
          div({ className: "row no-margin" }, [
            h2({ className: "col-lg-8 col-md-8 col-sm-8 col-xs-12 pvotes-box-title access-color" }, [
              img({ src: "/images/icon_access.png", alt: "Data Access Review icon", className: "pvotes-icons" }),
              "Data Access Request Review",
              br(),
              div({ className: "pvotes-box-title-description" }, ["Should data access be granted to this applicant?"]),
            ]),
            div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-12 search-reviewed no-padding" }, [
              div({ className: "search-text" }, [
                i({ className: "glyphicon glyphicon-search access-color" }),
                input({ type: "search", className: "form-control users-search", placeholder: "Enter search term...", value: this.searchAccessCases }),
              ]),
            ]),
          ]),
          div({ className: "jumbotron box-vote-singleresults box-vote-no-margin" }, [
            div({ className: "row" }, [
              div({ className: "pvotes-box-head fsi-row-lg-level fsi-row-md-level" }, [
                div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 pvotes-box-subtitle access-color" }, ["Data Request Id"]),
                div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-3 pvotes-box-subtitle access-color" }, ["Project Title"]),
                div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 center-text pvotes-box-subtitle access-color" }, ["Status"]),
                div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 center-text pvotes-box-subtitle access-color" }, ["Logged"]),
                div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 center-text pvotes-box-subtitle access-color" }, ["Review/Vote",
                  div({ isRendered: this.state.totalAccessPendingVotes > 0, className: "pcases-small-tag" }, [this.state.totalAccessPendingVotes]),
                ]),
              ]),
              hr({ className: "pvotes-main-separator" }),
              div({ className: "pvotes-box-body" }, [

                this.state.electionsList.access.slice((currentAccessPage - 1) * this.state.accessLimit, currentAccessPage * this.state.accessLimit).map((pendingCase, rIndex) => {
                  return h(Fragment, { key: rIndex }, [

                    hr({ className: "pvotes-separator" }),
                    div({ className: "row pvotes-main-list" }, [
                      div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-3 pvotes-list-id", title: pendingCase.frontEndId }, [pendingCase.frontEndId]),
                      div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-3 pvotes-list-id", title: pendingCase.projectTitle }, [pendingCase.projectTitle]),
                      div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 pvotes-list this.pendingCase.status " }, [
                        span({ isRendered: pendingCase.isReminderSent === true }, ["URGENT!"]),
                        span({ isRendered: pendingCase.status === 'pending' && pendingCase.isReminderSent !== true }, ["Pending"]),
                        span({ isRendered: pendingCase.status === 'editable' }, ["Editable"]),
                      ]),
                      div({ className: "col-lg-2 col-md-2 col-sm-2 col-xs-2 pvotes-list" }, [pendingCase.logged]),
                      a({
                        onClick: this.openAccessReview, /*(pendingCase.referenceId, pendingCase.voteId, pendingCase.rpVoteId)"*/
                        className: "col-lg-2 col-md-2 col-sm-2 col-xs-2"
                      }, [
                          div({ className: pendingCase.status }, [
                            span({ isRendered: pendingCase.alreadyVoted === false }, ["Vote"]),
                            span({ isRendered: pendingCase.alreadyVoted === true }, ["Edit"]),
                          ]),
                        ]),
                    ]),
                  ]);
                }),
                hr({ className: "pvotes-separator" }),
                PaginatorBar({
                  name: 'access',
                  total: this.state.electionsList.dul.length,
                  limit: this.state.accessLimit,
                  pageCount: this.accessPageCount,
                  currentPage: this.state.currentAccessPage,
                  onPageChange: this.handleAccessPageChange,
                  changeHandler: this.handleAccessSizeChange,
                }),
              ]),
            ]),
          ]),
        ]),
      ])
    );
  }
}

export default MemberConsole;
