import { Component, Fragment } from 'react';
import { div, button, span, b, a, i, hr, h4, ul, li, label, h3, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { SingleResultBox } from '../components/SingleResultBox';
import { CollectResultBox } from '../components/CollectResultBox';
import { CollapsiblePanel } from '../components/CollapsiblePanel';

class AccessResultRecords extends Component {

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
      prev.enableFinalButton = true;
      prev.enableAgreementButton = true;
      prev.hasUseRestriction = true;
      prev.projectTitle = 'My Project 01';
      prev.darCode = 'DAR-02';
      prev.isQ1Expanded = false;
      prev.isQ2Expanded = false;
      prev.isDulExpanded = false;
      prev.match = '-1';
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
      prev.voteAgreement = {
        vote: '0',
        rationale: '',
      };
      prev.darInfo = {
        havePI: true,
        pi: 'PI name goes here....',
        rus: "something",
        sDar: "something else",
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
      return prev;
    });
  }

  initialState() {
    return {
      voteStatus: '1',
      createDate: '2018-08-30',
      enableFinalButton: false,
      enableAgreementButton: false,
      hasUseRestriction: true,
      projectTitle: 'My Project 01',
      darCode: 'DAR-02',
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
      voteList: [
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

  setEnableFinalButton = (e) => {
    console.log('------------positsetEnableFinalButtoniveVote--------------');
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

  toggleDulExpanded = (e) => {
    this.setState(prev => {
      prev.isDulExpanded = !prev.isDulExpanded;
      return prev;
    });
    console.log('------------toggleDulExpanded--------------');
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
      this.state.darCode
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
                div({ className: "response-label", "ng-bind html": "sDar" }, [this.state.darInfo.sDar]),
                a({
                  isRendered: this.state.hasUseRestriction, onClick: this.download,
                  filename: 'machine-readable-DAR.json',
                  value: "mrDAR", className: "italic hover-color"
                }, ["Download DAR machine-readable format"]),
              ]),

              div({ isRendered: this.state.darInfo.hasPurposeStatements, className: "row dar-summary" }, [
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
                button({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12 btn download-pdf hover-color", onClick: this.downloadDUL }, ["Download Data Use Letter"]),
              ]),
              div({ className: "row dar-summary" }, [
                div({ className: "control-label dul-color" }, ["Structured Limitations"]),
                div({ className: "response-label", "ng-bind-html": "sDul" }, ["sDul"]),
                a({ onClick: this.download, filename: 'machine-readable-DUL.json', value: "mrDUL", className: "italic hover-color" }, ["Download DUL machine-readable format"]),
              ]),
            ]),
          ]),
          //-------------------------------

        ]),
        hr({ className: "section-separator" }),

        div({ className: "row no-margin" }, [
          div({ className: this.state.hasUseRestriction ? "col-lg-6 col-md-6 col-sm-12 col-xs-12"
          : "col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-12 col-xs-12" }, [
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
                          id: "accessSingleResult" + vIndex,
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
                          id: "rpSingleResult" + vIndex,
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
                          id: "dulSingleResult" + vIndex,
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

