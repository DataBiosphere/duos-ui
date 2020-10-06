import * as ld from 'lodash';
import { apply, assign, isNil } from 'lodash/fp';
import { Component, Fragment } from 'react';
import { a, b, br, div, h, h3, h4, hr, i, label, span } from 'react-hyperscript-helpers';
import { Link } from 'react-router-dom';
import { ApplicationSummary } from '../components/ApplicationSummary';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { CollectResultBox } from '../components/CollectResultBox';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { DataAccessRequest } from '../components/DataAccessRequest';
import { PageHeading } from '../components/PageHeading';
import { SingleResultBox } from '../components/SingleResultBox';
import { SubmitVoteBox } from '../components/SubmitVoteBox';
import { DAR, Election, Files, Match, Researcher, Votes } from '../libs/ajax';
import { Config } from '../libs/config';
import { Models } from '../libs/models';
import { Storage } from '../libs/storage';
import * as Utils from '../libs/utils';


class FinalAccessReview extends Component {

  constructor(props) {
    super(props);
    this.logVote = this.logVote.bind(this);
    this.state = this.initialState();
  }

  componentDidMount() {
    const currentUser = Storage.getCurrentUser();
    this.setState({
      loading: false,
      vote: {},
      voteAgreement: {},
      currentUser: currentUser,
      referenceId: this.props.match.params.referenceId,
      electionId: this.props.match.params.electionId,
      electionAccess: {
        finalVote: null
      },
      darInfo: Models.dar,
      researcherProfile: null,
      voteAccessList: [],
      rpVoteAccessList: [],
      voteList: [],
      chartDataAccess: {
        Total: []
      },
      electionRP: {},
      chartRP: {
        Total: []
      },
      election: {},
      chartDataDUL: {
        Total: []
      }
    }, () => {
      this.loadData();
    });
  }

  async loadData() {
    const hasUseRestrictionResp = await DAR.hasUseRestriction(this.state.referenceId);
    await DAR.describeDar(this.state.referenceId).then(
      darInfo => {
        Researcher.getResearcherProfile(darInfo.researcherId).then(
          researcherProfile => {
            this.setState(prev => {
              prev.darInfo = darInfo;
              prev.researcherProfile = researcherProfile;
              return prev;
            });
          });
      }
    );

    this.setState({
      path: 'final-access-review',
      hasUseRestriction: hasUseRestrictionResp.hasUseRestriction,
      hasLibraryCard: false,
      vote: {},
      voteAgreement: {},
      electionType: null,
      alertOn: null,
      alertsDAR: [],
      alertsAgree: [],
    }, () => {
      this.init();
    });
  }

  reminderDARAlert = (index) => {
    this.setState({
      showQ1Alert: true,
      alertQ1Message: 'Please log a vote on Decision Agreement.'

    });
  };

  reminderAgreeAlert = (index) => {
    this.setState({
      showQ2Alert: true,
      alertQ2Message: 'Please log a vote on Final Access Decision.'
    });
  };

  closeAlert = (index) => {
    const alerts = this.state.alerts.splice(index, 1);
    this.setState({
      alerts: alerts
    });
  };

  logVote(answer, rationale) {
    this.setState(prev => {
      prev.tmpVote = answer;
      prev.tmpRationale = rationale;
      prev.showConfirmDialog = true;
      prev.q1OkBtnDisabled = false;
      prev.q1NoBtnDisabled = false;
      return prev;
    });
  }

  confirmationHandlerOK = (answer) => async (e) => {

    this.setState({
      q1OkBtnDisabled: true,
      q1NoBtnDisabled: true,
      q1AlertTitle: undefined,
      q1AlertMessage: ''
    });

    if (answer === true) {

      let vote = this.state.vote;
      vote.finalVote = this.state.tmpVote;
      vote.finalRationale = this.state.tmpRationale;
      vote.vote = this.state.tmpVote;
      vote.rationale = this.state.tmpRationale;

      try {
        // vote
        await Votes.updateFinalAccessDarVote(this.state.referenceId, vote);
      } catch (e) {
        this.setState({
          q1AlertTitle: 'Error while updating final access vote.',
          q1AlertMessage: 'Please try again later',
          q1OkBtnDisabled: true,
          q1NoBtnDisabled: false
        });
        return;
      }

      if (this.state.agreementAlreadyVote || this.state.hideMatch) {
        await this.closeElection(1);
      }

      await this.setState({
        alreadyVote: true,
        showConfirmDialog: false
      });

      if (this.state.agreementAlreadyVote || this.state.hideMatch) {
        this.props.history.push('/chair_console');
      } else {
        this.reminderDARAlert();
      }

    } else {
      // vote cancelled
      this.setState(prev => {
        prev.showConfirmDialog = false;
        prev.q1OkBtnDisabled = false;
        prev.q1NoBtnDisabled = false;
        return prev;
      });
    }
  };

  logVoteAgreement = async (answer, rationale) => {

    this.setState(prev => {
      prev.tmpAgreementVote = answer;
      prev.tmpAgreementRationale = rationale;
      prev.showConfirmAgreementDialog = true;
      prev.q2OkBtnDisabled = false;
      prev.q2NoBtnDisabled = false;
      prev.q2AlertTitle = undefined;
      prev.q2AlertMessage = '';
      return prev;
    });
  };

  confirmationAgreementHandlerOK = (answer) => async (e) => {

    this.setState({
      q2OkBtnDisabled: true,
      q2NoBtnDisabled: true
    });

    if (answer === true) {

      let voteAgreement = this.state.voteAgreement;
      voteAgreement.finalVote = this.state.tmpAgreementVote;
      voteAgreement.finalRationale = this.state.tmpAgreementRationale;
      voteAgreement.vote = this.state.tmpAgreementVote;
      voteAgreement.rationale = this.state.tmpAgreementRationale;

      // vote
      try {
        await Votes.updateFinalAccessDarVote(this.state.referenceId, voteAgreement);
      } catch (e) {
        this.setState({
          q2AlertTitle: 'Error while updating final access vote.',
          q2AlertMessage: 'Please try again later',
          q2OkBtnDisabled: true,
          q2NoBtnDisabled: false
        });
        return;
      }

      if (this.state.alreadyVote) {
        await this.closeElection(2);
      }

      await this.setState({
        agreementAlreadyVote: true,
        showConfirmAgreementDialog: false
      });

      if (this.state.alreadyVote) {
        this.props.history.push('/chair_console');
      } else {
        this.reminderAgreeAlert();
      }
    } else {
      // vote cancelled
      this.setState(prev => {
        prev.showConfirmAgreementDialog = false;
        prev.q2OkBtnDisabled = false;
        prev.q2NoBtnDisabled = false;
        return prev;
      });
    }
  };

  closeElection = async (q) => {

    try {
      // change election status
      await this.setState(prev => { prev.electionAccess.status = 'Closed'; });

      // update election
      await Election.updateElection(this.state.electionAccess.electionId, this.state.electionAccess);
    } catch (e) {

      if (q === 1) {
        this.setState({
          q1AlertTitle: 'Error while updating final access vote.',
          q1AlertMessage: 'Please try again later',
          q1OkBtnDisabled: true,
          q1NoBtnDisabled: false
        });
      } else {
        this.setState({
          q2AlertTitle: 'Error while updating final access vote.',
          q2AlertMessage: 'Please try again later',
          q2OkBtnDisabled: true,
          q2NoBtnDisabled: false
        });

      }
      return;
    }
  };

  initialState = () => {
    return {
      loading: true,
      alreadyVote: false,
      agreementAlreadyVote: false,
      vote: {},
      voteAgreement: {},
      q1OkBtnDisabled: false,
      q1NoBtnDisabled: false,
      q1AlertTitle: undefined,
      q1AlertMessage: '',
      q2OkBtnDisabled: false,
      q2NoBtnDisabled: false,
      q2AlertTitle: undefined,
      q2AlertMessage: '',

      referenceId: this.props.match.params.referenceId,
      electionId: this.props.match.params.electionId,
      electionAccess: {
        finalVote: null
      },
      darInfo: Models.dar,
      voteAccessList: [],
      rpVoteAccessList: [],
      voteList: [],
      chartDataAccess: {
        Total: []
      },
      electionRP: {},
      chartRP: {
        Total: []
      },
      election: {},
      chartDataDUL: {
        Total: []
      }
    };
  };

  downloadDAR = async (e) => {
    this.setState({
      loading: true
    });
    await Files.getDARFile(this.state.referenceId);
    this.setState({
      loading: false
    });
  };

  toggleQ1 = (e) => {
    this.setState(prev => {
      prev.isQ1Expanded = !prev.isQ1Expanded;
      return prev;
    });
  };

  toggleQ2 = (e) => {
    this.setState(prev => {
      prev.isQ2Expanded = !prev.isQ2Expanded;
      return prev;
    });
  };

  toggleDulExpanded = (e) => {
    this.setState(prev => {
      prev.isDulExpanded = !prev.isDulExpanded;
      return prev;
    });
  };

  async init() {
    const darFinalAccessVotePromise =  Votes.getDarFinalAccessVote(this.state.electionId);
    const dataAccessElectionReviewPromise = Election.findDataAccessElectionReview(this.state.electionId, false);
    const rpElectionReviewPromise = Election.findRPElectionReview(this.state.electionId, false);
    let [darFinalAccessVote, dataAccessElectionReview, rpElectionReview] = await Promise.all([darFinalAccessVotePromise, dataAccessElectionReviewPromise, rpElectionReviewPromise]);

    //darFinalAccessVote processing
    const voteObj = this.processFinalAccessVoteState(darFinalAccessVote, this.state.electionId);

    let showAccessDataObj = this.showAccessData(dataAccessElectionReview);
    showAccessDataObj.consentName = dataAccessElectionReview.associatedConsent.name;

    //electionReview processing
    const electionReview = await Election.findElectionReviewById(
      dataAccessElectionReview.associatedConsent.electionId,
      dataAccessElectionReview.associatedConsent.consentId
    );
    const vaultVotePromise = this.vaultVote(electionReview.consent.consentId);
    const dulDataPromise = this.showDULData(electionReview);
    const [dulData, vaultVote] = await Promise.all([dulDataPromise, vaultVotePromise]);

    //rpElection processing
    let rpElectionReviewObj = this.processRPElectionReviewState(rpElectionReview);

    //state assignment
    this.setState(prev => {
      prev = assign(prev, {loading: false}, voteObj, showAccessDataObj, dulData, vaultVote, rpElectionReviewObj);
      return prev;
    });
  };

  showAccessData = (electionReview) => {
    let applyToState = {};
    if (!isNil(electionReview.voteAgreement)) {
      applyToState.originalAgreementVote = electionReview.voteAgreement.vote;
      applyToState.originalAgreementRationale = electionReview.voteAgreement.rationale;
      if(!isNil(electionReview.voteAgreement.vote)) {
        applyToState.agreementAlreadyVote = true;
      }
    }

    applyToState.electionAccess = electionReview.election;

    if (!isNil(electionReview.election)) {
      if (isNil(electionReview.election.finalRationale)) {
        applyToState.electionAccess.finalRationale = '';
      }
      applyToState.status = electionReview.election.status;
      applyToState.voteAgreementId = electionReview.election.referenceId;
      applyToState.mrDAR = JSON.stringify(electionReview.election.useRestriction, null, 2);
    }

    applyToState.voteAccessList = this.chunk(electionReview.reviewVote, 2);
    applyToState.chartDataAccess = this.getGraphData(electionReview.reviewVote);
    applyToState.voteAgreement = electionReview.voteAgreement;

    return applyToState;
  };

  showDULData = async (electionReview) => {
    let applyToState = {
      sDul: electionReview.election.translatedUseRestriction,
      mrDUL: JSON.stringify(electionReview.election.useRestriction, null, 2),
      downloadUrl: await Config.getApiUrl() + 'consent/' + electionReview.consent.consentId + '/dul',
      dulName: electionReview.election.dulName,
      status: electionReview.election.status,
      voteList: this.chunk(electionReview.reviewVote, 2),
      chartDataDUL: this.getGraphData(electionReview.reviewVote),
      election: electionReview.election
    };

    if(electionReview.election.finalRationale === null) {
      applyToState.election.finalRationale = '';
    }

    return applyToState;
  };

  vaultVote = async (consentId) => {
    const data = await Match.findMatch(consentId, this.state.referenceId);
    let applyToState;
    if (data.failed !== null && data.failed !== undefined && data.failed) {
      applyToState = {
        hideMatch: false,
        match: '-1',
        createDate: data.createDate
      };
    } else if (data.match !== null && data.match !== undefined) {
      applyToState = {
        hideMatch: false,
        match: data.match,
        createDate: data.createDate
      };
    } else {
      applyToState = {
        hideMatch: true
      };
    }

    return applyToState;
  };

  processFinalAccessVoteState = (darFinalAccessVote, electionId) => {
    let applyToState = {
      vote: darFinalAccessVote,
      voteId: electionId
    };

    if (!isNil(darFinalAccessVote.vote)) {
      applyToState.alreadyVote = true;
      applyToState.originalVote = darFinalAccessVote.vote;
      applyToState.originalRationale = darFinalAccessVote.rationale;
    } else {
      applyToState.alreadyVote = false;
    }

    return applyToState;
  };

  processRPElectionReviewState = (rpElectionReview) => {
    let applyToState;
    if (!isNil(rpElectionReview.election)) {
      let election = rpElectionReview.election;
      const finalRationale = election.finalRationale;
      applyToState = {
        electionRP: election,
        statusRP: election.status,
        rpVoteAccessList: this.chunk(rpElectionReview.reviewVote, 2), 
        chartRP: this.getGraphData(rpElectionReview.reviewVote),
        showRPaccordion: true
      };
      applyToState.electionRP.finalRationale = finalRationale || '';
    } else {
      applyToState = {
        electionRP: {},
        rpVoteAccessList: [],
        chartRP: { Total: [] },
        showRPaccordion: false
      };
    }
    //NOTE: should this be moved outside of this method's flow control?
    applyToState.loading = false;
    return applyToState;
  }

  chunk = (arr, size) => {
    var newArr = [];
    for (var i = 0; i < arr.length; i += size) {
      newArr.push(arr.slice(i, i + size));
    }
    return newArr;
  };

  getGraphData = (reviewVote) => {
    var yes = 0, no = 0, empty = 0;
    for (var i = 0; i < reviewVote.length; i++) {
      if (reviewVote[i].vote.type === 'DAC') {
        switch (reviewVote[i].vote.vote) {
          case true:
            yes++;
            break;
          case false:
            no++;
            break;
          default:
            empty++;
            break;
        }
      }
    }
    var chartData = {
      'Total': [
        ['Results', 'Votes'],
        ['YES', yes],
        ['NO', no],
        ['Pending', empty]
      ]
    };
    return chartData;
  };

  render() {

    let finalVote = null;
    if (this.state.electionAccess.finalVote === '1' || this.state.electionAccess.finalVote === true || this.state.electionAccess.finalVote ===
      'true') {
      finalVote = true;
    }
    if (this.state.electionAccess.finalVote === '0' || this.state.electionAccess.finalVote === false || this.state.electionAccess.finalVote ===
      'false') {
      finalVote = false;
    }

    const agreementData = div({ className: 'agreement-data' }, [
      label({}, ['DAC Decision: ']),
      span({ className: 'access-color', isRendered: finalVote === true, style: { 'marginLeft': '5px' } }, [b({}, ['YES'])]),
      span({ className: 'access-color', isRendered: finalVote === false, style: { 'marginLeft': '5px' } }, [b({}, ['NO'])]),
      span({ className: 'access-color', isRendered: finalVote === null, style: { 'marginLeft': '5px' } }, [b({}, ['---'])]),
      label({}, ['DUOS Matching Algorithm Decision: ']),
      span({
        className: 'access-color', isRendered: this.state.match === '1' || this.state.match === true || this.state === 'true',
        style: { 'marginLeft': '5px' }
      }, [b({}, ['YES'])]),
      span({
        className: 'access-color', isRendered: this.state.match === '0' || this.state.match === false || this.state === 'false',
        style: { 'marginLeft': '5px' }
      }, [b({}, ['NO'])]),
      span({ className: 'access-color', isRendered: this.state.match === null, style: { 'marginLeft': '5px' } }, [b({}, ['---'])]),
      span({ className: 'cancel-color', isRendered: this.state.match === '-1', style: { 'marginLeft': '5px' } }, [
        'Automated Vote System Failure. Please report this issue via the "Request Help" link'
      ])
    ]);

    return (

      div({ className: 'container container-wide' }, [
        div({ className: 'row no-margin' }, [
          div({ className: 'col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding' }, [
            PageHeading({
              id: 'finalAccess', imgSrc: '/images/icon_access.png', iconSize: 'medium',
              color: 'access', title: 'Final voting for Data Access Review'
            }),
            DataAccessRequest({
              isRendered: !ld.isEmpty(this.state.darInfo.datasets),
              dar: this.state.darInfo,
              consentName: this.state.consentName
            })
          ]),
          div({ className: 'col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding' }, [
            h(Link, { id: 'btn_back', to: '/chair_console', className: 'btn-primary btn-back' }, [
              i({ className: 'glyphicon glyphicon-chevron-left' }), 'Back'
            ])
          ])
        ]),

        div({ className: 'accordion-title access-color' }, [
          'Does the DAC grant this researcher permission to access the data?'
        ]),
        hr({ className: 'section-separator' }),

        h4({ className: 'hint', isRendered: this.state.hasUseRestriction === true }, [
          'Please review the Application Summary and Data Use Limitations to answer the two questions below.',
          br(),
          'You may review other DAC votes related to this data access request below the questions on this page.'
        ]),

        h4({ className: 'hint', isRendered: !this.state.hasUseRestriction === true }, [
          'Please review the Application Summary and Data Use Limitations to answer the question below.',
          br(),
          'You may review other DAC votes related to this data access request below the question on this page.'
        ]),

        div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [

          ApplicationSummary({
            isRendered: !ld.isNil(this.state.darInfo) && !ld.isNil(this.state.researcherProfile),
            mrDAR: this.state.mrDAR,
            hasUseRestriction: this.state.hasUseRestriction,
            darInfo: this.state.darInfo,
            downloadDAR: this.downloadDAR,
            researcherProfile: this.state.researcherProfile }),

          div({ className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes' }, [

            div({ className: 'panel-heading cm-boxhead dul-color' }, [
              h4({}, ['Data Use Limitations'])
            ]),
            div({ id: 'dul', className: 'panel-body cm-boxbody' }, [
              div({ className: 'row dar-summary' }, [
                div({ className: 'control-label dul-color' }, ['Structured Limitations']),
                div({ className: 'response-label translated-restriction', dangerouslySetInnerHTML: { __html: this.state.sDul } }, []),
                a({
                  id: 'btn_downloadSDul', onClick: () => Utils.download('machine-readable-DUL.json', this.state.mrDUL),
                  className: 'italic hover-color'
                }, ['Download DUL machine-readable format'])
              ])
            ])
          ])

        ]),

        hr({ className: 'section-separator' }),

        div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [

          div({
            className: 'jumbotron box-vote-results access-background-lighter ' +
              (this.state.hasUseRestriction ? 'col-lg-6 col-md-6 col-sm-12 col-xs-12'
                : 'col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-10 col-sm-offset-1 col-xs-12 center-margin')
          }, [

            SubmitVoteBox({
              id: 'finalAccess',
              color: 'access',
              title: this.state.hasUseRestriction === true ? 'Q1. Does the DAC grant this researcher permission to access the data?'
                : 'Does the DAC grant this researcher permission to access the data?',
              isDisabled: false,
              voteStatus: this.state.vote.vote,
              rationale: this.state.vote.rationale !== null ? this.state.vote.rationale : '',
              showAlert: this.state.showQ1Alert,
              alertMessage: this.state.alertQ1Message,
              action: { label: 'Vote', handler: this.logVote },
              key: this.state.voteId
            })
          ]),

          this.q2VoteBox(agreementData)

        ]),

        ConfirmationDialog({
          title: 'Post Final Access Decision?',
          color: 'access',
          showModal: this.state.showConfirmDialog,
          disableNoBtn: this.state.q1NoBtnDisabled,
          disableOkBtn: this.state.q1OkBtnDisabled,
          alertTitle: this.state.q1AlertTitle,
          alertMessage: this.state.q1AlertMessage,
          action: {
            label: 'Yes',
            handler: this.confirmationHandlerOK
          }
        }, [
          div({ className: 'dialog-description' }, [
            span({}, ['Are you sure you want to post this Final Access Decision?'])
          ])
        ]),

        ConfirmationDialog({
          title: 'Post Decision Agreement?',
          color: 'access',
          showModal: this.state.showConfirmAgreementDialog,
          disableNoBtn: this.state.q2NoBtnDisabled,
          disableOkBtn: this.state.q2OkBtnDisabled,
          alertTitle: this.state.q2AlertTitle,
          alertMessage: this.state.q2AlertMessage,
          action: {
            label: 'Yes',
            handler: this.confirmationAgreementHandlerOK
          }
        }, [
          div({ className: 'dialog-description' }, [
            span({}, ['Are you sure you want to post this Decision Agreement?'])
          ])
        ]),

        h3({ className: 'cm-subtitle' }, ['Data Access Committee Voting Results']),

        div({ className: 'row no-margin' }, [

          CollapsiblePanel({
            id: 'accessCollectVotes',
            onClick: this.toggleQ1,
            color: 'access',
            title: this.state.hasUseRestriction === true ? 'Q1. Should data access be granted to this applicant?'
              : 'Should data access be granted to this applicant?',
            expanded: this.state.isQ1Expanded
          }, [

            div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [

              CollectResultBox({
                id: 'accessCollectResult',
                title: 'DAC Decision',
                color: 'access',
                class: 'col-lg-7 col-md-7 col-sm-12 col-xs-12',
                vote: this.state.electionAccess.finalVote,
                voteDate: this.state.electionAccess.finalVoteDate,
                rationale: this.state.electionAccess.finalRationale,
                chartData: this.state.chartDataAccess.Total
              }),

              div({
                isRendered: this.state.hasUseRestriction === true,
                className: 'col-lg-5 col-md-5 col-sm-12 col-xs-12 jumbotron box-vote-results no-padding'
              }, [
                h4({ className: 'box-vote-title access-color' }, ['DUOS Matching Algorithm Decision']),
                hr({ className: 'box-separator' }),
                div({ className: 'results-box' }, [
                  div({ className: 'row' }, [
                    label({ className: 'col-lg-3 col-md-3 col-sm-2 col-xs-4 control-label vote-label access-color' }, ['Vote: ']),
                    div({ id: 'lbl_resultMatch', className: 'col-lg-9 col-md-9 col-sm-3 col-xs-3 vote-label bold' }, [
                      span({ isRendered: this.state.match === '1' || this.state.match === true || this.state.match === 'true' }, ['YES']),
                      span({ isRendered: this.state.match === '0' || this.state.match === false || this.state.match === 'false' }, ['NO']),
                      span({ isRendered: this.state.match === null }, []),
                      span({ className: 'cancel-color', isRendered: this.state.match === '-1' }, [
                        'Automated Vote System Failure. Please report this issue via the "Request Help" link'
                      ])
                    ])
                  ]),
                  div({ className: 'row' }, [
                    label({ className: 'col-lg-3 col-md-3 col-sm-2 col-xs-4 control-label vote-label access-color' }, ['Date: ']),
                    div({ id: 'lbl_dateMatch', className: 'col-lg-9 col-md-9 col-sm-3 col-xs-3 vote-label' },
                      [Utils.formatDate(this.state.createDate)])
                  ])
                ])
              ])
            ]),

            this.state.voteAccessList.map((row, rIndex) => {
              return h(Fragment, { key: 'val_' + rIndex }, [
                div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                  row.map((vm, vIndex) => {
                    return h(Fragment, { key: 'valr_' + vIndex }, [
                      SingleResultBox({
                        id: 'accessSingleResult_' + vIndex,
                        color: 'access',
                        data: vm
                      })
                    ]);
                  })
                ])
              ]);
            })
          ]),

          CollapsiblePanel({
            isRendered: this.state.showRPaccordion === true,
            id: 'rpCollectVotes',
            onClick: this.toggleQ2,
            color: 'access',
            title: 'Q2. Was the research purpose accurately converted to a structured format?',
            expanded: this.state.isQ2Expanded
          }, [

            div({ className: 'row no-margin' }, [
              CollectResultBox({
                id: 'rpCollectResult',
                title: 'DAC Decision',
                color: 'access',
                class: 'col-lg-8 col-md-8 col-sm-12 col-xs-12',
                vote: this.state.electionRP.finalVote,
                voteDate: this.state.electionRP.finalVoteDate,
                rationale: this.state.electionRP.finalRationale,
                chartData: this.state.chartRP.Total
              })
            ]),

            this.state.rpVoteAccessList.map((row, rIndex) => {
              return h(Fragment, { key: 'rval_' + rIndex }, [
                div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                  row.map((vm, vIndex) => {
                    return h(Fragment, { key: 'rrval_' + vIndex }, [
                      SingleResultBox({
                        id: 'rpSingleResult_' + vIndex,
                        color: 'access',
                        data: vm
                      })
                    ]);
                  })
                ])
              ]);
            })
          ]),

          CollapsiblePanel({
            id: 'dulCollectVotes',
            onClick: this.toggleDulExpanded,
            color: 'dul',
            title: 'Were the data use limitations in the Data Use Letter accurately converted to structured limitations?',
            expanded: this.state.isDULExpanded
          }, [

            div({ className: 'row no-margin' }, [
              CollectResultBox({
                id: 'dulCollectResult',
                title: 'DAC Decision',
                color: 'dul',
                class: 'col-lg-8 col-md-8 col-sm-12 col-xs-12',
                vote: this.state.election.finalVote,
                voteDate: this.state.election.finalVoteDate,
                rationale: this.state.election.finalRationale,
                chartData: this.state.chartDataDUL.Total
              })
            ]),


            this.state.voteList.map((row, rIndex) => {
              return h(Fragment, { key: 'vl_' + rIndex }, [
                div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                  row.map((vm, vIndex) => {
                    return h(Fragment, { key: 'rvl_' + vIndex }, [
                      SingleResultBox({
                        id: 'dulSingleResult_' + vIndex,
                        color: 'dul',
                        data: vm
                      })
                    ]);
                  })
                ])
              ]);
            })
          ])
        ])
      ])
    );
  }

  q2VoteBox = (agreementData) => {
    let box = null;
    if (this.state.hasUseRestriction === true) {

      box = div({
        isRendered: this.state.hasUseRestriction === true,
        className: 'jumbotron box-vote-results access-background-lighter col-lg-6 col-md-6 col-sm-12 col-xs-12'
      }, [

        SubmitVoteBox({
          id: 'agreement',
          color: 'access',
          title: 'Q2. Is the DAC decision consistent with the DUOS Matching Algorithm decision?',
          isDisabled: false,
          agreementData: agreementData,
          voteStatus: ld.isEmpty(this.state.voteAgreement) ? null : this.state.voteAgreement.vote,
          rationale: ld.isEmpty(this.state.voteAgreement) ? null : this.state.voteAgreement.rationale !== null ? this.state.voteAgreement.rationale : '',
          showAlert: this.state.showQ2Alert,
          alertMessage: this.state.alertQ2Message,
          action: { label: 'Vote', handler: this.logVoteAgreement },
          key: this.state.voteAgreementId
        })
      ]);
    }
    return box;
  };

}

export default FinalAccessReview;
