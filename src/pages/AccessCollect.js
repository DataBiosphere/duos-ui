import { Component, Fragment } from 'react';
import { div, button, i, span, b, a, hr, h4, ul, li, label, h3, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { SubmitVoteBox } from '../components/SubmitVoteBox';
import { SingleResultBox } from '../components/SingleResultBox';
import { CollectResultBox } from '../components/CollectResultBox';
import { CollapsiblePanel } from '../components/CollapsiblePanel';

class AccessCollect extends Component {


  constructor(props) {
    super(props);
    this.state = this.initialState();
  }

  componentWillMount() {
    this.mockState();
    this.setState(prev => {
      prev.currentUser = {
        roles: [
          { name: 'CHAIRPERSON' },
          { name: 'ADMIN' },
        ]
      };
      return prev;
    });
  }

  mockState() {
    this.setState(prev => {
      prev.createDate = '2018-08-30';
      prev.hasUseRestriction = true;
      prev.projectTitle = 'My Project 01';
      prev.consentName = 'ORSP-124';
      prev.isQ1Expanded = true;
      prev.isQ2Expanded = false;
      prev.election = {
        finalVote: '0',
        finalRationale: '',
        finalVoteDate: '2018-08-30'
      };
      prev.electionAccess = {
        finalVote: '0',
        finalRationale: 'lalala',
        finalVoteDate: '2018-08-30'
      };
      prev.electionRP = {
        finalVote: '0',
        finalRationale: '',
        finalVoteDate: '2018-08-30'
      };
      prev.darInfo = {
        havePI: true,
        pi: 'PI name goes here....',
        profileName: 'My Profile name',
        status: 'OK',
        hasAdminComment: true,
        adminComment: 'This is an admin comment',
        institution: 'Institution',
        department: 'Department',
        city: 'City',
        country: 'Country',
        rus: 'something',
        sDar: 'something else',
        purposeManualReview: true,
        researchTypeManualReview: true,
        hasDiseases: true,
        purposeStatements: [
          { title: "Purpose Title 1", description: "Purpose Description 1", manualReview: true },
          { title: "Purpose Title 2", description: "Purpose Description 2", manualReview: false },
          { title: "Purpose Title 3", description: "Purpose Description 3", manualReview: true },
          { title: "Purpose Title 4", description: "Purpose Description 4", manualReview: false },
        ],
        researchType: [
          { title: "Research Type Title 1", description: "Research Type Description 1", manualReview: true },
          { title: "Research Type Title 2", description: "Research Type Description 2", manualReview: false },
          { title: "Research Type Title 3", description: "Research Type Description 3", manualReview: true },
          { title: "Research Type Title 4", description: "Research Type Description 4", manualReview: false },
        ],
        diseases: [
          'disease 0',
          'disease 1',
          'disease 2',
          'disease 3',
        ]
      }
      return prev;
    });
  }

  initialState() {
    return {
      voteStatus: '1',
      createDate: '2018-08-30',
      hasUseRestriction: true,
      projectTitle: 'My Project 01',
      consentName: 'ORSP-124',
      isQ1Expanded: false,
      isQ2Expanded: false,
      
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

      voteAccessList: [
        [
          {
            displayName: "Diego Gil", vote: {
              vote: '0',
              rationale: 'por que si ... por que si ... por que si ... por que si ... por que si ... por que si ... por que si ... por que si ... por que si ... por que si ...por que si ...',
              createDate: '',
              updateDate: '',
            }
          },
          {
            displayName: "Nadya Lopez Zalba", vote: {
              vote: '0',
              rationale: '',
              createDate: '',
              updateDate: '',
            }
          },
        ],
        [
          {
            displayName: "Walter Lo Forte", vote: {
              vote: '0',
              rationale: 'lala',
              createDate: '',
              updateDate: ''
            }
          },
          {
            displayName: "Leo Forconesi", vote: {
              vote: '1',
              rationale: '',
              createDate: '',
              updateDate: ''
            }
          },
        ]
      ],
      rpVoteAccessList: [
        [
          {
            displayName: "Diego Gil", vote: {
              vote: '0',
              rationale: 'por que si ... por que si ... por que si ... por que si ... por que si ... por que si ... por que si ... por que si ... por que si ... por que si ...por que si ...',
              createDate: '',
              updateDate: '',
            }
          },
          {
            displayName: "Nadya Lopez Zalba", vote: {
              vote: '0',
              rationale: '',
              createDate: '',
              updateDate: '',
            }
          },
        ],
        [
          {
            displayName: "Walter Lo Forte", vote: {
              vote: '0',
              rationale: 'lala',
              createDate: '',
              updateDate: ''
            }
          },
          {
            displayName: "Leo Forconesi", vote: {
              vote: '1',
              rationale: '',
              createDate: '',
              updateDate: ''
            }
          },
        ],
        [
          {
            displayName: "Tadeo Riveros", vote: {
              vote: '0',
              rationale: 'lalala',
              createDate: '',
              updateDate: ''
            }
          }
        ]
      ],

      darInfo: {
        havePI: true,
        pi: 'PI name goes here....',
        profileName: 'My Profile name',
        status: 'OK',
        hasAdminComment: true,
        adminComment: 'This is an admin comment',
        institution: 'Institution',
        department: 'Department',
        city: 'City',
        country: 'Country',
        purposeManualReview: true,
        researchTypeManualReview: true,
        hasDiseases: true,
        purposeStatements: [
          { title: "Purpose Title 1", description: "Purpose Description 1", manualReview: true },
          { title: "Purpose Title 2", description: "Purpose Description 2", manualReview: false },
          { title: "Purpose Title 3", description: "Purpose Description 3", manualReview: true },
          { title: "Purpose Title 4", description: "Purpose Description 4", manualReview: false },
        ],
        researchType: [
          { title: "Research Type Title 1", description: "Research Type Description 1", manualReview: true },
          { title: "Research Type Title 2", description: "Research Type Description 2", manualReview: false },
          { title: "Research Type Title 3", description: "Research Type Description 3", manualReview: true },
          { title: "Research Type Title 4", description: "Research Type Description 4", manualReview: false },
        ],
        diseases: [
          'disease 0',
          'disease 1',
          'disease 2',
          'disease 3',
        ]
      }
    };
  }

  download = (e) => {
    const filename = e.target.getAttribute('filename');
    const value = e.target.getAttribute('value');
    console.log('------------download-------------', filename, value);
  }

  downloadDAR = (e) => {
    console.log('------------downloadDAR-------------', e);
  }

  downloadDUL = (e) => {
    console.log('------------downloadDUL-------------', e);
  }

  positiveVote = (e) => {
    console.log('------------positiveVote--------------');
  }

  logVote = (e) => {
    console.log('------------logVote--------------');
  }

  toggleQ1 = (e) => {
    this.setState(prev => {
      prev.isQ1Expanded = !prev.isQ1Expanded;
      return prev;
    });
    console.log('------------toggleQ1--------------');
  }

  toggleQ2 = (e) => {
    this.setState(prev => {
      prev.isQ2Expanded = !prev.isQ2Expanded;
      return prev;
    });
    console.log('------------toggleQ1--------------');
  }

  render() {

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

    const consentData = span({ className: "consent-data" }, [
      b({ className: "pipe" }, [this.state.projectTitle]),
      this.state.consentName
    ]);

    return (

      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding" }, [
            PageHeading({ id: "collectAccess", imgSrc: "/images/icon_access.png", iconSize: "medium", color: "access", title: "Collect votes for Data Access Congruence Review", description: consentData }),
          ]),
          div({ className: "col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding" }, [
            a({ id: "btn_back", onClick: "back()", className: "btn vote-button vote-button-back vote-button-bigger" }, [
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

              hr({ className: "section-separator", style: { 'marginTop': '0' } }),
              h4({ className: "hint" }, ["Please review the Application Summary, Data Use Limitations, and DAC Votes to determine if the researcher should be granted access to the data"]),
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
                              return h(Fragment, {}, [
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
                              return h(Fragment, {}, [
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
                              return h(Fragment, {}, [
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

                //-----
                div({ className: "col-lg-4 col-md-4 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
                  div({ className: "panel-heading cm-boxhead dul-color" }, [
                    h4({}, ["Data Use Limitations"]),
                  ]),
                  div({ id: "panel_dul", className: "panel-body cm-boxbody" }, [
                    div({ className: "row no-margin" }, [
                      button({ id: "btn_downloadDataUseLetter", className: "col-lg-8 col-md-8 col-sm-6 col-xs-12 btn download-pdf hover-color", onClick: this.downloadDUL }, ["Download Data Use Letter"]),
                    ]),
                  ]),
                ]),
              ]),

              //-----

              div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                CollectResultBox({
                  id: "accessCollectResult",
                  title: "Vote Results",
                  color: "access",
                  type: "stats",
                  class: "col-lg-4 col-md-4 col-sm-12 col-xs-12",
                  chartData: [
                    ['Results', 'Votes'],
                    ['Yes', 90],
                    ['No', 110]
                  ]
                }),

                div({ className: "col-lg-8 col-md-8 col-sm-12 col-xs-12 jumbotron box-vote-results access-background-lighter" }, [
                  SubmitVoteBox({
                    id: "collectAccess",
                    color: "access",
                    title: this.state.hasUseRestriction ? "Q1. Should data access be granted to this applicant?"
                      : "Should data access be granted to this applicant?",
                    isDisabled: "isFormDisabled",
                    voteStatus: this.state.voteStatus,
                    action: { label: "Vote", handler: this.submit }
                  }),
                ]),
              ]),

              h3({ className: "cm-subtitle" }, ["Data Access Committee Votes"]),

              this.state.voteAccessList.map((row, rIndex) => {
                return h(Fragment, {}, [
                  div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                    row.map((vm, vIndex) => {
                      return h(Fragment, {}, [
                        SingleResultBox({
                          id: "accessSingleResult" + vIndex,
                          color: "access",
                          data: vm
                        })
                      ]);
                    })
                  ]),
                ]);
              })
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

              hr({ className: "section-separator", style: { 'marginTop': '0' } }),
              h4({ className: "hint" }, ["Please review the Research Purpose, Structured Research Purpose, and DAC votes to determine if the Research Purpose was appropriately converted to a Structured Research Purpose"]),

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

              //-----

              div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                CollectResultBox({
                  id: "rpCollectResult",
                  title: "Vote Results",
                  color: "access",
                  type: "stats",
                  class: "col-lg-4 col-md-4 col-sm-12 col-xs-12",
                  chartData: [
                    ['Results', 'Votes'],
                    ['Yes', 90],
                    ['No', 110]
                  ]
                }),

                div({ className: "col-lg-8 col-md-8 col-sm-12 col-xs-12 jumbotron box-vote-results access-background-lighter" }, [
                  SubmitVoteBox({
                    id: "collectRP",
                    color: "access",
                    title: "Q2. Was the research purpose accurately converted to a structured format?",
                    isDisabled: "isFormDisabled",
                    voteStatus: this.state.voteStatus,
                    action: { label: "Vote", handler: this.submit }
                  }),
                ]),
              ]),

              h3({ className: "cm-subtitle" }, ["Data Access Committee Votes"]),

              this.state.rpVoteAccessList.map((row, rIndex) => {
                return h(Fragment, {}, [
                  div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                    row.map((vm, vIndex) => {
                      return h(Fragment, {}, [
                        SingleResultBox({
                          id: "rpSingleResult" + vIndex,
                          color: "access",
                          data: vm
                        })
                      ]);
                    })
                  ]),
                ]);
              })
            ])
        ])
      ])
    );
  }
}

export default AccessCollect;

