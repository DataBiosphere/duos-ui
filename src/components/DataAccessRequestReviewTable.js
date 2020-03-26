import {button, div, h, hh, hr, span} from 'react-hyperscript-helpers';
import {PageSubHeading} from './PageSubHeading';
import {SearchBox} from './SearchBox';
import {Component, Fragment} from 'react';
import _ from 'lodash';
import {PaginatorBar} from './PaginatorBar';
import {Storage} from '../libs/storage';
import {DAR} from '../libs/ajax';
import {Config} from '../libs/config';
import {USER_ROLES} from '../libs/utils';

export const DataAccessRequestReviewTable = hh(
  class DataAccessRequestReview extends Component {

    constructor(props) {
      super(props);
      this.state = {
        showModal: false,
        currentUser: {},
        darLimit: 5,
        currentDarPage: 1,
        totalAccessPendingVotes: 0,
        electionsList: {
          access: [],
        },
      };
    }

    componentDidMount() {
      let currentUser = Storage.getCurrentUser();
      this.setState({
        currentUser: currentUser,
      }, () => {
        this.init(currentUser);
      });
    }

    init(currentUser) {
      DAR.getDataAccessManage(undefined).then(
        dars => {
          let totalAccessPendingVotes = 0;
          dars.forEach(
            dar => {
              if (dar.alreadyVoted === false) {
                totalAccessPendingVotes += (dar.alreadyVoted === false ? 1 : 0);
              }
            },
          );
          this.setState(prev => {
            prev.electionsList.access = dars;
            prev.totalAccessPendingVotes = totalAccessPendingVotes;
            return prev;
          });
        },
      );
    }

    handleOpenModal = () => {
      this.setState({showModal: true});
    };

    handleCloseModal = () => {
      this.setState({showModal: false});
    };

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

    handleSearchDar = (query) => {
      this.setState({searchDarText: query});
    };

    searchTable = (query) => (row) => {
      if (query) {
        let text = JSON.stringify(row);
        return text.toLowerCase().includes(query.toLowerCase());
      }
      return true;
    };

    openFinalAccessReview = (referenceId, electionId, rpElectionId) => (e) => {
      this.props.history.push(
        `${'final_access_review'}/${referenceId}/${electionId}`);
    };

    openAccessReview = (referenceId, voteId, rpVoteId) => (e) => {
      const newDarUiEnabled = Config.getFeatureFlag('newDarUi');
      const pathStart = newDarUiEnabled ? 'new_access_review' : 'access_review';
      if (rpVoteId !== null) {
        this.props.history.push(
          `${pathStart}/${referenceId}/${voteId}/${rpVoteId}`);
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
      if (dacId === 0) {
        return pendingCaseAccessCollectStatus;
      }
      const dacChairRoles = _.filter(this.state.currentUser.roles,
        {'name': USER_ROLES.chairperson, 'dacId': dacId});
      return (!_.isEmpty(dacChairRoles)) && pendingCaseAccessCollectStatus;
    };

    openAccessCollect = (referenceId, electionId) => (e) => {
      this.props.history.push(`access_collect/${electionId}/${referenceId}`);
    };

    render() {

      const {darLimit, searchDarText} = this.state;
      const oneColumnClass = 'col-lg-1 col-md-1 col-sm-1 col-xs-1';
      const twoColumnClass = 'col-lg-2 col-md-2 col-sm-2 col-xs-2';
      const threeColumnClass = 'col-lg-3 col-md-3 col-sm-3 col-xs-3';

      return (
        div({}, [
          div({className: 'row no-margin'}, [
            div({className: 'col-lg-8 col-md-8 col-sm-8 col-xs-12 no-padding'},
              [
                PageSubHeading({
                  id: 'chairConsoleAccess',
                  imgSrc: '/images/icon_access.png',
                  color: 'access',
                  title: 'Data Access Request Review',
                  description: 'Should data access be granted to this applicant?',
                }),
              ]),
            div(
              {className: 'col-lg-4 col-md-4 col-sm-4 col-xs-12 search-wrapper no-padding'},
              [
                h(SearchBox,
                  {
                    id: 'chairConsoleAccess',
                    searchHandler: this.handleSearchDar,
                    pageHandler: this.handleAccessPageChange,
                    color: 'access',
                  }),
              ]),
          ]),
          div({className: 'jumbotron table-box'}, [
            div({className: 'row no-margin'}, [
              div({className: twoColumnClass + ' cell-header access-color'},
                ['Data Request Id']),
              div({className: threeColumnClass + ' cell-header access-color'},
                ['Project Title']),
              div({className: twoColumnClass + ' cell-header access-color'},
                ['DAC']),
              div({
                className: twoColumnClass +
                    ' cell-header f-center access-color',
              }, [
                'Review/Vote',
                div({
                  isRendered: this.state.totalAccessPendingVotes > 0,
                  id: 'accessPendingVoteCases',
                  className: 'pcases-small-tag',
                }, [
                  this.state.totalAccessPendingVotes,
                ]),
              ]),
              div({
                className: oneColumnClass +
                    ' cell-header f-center access-color',
              }, ['Logged']),
              div({
                className: twoColumnClass +
                    ' cell-header f-center access-color',
              }, [
                'Actions',
              ]),
            ]),

            hr({className: 'table-head-separator'}),

            this.state.electionsList.access.filter(
              this.searchTable(searchDarText))
              .slice((this.state.currentDarPage - 1) * darLimit,
                this.state.currentDarPage * darLimit)
              .map((pendingCase, rIndex) => {
                return h(Fragment, {key: rIndex}, [
                  div({className: 'row no-margin tableRowAccess'}, [
                    div({
                      id: pendingCase.frontEndId,
                      name: 'darId',
                      className: twoColumnClass + ' cell-body text',
                      title: pendingCase.frontEndId,
                    }, [pendingCase.frontEndId]),
                    div({
                      id: pendingCase.frontEndId + '_projectTitle',
                      name: 'projectTitle',
                      className: threeColumnClass + ' cell-body text',
                      title: pendingCase.projectTitle,
                    }, [pendingCase.projectTitle]),
                    div({
                      id: pendingCase.frontEndId + '_dacName',
                      name: 'dacName',
                      className: twoColumnClass + ' cell-body text',
                      title: _.get(pendingCase, 'dac.name', ''),
                    }, [_.get(pendingCase, 'dac.name', '- -')]),
                    div({
                      isRendered: pendingCase.electionStatus !== 'Final',
                      className: twoColumnClass + ' cell-body f-center',
                    }, [
                      button({
                        id: pendingCase.frontEndId + '_btnVote',
                        name: 'btn_voteAccess',
                        onClick: this.openAccessReview(pendingCase.referenceId,
                          pendingCase.voteId, pendingCase.rpVoteId),
                        className: 'cell-button ' +
                            (pendingCase.alreadyVoted === true ?
                              'default-color' :
                              'cancel-color'),
                      }, [
                        span({
                          isRendered: (pendingCase.alreadyVoted === false) &&
                              (pendingCase.electionStatus !== 'Final'),
                        }, ['Vote']),
                        span({isRendered: pendingCase.alreadyVoted === true},
                          ['Edit']),
                      ]),
                    ]),
                    div({
                      isRendered: pendingCase.electionStatus === 'Final',
                      className: twoColumnClass +
                          ' cell-body text f-center empty',
                    }, []),

                    div({
                      id: pendingCase.frontEndId + '_logged',
                      name: 'loggedAccess',
                      className: oneColumnClass + ' cell-body text f-center',
                    }, [pendingCase.logged]),

                    div({
                      isRendered: this.isAccessCollectEnabled(pendingCase),
                      className: twoColumnClass + ' cell-body f-center',
                    }, [
                      button({
                        id: pendingCase.frontEndId + '_btnCollect',
                        name: 'btn_collectAccess',
                        onClick: this.openAccessCollect(pendingCase.referenceId,
                          pendingCase.electionId),
                        className: 'cell-button cancel-color',
                      }, ['Collect Votes']),
                    ]),
                    div({
                      isRendered: (pendingCase.alreadyVoted === true) &&
                          (pendingCase.electionStatus === 'Final'),
                      className: twoColumnClass + ' cell-body f-center',
                    }, [
                      button({
                        id: pendingCase.frontEndId + '_btnFinal',
                        name: 'btn_finalAccess',
                        onClick: this.openFinalAccessReview(
                          pendingCase.referenceId, pendingCase.electionId,
                          pendingCase.rpElectionId),
                        className: 'cell-button cancel-color',
                      }, ['FINAL VOTE']),
                    ]),
                    div({
                      isRendered: (!pendingCase.alreadyVoted) &&
                          (pendingCase.electionStatus !== 'Final'),
                      className: twoColumnClass +
                          ' cell-body text f-center empty',
                    }, []),
                  ]),
                  hr({className: 'table-body-separator'}),
                ]);
              }),
            PaginatorBar({
              name: 'access',
              total: this.state.electionsList.access.filter(
                this.searchTable(searchDarText)).length,
              limit: darLimit,
              currentPage: this.state.currentDarPage,
              onPageChange: this.handleAccessPageChange,
              changeHandler: this.handleAccessSizeChange,
            }),
          ]),
        ],
        )
      );
    }

  });