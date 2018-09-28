import { Component, Fragment } from 'react';
import { div, button, span, b, a, i, hr, h4, ul, li, label, h3, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { SingleResultBox } from '../components/SingleResultBox';
import { CollectResultBox } from '../components/CollectResultBox';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { Storage } from '../libs/storage';
import { DAR, Election, Votes, Match } from '../libs/ajax';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { Config } from '../libs/config';
import * as Utils from '../libs/utils';

class AccessResultRecords extends Component {

  // apiUrl = '';

  constructor(props) {
    super(props);
    this.state = this.initialState();

  }

  async componentDidMount() {
    this.loadData();
    this.setState({
      loading: true
    });
  }

  initialState() {
    return {
      loading: true,
      isQ1Expanded: false,
      isQ2Expanded: false,
      isDulExpanded: false,
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

  downloadSDUL = (e) => {

    const filename = e.target.getAttribute('filename');
    const value = e.target.getAttribute('value');
    console.log('-------------------downloadSDUL---------------------', filename, value);
  }

  downloadSDAR = (e) => {
    const filename = e.target.getAttribute('filename');
    const value = e.target.getAttribute('value');
    console.log('-------------------downloadSDAR---------------------', filename, value);
  }

  downloadDAR = (e) => {
    console.log('-------------------downloadDAR---------------------');
    // cmFilesService.getDARFile($scope.darElection.referenceId);
  }

  downloadDUL = (e) => {
    console.log('-------------------downloadDUL---------------------');
    // cmFilesService.getDULFile($scope.electionReview.consent.consentId, $scope.electionReview.election.dulName);

  }

  positiveVote = (e) => {

  }

  setEnableFinalButton = (e) => {

  }

  logVote = (e) => {

  }

  toggleQ1 = (e) => {
    this.setState(prev => {
      prev.isQ1Expanded = !prev.isQ1Expanded;
      return prev;
    });
  }

  toggleQ2 = (e) => {
    this.setState(prev => {
      prev.isQ2Expanded = !prev.isQ2Expanded;
      return prev;
    });
  }

  toggleDulExpanded = (e) => {
    this.setState(prev => {
      prev.isDulExpanded = !prev.isDulExpanded;
      return prev;
    });
  }

  goBack = (e) => {
    this.props.history.goBack();
  }

  render() {

    if (this.state.loading) { return LoadingIndicator(); }

    const { projectTitle, darCode, dar, darInfo, hasUseRestriction } = this.state;

    const consentData = span({ className: "consent-data" }, [
      b({ className: "pipe" }, [projectTitle]), darCode
    ]);

    const backButton = div({ className: "col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding" }, [
      a({ id: "btn_back", onClick: this.goBack, className: "btn vote-button vote-button-back vote-button-bigger" }, [
        i({ className: "glyphicon glyphicon-chevron-left" }), "Back"
      ])
    ]);

    return (

      div({ className: "container container-wide" }, [

        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding" }, [
            PageHeading({
              id: "recordAccess", imgSrc: "/images/icon_access.png", iconSize: "medium", color: "access",
              title: "Data Access - Results Record", description: consentData
            }),
          ]),
          backButton,
        ]),

        div({ className: "accordion-title access-color" }, [
          "Did the DAC grant this researcher permission to access the data?"
        ]),
        hr({ className: "section-separator" }),

        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
          this.renderApplicationSummary(darInfo, dar, this.state.sDAR, this.state.mrDAR),
          this.renderDataUseLimitation(this.state.sDUL, this.state.mrDUL)
        ]),

        hr({ className: "section-separator" }),

        div({ className: "row no-margin", style: { "border": "1px solid red" } }, [
          this.renderCollectResultBox1(hasUseRestriction, this.state.finalDACVote),
          this.renderCollectResultBox2(hasUseRestriction, this.state.voteAgreement),
        ]),

        h3({ className: "cm-subtitle" }, ["Data Access Committee Voting Results"]),

        div({ className: "row no-margin" }, [

          CollapsiblePanel({
            id: "accessRecordVotes",
            onClick: this.toggleQ1,
            color: 'access',
            title: this.state.hasUseRestriction ? "Q1. Should data access be granted to this applicant?"
              : "Should data access be granted to this applicant?",
            expanded: this.state.isQ1Expanded
          }, [

              div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [

                this.renderCollectResultBox3(this.state.chartDataAccess, this.state.electionAccess),

                div({
                  isRendered: this.state.hasUseRestriction,
                  className: "col-lg-5 col-md-5 col-sm-12 col-xs-12 jumbotron box-vote-results no-padding"
                }, [
                    h4({ className: "box-vote-title access-color" }, ["DUOS Matching Algorithm Decision"]),
                    hr({ className: "box-separator" }),
                    div({ className: "results-box" }, [

                      div({ className: "row" }, [
                        label({ className: "col-lg-3 col-md-3 col-sm-2 col-xs-4 control-label vote-label access-color" }, ["Vote: "]),
                        div({ id: "lbl_resultMatch", className: "col-lg-9 col-md-9 col-sm-3 col-xs-3 vote-label bold" }, [
                          span({ isRendered: this.state.match === '1' }, ["YES"]),
                          span({ isRendered: this.state.match === '0' }, ["NO"]),
                          span({ isRendered: this.state.match === null }, ['---']),
                          span({ className: "cancel-color", isRendered: this.state.match === '-1' }, [
                            "Automated Vote System Failure. Please report this issue via the \"Request Help\" link"
                          ]),
                        ]),
                      ]),

                      div({ className: "row" }, [
                        label({ className: "col-lg-3 col-md-3 col-sm-2 col-xs-4 control-label vote-label access-color" }, ["Date: "]),
                        div({ id: "lbl_dateMatch", className: "col-lg-9 col-md-9 col-sm-3 col-xs-3 vote-label" }, [Utils.formatDate(this.state.createDate)]),
                      ]),
                    ]),
                  ]),
              ]),
              this.renderVotes(this.state.voteAccessList),
            ]),

          CollapsiblePanel({
            isRendered: "showRPaccordion",
            id: "rpRecordVotes",
            onClick: this.toggleQ2,
            color: 'access',
            title: "Q2. Was the research purpose accurately converted to a structured format?",
            expanded: this.state.isQ2Expanded
          }, [

              div({ className: "row no-margin" }, [
                this.renderCollectResultBox4(this.state.chartRP, this.state.electionRP),
              ]),
              this.renderDarVotes(this.state.rpVoteAccessList)
            ]),

          CollapsiblePanel({
            id: "dulRecordVotes",
            onClick: this.toggleDulExpanded,
            color: 'dul',
            title: "Were the data use limitations in the Data Use Letter accurately converted to structured limitations?",
            expanded: this.state.isDULExpanded
          }, [
              div({ className: "row no-margin" }, [
                this.renderCollectResultBox5(this.state.chartDataDUL, this.state.election),
              ]),
              this.renderVoteList(this.state.voteList)
            ]),
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
          div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
            row.map((vm, vIndex) => {
              return h(Fragment, { key: 'vote_vm_' + vIndex }, [
                SingleResultBox({
                  id: "accessSingleResult_" + vIndex,
                  color: "access",
                  data: vm
                })
              ]);
            })
          ]),
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
          div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
            row.map((vm, vIndex) => {
              return h(Fragment, { key: 'rpVote_vm_' + vIndex }, [
                SingleResultBox({
                  id: "rpSingleResult_" + vIndex,
                  color: "access",
                  data: vm
                })
              ]);
            })
          ]),
        ]);
      })
    );
  }


  renderVoteList(voteList) {
    if (voteList === null || voteList === undefined) {
      voteList = [];
    }

    return (
      this.state.voteList.map((row, rIndex) => {
        return h(Fragment, { key: 'votel_' + rIndex }, [
          div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
            row.map((vm, vIndex) => {
              return h(Fragment, { key: 'votel_' + vIndex }, [
                SingleResultBox({
                  id: "dulSingleResult_" + vIndex,
                  color: "dul",
                  data: vm
                })
              ]);
            })
          ]),
        ]);
      })
    );
  }

  renderApplicationSummary(darInfo, dar, sDAR, mrDAR) {
    console.log(dar);

    return (
      div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
        div({ className: "panel-heading cm-boxhead access-color" }, [
          h4({}, ["Application Summary"]),
        ]),
        div({ id: "rp", className: "panel-body" }, [
          div({ className: "row dar-summary" }, [
            div({ className: "control-label access-color" }, ["Research Purpose"]),
            div({ className: "response-label" }, [dar.rus]),
          ]),

          div({ className: "row dar-summary" }, [
            div({ className: "control-label access-color" }, ["Structured Research Purpose"]),
            div({ className: "panel-body cm-boxbody translated-restriction", dangerouslySetInnerHTML: { __html: darInfo.sDar } }, []),
            a({
              isRendered: this.state.hasUseRestriction, onClick: this.downloadSDAR,
              filename: 'machine-readable-DAR.json',
              value: mrDAR, className: "italic hover-color"
            }, ["Download DAR machine-readable format"]),
          ]),

          div({ isRendered: darInfo.hasPurposeStatements && darInfo.purposeStatements !== undefined, className: "row dar-summary" }, [

            div({ className: "control-label access-color" }, ["Purpose Statement"]),
            div({ className: "response-label" }, [
              ul({}, [
                darInfo.purposeStatements.map((purpose, rIndex) => {
                  return h(Fragment, { key: 'purpose_' + rIndex }, [
                    li({ className: purpose.manualReview ? 'cancel-color' : '' }, [
                      b({}, [purpose.title]), purpose.description
                    ])
                  ]);
                })
              ]),
              div({ isRendered: darInfo.purposeManualReview && !darInfo.researchTypeManualReview, className: "dar-summary" }, [
                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 alert-danger cancel-color" }, [
                  "This research involves studying a sensitive population and requires manual review."
                ]),
              ]),
            ]),

            div({ className: "row dar-summary" }, [
              div({ className: "control-label access-color" }, ["Type of Research"]),
              div({ className: "response-label" }, [
                ul({}, [
                  darInfo.researchType.map((type, rIndex) => {
                    return h(Fragment, { key: 'type_' + rIndex }, [
                      li({ className: type.manualReview ? 'cancel-color' : '' }, [
                        b({}, [type.title]), type.description
                      ]),
                    ]);
                  })
                ]),
              ]),
            ]),

            div({ isRendered: darInfo.researchTypeManualReview, className: "row dar-summary" }, [
              div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 alert-danger cancel-color" }, [
                "This research requires manual review."
              ]),
            ]),

            div({ isRendered: darInfo.hasDiseases, className: "row dar-summary" }, [
              div({ className: "control-label access-color" }, ["Disease area(s)"]),
              div({ className: "response-label" }, [
                ul({}, [
                  darInfo.diseases.map((disease, rIndex) => {
                    return h(Fragment, { key: 'disease_' + rIndex }, [
                      li({}, [
                        disease
                      ]),
                    ]);
                  })
                ]),
              ]),
            ]),
            div({ isRendered: darInfo.havePI, className: "row no-margin" }, [
              label({ className: "control-label access-color" }, ["Principal Investigator: "]),
              span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [darInfo.pi]),
            ]),

            div({ className: "row no-margin" }, [
              label({ className: "control-label access-color" }, ["Researcher: "]),
              span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [darInfo.profileName]),
              div({ className: "row no-margin" }, [
                label({ className: "control-label no-padding" }, ["Status: "]),
                span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [darInfo.status]),
                span({ isRendered: darInfo.hasAdminComment }, [
                  label({ className: "control-label no-padding" }, [" - Comment: "]),
                  span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [darInfo.adminComment]),
                ]),
              ]),
            ]),
            div({ className: "row no-margin" }, [
              label({ className: "control-label access-color" }, ["Institution: "]),
              span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [darInfo.institution]),
            ]),
            div({ className: "row no-margin" }, [
              label({ className: "control-label access-color" }, ["Department: "]),
              span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [darInfo.department]),
            ]),
            div({ className: "row no-margin" }, [
              label({ className: "control-label access-color" }, ["City: "]),
              span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [darInfo.city]),
            ]),
            div({ className: "row no-margin" }, [
              label({ className: "control-label access-color" }, ["Country: "]),
              span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [darInfo.country]),
            ]),
            button({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12 btn download-pdf hover-color", onClick: this.downloadDAR }, ["Download Full Application"]),
          ]),
        ]),
      ])

    );
  }

  renderDataUseLimitation(sDUL, mrDUL) {

    return (
      div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [

        div({ className: "panel-heading cm-boxhead dul-color" }, [
          h4({}, ["Data Use Limitations"]),
        ]),
        div({ id: "dul", className: "panel-body cm-boxbody" }, [
          div({ className: "row no-margin" }, [
            button({ id: "btn_downloadDataUseLetter", className: "col-lg-6 col-md-6 col-sm-6 col-xs-12 btn download-pdf hover-color", onClick: this.downloadDUL }, ["Download Data Use Letter"]),
          ]),
          div({ className: "row dar-summary" }, [
            div({ className: "control-label dul-color" }, ["Structured Limitations"]),
            div({ className: "panel-body cm-boxbody translated-restriction", dangerouslySetInnerHTML: { __html: sDUL } }, []),
            a({ id: "btn_downloadSDul", onClick: this.downloadSDUL, filename: 'machine-readable-DUL.json', value: mrDUL, className: "italic hover-color" }, ["Download DUL machine-readable format"]),
          ]),
        ]),
      ])
    );
  }

  renderCollectResultBox1(hasUseRestriction, finalDACVote) {
    if (finalDACVote === null || finalDACVote === undefined) {
      finalDACVote = {
        finalVote: null,
        finalRationale: null
      };
    }

    return (
      div({
        className: hasUseRestriction ? "col-lg-6 col-md-6 col-sm-12 col-xs-12"
          : "col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-12 col-xs-12"
      }, [
          CollectResultBox({
            id: "finalAccessRecordResult",
            title: hasUseRestriction ? "Q1. Did the DAC grant this researcher permission to access the data?"
              : "Did the DAC grant this researcher permission to access the data?",
            color: "access",
            type: "records",
            class: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
            vote: finalDACVote.finalVote,
            voteDate: finalDACVote.finalVoteDate,
            rationale: finalDACVote.finalRationale
          }),
        ])
    );
  }

  renderCollectResultBox2(hasUseRestriction, voteAgreement) {
    if (voteAgreement === null || voteAgreement === undefined) {
      voteAgreement = {};
    }

    return (
      div({ isRendered: hasUseRestriction, className: "col-lg-6 col-md-6 col-sm-12 col-xs-12" }, [
        CollectResultBox({
          id: "finalAgreementRecordResult",
          title: "Q2. Was the DAC decision consistent with the DUOS Matching Algorithm decision?",
          color: "access",
          type: "records",
          class: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
          vote: voteAgreement.vote,
          voteDate: voteAgreement.createDate,
          rationale: voteAgreement.finalRationale
        }),
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
        id: "accessRecordResult",
        title: "DAC Decision",
        color: "access",
        class: "col-lg-7 col-md-7 col-sm-12 col-xs-12",
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
        id: "rpRecordResult",
        title: "DAC Decision",
        color: "access",
        class: "col-lg-8 col-md-8 col-sm-12 col-xs-12",
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
        id: "dulRecordResult",
        title: "DAC Decision",
        color: "dul",
        class: "col-lg-8 col-md-8 col-sm-12 col-xs-12",
        vote: election.finalVote,
        voteDate: election.finalVoteDate,
        rationale: election.finalRationale,
        chartData: chartData
      })
    );
  }

  //------------------------
  async loadData() {
    // formerly resolved on route ....
    const referenceId = this.props.match.params.referenceId;
    console.log("referenceId: ", referenceId);

    const electionId = this.props.match.params.electionId;
    console.log("electionId: ", electionId);

    const darElection = await Election.findElectionById(electionId);
    console.log("darElection: ", darElection);

    const hasUseRestriction_obj = await DAR.hasUseRestriction(referenceId);
    const hasUseRestriction = hasUseRestriction_obj.hasUseRestriction;

    console.log("hasUseRestriction: ", referenceId, electionId, hasUseRestriction, darElection);

    const finalDACVote = await Votes.getDarFinalAccessVote(electionId);
    console.log("finalDACVote", finalDACVote);

    const darInfo = await DAR.describeDar(darElection.referenceId);
    if (darInfo.purposeStatements === undefined) {
      darInfo.purposeStatements = [];
    }
    console.log("darInfo: ", darInfo);

    this.setState({
      loading: true,
      electionId: electionId,
      referenceId: referenceId,
      hasUseRestriction,
      finalDACVote: finalDACVote,
      darInfo: darInfo
    });

    const data = await Election.findDataAccessElectionReview(electionId, false); //.then(
    //----------
    // data => {
    await this.showDarData(data);

    const data2 = await Election.findRPElectionReview(electionId, false)
    // .then(data2 => {
    if (data2.election !== undefined) {
      console.log('data2.election !== undefined', data2);
      let electionRP = data2.election;
      if (data2.election.finalRationale === null) {
        electionRP.finalRationale = '';
      }
      this.setState({
        electionRP: electionRP,
        statusRP: data2.election.status,
        rpVoteAccessList: this.chunk(data2.reviewVote, 2),
        chartRP: this.getGraphData(data2.reviewVote),
        showRPaccordion: true
      });
    } else {
      console.log('data2.election === undefined', data2);
      this.setState({
        showRPaccordion: false
      });
    }

    const data3 = await Election.findElectionReviewById(data.associatedConsent.electionId, data.associatedConsent.consentId)
    // .then(data3 => {
    this.setState({
      electionReview: data3
    })
    await this.showDULData(data3);

    this.vaultVote(data3.consent.consentId);
    // });


    // });


    //--------------------
    // });
  }

  async showDarData(electionReview) {
    console.log('------------------showDarData(electionReview)-------------------------', electionReview);
    const dar = await DAR.getDarFields(electionReview.election.referenceId, "rus")
    let tmp = await DAR.getDarFields(electionReview.election.referenceId, "dar_code");
    const darCode = tmp.dar_code;

    tmp = await DAR.getDarFields(electionReview.election.referenceId, "projectTitle");
    const projectTitle = tmp.projectTitle;

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
    const sDAR = electionReview.election.translatedUseRestriction;

    this.setState({
      // dar: {
      dar: dar,
      darCode: darCode,
      projectTitle: projectTitle,
      electionAccess: electionAccess,
      status: status,
      voteAccessList: voteAccessList,
      chartDataAccess: chartDataAccess,
      voteAgreement: voteAgreement,
      sDAR: sDAR,
      mrDAR: mrDAR
      // }
    });
  }

  async showDULData(electionReview) {
    let election = electionReview.election;
    if (electionReview.election.finalRationale === null) {
      election.finalRationale = '';
    }
    this.setState({
      // dul: {
      election: election,
      downloadUrl: await Config.getApiUrl() + 'consent/' + electionReview.consent.consentId + '/dul',
      dulName: electionReview.election.dulName,
      status: electionReview.election.status,
      voteList: this.chunk(electionReview.reviewVote, 2),
      chartDataDUL: this.getGraphData(electionReview.reviewVote),
      mrDUL: JSON.stringify(electionReview.election.useRestriction, null, 2),
      sDUL: electionReview.election.translatedUseRestriction
      // }
    }, () => {
      console.log('-------------------------showDULData--------------------------------------------', electionReview, this.state);
    });
  }

  async vaultVote(consentId) {
    const data = await Match.findMatch(consentId, this.state.electionAccess.referenceId)

    if (data.failed !== null && data.failed !== undefined && data.failed) {
      this.setState({
        hideMatch: false,
        match: "-1",
        createDate: data.createDate,
        loading: false
      })
    } else if (data.match !== null && data.match !== undefined) {

      this.setState({
        hideMatch: false,
        match: data.match,
        createDate: data.createDate,
        loading: false
      });

    } else {

      this.setState({
        hideMatch: true,
        loading: false
      });
    }

  }

}

export default AccessResultRecords;

