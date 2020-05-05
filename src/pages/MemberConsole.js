import _ from 'lodash';
import { Component, Fragment } from 'react';
import { button, div, h, hr, span } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { PageSubHeading } from '../components/PageSubHeading';
import { PaginatorBar } from '../components/PaginatorBar';
import { SearchBox } from '../components/SearchBox';
import { PendingCases } from '../libs/ajax';
import { Storage } from '../libs/storage';
import { NavigationUtils } from '../libs/utils';

class MemberConsole extends Component {

  constructor(props) {
    super(props);

    let currentUser = Storage.getCurrentUser();

    this.state = {
      currentUser: currentUser,
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
      totalResearchPurposePendingVotes: 0

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

  handleDulSizeChange = size => {
    this.setState(prev => {
      prev.dulLimit = size;
      prev.currentDulPage = 1;
      return prev;
    });
  };

  handleAccessPageChange = page => {
    this.setState(prev => {
      prev.currentAccessPage = page;
      return prev;
    });
  };

  handleAccessSizeChange = size => {
    this.setState(prev => {
      prev.accessLimit = size;
      prev.currentAccessPage = 1;
      return prev;
    });
  };

  handleOpenModal() {
    this.setState({ showModal: true });
  }

  handleCloseModal() {
    this.setState({ showModal: false });
  }

  componentDidMount() {
    this.getMembersInfo();
  }

  async getMembersInfo() {
    let currentUser = Storage.getCurrentUser();

    const duls = await PendingCases.findConsentPendingCasesByUser(currentUser.dacUserId);
    const dars = await PendingCases.findDataRequestPendingCasesByUser(currentUser.dacUserId);

    this.setState(prev => {
      prev.currentUser = currentUser;
      prev.totalDulPendingVotes = duls.totalDulPendingVotes;
      prev.electionsList.dul = duls.dul;
      prev.totalAccessPendingVotes = dars.totalAccessPendingVotes;
      prev.electionsList.access = dars.access;
      return prev;
    });

  }

  openAccessReview = (referenceId, voteId, rpVoteId) => async (e) => {
    const pathStart = await NavigationUtils.accessReviewPath();
    if (rpVoteId !== null) {
      this.props.history.push(`${pathStart}/${referenceId}/${voteId}/${rpVoteId}`);
    } else {
      this.props.history.push(`${pathStart}/${referenceId}/${voteId}`);
    }
  };

  openDULReview = (consentId, voteId) => (e) => {
    this.props.history.push(`dul_review/${voteId}/${consentId}`);
  };

  handleSearchDul = (query) => {
    this.setState({ searchDulText: query });
  };

  handleSearchDar = (query) => {
    this.setState({ searchDarText: query });
  };

  searchTable = (query) => (row) => {
    if (query && query !== undefined) {
      let text = JSON.stringify(row);
      return text.toLowerCase().includes(query.toLowerCase());
    }
    return true;
  };

  render() {

    const { currentUser, searchDulText, searchDarText } = this.state;
    const oneColumnClass = 'col-lg-1 col-md-1 col-sm-1 col-xs-1';
    const twoColumnClass = 'col-lg-2 col-md-2 col-sm-2 col-xs-2';
    const threeColumnClass = 'col-lg-3 col-md-3 col-sm-3 col-xs-3';

    return (

      div({ className: 'container' }, [
        div({ className: 'col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12' }, [
          PageHeading({
            id: 'memberConsole', color: 'common', title: 'Welcome ' + currentUser.displayName + '!',
            description: 'These are your pending cases for review'
          }),
          hr({ className: 'section-separator' }),

          div({ className: 'row no-margin' }, [
            div({ className: 'col-lg-8 col-md-8 col-sm-8 col-xs-12 no-padding' }, [
              PageSubHeading({
                id: 'memberConsoleDul', imgSrc: '/images/icon_dul.png', color: 'dul', title: 'Data Use Limitations Review',
                description: 'Were data use limitations accurately converted to a structured format?'
              })
            ]),
            div({ className: 'col-lg-4 col-md-4 col-sm-4 col-xs-12 search-wrapper no-padding' }, [
              h(SearchBox, { id: 'memberConsoleDul', searchHandler: this.handleSearchDul, pageHandler: this.handleDulPageChange, color: 'dul' })
            ])
          ]),

          div({ className: 'jumbotron table-box' }, [
            div({ className: 'row no-margin' }, [
              div({ className: twoColumnClass + ' cell-header dul-color' }, ['Consent id']),
              div({ className: threeColumnClass + ' cell-header dul-color' }, ['Consent Group Name']),
              div({ className: twoColumnClass + ' cell-header dul-color' }, ['DAC']),
              div({ className: twoColumnClass + ' cell-header f-center dul-color' }, ['Status']),
              div({ className: oneColumnClass + ' cell-header f-center dul-color' }, ['Logged']),
              div({ className: twoColumnClass + ' cell-header f-center dul-color' }, [
                'Review/Vote',
                div({ isRendered: this.state.totalDulPendingVotes > 0, className: 'pcases-small-tag' }, [this.state.totalDulPendingVotes])
              ])
            ]),
            hr({ className: 'table-head-separator' }),

            this.state.electionsList.dul
              .filter(this.searchTable(searchDulText))
              .slice((this.state.currentDulPage - 1) * this.state.dulLimit, this.state.currentDulPage * this.state.dulLimit).map((pendingCase, rIndex) => {
                return h(Fragment, { key: rIndex }, [
                  div({ className: 'row no-margin tableRowDul' }, [
                    div({
                      id: pendingCase.frontEndId + '_consentId', name: 'consentId', className: twoColumnClass + ' cell-body text',
                      title: pendingCase.frontEndId
                    }, [pendingCase.frontEndId]),
                    div({
                      id: pendingCase.frontEndId + '_consentGroup', name: 'consentGroup',
                      className: threeColumnClass + ' cell-body text ' + (!pendingCase.consentGroupName ? 'empty' : ''),
                      title: pendingCase.consentGroupName
                    }, [pendingCase.consentGroupName]),
                    div({
                      id: pendingCase.frontEndId + '_dacName', name: 'dacName', className: twoColumnClass + ' cell-body text',
                      title: _.get(pendingCase, 'dac.name', '')
                    }, [_.get(pendingCase, 'dac.name', '- -')]),
                    div({
                      id: pendingCase.frontEndId + '_statusDul', name: 'statusDul',
                      className: twoColumnClass + ' cell-body text bold f-center'
                    }, [
                      span({ isRendered: pendingCase.isReminderSent === true }, ['URGENT!']),
                      span({ isRendered: (pendingCase.status === 'pending') && (pendingCase.isReminderSent !== true) }, ['Pending']),
                      span({ isRendered: (pendingCase.status === 'editable') && (pendingCase.isReminderSent !== true) }, ['Editable'])
                    ]),
                    div({
                      id: pendingCase.frontEndId + '_logged', name: 'loggedDul',
                      className: oneColumnClass + ' cell-body text f-center'
                    }, [pendingCase.logged]),
                    div({
                      onClick: this.openDULReview(pendingCase.referenceId, pendingCase.voteId),
                      className: twoColumnClass + ' cell-body f-center'
                    }, [
                      button({
                        id: pendingCase.frontEndId + '_btnVoteDul', name: 'btn_voteDul',
                        className: 'cell-button ' + (pendingCase.alreadyVoted ? 'default-color' : 'cancel-color')
                      }, [
                        span({ isRendered: pendingCase.alreadyVoted === false }, ['Vote']),
                        span({ isRendered: pendingCase.alreadyVoted === true }, ['Edit'])
                      ])
                    ])
                  ]),
                  hr({ className: 'table-body-separator' })
                ]);
              }),
            PaginatorBar({
              name: 'dul',
              total: this.state.electionsList.dul.filter(this.searchTable(searchDulText)).length,
              limit: this.state.dulLimit,
              currentPage: this.state.currentDulPage,
              onPageChange: this.handleDulPageChange,
              changeHandler: this.handleDulSizeChange
            })
          ]),

          div({ className: 'row no-margin' }, [
            div({ className: 'col-lg-8 col-md-8 col-sm-8 col-xs-12 no-padding' }, [
              PageSubHeading({
                id: 'memberConsoleAccess', imgSrc: '/images/icon_access.png', color: 'access', title: 'Data Access Request Review',
                description: 'Should data access be granted to this applicant?'
              })
            ]),

            div({ className: 'col-lg-4 col-md-4 col-sm-4 col-xs-12 search-wrapper no-padding' }, [
              h(SearchBox,
                { id: 'memberConsoleAccess', searchHandler: this.handleSearchDar, pageHandler: this.handleAccessPageChange, color: 'access' })
            ])
          ]),
          div({ className: 'jumbotron table-box' }, [
            div({ className: 'row no-margin' }, [
              div({ className: twoColumnClass + ' cell-header access-color' }, ['Data Request Id']),
              div({ className: threeColumnClass + ' cell-header access-color' }, ['Project Title']),
              div({ className: twoColumnClass + ' cell-header access-color' }, ['DAC']),
              div({ className: twoColumnClass + ' cell-header access-color f-center' }, ['Status']),
              div({ className: oneColumnClass + ' cell-header access-color f-center' }, ['Logged']),
              div({ className: twoColumnClass + ' cell-header access-color f-center' }, [
                'Review/Vote',
                div({ isRendered: this.state.totalAccessPendingVotes > 0, className: 'pcases-small-tag' }, [this.state.totalAccessPendingVotes])
              ])
            ]),

            hr({ className: 'table-head-separator' }),

            this.state.electionsList.access
              .filter(this.searchTable(searchDarText))
              .slice((this.state.currentAccessPage - 1) * this.state.accessLimit, this.state.currentAccessPage * this.state.accessLimit).map((pendingCase, rIndex) => {
                return h(Fragment, { key: rIndex }, [
                  div({ className: 'row no-margin tableRowAccess' }, [
                    div({
                      id: pendingCase.frontEndId + '_darId', name: 'darId', className: twoColumnClass + ' cell-body text',
                      title: pendingCase.frontEndId
                    }, [pendingCase.frontEndId]),
                    div({
                      id: pendingCase.frontEndId + '_projectTitle', name: 'projectTitle',
                      className: threeColumnClass + ' cell-body text', title: pendingCase.projectTitle
                    }, [pendingCase.projectTitle]),
                    div({
                      id: pendingCase.frontEndId + '_dacName', name: 'dacName', className: twoColumnClass + ' cell-body text',
                      title: _.get(pendingCase, 'dac.name', '')
                    }, [_.get(pendingCase, 'dac.name', '- -')]),
                    div({
                      id: pendingCase.frontEndId + '_statusAccess', name: 'statusAccess',
                      className: twoColumnClass + ' cell-body text f-center bold'
                    }, [
                      span({ isRendered: pendingCase.isReminderSent === true }, ['URGENT!']),
                      span({ isRendered: (pendingCase.status === 'pending') && (pendingCase.isReminderSent !== true) }, ['Pending']),
                      span({ isRendered: (pendingCase.status === 'editable') && (pendingCase.isReminderSent !== true) }, ['Editable'])
                    ]),
                    div({
                      id: pendingCase.frontEndId + '_loggedAccess', name: 'loggedAccess',
                      className: oneColumnClass + ' cell-body text f-center'
                    }, [pendingCase.logged]),
                    div({
                      onClick: this.openAccessReview(pendingCase.referenceId, pendingCase.voteId, pendingCase.rpVoteId),
                      className: twoColumnClass + ' cell-body f-center'
                    }, [
                      button({
                        id: pendingCase.frontEndId + '_btnVoteAccess', name: 'btn_voteAccess',
                        className: 'cell-button ' + (pendingCase.alreadyVoted ? 'default-color' : 'cancel-color')
                      }, [
                        span({ isRendered: pendingCase.alreadyVoted === false }, ['Vote']),
                        span({ isRendered: pendingCase.alreadyVoted === true }, ['Edit'])
                      ])
                    ])
                  ]),
                  hr({ className: 'table-body-separator' })
                ]);
              }),
            PaginatorBar({
              name: 'access',
              total: this.state.electionsList.access.filter(this.searchTable(searchDarText)).length,
              limit: this.state.accessLimit,
              currentPage: this.state.currentAccessPage,
              onPageChange: this.handleAccessPageChange,
              changeHandler: this.handleAccessSizeChange
            })
          ])
        ])
      ])
    );
  }
}

export default MemberConsole;
