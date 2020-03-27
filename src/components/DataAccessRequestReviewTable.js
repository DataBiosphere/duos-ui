import { button, div, h, hh, hr, span } from 'react-hyperscript-helpers';
import { PageSubHeading } from './PageSubHeading';
import { SearchBox } from './SearchBox';
import { Component, Fragment } from 'react';
import _ from 'lodash';
import { PaginatorBar } from './PaginatorBar';
import { Storage } from '../libs/storage';
import { DAR } from '../libs/ajax';
import { Config } from '../libs/config';
import { USER_ROLES } from '../libs/utils';

export const DataAccessRequestReviewTable = hh(
  class DataAccessRequestReview extends Component {

    constructor(props) {
      super(props);
      this.state = {
        showModal: false,
        currentUser: {},
        pageLimit: 5,
        currentPage: 1,
        totalAccessPendingVotes: 0,
        darList: [],
        searchText: null
      };
    }

    componentDidMount() {
      const currentUser = Storage.getCurrentUser();
      this.setState({
        currentUser: currentUser,
      }, () => {
        this.init();
      });
    }

    init = () => {
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
            prev.darList = dars;
            prev.totalAccessPendingVotes = totalAccessPendingVotes;
            return prev;
          });
        },
      );
    };

    handleOpenModal = () => {
      this.setState({ showModal: true });
    };

    handleCloseModal = () => {
      this.setState({ showModal: false });
    };

    handlePageChange = page => {
      this.setState(prev => {
        prev.currentPage = page;
        return prev;
      });
    };

    handlePageSizeChange = size => {
      this.setState(prev => {
        prev.pageLimit = size;
        prev.currentPage = 1;
        return prev;
      });
    };

    handleSearch = (query) => {
      this.setState({ searchText: query });
    };

    searchTable = (query) => (row) => {
      const searchFields = ['frontEndId', 'dac', 'projectTitle'];
      if (query) {
        const searchObj = _.pick(row, searchFields);
        let text = JSON.stringify(searchObj);
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
        { 'name': USER_ROLES.chairperson, 'dacId': dacId });
      return (!_.isEmpty(dacChairRoles)) && pendingCaseAccessCollectStatus;
    };

    openAccessCollect = (referenceId, electionId) => (e) => {
      this.props.history.push(`access_collect/${electionId}/${referenceId}`);
    };

    tableCell = (id, name, classPrefix, title, value) => {
      return div({
        id: id,
        name: name,
        className: classPrefix + ' cell-body text',
        title: title,
      }, [value]);
    };

    render() {

      const { pageLimit, searchText } = this.state;
      const oneColumnClass = 'col-lg-1 col-md-1 col-sm-1 col-xs-1';
      const twoColumnClass = 'col-lg-2 col-md-2 col-sm-2 col-xs-2';
      const threeColumnClass = 'col-lg-3 col-md-3 col-sm-3 col-xs-3';

      return (
        div({}, [
          div({ className: 'row no-margin' }, [
            div({ className: 'col-lg-8 col-md-8 col-sm-8 col-xs-12 no-padding' },
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
              { className: 'col-lg-4 col-md-4 col-sm-4 col-xs-12 search-wrapper no-padding' },
              [
                h(SearchBox,
                  {
                    id: 'DataAccessRequestReviewTable',
                    searchHandler: this.handleSearch,
                    pageHandler: this.handlePageChange,
                    color: 'access',
                  }),
              ]),
          ]),
          div({ className: 'jumbotron table-box' }, [
            div({ className: 'row no-margin' }, [
              div({ className: twoColumnClass + ' cell-header access-color' },
                ['Data Request Id']),
              div({ className: threeColumnClass + ' cell-header access-color' },
                ['Project Title']),
              div({ className: twoColumnClass + ' cell-header access-color' },
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

            hr({ className: 'table-head-separator' }),

            this.state.darList.filter(
              this.searchTable(searchText))
              .slice((this.state.currentPage - 1) * pageLimit,
                this.state.currentPage * pageLimit)
              .map((pendingCase, rIndex) => {
                return h(Fragment, { key: rIndex }, [
                  div({ className: 'row no-margin tableRowAccess' }, [

                    this.tableCell(
                      pendingCase.frontEndId,
                      'darId',
                      twoColumnClass,
                      pendingCase.frontEndId,
                      pendingCase.frontEndId
                    ),
                    this.tableCell(
                      pendingCase.frontEndId + '_projectTitle',
                      'projectTitle',
                      threeColumnClass,
                      pendingCase.projectTitle,
                      pendingCase.projectTitle
                    ),
                    this.tableCell(
                      pendingCase.frontEndId + '_dacName',
                      'dacName',
                      twoColumnClass,
                      _.get(pendingCase, 'dac.name', ''),
                      _.get(pendingCase, 'dac.name', '- -')
                    ),
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
                        span({ isRendered: pendingCase.alreadyVoted === true },
                          ['Edit']),
                      ]),
                    ]),
                    div({
                      isRendered: pendingCase.electionStatus === 'Final',
                      className: twoColumnClass +
                          ' cell-body text f-center empty',
                    }, []),

                    this.tableCell(
                      pendingCase.frontEndId + '_logged',
                      'loggedAccess',
                      oneColumnClass + " f-center ",
                      pendingCase.logged,
                      pendingCase.logged
                    ),

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
                  hr({ className: 'table-body-separator' }),
                ]);
              }),
            PaginatorBar({
              name: 'access',
              total: this.state.darList.filter(this.searchTable(searchText)).length,
              limit: pageLimit,
              currentPage: this.state.currentPage,
              onPageChange: this.handlePageChange,
              changeHandler: this.handlePageSizeChange,
            }),
          ]),
        ],
        )
      );
    }

  });