import _ from 'lodash';
import { Component, Fragment } from 'react';
import {button, div, h, hr, img, input, span} from 'react-hyperscript-helpers';
import { useRef } from 'react';
import { PageHeading } from '../components/PageHeading';
import { PageSubHeading } from '../components/PageSubHeading';
import { PaginatorBar } from '../components/PaginatorBar';
import { SearchBox } from '../components/SearchBox';
import { PendingCases } from '../libs/ajax';
import { Storage } from '../libs/storage';
import { NavigationUtils } from '../libs/utils';
import {Styles} from "../libs/theme";

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
      // Filter vote-able elections. See https://broadinstitute.atlassian.net/browse/DUOS-789
      // for more work related to ensuring closed elections aren't displayed here.
      prev.electionsList.access = _.filter(dars.access, (e) => { return e.electionStatus !== 'Closed'; });
      return prev;
    });

  }

  openAccessReview = (referenceId) => async (e) => {
    const pathStart = NavigationUtils.accessReviewPath();
    this.props.history.push(`${pathStart}/${referenceId}`);
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

    const { currentUser, searchDarText } = this.state;
    const oneColumnClass = 'col-lg-1 col-md-1 col-sm-1 col-xs-1 ';
    const twoColumnClass = 'col-lg-2 col-md-2 col-sm-2 col-xs-2';
    const threeColumnClass = 'col-lg-3 col-md-3 col-sm-3 col-xs-3';

    return (

      div({ className: 'container' }, [
          div({style: Styles.HEADER_CONTAINER}, [
            div({style: Styles.TITLE}, ['Welcome to your DAC Member Console, ' + currentUser.displayName + '!']),
            div({style: Styles.SMALL}, ['These are your pending cases for review'])
          ]),
          hr({ className: 'section-separator' }),
          div({ className: 'row no-margin' }, [
            div({ style: {display: "flex", justifyContent: "space-between"}}, [
              div({className: "left-header-section", style: Styles.LEFT_HEADER_SECTION}, [
                div({style: Styles.ICON_CONTAINER}, [
                  img({
                    id: 'lock-icon',
                    src: '/images/lock-icon.png',
                    style: Styles.HEADER_IMG
                  })
                ]),
                div({style: Styles.HEADER_CONTAINER}, [
                  div({style: Styles.TITLE}, ['Data Access Request Review']),
                  div({style: Styles.SMALL}, ['Should data access be granted to this applicant?'])
                ])
              ]),
              div({className: "right-header-section", style: Styles.RIGHT_HEADER_SECTION}, [
                h(SearchBox,
                  { id: 'memberConsoleAccess', searchHandler: this.handleSearchDar, pageHandler: this.handleAccessPageChange, color: 'access' })
              ])
            ]),
          ]),
          div({ style: Styles.TABLE.CONTAINER }, [
            div({style: Styles.TABLE.MEMBER_HEADER_ROW}, [
              div({className: twoColumnClass}, ["Data Request ID"]),
              div({className: threeColumnClass}, ["Project Title"]),
              div({className: twoColumnClass}, ["DAC"]),
              div({className: twoColumnClass}, ["Status"]),
              div({className: oneColumnClass}, ["Logged"]),
              div({className: twoColumnClass}, [
                "Review/Vote",
                div({ isRendered: this.state.totalAccessPendingVotes > 0, className: 'pcases-small-tag' }, [this.state.totalAccessPendingVotes])
              ])
            ]),

            this.state.electionsList.access
              .filter(this.searchTable(searchDarText))
              .slice((this.state.currentAccessPage - 1) * this.state.accessLimit, this.state.currentAccessPage * this.state.accessLimit).map((pendingCase, rIndex) => {
                return h(Fragment, { key: rIndex }, [
                  div({style: Styles.TABLE.RECORD_ROW, paddingTop: '1rem'}, [
                    div({className: twoColumnClass, style: Styles.TABLE.MEMBER_RECORD_TEXT}, [pendingCase.frontEndId]),
                    div({className: threeColumnClass, style: Styles.TABLE.MEMBER_RECORD_TEXT}, [pendingCase.projectTitle]),
                    div({className: twoColumnClass, style: Styles.TABLE.MEMBER_RECORD_TEXT}, [_.get(pendingCase, 'dac.name', '- -')]),
                    div({className: twoColumnClass, style: Styles.TABLE.MEMBER_RECORD_TEXT}, [
                      span({ isRendered: pendingCase.isReminderSent === true }, ['URGENT!']),
                      span({ isRendered: (pendingCase.status === 'pending') && (pendingCase.isReminderSent !== true) }, ['Pending']),
                      span({ isRendered: (pendingCase.status === 'editable') && (pendingCase.isReminderSent !== true) }, ['Editable'])
                    ]),
                    div({className: oneColumnClass, style: Styles.TABLE.MEMBER_RECORD_TEXT}, [pendingCase.logged]),
                    div({className: twoColumnClass, style: {paddingTop: "0.5rem"}}, [
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
    );
  }
}

export default MemberConsole;
