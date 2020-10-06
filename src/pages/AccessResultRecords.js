import * as ld from 'lodash';
import isNil from 'lodash/fp/isNil';
import isEmpty from 'lodash/fp/isEmpty';
import assign from 'lodash/fp/assign';
import { Component, Fragment } from 'react';
import { a, div, h, h3, h4, hr, i, label, span } from 'react-hyperscript-helpers';
import { ApplicationSummary } from '../components/ApplicationSummary';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { CollectResultBox } from '../components/CollectResultBox';
import { DataAccessRequest } from '../components/DataAccessRequest';
import { PageHeading } from '../components/PageHeading';
import { SingleResultBox } from '../components/SingleResultBox';
import TranslatedDULComponent from '../components/TranslatedDULComponent';

import { DAR, Election, Files, Match, Researcher, Votes } from '../libs/ajax';
import { Config } from '../libs/config';
import { Models } from '../libs/models';
import { Storage } from '../libs/storage';
import * as Utils from '../libs/utils';


class AccessResultRecords extends Component {

  constructor(props) {
    super(props);
    this.state = this.initialState();
  }

  async componentDidMount() {
    const currentUser = await Storage.getCurrentUser();
    this.loadData();
    this.setState({
      currentUser: currentUser
    });
  }

  initialState() {
    return {
      createDate: null,
      enableFinalButton: true,
      enableAgreementButton: true,
      hasUseRestriction: true,
      hasLibraryCard: false,
      isQ1Expanded: false,
      isQ2Expanded: false,
      isDulExpanded: false,
      match: '-1',
      election: {},
      electionAccess: {},
      electionRP: {},
      voteAgreement: {},
      darInfo: Models.dar,
      researcherProfile: null,
      datasets: [],
      consentName: ''
    };
  }

  chunk(arr, size) {
    var newArr = [];
    for (var i = 0; i < arr.length; i += size) {
      newArr.push(arr.slice(i, i + size));
    }
    return newArr;
  }

  getGraphData(reviewVote) {
    let yes = 0;
    let no = 0;
    let empty = 0;

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

    const chartData =
      [
        ['Results', 'Votes'],
        ['YES', yes],
        ['NO', no],
        ['Pending', empty]
      ];

    return chartData;
  }



  downloadDAR = (e) => {
    Files.getDARFile(this.state.darElection.referenceId);
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

  goBack = (e) => {
    this.props.history.goBack();
  };

  render() {

    const { darInfo, hasUseRestriction, mrDAR, showRPaccordion, researcherProfile } = this.state;

    const backButton = div({ className: 'col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding' }, [
      a({ id: 'btn_back', onClick: this.goBack, className: 'btn-primary btn-back' }, [
        i({ className: 'glyphicon glyphicon-chevron-left' }), 'Back'
      ])
    ]);

    return (

      div({ className: 'container container-wide' }, [

        div({ className: 'row no-margin' }, [

          div({ className: 'col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding' }, [
            PageHeading({
              id: 'recordAccess', imgSrc: '/images/icon_access.png', iconSize: 'medium',
              color: 'access', title: 'Data Access - Results Record'
            }),
            DataAccessRequest({
              isRendered: !ld.isEmpty(this.state.darInfo.datasets),
              dar: this.state.darInfo,
              consentName: this.state.consentName
            })
          ]),

          backButton
        ]),

        div({ className: 'accordion-title access-color' }, [
          'Did the DAC grant this researcher permission to access the data?'
        ]),
        hr({ className: 'section-separator' }),

        div({
          isRendered: !isNil(this.state.mrDUL) || !isNil(this.state.sDUL),
          className: 'row fsi-row-lg-level fsi-row-md-level no-margin'
        }, [
          ApplicationSummary({
            isRendered: !ld.isNil(darInfo) && !ld.isNil(researcherProfile),
            mrDAR: mrDAR,
            hasUseRestriction: hasUseRestriction,
            darInfo: darInfo,
            downloadDAR: this.downloadDAR,
            researcherProfile: researcherProfile
          }),

          div({ className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes' }, [
            h(TranslatedDULComponent, {
              mrDUL: this.state.mrDUL,
              restrictions: this.state.dataUse
            })
          ])
        ]),

        hr({ className: 'section-separator' }),

        div({ className: 'row no-margin' }, [
          this.renderCollectResultBox1(hasUseRestriction, this.state.finalDACVote),
          this.renderCollectResultBox2(hasUseRestriction, this.state.voteAgreement)
        ]),

        h3({ className: 'cm-subtitle' }, ['Data Access Committee Voting Results']),

        div({ className: 'row no-margin' }, [

          CollapsiblePanel({
            id: 'accessRecordVotes',
            onClick: this.toggleQ1,
            color: 'access',
            title: this.state.hasUseRestriction ? 'Q1. Should data access be granted to this applicant?'
              : 'Should data access be granted to this applicant?',
            expanded: this.state.isQ1Expanded
          }, [

            div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [

              this.renderCollectResultBox3(this.state.chartDataAccess, this.state.electionAccess),

              this.renderDACDecision()

            ]),
            this.renderVotes(this.state.voteAccessList)
          ]),

          CollapsiblePanel({
            isRendered: showRPaccordion,
            id: 'rpRecordVotes',
            onClick: this.toggleQ2,
            color: 'access',
            title: 'Q2. Was the research purpose accurately converted to a structured format?',
            expanded: this.state.isQ2Expanded
          }, [

            div({ className: 'row no-margin' }, [
              this.renderCollectResultBox4(this.state.chartRP, this.state.electionRP)
            ]),
            this.renderDarVotes(this.state.rpVoteAccessList)
          ]),

          CollapsiblePanel({
            id: 'dulRecordVotes',
            onClick: this.toggleDulExpanded,
            color: 'dul',
            title: 'Were the data use limitations in the Data Use Letter accurately converted to structured limitations?',
            expanded: this.state.isDULExpanded
          }, [
            div({ className: 'row no-margin' }, [
              this.renderCollectResultBox5(this.state.chartDataDUL, this.state.election)
            ]),
            this.renderVoteList(this.state.voteList)
          ])
        ])
      ])
    );
  }

  renderDACDecision() {

    let voteIsYes = this.state.match === '1' || this.state.match === 'true' || this.state.match === true;
    let voteIsNo = this.state.match === '0' || this.state.match === 'false' || this.state.match === false;
    let voteFailed = this.state.match === '-1';
    let voteIsNull = this.state.match == null;

    return (
      div({
        isRendered: this.state.hasUseRestriction,
        className: 'col-lg-4 col-md-5 col-sm-12 col-xs-12 jumbotron box-vote-results no-padding'
      }, [
        h4({ className: 'box-vote-title access-color' }, ['DUOS Matching Algorithm Decision']),
        hr({ className: 'box-separator' }),
        div({ className: 'results-box' }, [

          div({ className: 'row' }, [
            label({ className: 'col-lg-3 col-md-3 col-sm-2 col-xs-4 control-label vote-label access-color' }, ['Vote: ']),
            div({ id: 'lbl_resultMatch', className: 'col-lg-9 col-md-9 col-sm-3 col-xs-3 vote-label bold' }, [
              span({ isRendered: voteIsYes }, ['YES']),
              span({ isRendered: voteIsNo }, ['NO']),
              span({ isRendered: voteIsNull }, ['---']),
              span({ className: 'cancel-color', isRendered: voteFailed }, [
                'Automated Vote System Failure. Please report this issue via the "Request Help" link'
              ])
            ])
          ]),

          div({ className: 'row' }, [
            label({ className: 'col-lg-3 col-md-3 col-sm-2 col-xs-4 control-label vote-label access-color' }, ['Date: ']),
            div({ id: 'lbl_dateMatch', className: 'col-lg-9 col-md-9 col-sm-3 col-xs-3 vote-label' }, [Utils.formatDate(this.state.createDate)])
          ])
        ])
      ])
    );
  }

  renderVotes(voteAccessList) {
    if (voteAccessList === null || voteAccessList === undefined) {
      voteAccessList = [];
    }

    return (
      voteAccessList.map((row, rIndex) => {
        return h(Fragment, { key: 'vote_' + rIndex }, [
          div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
            row.map((vm, vIndex) => {
              return h(Fragment, { key: 'vote_vm_' + vIndex }, [
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
    );
  }

  renderDarVotes(rpVoteAccessList) {
    if (rpVoteAccessList === null || rpVoteAccessList === undefined) {
      rpVoteAccessList = [];
    }

    return (
      rpVoteAccessList.map((row, rIndex) => {
        return h(Fragment, { key: 'rpVote_' + rIndex }, [
          div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
            row.map((vm, vIndex) => {
              return h(Fragment, { key: 'rpVote_vm_' + vIndex }, [
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
    );
  }

  renderVoteList(voteList) {
    if (voteList === null || voteList === undefined) {
      voteList = [];
    }

    return (
      voteList.map((row, rIndex) => {
        return h(Fragment, { key: 'votel_' + rIndex }, [
          div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
            row.map((vm, vIndex) => {
              return h(Fragment, { key: 'votel_' + vIndex }, [
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
    );
  }

  // renderDataUseLimitation(sDUL, mrDUL) {

  //   return (
  //     div({className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes' }, [

  //       div({ className: 'panel-heading cm-boxhead dul-color' }, [
  //         h4({}, ['Data Use Limitations'])
  //       ]),
  //       div({ id: 'dul', className: 'panel-body cm-boxbody' }, [
  //         div({ className: 'row dar-summary' }, [
  //           div({ className: 'control-label dul-color' }, ['Structured Limitations']),
  //           div({ className: 'response-label translated-restriction', dangerouslySetInnerHTML: { __html: sDUL } }, []),
  //           a({
  //             id: 'btn_downloadSDul', onClick: () => Utils.download('machine-readable-DUL.json', mrDUL),
  //             filename: 'machine-readable-DUL.json', value: mrDUL, className: 'italic hover-color'
  //           }, ['Download DUL machine-readable format'])
  //         ])
  //       ])
  //     ])
  //   );
  // }

  renderCollectResultBox1(hasUseRestriction, finalDACVote) {

    if (finalDACVote === null || finalDACVote === undefined) {
      finalDACVote = {
        finalVote: null,
        finalRationale: null
      };
    }

    return (
      div({
        className: hasUseRestriction ? 'col-lg-6 col-md-6 col-sm-12 col-xs-12'
          : 'col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-12 col-xs-12'
      }, [
        CollectResultBox({
          id: 'finalAccessRecordResult',
          title: hasUseRestriction ? 'Q1. Did the DAC grant this researcher permission to access the data?'
            : 'Did the DAC grant this researcher permission to access the data?',
          color: 'access',
          type: 'records',
          class: 'col-lg-12 col-md-12 col-sm-12 col-xs-12',
          vote: finalDACVote.vote,
          voteDate: finalDACVote.createDate,
          rationale: finalDACVote.rationale
        })
      ])
    );
  }

  renderCollectResultBox2(hasUseRestriction, voteAgreement) {
    if (voteAgreement === null || voteAgreement === undefined) {
      voteAgreement = {};
    }

    return (
      div({
        isRendered: hasUseRestriction, className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12'
      }, [
        CollectResultBox({
          id: 'finalAgreementRecordResult',
          title: 'Q2. Was the DAC decision consistent with the DUOS Matching Algorithm decision?',
          color: 'access',
          type: 'records',
          class: 'col-lg-12 col-md-12 col-sm-12 col-xs-12',
          vote: voteAgreement.vote,
          voteDate: voteAgreement.createDate,
          rationale: voteAgreement.rationale
        })
      ])
    );
  }

  renderCollectResultBox3(chartData, electionAccess) {
    if (electionAccess === null || electionAccess === undefined) {
      electionAccess = {};
    }

    if (chartData === null || chartData === undefined) {
      chartData = [];
    }

    return (
      CollectResultBox({
        id: 'accessRecordResult',
        title: 'DAC Decision',
        color: 'access',
        class: 'col-lg-8 col-md-7 col-sm-12 col-xs-12',
        vote: electionAccess.finalVote,
        voteDate: electionAccess.finalVoteDate,
        rationale: electionAccess.finalRationale,
        chartData: chartData
      })
    );
  }


  renderCollectResultBox4(chartData, electionRP) {
    if (electionRP === null || electionRP === undefined) {
      electionRP = {};
    }

    if (chartData === null || chartData === undefined) {
      chartData = [];
    }

    return (
      CollectResultBox({
        id: 'rpRecordResult',
        title: 'DAC Decision',
        color: 'access',
        class: 'col-lg-8 col-md-8 col-sm-12 col-xs-12',
        vote: electionRP.finalVote,
        voteDate: electionRP.finalVoteDate,
        rationale: electionRP.finalRationale,
        chartData: chartData
      })
    );
  }

  renderCollectResultBox5(chartData, election) {
    if (election === null || election === undefined) {
      election = {};
    }

    if (chartData === null || chartData === undefined) {
      chartData = [];
    }

    return (
      CollectResultBox({
        id: 'dulRecordResult',
        title: 'DAC Decision',
        color: 'dul',
        class: 'col-lg-8 col-md-8 col-sm-12 col-xs-12',
        vote: election.finalVote,
        voteDate: election.finalVoteDate,
        rationale: election.finalRationale,
        chartData: chartData
      })
    );
  }

  showDarData(electionReview) {
    let electionAccess = electionReview.election;
    if (electionReview.election.finalRationale === null) {
      electionAccess.finalRationale = '';
    }
    const status = electionReview.election.status;
    const voteAccessList = this.chunk(electionReview.reviewVote, 2);
    const chartDataAccess = this.getGraphData(electionReview.reviewVote);
    const voteAgreement = electionReview.voteAgreement;

    // this data is used to construct structured_ files
    const mrDAR = JSON.stringify(electionReview.election.useRestriction, null, 2);

    return {
      electionAccess: electionAccess,
      status: status,
      voteAccessList: voteAccessList,
      chartDataAccess: chartDataAccess,
      voteAgreement: voteAgreement,
      mrDAR: mrDAR
    };
  };

  async showDULData(electionReview) {
    let election = electionReview.election;
    if (electionReview.election.finalRationale === null) {
      election.finalRationale = '';
    }
    return {
      election: election,
      downloadUrl: await Config.getApiUrl() + 'consent/' + electionReview.consent.consentId + '/dul',
      dulName: electionReview.election.dulName,
      status: electionReview.election.status,
      voteList: this.chunk(electionReview.reviewVote, 2),
      chartDataDUL: this.getGraphData(electionReview.reviewVote),
      mrDUL: JSON.stringify(electionReview.election.useRestriction, null, 2)
    };
  };

  async vaultVote(consentId, referenceId) {
    const data = await Match.findMatch(consentId, referenceId);
    let output = {};
    if (data.failed !== null && data.failed !== undefined && data.failed) {
      output = {
        hideMatch: false,
        match: '-1',
        createDate: data.createDate
      };
    } else if (data.match !== null && data.match !== undefined) {
      output = {
        hideMatch: false,
        match: data.match,
        createDate: data.createDate
      };
    } else {
      output = {
        hideMatch: true
      };
    }
    return output;
  };

  async electionAPICalls(electionId) {
    const darElection = await Election.findElectionById(electionId);
    return {
      darElection
    };
  };

  async darAPICalls (referenceId) {
    const darInfo = await DAR.describeDar(referenceId);
    const researcherProfile = await Researcher.getResearcherProfile(darInfo.researcherId);
    return {
      darInfo,
      researcherProfile
    };
  };

  //returns the most recent final vote
  async getFinalDACVote(electionId) {
    const finalDACVote = await Votes.getDarFinalAccessVote(electionId);
    return {finalDACVote};
  };

  async electionReviewCall(electionId) {
    let output = {
      darData: null,
      electionReview: null,
      showDULData: null,
      vaultVote: null
    };

    const dataAccessElectionReview = await Election.findDataAccessElectionReview(electionId, false);
    const darData = this.showDarData(dataAccessElectionReview);
    const electionReview = await Election.findElectionReviewById(dataAccessElectionReview.associatedConsent.electionId, dataAccessElectionReview.associatedConsent.consentId);
    const showDULDataPromise = await this.showDULData(electionReview);
    const vaultVotePromise = await this.vaultVote(electionReview.consent.consentId, darData.electionAccess.referenceId);
    const [vaultVote, showDULData] = await Promise.all([vaultVotePromise, showDULDataPromise]);
    output = {
      darData,
      electionReview,
      showDULData,
      vaultVote
    };

    return output;
  };

  async electionRPCall(electionId, finalStatus = false) {
    let assignToState = {};
    const rpElectionReviewResp = await Election.findRPElectionReview(electionId, false);
    if (!ld.isEmpty(rpElectionReviewResp) && rpElectionReviewResp.election) {
      let electionRP = rpElectionReviewResp.election;
      if (ld.isNil(electionRP.finalRationale)) {
        electionRP.finalRationale = '';
      }
      ld.assign(assignToState, {
        electionRP: electionRP,
        statusRP: rpElectionReviewResp.election.status,
        rpVoteAccessList: this.chunk(rpElectionReviewResp.reviewVote, 2),
        chartRP: this.getGraphData(rpElectionReviewResp.reviewVote),
        showRPaccordion: true
      });
    } else {
      ld.assign(assignToState, {
        showRPaccordion: false
      });
    }

    return assignToState;
  };


  async loadData() {
    const referenceId = this.props.match.params.referenceId;
    const electionId = this.props.match.params.electionId;
    let assignToState = {};

    const[electionAPIResults, darAPIResults, finalDACVote, electionReviewResults, electionRPResults] = await Promise.all([
      this.electionAPICalls(electionId), //Election.findElectionById
      this.darAPICalls(referenceId), //DAR.describeDar, Researcher.getResearcherProfile
      this.getFinalDACVote(electionId), //Votes.getDarFinalAccessVote
      this.electionReviewCall(electionId), //Election.findDataAccessElectionReview, Election.findElectionReviewById, Config.getApiUrl() + 'consent/' + electionReview.consent.consentId + '/dul'
      this.electionRPCall(electionId, false) //Election.findRPElectionReview(electionId, false (finalStatus))
    ]);

    const {darData, electionReview, showDULData, vaultVote} = electionReviewResults;
    const restrictions = darAPIResults.darInfo.restrictions;
    const consent = electionReview.consent;

    assignToState = Object.assign({}, darData, electionReview, showDULData, vaultVote, electionAPIResults, darAPIResults, finalDACVote, electionRPResults);
    assignToState.hasUseRestrictions = !isNil(restrictions) && !isEmpty(restrictions);
    assignToState.consentName = consent.name;
    assignToState.dataUse = consent.dataUse;
    //NOTE: need to add hasUseRestriction to the state object, but is there a way for me to pull it forward?

    //NOTE: lot of election calls, they seem to have different contexts and have extra stuff added to them
    //On top of that it just gets a bunch of other stuff (votes, consent) objects attached to it and returned as a seperate data structure
    //Contextually the difference between each of these elections are not clear (TYPE is different, but what that entails is not obvious)
    //Similar questions with the various votes (rpVotes, finalDACVote).

    //The various consent objects seem to have the same data, they only really differ in timestamps, ids, and type
    //Need to do a more thorough analysis of the above (larger sample size)

    //NOTE: the component currently uses hasRestrictions, which I found out to simply be a check on the restrictions attribute on a DAR
    //Basically all it does is check if a value exists and returns the bool value
    //So all I've done is simply check that value myself from the describeDar return value rather than use the endpoint

    //List of keys with mapped values
    //   electionId,
    //   referenceId,
    //   darElection: electionAPIResults.darElection,
    //   darInfo: darAPIResults.darInfo,
    //   researcherProfile: darAPIResults.researcherProfile,
    //   finalDACVote: finalDACVote.voteResponse,
    //   electionReview: electionReviewResults.electionReview,
    //   consentName: consent.name,
    //   election: electionReviewResults.showDULData.election,
    //   downloadUrl: electionReviewResults.showDULData.downloadUrl,
    //   dulName: electionReviewResults.showDULData.dulName,
    //   hasUseRestrictions: !isNil(restrictions) && !isEmpty(restrictions),
    //   status: electionReviewResults.showDULData.election.status,
    //   voteList: electionReviewResults.showDULData.voteList,
    //   chartDataDUL: electionReviewResults.showDULData.chartDataDUL,
    //   mrDUL: electionReviewResults.showDULData.mrDUL,
    //   dataUse: consent.dataUse,
    //   hideMatch: electionReviewResults.vaultVote.hideMatch,
    //   match: electionReviewResults.vaultVote.match,
    //   createDate: electionReviewResults.vaultVote.createDate,
    //   electionRP: electionRPResults.electionRP,
    //   statusRP: electionRPResults.statusRP,
    //   rpVoteAccessList: electionRPResults.rpVoteAccessList,
    //   chartRP: electionRPResults.chartRP,
    //   showRPaccordion: electionRPResults.showRPaccordian,
    //   electionAccess: electionReviewResults.darData.electionAccess,
    // };

    this.setState((state) => {
      state = Object.assign({}, state, assignToState);
      return state;
    });

    //From here process results and assign them to state variable
    //NOTE: need to make sure functions have been refactored/organized correctly
    //NOTE: see if there's a way to simplify the election/vote requests and processing steps
  }
}

export default AccessResultRecords;
