import _, { isNil } from 'lodash';
import { Component, Fragment } from 'react';
import { button, div, h, hh, hr, span, img } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { PageSubHeading } from '../components/PageSubHeading';
import { PaginatorBar } from '../components/PaginatorBar';
import { SearchBox } from '../components/SearchBox';
import { PendingCases } from '../libs/ajax';
import { Storage } from '../libs/storage';
import { NavigationUtils, USER_ROLES } from '../libs/utils';
import {Notifications} from '../libs/utils';
import { Theme } from '../libs/theme';

const styles = {
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
  HEADERIMG: {
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
    paddingTop: '4.75rem'
  },
  LEFT_HEADER_SECTION: {
    display: 'flex',
    flexDirection: 'row',
    paddingTop: "3rem"
  }
};
export const ChairConsole = hh(class ChairConsole extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      currentUser: {},
      // dulLimit: 5,
      darLimit: 5,
      // currentDulPage: 1,
      currentDarPage: 1,
      // totalDulPendingVotes: 0,
      totalAccessPendingVotes: 0,
      electionsList: {
        // dul: [],
        access: []
      }
    };
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
  }


  // handleDulPageChange = page => {
  //   this.setState(prev => {
  //     prev.currentDulPage = page;
  //     return prev;
  //   });
  // };

  handleAccessPageChange = page => {
    this.setState(prev => {
      prev.currentDarPage = page;
      return prev;
    });
  };

  // handleDulSizeChange = size => {
  //   this.setState(prev => {
  //     prev.dulLimit = size;
  //     prev.currentDulPage = 1;
  //     return prev;
  //   });
  // };

  handleAccessSizeChange = size => {
    this.setState(prev => {
      prev.darLimit = size;
      prev.currentDarPage = 1;
      return prev;
    });
  };

  async componentDidMount() {
    // // let currentUser = Storage.getCurrentUser();
    // this.setState({
    //   currentUser: currentUser
    // }, () => {
    //   this.init(currentUser);
    // });
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
        prev.electionsList.access = _.filter(pendingList.access, (e) => { return e.electionStatus !== 'Closed'; });
        prev.totalAccessPendingVotes = pendingList.totalAccessPendingVotes;
        return prev;
      });
    } catch(error) {
      Notifications.showError({text: 'Error: Unable to retreive data requests from server'});
    };
  };

  // openDULReview = (voteId, referenceId) => (e) => {
  //   this.props.history.push(`dul_review/${voteId}/${referenceId}`);
  // };

  // isDuLCollectEnabled = (pendingCase) => {
  //   const pendingCaseDulCollectStatus = (pendingCase.alreadyVoted === true);
  //   const dacId = _.get(pendingCase, 'dac.dacId', 0);
  //   // if the pending case doesn't have a DAC, then any chair should be able to collect votes:
  //   if (dacId === 0) { return pendingCaseDulCollectStatus; }
  //   const dacChairRoles = _.filter(this.state.currentUser.roles, { 'name': USER_ROLES.chairperson, 'dacId': dacId });
  //   return (!_.isEmpty(dacChairRoles)) && pendingCaseDulCollectStatus;
  // };

  // openDulCollect = (consentId) => (e) => {
  //   this.props.history.push(`dul_collect/${consentId}`);
  // };

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

  // handleSearchDul = (query) => {
  //   this.setState({ searchDulText: query });
  // };

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
      div({ className: 'row' }, [
        div({ className: 'col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12' }, [

          //START: header section
          div({ style: {display: "flex", justifyContent: "space-between"}}, [
            div({className: "left-header-section", style: styles.LEFT_HEADER_SECTION}, [
              div({style: styles.ICON_CONTAINER}, [
                img({
                  id: 'lock-icon',
                  src: '/images/lock-icon.png',
                  style: styles.HEADERIMG
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
          //   div({ className: 'col-lg-8 col-md-8 col-sm-8 col-xs-12 no-padding' }, [
          //     // PageSubHeading({
          //     //   id: 'chairConsoleAccess', imgSrc: '/images/icon_access.png', color: 'access', title: 'Data Access Request Review',
          //     //   description: 'Select and ?'
          //     // })
          //     div({className: "chair-console-header row no-margin"}, [
          //       div()
          //       img({
          //         id: 'lock-icon',
          //         src: '/images/lock-icon.png',
          //         style: styles.HEADERIMG
          //       }),
          //       div({style: {display: }}, [
          //         div({style: styles.TITLE}, ["Manage Data Access Request"]),
          //         div({style:styles.SMALL}, ['Select and manage Data Access Request for DAC Review'])
          //       ])
          //     ])
          //   ]),
          //   div({ className: 'col-lg-4 col-md-4 col-sm-4 col-xs-12 search-wrapper no-padding' }, [
          //     h(SearchBox,
          //       { id: 'chairConsoleAccess', searchHandler: this.handleSearchDar, pageHandler: this.handleAccessPageChange, color: 'access' })
          //   ])
          // ]),
          //END: header section

          div({ className: 'jumbotron table-box' }, [
            div({ className: 'row no-margin' }, [
              div({ className: twoColumnClass + ' cell-header access-color' }, ['Data Request Id']),
              div({ className: threeColumnClass + ' cell-header access-color' }, ['Project Title']),
              div({ className: twoColumnClass + ' cell-header access-color' }, ['DAC']),
              div({ className: twoColumnClass + ' cell-header f-center access-color' }, [
                'Review/Vote',
                div({ isRendered: this.state.totalAccessPendingVotes > 0, id: 'accessPendingVoteCases', className: 'pcases-small-tag' }, [
                  this.state.totalAccessPendingVotes
                ])
              ]),
              div({ className: oneColumnClass + ' cell-header f-center access-color' }, ['Logged']),
              div({ className: twoColumnClass + ' cell-header f-center access-color' }, [
                'Actions'
              ])
            ]),

            hr({ className: 'table-head-separator' }),

            this.state.electionsList.access.filter(this.searchTable(searchDarText))
              .slice((this.state.currentDarPage - 1) * darLimit, this.state.currentDarPage * darLimit)
              .map((pendingCase, rIndex) => {
                return h(Fragment, { key: rIndex }, [
                  div({ className: 'row no-margin tableRowAccess' }, [
                    div({
                      id: pendingCase.frontEndId, name: 'darId', className: twoColumnClass + ' cell-body text',
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
                    div({ isRendered: pendingCase.electionStatus !== 'Final', className: twoColumnClass + ' cell-body f-center' }, [
                      button({
                        id: pendingCase.frontEndId + '_btnVote',
                        name: 'btn_voteAccess',
                        onClick: this.openAccessReview(pendingCase.referenceId, pendingCase.voteId, pendingCase.rpVoteId, pendingCase.alreadyVoted),
                        className: 'cell-button cancel-color'
                      }, [
                        span({ isRendered: (pendingCase.alreadyVoted === false) && (pendingCase.electionStatus !== 'Final') }, ['Vote']),
                        span({ isRendered: pendingCase.alreadyVoted === true }, ['Log Final Vote'])
                      ])
                    ]),
                    div({
                      isRendered: pendingCase.electionStatus === 'Final',
                      className: twoColumnClass + ' cell-body text f-center empty'
                    }, []),

                    div({
                      id: pendingCase.frontEndId + '_logged', name: 'loggedAccess',
                      className: oneColumnClass + ' cell-body text f-center'
                    }, [pendingCase.logged]),

                    div({
                      isRendered: this.isAccessCollectEnabled(pendingCase),
                      className: twoColumnClass + ' cell-body f-center'
                    }, []),
                    div({
                      isRendered: (pendingCase.alreadyVoted === true) && (pendingCase.electionStatus === 'Final'),
                      className: twoColumnClass + ' cell-body f-center'
                    }, []),
                    div({
                      isRendered: (!pendingCase.alreadyVoted) && (pendingCase.electionStatus !== 'Final'),
                      className: twoColumnClass + ' cell-body text f-center empty'
                    }, [])
                  ]),
                  hr({ className: 'table-body-separator' })
                ]);
              }),
            PaginatorBar({
              name: 'access',
              total: this.state.electionsList.access.filter(this.searchTable(searchDarText)).length,
              limit: darLimit,
              currentPage: this.state.currentDarPage,
              onPageChange: this.handleAccessPageChange,
              changeHandler: this.handleAccessSizeChange
            })
          ])
        ])
      ])
    );
  }
});
