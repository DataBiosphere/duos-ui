import _ from 'lodash';
import { Component, Fragment } from 'react';
import { button, div, h, hh, hr, a, span } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { PageSubHeading } from '../components/PageSubHeading';
import { PaginatorBar } from '../components/PaginatorBar';
import { SearchBox } from '../components/SearchBox';
import { PendingCases } from '../libs/ajax';
import { Storage } from '../libs/storage';
import { NavigationUtils, USER_ROLES } from '../libs/utils';

export const SigningOfficialConsole = hh(class ChairConsole extends Component {

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
      prev.currentDulPage = 1;
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

  componentDidMount() {
    let currentUser = Storage.getCurrentUser();
    this.setState({
      currentUser: currentUser
    }, () => {
      this.init(currentUser);
    });
  }

  init(currentUser) {

    PendingCases.findConsentPendingCasesByUser(currentUser.dacUserId).then(
      duls => {
        this.setState(prev => {
          prev.electionsList.dul = duls.dul;
          prev.totalDulPendingVotes = duls.totalDulPendingVotes;
          return prev;
        });
      }
    );

    PendingCases.findDataRequestPendingCasesByUser(currentUser.dacUserId).then(
      dars => {
        this.setState(prev => {
          prev.electionsList.access = dars.access;
          prev.totalAccessPendingVotes = dars.totalAccessPendingVotes;
          return prev;
        });
      }
    );
  }

  openDULReview = (voteId, referenceId) => (e) => {
    this.props.history.push(`dul_review/${voteId}/${referenceId}`);
  };

  isDuLCollectEnabled = (pendingCase) => {
    const pendingCaseDulCollectStatus = (pendingCase.alreadyVoted === true);
    const dacId = _.get(pendingCase, 'dac.dacId', 0);
    // if the pending case doesn't have a DAC, then any chair should be able to collect votes:
    if (dacId === 0) { return pendingCaseDulCollectStatus; }
    const dacChairRoles = _.filter(this.state.currentUser.roles, { 'name': USER_ROLES.chairperson, 'dacId': dacId });
    return (!_.isEmpty(dacChairRoles)) && pendingCaseDulCollectStatus;
  };

  openDulCollect = (consentId) => (e) => {
    this.props.history.push(`dul_collect/${consentId}`);
  };

  openFinalAccessReview = (referenceId, electionId, rpElectionId) => (e) => {
    this.props.history.push(`${'final_access_review'}/${referenceId}/${electionId}`);
  };

  openAccessReview = (referenceId, voteId, rpVoteId) => async (e) => {
    const pathStart = await NavigationUtils.accessReviewPath();
    if (rpVoteId !== null) {
      this.props.history.push(`${pathStart}/${referenceId}/${voteId}/${rpVoteId}`);
    } else {
      this.props.history.push(`${pathStart}/${referenceId}/${voteId}`);
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


  handleOpenModal = () => {
    this.setState({ showModal: true });
  }

  handleCloseModal = () => {
    this.setState({ showModal: false });
  }

  handleSearchDul = (query) => {
    this.setState({ searchDulText: query });
  };

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

    const { currentUser, dulLimit, darLimit, searchDulText, searchDarText } = this.state;
    const oneColumnClass = 'col-lg-1 col-md-1 col-sm-1 col-xs-1';
    const twoColumnClass = 'col-lg-2 col-md-2 col-sm-2 col-xs-2';
    const threeColumnClass = 'col-lg-3 col-md-3 col-sm-3 col-xs-3';

    return (

      div({ className: 'container' }, [
        div({ className: 'col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12' }, [
          PageHeading({
            id: 'chairConsole', color: 'common', title: 'Welcome to your Signing Official Console, ' + currentUser.displayName + '!',
            description: 'Your researchers and their data access requests are below'
          }),

          hr({ className: 'section-separator' }),

          div({ className: 'row no-margin' }, [
            div({ className: 'col-lg-8 col-md-8 col-sm-8 col-xs-12 no-padding' }, [
              PageSubHeading({
                id: 'chairConsoleDul', imgSrc: '/images/icon_manage_users.png', color: 'dataset', title: 'My Institution\'s Researchers',
                description: 'Records from all current and closed data access requests under your purveiw are below'
              })
            ]),
            div({ className: 'col-lg-4 col-md-4 col-sm-4 col-xs-12 search-wrapper no-padding' }, [
              h(SearchBox, { id: 'chairConsoleDul', searchHandler: this.handleSearchDul, pageHandler: this.handleDulPageChange, color: 'dul' }),
              a({
                id: 'btn_addUser',
                className: "col-lg-5 col-md-5 col-sm-5 col-xs-5 btn-primary btn-add common-background no-margin",
                onClick: this.addUser
              }, [
                  div({ className: "all-icons add-user_white" }),
                  span({}, ["Add Users"]),
                ]),
            ])
          ]),

          div({ className: 'jumbotron table-box' }, [
            div({ className: 'row no-margin' }, [
              div({ className: twoColumnClass + ' cell-header dataset-color' }, ['User Name']),
              div({ className: twoColumnClass + ' cell-header dataset-color' }, ['Google ID']),
              div({ className: twoColumnClass + ' cell-header dataset-color' }, ['Library Card(s)']),
              div({ className: twoColumnClass + ' cell-header f-center dataset-color' }, [
                'Library Card Actions',
                div({ isRendered: this.state.totalDulPendingVotes > 0, id: 'dulPendingVoteCases', className: 'pcases-small-tag' }, [
                  this.state.totalDulPendingVotes
                ])
              ]),
              div({ className: oneColumnClass + ' cell-header f-center dataset-color' }, ['Role']),
              div({ className: twoColumnClass + ' cell-header f-center dataset-color' }, ['Active DARs'])
            ]),

            hr({ className: 'table-head-separator' }),

            div({ className: 'row no-margin' }, [
              div({ className: twoColumnClass }, ['Carol Smith']),
              div({ className: twoColumnClass }, ['csmith1212@jnj.org']),
              div({ className: twoColumnClass }, ['[Broad], [NIH]']),
              div({ className: twoColumnClass + ' cell header cancel-color'}, ['[Issue/Remove]']),
              div({ className: twoColumnClass }, ['PI']),
              div({ className: oneColumnClass }, ['4'])
            ]),

            div({ className: 'row no-margin' }, [
              div({ className: twoColumnClass }, ['Jaime Gonzalez']),
              div({ className: twoColumnClass }, ['jgonzalez1212@jnj.org']),
              div({ className: twoColumnClass }, ['[Broad]']),
              div({ className: twoColumnClass + ' cell header cancel-color'}, ['[Issue/Remove]']),
              div({ className: twoColumnClass }, ['Lab Staff']),
              div({ className: oneColumnClass }, ['3'])
            ]),

            PaginatorBar({
              name: 'dul',
              total: this.state.electionsList.dul.filter(this.searchTable(searchDulText)).length,
              limit: dulLimit,
              currentPage: this.state.currentDulPage,
              onPageChange: this.handleDulPageChange,
              changeHandler: this.handleDulSizeChange
            })
          ]),

          div({ className: 'row no-margin' }, [
            div({ className: 'col-lg-8 col-md-8 col-sm-8 col-xs-12 no-padding' }, [
              PageSubHeading({
                id: 'chairConsoleAccess', imgSrc: '/images/icon_access.png', color: 'access', title: 'My Institution\'s Data Access Requests',
                description: 'Records from all current and closed data access requests under your purview'
              })
            ]),
            div({ className: 'col-lg-4 col-md-4 col-sm-4 col-xs-12 search-wrapper no-padding' }, [
              h(SearchBox,
                { id: 'chairConsoleAccess', searchHandler: this.handleSearchDar, pageHandler: this.handleAccessPageChange, color: 'access' })
            ])
          ]),

          div({ className: 'jumbotron table-box' }, [
            div({ className: 'row no-margin' }, [
              div({ className: twoColumnClass + ' cell-header access-color' }, ['DAR ID']),
              div({ className: threeColumnClass + ' cell-header access-color' }, ['Project Title']),
              div({ className: twoColumnClass + ' cell-header f-center access-color' }, ['Date Submitted']),
              div({ className: twoColumnClass + ' cell-header f-center access-color' }, ['PI']),
              div({ className: oneColumnClass + ' cell-header access-color' }, ['DAC']),
              div({ className: oneColumnClass + ' cell-header f-center access-color' }, ['Status']),
              div({ className: oneColumnClass + ' cell-header f-center access-color' }, ['Actions'])
            ]),

            hr({ className: 'table-head-separator' }),

            div({ className: 'row no-margin' }, [
              div({ className: twoColumnClass }, ['DAR-192']),
              div({ className: threeColumnClass }, ['Variant based determinants of microcellular function']),
              div({ className: twoColumnClass }, ['03/21/2020']),
              div({ className: twoColumnClass }, ['Dr. Peter Gabriel']),
              div({ className: oneColumnClass }, ['Broad DAC']),
              div({ className: oneColumnClass }, ['In Review']),
              div({ className: oneColumnClass }, ['[Closeout]']),
            ]),

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


export default SigningOfficialConsole;
