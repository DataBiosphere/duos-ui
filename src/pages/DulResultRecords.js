import { Component, Fragment } from 'react';
import { div, button, i, span, b, a, hr, h4, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { SingleResultBox } from '../components/SingleResultBox';
import { CollectResultBox } from '../components/CollectResultBox';

class DulResultRecords extends Component {

  constructor(props) {
    super(props);
    this.state = this.initialState();
  }

  componentWillMount() {
    this.mockState();
    this.setState(prev => {
      prev.currentUser = {
        roles: [
          { name: 'ADMIN' },
        ]
      };
      return prev;
    });
  }

  mockState() {
    this.setState(prev => {
      prev.createDate = '2018-08-30';
      prev.consentGroupName = 'GroupName 01';
      prev.consentName = 'ORSP-124';
      prev.electionDul = {
        finalVote: '0',
        finalRationale: '',
        finalVoteDate: '2018-08-30'
      };


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
      sDul: "something",

      dulElection: {
        finalVote: '0',
        finalRationale: 'lalala',
        finalVoteDate: '2018-08-31'
      },

      dulVoteList: [
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
    };
  }


  download = (e) => {
    const filename = e.target.getAttribute('filename');
    const value = e.target.getAttribute('value');
    console.log('------------download-------------', filename, value);
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
      b({ className: "pipe" }, [this.state.consentGroupName]),
      this.state.consentName
    ]);

    return (

      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding" }, [
            PageHeading({ id: "recordsDul", imgSrc: "/images/icon_dul.png", iconSize: "medium", color: "dul", title: "Data Use Limitations - Results Record", description: consentData }),
          ]),
          div({ className: "col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding" }, [
            a({ id: "btn_back", onClick: "back()", className: "btn vote-button vote-button-back vote-button-bigger" }, [
              i({ className: "glyphicon glyphicon-chevron-left" }), "Back"
            ])
          ]),
        ]),

        div({ className: "accordion-title dul-color" }, ["Were the data use limitations in the Data Use Letter accurately converted to structured limitations?"]),

        hr({ className: "section-separator", style: { 'marginTop': '0' } }),

        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
          div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
            div({ className: "panel-heading cm-boxhead dul-color" }, [
              h4({}, ["Data Use Limitations"]),
            ]),
            div({ id: "panel_dul", className: "panel-body cm-boxbody" }, [
              button({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12 btn download-pdf hover-color", onClick: this.downloadDUL }, ["Download Data Use Letter"]),
            ])
          ]),

          div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
            div({ className: "panel-heading cm-boxhead dul-color" }, [
              h4({}, ["Structured Limitations"]),
            ]),
            div({ id: "panel_structuredDul", className: "panel-body cm-boxbody translated-restriction" }, [this.state.sDul])
          ]),
        ]),

        //-----

        div({ className: "row no-margin" }, [
          div({ className: "col-lg-8 col-lg-offset-2 col-md-8 col-md-offset-2 col-sm-12 col-xs-12" }, [
            CollectResultBox({
              id: "dulRecordResult",
              title: "Final DAC Decision",
              color: "dul",
              class: "col-lg-12 col-md-12 col-sm-12 col-xs-12",
              vote: this.state.electionDul.finalVote,
              voteDate: this.state.electionDul.finalVoteDate,
              rationale: this.state.electionDul.finalRationale,
              chartData: [
                ['Results', 'Votes'],
                ['Yes', 90],
                ['No', 110]
              ]
            }),
          ]),
        ]),

        div({ className: "row no-margin" }, [
          CollapsiblePanel({
            id: "dulRecordVotes",
            onClick: this.toggleQ1,
            color: 'dul',
            title: "Data Access Committee Votes",
            expanded: this.state.isQ1Expanded
          }, [

              this.state.dulVoteList.map((row, rIndex) => {
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
        ]),
      ])
    );
  }
}

export default DulResultRecords;

