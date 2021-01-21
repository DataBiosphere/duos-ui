import _, { isNil, merge } from 'lodash';
import { Component, Fragment } from 'react';
import { button, div, h, hh, hr, span, img } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { PageSubHeading } from '../components/PageSubHeading';
import { PaginatorBar } from '../components/PaginatorBar';
import { SearchBox } from '../components/SearchBox';
import { PendingCases } from '../libs/ajax';
import { Storage } from '../libs/storage';
import { NavigationUtils, USER_ROLES } from '../libs/utils';
import {Notifications, formatDate} from '../libs/utils';
import { Theme } from '../libs/theme';

const styles = {
  PAGE: {
    width: "83.4%",
    margin: "0 auto"
  },
  TITLE: {
    fontFamily: "Montserrat",
    fontWeight: Theme.font.weight.semibold,
    fontSize: Theme.font.size.title,
  },
  SMALL: {
    fontFamily: 'Montserrat',
    fontWeight: Theme.font.weight.regular,
    fontSize: Theme.font.size.small
  },
  HEADER_IMG: {
    width: '60px',
    height: '60px',
  },
  HEADER_CONTAINER: {
    display: 'flex',
    flexDirection: "column"
  },
  ICON_CONTAINER: {
    flexBasis: '76px',
    height: '60px',
    paddingRight: '16px'
  },
  RIGHT_HEADER_SECTION: {
    display: 'flex',
    alignItems: 'flex-end'
  },
  LEFT_HEADER_SECTION: {
    display: 'flex',
    flexDirection: 'row',
    paddingTop: "3rem"
  },
  TABLE: {
    CONTAINER: {
      margin: "3rem auto"
    },
    HEADER_ROW: {
      fontFamily: "Montserrat",
      fontSize: "14px",
      color: "#00243C",
      fontWeight: Theme.font.weight.medium,
      backgroundColor: "#f3f6f7",
      display: "flex",
      justifyContent: "center",
      height: "51px"
    },
    RECORD_ROW: {
      fontFamily: 'Montserrat',
      fontWeight: Theme.font.weight.regular,
      fontSize: "14px",
      display: "flex",
      justifyContent: "center",
      height: "48px"
    },
    RECORD_TEXT: {
      color: "#00243C"
    },
    DATA_REQUEST_TEXT: {
      color: "#00609F",
      fontWeight: Theme.font.weight.semibold
    },
    //NOTE: play around with the cell measurements
    TITLE_CELL: {
      width: "18%",
      display: "flex",
      justifyContent: "left",
      alignItems: "center",
      margin: "0 2%"
    },
    DATA_ID_CELL: {
      width: "10%",
      margin: "0 2%",
      display: "flex",
      justifyContent: "left",
      alignItems: "center",
    },
    SUBMISSION_DATE_CELL: {
      width: "10%",
      margin: "0 2%",
      display: "flex",
      justifyContent: "left",
      alignItems: "center",
    },
    DAC_CELL: {
      width: "10%",
      margin: "0 2%",
      display: "flex",
      justifyContent: "left",
      alignItems: "center",
    },
    ELECTION_STATUS_CELL: {
      width: "10%",
      margin: "0 2%",
      display: "flex",
      justifyContent: "left",
      alignItems: "center",
    },
    ELECTION_ACTIONS_CELL: {
      width: "23%",
      margin: "0 2%",
      display: "flex",
      justifyContent: "left",
      alignItems: "center",
    }
  }
};

const Records = (props) => {
  const dataIDTextStyle = styles.TABLE.DATA_REQUEST_TEXT;
  const recordTextStyle = styles.TABLE.RECORD_TEXT;
  return props.electionList.map((election) => {
    return div({style: styles.TABLE.RECORD_ROW}, [
      div({style: Object.assign({}, styles.TABLE.DATA_ID_CELL, dataIDTextStyle)}, [election.frontEndId]),
      div({style: Object.assign({}, styles.TABLE.TITLE_CELL, recordTextStyle)}, [election.projectTitle]),
      div({style: Object.assign({}, styles.TABLE.SUBMISSION_DATE_CELL, recordTextStyle)}, [formatDate(election.createDate)]),
      div({style: Object.assign({}, styles.TABLE.DAC_CELL, recordTextStyle)}, [election.dac.name]),
      div({style: Object.assign({}, styles.TABLE.ELECTION_STATUS_CELL, recordTextStyle)}, [election.electionStatus]),
      div({style: Object.assign({}, styles.TABLE.ELECTION_ACTIONS_CELL, recordTextStyle)}, ['Placeholder for buttons. (font style is placeholder as well)'])
    ]);
  });
};
export const ChairConsole = hh(class ChairConsole extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      currentUser: {},
      darLimit: 5,
      currentDarPage: 1,
      totalAccessPendingVotes: 0,
      electionList: []
    };
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
  }

  handleAccessPageChange = page => {
    this.setState(prev => {
      prev.currentDarPage = page;
      return prev;
    });
  };

  handleAccessSizeChange = size => {
    this.setState(prev => {
      prev.darLimit = size;
      prev.currentDarPage = 1;
      return prev;
    });
  };

  async componentDidMount() {

    await this.init();
  }

  async init() {
    try {
      const currentUser = Storage.getCurrentUser();
      const pendingList = await PendingCases.findDataRequestPendingCasesByUser(currentUser.dacUserId);
      this.setState(prev => {
        prev.currentUser = currentUser;
        // Filter vote-able elections. See https://broadinstitute.atlassian.net/browse/DUOS-789
        // for more work related to ensuring closed elections aren't displayed here.
        prev.electionList = _.filter(pendingList.access, (e) => { return e.electionStatus !== 'Closed'; });
        prev.totalAccessPendingVotes = pendingList.totalAccessPendingVotes;
        return prev;
      });
    } catch(error) {
      Notifications.showError({text: 'Error: Unable to retreive data requests from server'});
    };
  };

  openFinalAccessReview = (referenceId, electionId, rpElectionId) => (e) => {
    this.props.history.push(`${'final_access_review'}/${referenceId}/${electionId}`);
  };

  openAccessReview = (referenceId, voteId, rpVoteId, alreadyVoted) => async (e) => {
    const pathStart = await NavigationUtils.accessReviewPath();
    let chairFinal = false;
    if(this.state.currentUser && alreadyVoted) {
      chairFinal = this.state.currentUser.isChairPerson;
    }
    if (rpVoteId !== null) {
      this.props.history.push(
        `${pathStart}/${referenceId}/${voteId}/${rpVoteId}`,
        {chairFinal}
      );
    } else {
      this.props.history.push(
        `${pathStart}/${referenceId}/${voteId}`,
        {chairFinal}
      );
    }
  };

  isAccessCollectEnabled = (pendingCase) => {
    const pendingCaseAccessCollectStatus =
      (pendingCase.alreadyVoted === true) &&
      (!pendingCase.isFinalVote) &&
      (pendingCase.electionStatus !== 'Final');
    const dacId = _.get(pendingCase, 'dac.dacId', 0);
    // if the pending case doesn't have a DAC, then any chair should be able to collect votes:
    if (dacId === 0) { return pendingCaseAccessCollectStatus; }
    const dacChairRoles = _.filter(this.state.currentUser.roles, { 'name': USER_ROLES.chairperson, 'dacId': dacId });
    return (!_.isEmpty(dacChairRoles)) && pendingCaseAccessCollectStatus;
  };

  openAccessCollect = (referenceId, electionId) => (e) => {
    this.props.history.push(`access_collect/${electionId}/${referenceId}`);
  };


  handleOpenModal() {
    this.setState({ showModal: true });
  }

  handleCloseModal() {
    this.setState({ showModal: false });
  }

  handleSearchDar = (query) => {
    this.setState({ searchDarText: query });
  };

  searchTable = (query) => (row) => {
    if (query) {
      let text = JSON.stringify(row);
      return text.toLowerCase().includes(query.toLowerCase());
    }
    return true;
  };

  render() {

    const { darLimit, searchDarText } = this.state;
    const oneColumnClass = 'col-lg-1 col-md-1 col-sm-1 col-xs-1';
    const twoColumnClass = 'col-lg-2 col-md-2 col-sm-2 col-xs-2';
    const threeColumnClass = 'col-lg-3 col-md-3 col-sm-3 col-xs-3';

    return (
      div({style: styles.PAGE}, [
        div({ style: {display: "flex", justifyContent: "space-between"}}, [
          div({className: "left-header-section", style: styles.LEFT_HEADER_SECTION}, [
            div({style: styles.ICON_CONTAINER}, [
              img({
                id: 'lock-icon',
                src: '/images/lock-icon.png',
                style: styles.HEADER_IMG
              })
            ]),
            div({style: styles.HEADER_CONTAINER}, [
              div({style: styles.TITLE}, ["Manage Data Access Request"]),
              div({style: styles.SMALL}, ["Select and manage Data Access Requests for DAC review"])
            ])
          ]),
          div({className: "right-header-section", style: styles.RIGHT_HEADER_SECTION}, [
            h(SearchBox, {
              id: 'chairConsoleAccess', searchHandler: this.handleSearchDar, pageHandler: this.handleAccessPageChange, color: 'access' 
            })
          ])
        ]),
        //NOTE: Flexbox vs CSS Grid
        //Grid does not have universal support (Opera Mini does not support it)
        div({style: styles.TABLE.CONTAINER}, [
          div({style: styles.TABLE.HEADER_ROW}, [
            div({style: styles.TABLE.DATA_ID_CELL}, ["Data Request ID"]),
            div({style: styles.TABLE.TITLE_CELL}, ["Project Title"]),
            div({style: styles.TABLE.SUBMISSION_DATE_CELL}, ["Submission date"]),
            div({style: styles.TABLE.DAC_CELL}, ["DAC"]),
            div({style: styles.TABLE.ELECTION_STATUS_CELL}, ["Election status"]),
            div({style: styles.TABLE.ELECTION_ACTIONS_CELL}, ["Election Actions"])
          ]),
          h(Records, {electionList: this.state.electionList})
        ])
        //START: old Chair console table for DAR
        // div({ className: 'jumbotron table-box' }, [
        //   div({ className: 'row no-margin' }, [
        //     div({ className: twoColumnClass + ' cell-header access-color' }, ['Data Request Id']),
        //     div({ className: threeColumnClass + ' cell-header access-color' }, ['Project Title']),
        //     div({ className: twoColumnClass + ' cell-header access-color' }, ['DAC']),
        //     div({ className: twoColumnClass + ' cell-header f-center access-color' }, [
        //       'Review/Vote',
        //       div({ isRendered: this.state.totalAccessPendingVotes > 0, id: 'accessPendingVoteCases', className: 'pcases-small-tag' }, [
        //         this.state.totalAccessPendingVotes
        //       ])
        //     ]),
        //     div({ className: oneColumnClass + ' cell-header f-center access-color' }, ['Logged']),
        //     div({ className: twoColumnClass + ' cell-header f-center access-color' }, [
        //       'Actions'
        //     ])
        //   ]),

        //   hr({ className: 'table-head-separator' }),

        //   this.state.electionsList.access.filter(this.searchTable(searchDarText))
        //     .slice((this.state.currentDarPage - 1) * darLimit, this.state.currentDarPage * darLimit)
        //     .map((pendingCase, rIndex) => {
        //       return h(Fragment, { key: rIndex }, [
        //         div({ className: 'row no-margin tableRowAccess' }, [
        //           div({
        //             id: pendingCase.frontEndId, name: 'darId', className: twoColumnClass + ' cell-body text',
        //             title: pendingCase.frontEndId
        //           }, [pendingCase.frontEndId]),
        //           div({
        //             id: pendingCase.frontEndId + '_projectTitle', name: 'projectTitle',
        //             className: threeColumnClass + ' cell-body text', title: pendingCase.projectTitle
        //           }, [pendingCase.projectTitle]),
        //           div({
        //             id: pendingCase.frontEndId + '_dacName', name: 'dacName', className: twoColumnClass + ' cell-body text',
        //             title: _.get(pendingCase, 'dac.name', '')
        //           }, [_.get(pendingCase, 'dac.name', '- -')]),
        //           div({ isRendered: pendingCase.electionStatus !== 'Final', className: twoColumnClass + ' cell-body f-center' }, [
        //             button({
        //               id: pendingCase.frontEndId + '_btnVote',
        //               name: 'btn_voteAccess',
        //               onClick: this.openAccessReview(pendingCase.referenceId, pendingCase.voteId, pendingCase.rpVoteId, pendingCase.alreadyVoted),
        //               className: 'cell-button cancel-color'
        //             }, [
        //               span({ isRendered: (pendingCase.alreadyVoted === false) && (pendingCase.electionStatus !== 'Final') }, ['Vote']),
        //               span({ isRendered: pendingCase.alreadyVoted === true }, ['Log Final Vote'])
        //             ])
        //           ]),
        //           div({
        //             isRendered: pendingCase.electionStatus === 'Final',
        //             className: twoColumnClass + ' cell-body text f-center empty'
        //           }, []),

        //           div({
        //             id: pendingCase.frontEndId + '_logged', name: 'loggedAccess',
        //             className: oneColumnClass + ' cell-body text f-center'
        //           }, [pendingCase.logged]),

        //           div({
        //             isRendered: this.isAccessCollectEnabled(pendingCase),
        //             className: twoColumnClass + ' cell-body f-center'
        //           }, []),
        //           div({
        //             isRendered: (pendingCase.alreadyVoted === true) && (pendingCase.electionStatus === 'Final'),
        //             className: twoColumnClass + ' cell-body f-center'
        //           }, []),
        //           div({
        //             isRendered: (!pendingCase.alreadyVoted) && (pendingCase.electionStatus !== 'Final'),
        //             className: twoColumnClass + ' cell-body text f-center empty'
        //           }, [])
        //         ]),
        //         hr({ className: 'table-body-separator' })
        //       ]);
        //     }),
        //   PaginatorBar({
        //     name: 'access',
        //     total: this.state.electionsList.access.filter(this.searchTable(searchDarText)).length,
        //     limit: darLimit,
        //     currentPage: this.state.currentDarPage,
        //     onPageChange: this.handleAccessPageChange,
        //     changeHandler: this.handleAccessSizeChange
        //   })
        // ])
        //END: old chair console for DAR
      ])
    );
  }
});
