import { Component, Fragment } from 'react';
import { div, button, span, b, a, i, hr, h4, ul, li, label, h3, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { SingleResultBox } from '../components/SingleResultBox';
import { CollectResultBox } from '../components/CollectResultBox';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { Storage } from '../libs/storage';
import { DAR, Election, Votes, Match } from '../libs/ajax';

class AccessResultRecords extends Component {

  apiUrl = '';

  constructor(props) {
    super(props);
    this.state = this.initialState();
  }

  componentWillMount() {
    this.setState(prev => {
      prev.currentUser = Storage.getCurrentUser()
      return prev;
    });

    this.initState();
  }

  // async initState() {

  //   const referenceId = this.props.match.params.referenceId;

  //   // formerly resolved on route ....
  //   const electionId = this.props.match.params.electionId;
  //   const darElection = Election.findElectionById(electionId);
  //   const hasUseRestriction = DAR.hasUseRestriction(referenceId);

  //   const oneAtATime = false;

  //   const darInfo = await DAR.describeDar(darElection.referenceId)
  //   const finalDACVote = await Votes.getDarFinalAccessVote(electionId)

  //   let statusRP;
  //   let rpVoteAccessList = [];
  //   let chartRP = [];
  //   let showRPaccordion = false;

  //   const darElectionReview = await Election.findDataAccessElectionReview(electionId, false);

  //   const dar = await DAR.getDarFields(darElectionReview.election.referenceId, "rus");
  //   const darCode = await DAR.getDarFields(darElectionReview.election.referenceId, "dar_code").dar_code;
  //   const darFields = await DAR.getDarFields(darElectionReview.election.referenceId, "projectTitle");
  //   const projectTitle = darFields.projectTitle;
  //   const electionAccess = darElectionReview.election;

  //   if (darElectionReview.election.finalRationale === null) {
  //     electionAccess.finalRationale = '';
  //   }
  //   const status = darElectionReview.election.status;
  //   const voteAccessList = this.chunk(darElectionReview.reviewVote, 2);
  //   const chartDataAccess = this.getGraphData(darElectionReview.reviewVote);
  //   const voteAgreement = darElectionReview.voteAgreement;

  //   // this data is used to construct structured_ files
  //   const mrDAR = JSON.stringify(darElectionReview.election.useRestriction, null, 2);
  //   const sDAR = darElectionReview.election.translatedUseRestriction;

  //   //    function createMarkup() { return {__html: 'First &middot; Second'}; };
  //   // <div dangerouslySetInnerHTML={createMarkup()} />

  //   let electionRP = {};

  //   const rpElectionReview = Election.findRPElectionReview(electionId, false)
  //   if (rpElectionReview.election !== undefined) {
  //     electionRP = rpElectionReview.election;
  //     if (rpElectionReview.election.finalRationale === null) {
  //       electionRP.finalRationale = '';
  //     }
  //     statusRP = rpElectionReview.election.status;
  //     rpVoteAccessList = this.chunk(rpElectionReview.reviewVote, 2);
  //     chartRP = this.getGraphData(rpElectionReview.reviewVote);
  //     showRPaccordion = true;
  //   } else {
  //     showRPaccordion = false;
  //   }


  //   const electionReview = Election.findElectionReviewById(darElectionReview.associatedConsent.electionId,
  //     darElectionReview.associatedConsent.consentId)
  //   // .then(data => {
  //   // electionReview = data;
  //   // this.showDULData(data);

  //   const election = electionReview.election;
  //   if (electionReview.election.finalRationale === null) {
  //     election.finalRationale = '';
  //   }

  //   const downloadUrl = this.apiUrl + 'consent/' + electionReview.consent.consentId + '/dul';
  //   const dulName = electionReview.election.dulName;
  //   const status = electionReview.election.status;
  //   const voteList = this.chunk(electionReview.reviewVote, 2);
  //   const chartDataDUL = this.getGraphData(electionReview.reviewVote);
  //   const mrDUL = JSON.stringify(electionReview.election.useRestriction, null, 2);
  //   const sDUL = electionReview.election.translatedUseRestriction;


  //   this.vaultVote(darElectionReview.consent.consentId);
  //   // })

  //   // });

  //   this.setState(prev => {

  //     prev.isQ1Expanded = false;
  //     prev.isQ2Expanded = false;
  //     prev.isDulExpanded = false;

  //     prev.createDate = '2018-08-30';
  //     prev.enableFinalButton = true;
  //     prev.enableAgreementButton = true;

  //     //--------------------------------------
  //     prev.oneAtATime = oneAtATime;
  //     prev.referenceId = referenceId;
  //     prev.electionID = electionId;
  //     prev.darElection = darElection;
  //     prev.hasUseRestriction = hasUseRestriction;
  //     prev.darInfo = darInfo;
  //     prev.finalDACVote = finalDACVote;
  //     prev.statusRP = statusRP;
  //     prev.rpVoteAccessList = rpVoteAccessList;
  //     prev.chartRP = chartRP;
  //     prev.showRPaccordion = showRPaccordion;
  //     prev.electionReview = electionReview;

  //     //-------------------

  //     prev.projectTitle = projectTitle;
  //     prev.darCode = darCode;
  //     prev.match = '-1';
  //     prev.election = election;
  //     prev.electionAccess = electionAccess;
  //     prev.electionRP = electionRP;
  //     prev.voteAgreement = voteAgreement;
  //     return prev;
  //   });
  // }

  async initState() {

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

    // if (electionId === null) {
    //   this.props.history.push('reviewed_cases');
    // }

    //-----
    finalDACVote = await Votes.getDarFinalAccessVote(electionId);
    console.log("finalDACVote", finalDACVote);

    daer = await Election.findDataAccessElectionReview(electionId, false);
    console.log("daer", daer);
    // showAccessData(data);
    //--------------------
    // function showAccessData(electionReview) {

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


    // this data is used to construct structured_ files
    darElectionReview.mrDAR = JSON.stringify(daer.election.useRestriction, null, 2);
    darElectionReview.sDAR = daer.election.translatedUseRestriction;

    // }

    //....................

    let data2 = await Election.findRPElectionReview(electionId, false);
    if (data2 === null || data2 === undefined) data2 = {};
    console.log("data2",data2);

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

    //------------------------------------


    this.setState({
      voteStatus: status,
      createDate: createDate,
      enableFinalButton: false,
      enableAgreementButton: false,
      hasUseRestriction: hasUseRestriction,
      projectTitle: darElectionReview.projectTitle,
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
    },
      () => { console.log(this.state) });

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


  // async showAccessData(electionReview) {
  //   const dar = await DAR.getDarFields(electionReview.election.referenceId, "rus");
  //   const darCode = await DAR.getDarFields(electionReview.election.referenceId, "dar_code").dar_code;
  //   const darFields = await DAR.getDarFields(electionReview.election.referenceId, "projectTitle");
  //   const projectTitle = darFields.projectTitle;
  //   const electionAccess = electionReview.election;

  //   if (electionReview.election.finalRationale === null) {
  //     electionAccess.finalRationale = '';
  //   }
  //   const status = electionReview.election.status;
  //   const voteAccessList = this.chunk(electionReview.reviewVote, 2);
  //   const chartDataAccess = this.getGraphData(electionReview.reviewVote);
  //   const voteAgreement = electionReview.voteAgreement;

  //   // this data is used to construct structured_ files
  //   const mrDAR = JSON.stringify(electionReview.election.useRestriction, null, 2);
  //   const sDAR = electionReview.election.translatedUseRestriction;

  //   //    function createMarkup() { return {__html: 'First &middot; Second'}; };
  //   // <div dangerouslySetInnerHTML={createMarkup()} />
  // }

  // showDULData(electionReview) {
  //   const election = electionReview.election;
  //   if (electionReview.election.finalRationale === null) {
  //     election.finalRationale = '';
  //   }
  //   const downloadUrl = this.apiUrl + 'consent/' + electionReview.consent.consentId + '/dul';
  //   const dulName = electionReview.election.dulName;
  //   const status = electionReview.election.status;
  //   const voteList = this.chunk(electionReview.reviewVote, 2);
  //   const chartDataDUL = this.getGraphData(electionReview.reviewVote);
  //   const mrDUL = JSON.stringify(electionReview.election.useRestriction, null, 2);
  //   const sDUL = electionReview.election.translatedUseRestriction;
  // }

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
    const filename = e.target.getAttribute('filename');
    const value = e.target.getAttribute('value');
  }

  downloadSDAR = (e) => {
    console.log('-------------------downloadSDAR---------------------');
    const filename = e.target.getAttribute('filename');
    const value = e.target.getAttribute('value');
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

  // $scope.openApplication = function openApplication() {
  //     $scope.electionStatus = 'Closed';
  //     var modalInstance = $modal.open({
  //         animation: false,
  //         templateUrl: 'app/modals/application-summary-modal/application-summary-modal.html',
  //         controller: 'ApplicationModal',
  //         controllerAs: 'ApplicationModal',
  //         scope: $scope,
  //         resolve: {
  //             darDetails: function () {
  //                 return cmRPService.getDarModalSummary($scope.darElection.referenceId);
  //             },
  //             dar_id: function(){
  //                 return $scope.darElection.referenceId;
  //             },
  //             calledFromAdmin: function() {
  //                 return false;
  //             }
  //         }
  //     });
  //     modalInstance.result.then(function () {
  //         init();
  //     });
  // };

  render() {

    console.log('----------------------------------------------------------------------------------------------------');
    console.log(JSON.stringify(this.state, null, 2));
    // let vote = {
    //   vote: null,
    //   rationale: ''
    // }

    // let alertsDAR = [
    //   { title: "Alert 01" },
    //   { title: "Alert 02" },
    // ];

    // let alertsAgree = [
    //   { title: "Alert Agree 01" },
    //   { title: "Alert Agree 02" },
    // ];

    // let alertOn = null;

    const { projectTitle, darCode } = this.state;

    const consentData = span({ className: "consent-data" }, [
      b({ className: "pipe" }, [projectTitle]), darCode
    ]);

    return (

      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding" }, [
            PageHeading({ id: "recordAccess", imgSrc: "/images/icon_access.png", iconSize: "medium", color: "access", title: "Data Access - Results Record", description: consentData }),
          ]),
          div({ className: "col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding" }, [
            a({ id: "btn_back", href: "/chair_console", className: "btn vote-button vote-button-back vote-button-bigger" }, [
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
                div({ className: "response-label" }, [this.state.darInfo.rus]),
              ]),

              div({ className: "row dar-summary" }, [
                div({ className: "control-label access-color" }, ["Structured Research Purpose"]),
                div({ className: "response-label" }, [this.state.darInfo.sDar]),
                a({
                  isRendered: this.state.hasUseRestriction, onClick: this.downloadSDAR,
                  filename: 'machine-readable-DAR.json',
                  value: "mrDAR", className: "italic hover-color"
                }, ["Download DAR machine-readable format"]),
              ]),

              div({ isRendered: this.state.darInfo.hasPurposeStatements && this.state.darInfo.purposeStatements !== undefined, className: "row dar-summary" }, [
                div({ className: "control-label access-color" }, ["Purpose Statement"]),
                div({ className: "response-label" }, [
                  ul({}, [
                    this.state.darInfo.purposeStatements.map((purpose, rIndex) => {
                      return h(Fragment, {}, [
                        li({ className: purpose.manualReview ? 'cancel-color' : '' }, [
                          b({}, [purpose.title]), purpose.description
                        ])
                      ]);
                    })
                  ]),
                  div({ isRendered: this.state.darInfo.purposeManualReview && !this.state.darInfo.researchTypeManualReview, className: "dar-summary" }, [
                    div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 alert-danger cancel-color" }, [
                      "This research involves studying a sensitive population and requires manual review."
                    ]),
                  ]),
                ]),

                div({ className: "row dar-summary" }, [
                  div({ className: "control-label access-color" }, ["Type of Research"]),
                  div({ className: "response-label" }, [
                    ul({}, [
                      this.state.darInfo.researchType.map((type, rIndex) => {
                        return h(Fragment, {}, [
                          li({ className: type.manualReview ? 'cancel-color' : '' }, [
                            b({}, [type.title]), type.description
                          ]),
                        ]);
                      })
                    ]),
                  ]),
                ]),
                div({ isRendered: this.state.darInfo.researchTypeManualReview, className: "row dar-summary" }, [
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 alert-danger cancel-color" }, [
                    "This research requires manual review."
                  ]),
                ]),

                div({ isRendered: this.state.darInfo.hasDiseases, className: "row dar-summary" }, [
                  div({ className: "control-label access-color" }, ["Disease area(s)"]),
                  div({ className: "response-label" }, [
                    ul({}, [
                      this.state.darInfo.diseases.map((disease, rIndex) => {
                        return h(Fragment, {}, [
                          li({}, [
                            disease
                          ]),
                        ]);
                      })
                    ]),
                  ]),
                ]),
                div({ isRendered: this.state.darInfo.havePI, className: "row no-margin" }, [
                  label({ className: "control-label access-color" }, ["Principal Investigator: "]),
                  span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.pi]),
                ]),
                div({ className: "row no-margin" }, [
                  label({ className: "control-label access-color" }, ["Researcher: "]),
                  span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.profileName]),
                  div({ className: "row no-margin" }, [
                    label({ className: "control-label no-padding" }, ["Status: "]),
                    span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.status]),
                    span({ isRendered: this.state.darInfo.hasAdminComment }, [
                      label({ className: "control-label no-padding" }, [" - Comment: "]),
                      span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.adminComment]),
                    ]),
                  ]),
                ]),
                div({ className: "row no-margin" }, [
                  label({ className: "control-label access-color" }, ["Institution: "]),
                  span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.institution]),
                ]),
                div({ className: "row no-margin" }, [
                  label({ className: "control-label access-color" }, ["Department: "]),
                  span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.department]),
                ]),
                div({ className: "row no-margin" }, [
                  label({ className: "control-label access-color" }, ["City: "]),
                  span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.city]),
                ]),
                div({ className: "row no-margin" }, [
                  label({ className: "control-label access-color" }, ["Country: "]),
                  span({ className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.country]),
                ]),
                button({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12 btn download-pdf hover-color", onClick: this.downloadDAR }, ["Download Full Application"]),
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
                button({ id: "btn_downloadDataUseLetter", className: "col-lg-6 col-md-6 col-sm-6 col-xs-12 btn download-pdf hover-color", onClick: this.downloadDUL }, ["Download Data Use Letter"]),
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





// //-------------------------------------------------

// const init2 = async (apiUrl) => {

//   // formerly resolved on route ....
//   const referenceId = this.props.match.params.referenceId;
//   const electionId = this.props.match.params.electionId;
//   const darElection = Election.findElectionById(electionId);
//   const hasUseRestriction = DAR.hasUseRestriction(referenceId);

//   const oneAtATime = false;
//   const darInfo = await DAR.describeDar(darElection.referenceId);

//   let hideMatch = false;
//   let match = "-1";
//   let createDate = null;

//   let election;
//   let downloadUrl;
//   let dulName;
//   let status;
//   let voteList;
//   let chartDataDUL;
//   let mrDUL;
//   let sDUL;


//   if (electionId === null) {
//     this.props.history.push('reviewed_cases');

//     //-----
//     const finalDACVote = await Votes.getDarFinalAccessVote(electionId);

//     let darElectionReview = {};
//     let daer = await Election.findDataAccessElectionReview(electionId, false);
//     // showAccessData(data);
//     //--------------------
//     // function showAccessData(electionReview) {

//     darElectionReview.dar = await DAR.getDarFields(daer.election.referenceId, "rus")

//     DAR.getDarFields(daer.election.referenceId, "dar_code").then(function (data) {
//       darElectionReview.darCode = data.dar_code;
//     });

//     DAR.getDarFields(daer.election.referenceId, "projectTitle").then(function (data) {
//       darElectionReview.projectTitle = data.projectTitle;
//     });

//     darElectionReview.electionAccess = daer.election;
//     if (daer.election.finalRationale === null) {
//       darElectionReview.electionAccess.finalRationale = '';
//     }
//     darElectionReview.status = daer.election.status;
//     darElectionReview.voteAccessList = this.chunk(daer.reviewVote, 2);
//     darElectionReview.chartDataAccess = this.getGraphData(daer.reviewVote);
//     darElectionReview.voteAgreement = daer.voteAgreement;


//     // this data is used to construct structured_ files
//     darElectionReview.mrDAR = JSON.stringify(daer.election.useRestriction, null, 2);
//     darElectionReview.sDAR = daer.election.translatedUseRestriction;

//     // }

//     //....................
//     let rpeReview = {};
//     let data2 = await Election.findRPElectionReview(electionId, false);
//     if (data2.election !== undefined) {
//       rpeReview.electionRP = data2.election;
//       if (data2.election.finalRationale === null) {
//         rpeReview.electionRP.finalRationale = '';
//       }
//       rpeReview.statusRP = data2.election.status;
//       rpeReview.rpVoteAccessList = this.chunk(data2.reviewVote, 2);
//       rpeReview.chartRP = this.getGraphData(data2.reviewVote);
//       rpeReview.showRPaccordion = true;
//     } else {
//       rpeReview.showRPaccordion = false;
//     }


//     let electionReview = Election.findElectionReviewById(daer.associatedConsent.electionId, daer.associatedConsent.consentId);
//     election = electionReview.election;
//     if (electionReview.election.finalRationale === null) {
//       election.finalRationale = '';
//     }
//     downloadUrl = apiUrl + 'consent/' + electionReview.consent.consentId + '/dul';
//     dulName = electionReview.election.dulName;
//     status = electionReview.election.status;
//     voteList = this.chunk(electionReview.reviewVote, 2);
//     chartDataDUL = this.getGraphData(electionReview.reviewVote);
//     mrDUL = JSON.stringify(electionReview.election.useRestriction, null, 2);
//     sDUL = electionReview.election.translatedUseRestriction;

//     const data4 = await Match.findMatch(electionReview.consent.consentId, darElectionReview.electionAccess.referenceId);
//     if (data4.failed !== null && data4.failed !== undefined && data4.failed) {
//       hideMatch = false;
//       match = "-1";
//       createDate = data4.createDate;
//     } else if (data4.match !== null && data4.match !== undefined) {
//       hideMatch = false;
//       match = data4.match;
//       createDate = data4.createDate;
//     } else {
//       hideMatch = true;
//     }
//   };
//   //------------------------------------



//   // $scope.downloadDUL = function () {
//   //   cmFilesService.getDULFile($scope.electionReview.consent.consentId, $scope.electionReview.election.dulName);
//   // };

//   // $scope.back = function () {
//   //   $state.go($rootScope.pathFrom);
//   //   $rootScope.pathFrom = undefined;
//   // };
//   // $scope.download = downloadFileService.downloadFile;

//   // $scope.downloadDAR = function () {
//   //   cmFilesService.getDARFile($scope.darElection.referenceId);
//   // };

// }