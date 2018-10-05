import { Component, Fragment } from 'react';
import { div, button, span, b, a, i, hr, h4, ul, li, label, h3, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { SingleResultBox } from '../components/SingleResultBox';
import { CollectResultBox } from '../components/CollectResultBox';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { Storage } from '../libs/storage';
import { DAR, Election, Votes, Match } from '../libs/ajax';
import { Alert } from '../components/Alert';

class AccessResultRecords extends Component {

  apiUrl = '';

  constructor(props) {
    super(props);
    this.state = this.initialState();
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    console.log(nextProps, prevState);

    // this.setState(prev => {
    //   prev.currentUser = Storage.getCurrentUser()
    //   return prev;
    // });

    //  this.initState().then(
    //    data => {
    //      return data;
    //    }
    //  );

    return {};
  }

  componentDidMount() {
    this.initState();
  }

  async initState() {

    let hideMatch = false;
    let match = "-1";
    let createDate = null;
    let election;
    let downloadUrl;
    let dulName;
    let status;
    let voteList;
    let chartDataDUL;
    let mrDUL;
    let sDUL;
    let darElectionReview = {};
    let daer = {};
    let finalDACVote;
    let rpeReview = {};
    let electionReview;

    // formerly resolved on route ....
    const referenceId = this.props.match.params.referenceId;
    console.log("referenceId: ", referenceId);

    const electionId = this.props.match.params.electionId;
    console.log("electionId: ", electionId);

    const darElection = await Election.findElectionById(electionId);
    console.log("darElection: ", darElection);

    const hasUseRestriction_obj = await DAR.hasUseRestriction(referenceId);
    const hasUseRestriction = hasUseRestriction_obj.hasUseRestriction;
    console.log("hasUseRestriction: ", hasUseRestriction, hasUseRestriction_obj.hasUseRestriction);

    const oneAtATime = false;
    const darInfo = await DAR.describeDar(darElection.referenceId);
    console.log("darInfo: ", darInfo);

    finalDACVote = await Votes.getDarFinalAccessVote(electionId);
    console.log("finalDACVote", finalDACVote);

    daer = await Election.findDataAccessElectionReview(electionId, false);
    console.log("daer", daer);

    darElectionReview.dar = await DAR.getDarFields(daer.election.referenceId, "rus")
    console.log("darElectionReview.dar", darElectionReview.dar);

    DAR.getDarFields(daer.election.referenceId, "dar_code").then(function (data) {
      darElectionReview.darCode = data.dar_code;
      console.log("darElectionReview.darCode", darElectionReview.darCode);
    });

    DAR.getDarFields(daer.election.referenceId, "projectTitle").then(function (data) {
      darElectionReview.projectTitle = data.projectTitle;
      console.log("darElectionReview.projectTitle", darElectionReview.projectTitle);
    });

    darElectionReview.electionAccess = daer.election;
    if (daer.election.finalRationale === null) {
      darElectionReview.electionAccess.finalRationale = '';
    }
    darElectionReview.status = daer.election.status;
    darElectionReview.voteAccessList = this.chunk(daer.reviewVote, 2);
    darElectionReview.chartDataAccess = this.getGraphData(daer.reviewVote);
    darElectionReview.voteAgreement = daer.voteAgreement;

    darElectionReview.mrDAR = JSON.stringify(daer.election.useRestriction, null, 2);
    darElectionReview.sDAR = daer.election.translatedUseRestriction;

    let data2 = await Election.findRPElectionReview(electionId, false);
    if (data2 === null || data2 === undefined) data2 = {};
    console.log("data2", data2);

    if (data2.election !== undefined) {
      rpeReview.electionRP = data2.election;
      if (data2.election.finalRationale === null) {
        rpeReview.electionRP.finalRationale = '';
      }
      rpeReview.statusRP = data2.election.status;
      rpeReview.rpVoteAccessList = this.chunk(data2.reviewVote, 2);
      rpeReview.chartRP = this.getGraphData(data2.reviewVote);
      rpeReview.showRPaccordion = true;
    } else {
      rpeReview.showRPaccordion = false;
    }

    electionReview = await Election.findElectionReviewById(daer.associatedConsent.electionId, daer.associatedConsent.consentId);
    console.log("electionReview: ", electionReview);

    election = electionReview.election;
    if (electionReview.election.finalRationale === null) {
      election.finalRationale = '';
    }
    downloadUrl = this.apiUrl + 'consent/' + electionReview.consent.consentId + '/dul';
    dulName = electionReview.election.dulName;
    status = electionReview.election.status;
    voteList = this.chunk(electionReview.reviewVote, 2);
    chartDataDUL = this.getGraphData(electionReview.reviewVote);
    mrDUL = JSON.stringify(electionReview.election.useRestriction, null, 2);
    sDUL = electionReview.election.translatedUseRestriction;

    const data4 = await Match.findMatch(electionReview.consent.consentId, darElectionReview.electionAccess.referenceId);
    if (data4.failed !== null && data4.failed !== undefined && data4.failed) {
      hideMatch = false;
      match = "-1";
      createDate = data4.createDate;
    } else if (data4.match !== null && data4.match !== undefined) {
      hideMatch = false;
      match = data4.match;
      createDate = data4.createDate;
    } else {
      hideMatch = true;
    }

    this.setState({
      currentUser: Storage.getCurrentUser(),
      voteStatus: status,
      createDate: createDate,
      enableFinalButton: false,
      enableAgreementButton: false,
      hasUseRestriction: hasUseRestriction,
      projectTitle: darElectionReview.projectTitle,
      dar: darElectionReview.dar,
      darCode: darElectionReview.darCode,
      isQ1Expanded: false,
      isQ2Expanded: false,
      isDulExpanded: false,
      match: true,
      election: election,
      electionAccess: darElectionReview.electionAccess,
      electionRP: rpeReview,
      voteAgreement: darElectionReview.voteAgreement,
      voteList: voteList,
      voteAccessList: darElectionReview.voteAccessList,
      rpVoteAccessList: rpeReview.rpVoteAccessList,
      darInfo: darInfo,
      loading: false
    },
      () => {
        console.log('----------------------------------------------------------------------------------------------------');
        console.log(JSON.stringify(this.state, null, 2));
        console.log('----------------------------------------------------------------------------------------------------');
      });

    // $scope.downloadDUL = function () {
    //   cmFilesService.getDULFile($scope.electionReview.consent.consentId, $scope.electionReview.election.dulName);
    // };

    // $scope.back = function () {
    //   $state.go($rootScope.pathFrom);
    //   $rootScope.pathFrom = undefined;
    // };
    // $scope.download = downloadFileService.downloadFile;

    // $scope.downloadDAR = function () {
    //   cmFilesService.getDARFile($scope.darElection.referenceId);
    // };

  }


  initialState() {
    return {
      loading: true,
      voteStatus: '1',
      createDate: '',
      enableFinalButton: false,
      enableAgreementButton: false,
      hasUseRestriction: true,
      projectTitle: '',
      darCode: '',
      isQ1Expanded: false,
      isQ2Expanded: false,
      isDulExpanded: false,
      match: true,
      election: {
        finalVote: '0',
        finalRationale: '',
        finalVoteDate: '2018-08-30'
      },
      electionAccess: {
        finalVote: '0',
        finalRationale: 'lalala',
        finalVoteDate: '2018-08-31'
      },
      electionRP: {
        finalVote: '0',
        finalRationale: '',
        finalVoteDate: '2018-08-30'
      },
      voteAgreement: {
        vote: '0',
        rationale: '',
      },
      voteList: [],
      voteAccessList: [],
      rpVoteAccessList: [],
      darInfo: {
        havePI: true,
        pi: '',
        profileName: '',
        status: '',
        hasAdminComment: true,
        adminComment: '',
        institution: '',
        department: '',
        city: '',
        country: '',
        purposeManualReview: true,
        researchTypeManualReview: true,
        hasDiseases: true,
        purposeStatements: [],
        researchType: [],
        diseases: []
      }
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
    var chartData = {
      'Total': [
        ['Results', 'Votes'],
        ['YES', yes],
        ['NO', no],
        ['Pending', empty]
      ]
    };
    return chartData;
  }

  downloadSDUL = (e) => {
    console.log('-------------------downloadSDUL---------------------');
    // const filename = e.target.getAttribute('filename');
    // const value = e.target.getAttribute('value');
  }

  downloadSDAR = (e) => {
    console.log('-------------------downloadSDAR---------------------');
    // const filename = e.target.getAttribute('filename');
    // const value = e.target.getAttribute('value');
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

  render() {

    console.log('-------------------------------------------render---------------------------------------------------------');
    console.log(JSON.stringify(this.state, null, 2));
    console.log('----------------------------------------------------------------------------------------------------');

    const { loading, projectTitle, darCode, dar, darInfo } = this.state;

    if (loading) {
      return h3({}, [" Cargando datos ...."]);
    }
    const consentData = span({ className: "consent-data" }, [
      b({ className: "pipe" }, [projectTitle]), darCode
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
          div({ className: "col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding" }, [
            a({ id: "btn_back", href: "/chair_console", className: "btn-primary btn-back" }, [
              i({ className: "glyphicon glyphicon-chevron-left" }), "Back"
            ])
          ]),
        ]),

        div({ className: "accordion-title access-color" }, [
          "Did the DAC grant this researcher permission to access the data?"
        ]),
        hr({ className: "section-separator" }),

        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [

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
                div({ className: "response-label" }, [darInfo.sDar]),
                a({
                  isRendered: this.state.hasUseRestriction, onClick: this.downloadSDAR,
                  filename: 'machine-readable-DAR.json',
                  value: "mrDAR", className: "italic hover-color"
                }, ["Download DAR machine-readable format"]),
              ]),

              div({ isRendered: darInfo.hasPurposeStatements && darInfo.purposeStatements !== undefined, className: "row dar-summary" }, [
                div({ className: "control-label access-color" }, ["Purpose Statement"]),
                div({ className: "response-label" }, [
                  ul({}, [
                    darInfo.purposeStatements.map((purpose, rIndex) => {
                      return h(Fragment, {}, [
                        li({ className: purpose.manualReview ? 'cancel-color' : '' }, [
                          b({}, [purpose.title]), purpose.description
                        ])
                      ]);
                    })
                  ]),
                  div({ isRendered: darInfo.purposeManualReview && !darInfo.researchTypeManualReview, className: "summary-alert" }, [
                    Alert({ id: "purposeStatementManualReview", type: "danger", title: "This research involves studying a sensitive population and requires manual review." })
                  ])
                ]),

                div({ className: "row dar-summary" }, [
                  div({ className: "control-label access-color" }, ["Type of Research"]),
                  div({ className: "response-label" }, [
                    ul({}, [
                      darInfo.researchType.map((type, rIndex) => {
                        return h(Fragment, {}, [
                          li({ className: type.manualReview ? 'cancel-color' : '' }, [
                            b({}, [type.title]), type.description
                          ]),
                        ]);
                      })
                    ])
                  ])
                ]),
                div({ isRendered: darInfo.researchTypeManualReview, className: "summary-alert" }, [
                  Alert({ id: "researchTypeManualReview", type: "danger", title: "This research requires manual review." })
                ]),

                div({ isRendered: darInfo.hasDiseases, className: "row dar-summary" }, [
                  div({ className: "control-label access-color" }, ["Disease area(s)"]),
                  div({ className: "response-label" }, [
                    ul({}, [
                      darInfo.diseases.map((disease, rIndex) => {
                        return h(Fragment, {}, [
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
                button({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color", onClick: this.downloadDAR }, ["Download Full Application"]),
              ]),
            ]),
          ]),
          //---------------------------------
          div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [

            div({ className: "panel-heading cm-boxhead dul-color" }, [
              h4({}, ["Data Use Limitations"]),
            ]),
            div({ id: "dul", className: "panel-body cm-boxbody" }, [
              div({ className: "row no-margin" }, [
                button({ id: "btn_downloadDataUseLetter", className: "col-lg-6 col-md-6 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color", onClick: this.downloadDUL }, ["Download Data Use Letter"]),
              ]),
              div({ className: "row dar-summary" }, [
                div({ className: "control-label dul-color" }, ["Structured Limitations"]),
                div({ className: "response-label" }, ["sDul"]),
                a({ id: "btn_downloadSDul", onClick: this.downloadSDUL, filename: 'machine-readable-DUL.json', value: "mrDUL", className: "italic hover-color" }, ["Download DUL machine-readable format"]),
              ]),
            ]),
          ]),
          //-------------------------------

        ]),
        hr({ className: "section-separator" }),

        div({ className: "row no-margin" }, [
          div({
            className: this.state.hasUseRestriction ? "col-lg-6 col-md-6 col-sm-12 col-xs-12"
              : "col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-12 col-xs-12"
          }, [
              CollectResultBox({
                id: "finalAccessRecordResult",
                title: this.state.hasUseRestriction ? "Q1. Did the DAC grant this researcher permission to access the data?"
                  : "Did the DAC grant this researcher permission to access the data?",
                color: "access",
                type: "records",
                class: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
                vote: this.state.electionAccess.finalVote,
                voteDate: this.state.electionAccess.finalVoteDate,
                rationale: this.state.electionAccess.finalRationale
              }),
            ]),

          div({ isRendered: this.state.hasUseRestriction, className: "col-lg-6 col-md-6 col-sm-12 col-xs-12" }, [
            CollectResultBox({
              id: "finalAgreementRecordResult",
              title: "Q2. Was the DAC decision consistent with the DUOS Matching Algorithm decision?",
              color: "access",
              type: "records",
              class: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
              vote: this.state.voteAgreement.vote,
              voteDate: this.state.voteAgreement.createDate,
              rationale: this.state.electionAccess.finalRationale
            }),
          ]),
        ]),

        //---------------------------------------------------------/

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
                CollectResultBox({
                  id: "accessRecordResult",
                  title: "DAC Decision",
                  color: "access",
                  class: "col-lg-7 col-md-7 col-sm-12 col-xs-12",
                  vote: this.state.electionAccess.finalVote,
                  voteDate: this.state.electionAccess.finalVoteDate,
                  rationale: this.state.electionAccess.finalRationale,
                  chartData: [
                    ['Results', 'Votes'],
                    ['Yes', 90],
                    ['No', 110]
                  ]
                }),

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
                          span({ isRendered: this.state.match === null }, []),
                          span({ className: "cancel-color", isRendered: this.state.match === '-1' }, [
                            "Automated Vote System Failure. Please report this issue via the \"Request Help\" link"
                          ]),
                        ]),
                      ]),
                      div({ className: "row" }, [
                        label({ className: "col-lg-3 col-md-3 col-sm-2 col-xs-4 control-label vote-label access-color" }, ["Date: "]),
                        div({ id: "lbl_dateMatch", className: "col-lg-9 col-md-9 col-sm-3 col-xs-3 vote-label" }, [this.state.createDate /* | date:dateFormat */]),
                      ]),
                    ]),
                  ]),
              ]),

              this.state.voteAccessList.map((row, rIndex) => {
                return h(Fragment, {}, [
                  div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                    row.map((vm, vIndex) => {
                      return h(Fragment, {}, [
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
            ]),


          //---------------------------------------------------------/

          CollapsiblePanel({
            isRendered: "showRPaccordion",
            id: "rpRecordVotes",
            onClick: this.toggleQ2,
            color: 'access',
            title: "Q2. Was the research purpose accurately converted to a structured format?",
            expanded: this.state.isQ2Expanded
          }, [

              div({ className: "row no-margin" }, [
                CollectResultBox({
                  id: "rpRecordResult",
                  title: "DAC Decision",
                  color: "access",
                  class: "col-lg-8 col-md-8 col-sm-12 col-xs-12",
                  vote: this.state.electionRP.finalVote,
                  voteDate: this.state.electionRP.finalVoteDate,
                  rationale: this.state.electionRP.finalRationale,
                  chartData: [
                    ['Results', 'Votes'],
                    ['Yes', 90],
                    ['No', 110]
                  ]
                })
              ]),

              this.state.rpVoteAccessList.map((row, rIndex) => {
                return h(Fragment, {}, [
                  div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                    row.map((vm, vIndex) => {
                      return h(Fragment, {}, [
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
            ]),

          //---------------------------------------------------------/

          CollapsiblePanel({
            id: "dulRecordVotes",
            onClick: this.toggleDulExpanded,
            color: 'dul',
            title: "Were the data use limitations in the Data Use Letter accurately converted to structured limitations?",
            expanded: this.state.isDULExpanded
          }, [

              div({ className: "row no-margin" }, [
                CollectResultBox({
                  id: "dulRecordResult",
                  title: "DAC Decision",
                  color: "dul",
                  class: "col-lg-8 col-md-8 col-sm-12 col-xs-12",
                  vote: this.state.election.finalVote,
                  voteDate: this.state.election.finalVoteDate,
                  rationale: this.state.election.finalRationale,
                  chartData: [
                    ['Results', 'Votes'],
                    ['Yes', 90],
                    ['No', 110]
                  ]
                })
              ]),


              this.state.voteList.map((row, rIndex) => {
                return h(Fragment, {}, [
                  div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                    row.map((vm, vIndex) => {
                      return h(Fragment, {}, [
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
            ]),
        ])
      ])
    );
  }
}

export default AccessResultRecords;
