import { Component, Fragment } from 'react';
import { div, button, i, span, b, a, h4, ul, li, label, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { DAR, Election, Files } from "../libs/ajax";

class AccessPreview extends Component {


  constructor(props) {
    super(props);
    this.state = this.initialState();
  }

  componentWillMount() {
    this.darReviewInfo();
  }

  back = () => {
    this.props.history.goBack();
  };

  async darReviewInfo() {

    this.setState(prev => {
      prev.dar_id = this.props.match.params.referenceId
    });

    const data1 = await DAR.getDarFields(this.props.match.params.referenceId, 'rus');
    const data2 = await DAR.getDarFields(this.props.match.params.referenceId, 'translated_restriction');
    const data3 = await DAR.getDarFields(this.props.match.params.referenceId, 'projectTitle');
    const consent = await DAR.darConsent(this.props.match.params.referenceId);
    const data5 = await DAR.describeDar(this.props.match.params.referenceId);

    // dar: gerDarFields referenceID rus
    if (this.props.match.params.referenceId !== undefined) {
      this.setState(prev => {
        prev.darInfo.rus = data1.rus;
        return prev;
      });
    }

    // rp: gerDarFields referenceID translated_restriction
    if (this.props.match.params.referenceId !== undefined) {
      this.setState(prev => {
        prev.rp = data2;
        return prev;
      });
    }

    // request: gerDarFields referenceID projectTitle
    if (this.props.match.params.referenceId !== undefined) {
      this.setState(prev => {
        prev.projectTitle = data3.projectTitle;
        return prev;
      });
    }

    // consent: getDarConsent referenceID
    if (this.props.match.params.referenceId !== undefined) {
      this.setState(prev => {
        prev.consent = consent;
        prev.consentName = consent.name;
        return prev;
      });
    }

    this.setState(prev => {
      prev.darInfo.havePI = data5.havePI;
      prev.darInfo.pi = data5.pi;
      prev.darInfo.city = data5.city;
      prev.darInfo.department = data5.department;
      prev.darInfo.country = data5.country;
      prev.darInfo.diseases = data5.diseases;
      prev.darInfo.hasDiseases = data5.hasDiseases;
      prev.darInfo.institution = data5.institution;
      prev.darInfo.researchTypeManualReview = data5.researchTypeManualReview;
      prev.darInfo.purposeManualReview = data5.purposeManualReview;
      prev.darInfo.hasPurposeStatements = data5.hasPurposeStatements;
      if (data5.hasPurposeStatements) {
        prev.darInfo.purposeStatements = data5.purposeStatements;
      }
      prev.darInfo.researchType = data5.researchType;
      return prev;
    });

  };

  initialState() {
    return {
      hasUseRestriction: true,
      projectTitle: '',
      consentName: '',
      isQ1Expanded: true,
      isQ2Expanded: false,

      darInfo: {
        rus:'empty rus',
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
        purposeManualReview: false,
        researchTypeManualReview: false,
        hasDiseases: true,
        purposeStatements: [],
        researchType: [],
        hasPurposeStatements: false,
        diseases: []
      }
    };
  }

  downloadDAR = () => {
    Files.getDARFile(this.props.match.params.referenceId);
  };

  downloadDUL() {
    let consentElection = undefined;
    if (this.props.match.params.electionId !== undefined) {
      Election.electionConsentResource(this.props.match.params.electionId).then(data => {
        consentElection = data;
        if (consentElection !== undefined && consentElection.dulName !== undefined) {
          Files.getDulFile(this.props.match.params.consentId, consentElection.dulName);
        }
      });
    } else {
      Files.getDulFile(this.state.consent.consentId,this.state.consentName);
    }
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

  render() {
    
    const consentData = span({ className: "consent-data" }, [
      b({ className: "pipe" }, [this.state.projectTitle]),
      this.state.consentName
    ]);

    return (

      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding" }, [
            PageHeading({ id: "previewAccess", imgSrc: "/images/icon_access.png", iconSize: "medium", color: "access", title: "Data Access Congruence Preview", description: consentData }),
          ]),
          div({ className: "col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding" }, [
            a({ id: "btn_back", onClick: () => this.back(), className: "btn vote-button vote-button-back vote-button-bigger" }, [
              i({ className: "glyphicon glyphicon-chevron-left" }), "Back"
            ])
          ]),
        ]),

        div({ className: "row no-margin" }, [
          CollapsiblePanel({
            id: "accessCollectVotes",
            onClick: this.toggleQ1,
            color: 'access',
            title: this.state.hasUseRestriction ? "Q1. Should data access be granted to this applicant?"
              : "Should data access be granted to this applicant?",
            expanded: this.state.isQ1Expanded
          }, [

              //-----
              div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                div({ className: "col-lg-8 col-md-8 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
                  div({ className: "panel-heading cm-boxhead access-color" }, [
                    h4({}, ["Application Summary"]),
                  ]),

                  div({ id: "panel_applicationSummary", className: "panel-body row" }, [
                    div({ className: "col-lg-4 col-md-5 col-sm-5 col-xs-12" }, [

                      div({ isRendered: this.state.darInfo.havePI, className: "row no-margin" }, [
                        label({ className: "control-label access-color" }, ["PI: "]),
                        span({ id: "lbl_principalInvestigator", className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.pi]),
                      ]),
                      div({ className: "row no-margin" }, [
                        label({ className: "control-label access-color" }, ["Researcher: "]),
                        span({ id: "lbl_researcher", className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.profileName]),
                      ]),
                      div({ className: "row no-margin" }, [
                        label({ className: "control-label no-padding" }, ["Status: "]),
                        span({ id: "lbl_researcherStatus", className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.status]),
                      ]),
                      div({ isRendered: this.state.darInfo.hasAdminComment, className: "row no-margin" }, [
                        span({}, [
                          label({ className: "control-label no-padding" }, ["Comment: "]),
                          span({ id: "lbl_adminComment", className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.adminComment]),
                        ]),
                      ]),

                      div({ className: "row no-margin" }, [
                        label({ className: "control-label access-color" }, ["Institution: "]),
                        span({ id: "lbl_institution", className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.institution]),
                      ]),
                      div({ className: "row no-margin" }, [
                        label({ className: "control-label access-color" }, ["Department: "]),
                        span({ id: "lbl_department", className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.department]),
                      ]),
                      div({ className: "row no-margin" }, [
                        label({ className: "control-label access-color" }, ["City: "]),
                        span({ id: "lbl_state", className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.city]),
                      ]),
                      div({ className: "row no-margin" }, [
                        label({ className: "control-label access-color" }, ["Country: "]),
                        span({ id: "lbl_country", className: "response-label", style: { 'paddingLeft': '5px' } }, [this.state.darInfo.country]),
                      ]),
                      button({ id: "btn_downloadFullApplication", className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 btn download-pdf hover-color", onClick: this.downloadDAR }, ["Download Full Application"]),
                    ]),

                    div({ className: "col-lg-8 col-md-7 col-sm-7 col-xs-12" }, [

                      div({ className: "row dar-summary" }, [
                        div({ className: "control-label access-color" }, ["Research Purpose"]),
                        div({ id: "lbl_rus", className: "response-label" }, [this.state.darInfo.rus]),
                      ]),
                      div({ isRendered: this.state.darInfo.hasPurposeStatements, className: "row dar-summary" }, [
                        div({ className: "control-label access-color" }, ["Purpose Statement"]),
                        div({ className: "response-label" }, [
                          ul({}, [
                            this.state.darInfo.purposeStatements.map((purpose, rIndex) => {
                              return h(Fragment, {key: rIndex}, [
                                li({ id: "lbl_purposeStatement" + rIndex, className: purpose.manualReview ? 'cancel-color' : '' }, [
                                  b({}, [purpose.title]), purpose.description
                                ])
                              ]);
                            })
                          ]),
                          div({ isRendered: this.state.darInfo.purposeManualReview && !this.state.darInfo.researchTypeManualReview, className: "dar-summary" }, [
                            div({ id: "lbl_purposeStatementManualReview", className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 alert-danger cancel-color" }, [
                              "This research involves studying a sensitive population and requires manual review."
                            ]),
                          ]),
                        ]),
                      ]),

                      div({ className: "row dar-summary" }, [
                        div({ className: "control-label access-color" }, ["Type of Research"]),
                        div({ className: "response-label" }, [
                          ul({}, [
                            this.state.darInfo.researchType.map((type, rIndex) => {
                              return h(Fragment, {key: rIndex}, [
                                li({ id: "lbl_researchType" + rIndex, className: type.manualReview ? 'cancel-color' : '' }, [
                                  b({}, [type.title]), type.description
                                ]),
                              ]);
                            })
                          ]),
                        ]),
                      ]),
                      div({ isRendered: this.state.darInfo.researchTypeManualReview, className: "row dar-summary" }, [
                        div({ id: "lbl_researchTypeManualReview", className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 alert-danger cancel-color" }, [
                          "This research requires manual review."
                        ]),
                      ]),

                      div({ isRendered: this.state.darInfo.hasDiseases, className: "row dar-summary" }, [
                        div({ className: "control-label access-color" }, ["Disease area(s)"]),
                        div({ className: "response-label" }, [
                          ul({}, [
                            this.state.darInfo.diseases.map((disease, rIndex) => {
                              return h(Fragment, {key: rIndex}, [
                                li({ id: "lbl_disease" + rIndex }, [
                                  disease
                                ]),
                              ]);
                            })
                          ]),
                        ]),
                      ]),
                    ]),
                  ]),
                ]),

                div({ className: "col-lg-4 col-md-4 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
                  div({ className: "panel-heading cm-boxhead dul-color" }, [
                    h4({}, ["Data Use Limitations"]),
                  ]),
                  div({ id: "panel_dul", className: "panel-body cm-boxbody" }, [
                    div({ className: "row no-margin" }, [
                      button({ id: "btn_downloadDataUseLetter", className: "col-lg-8 col-md-8 col-sm-6 col-xs-12 btn download-pdf hover-color", onClick: () =>  this.downloadDUL() }, ["Download Data Use Letter"]),
                    ])
                  ])
                ])
              ])
            ])
        ]),

        div({ className: "row no-margin" }, [
          CollapsiblePanel({
            isRendered: this.state.hasUseRestriction,
            id: "rpCollectVotes",
            onClick: this.toggleQ1,
            color: 'access',
            title: "Q2. Was the research purpose accurately converted to a structured format?",
            expanded: this.state.isQ2Expanded
          }, [

              div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
                  div({ className: "panel-heading cm-boxhead access-color" }, [
                    h4({}, ["Research Purpose"]),
                  ]),
                  div({ id: "panel_researchPurpose", className: "panel-body cm-boxbody" }, [
                    div({ style: { 'marginBottom': '10px' } }, [this.state.darInfo.rus]),
                    button({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12 btn download-pdf hover-color", onClick: this.downloadDAR }, ["Download Full Application"]),
                  ])
                ]),

                div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
                  div({ className: "panel-heading cm-boxhead access-color" }, [
                    h4({}, ["Structured Research Purpose"]),
                  ]),
                  div({ id: "panel_structuredPurpose", className: "panel-body cm-boxbody translated-restriction" }, [this.state.darInfo.sDar])
                ]),
              ]),
            ])
        ])
      ])
    );
  }
}

export default AccessPreview;

