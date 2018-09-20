import { Component, Fragment } from 'react';
import { div, button, i, span, b, a, hr, h4, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { SingleResultBox } from '../components/SingleResultBox';
import { CollectResultBox } from '../components/CollectResultBox';
import { Election, Files } from '../libs/ajax';
import * as Utils from '../libs/utils';

class DulResultRecords extends Component {

  constructor(props) {
    super(props);
    this.state = this.initialState();
    this.back = this.back.bind(this);
  }

  chunk(arr, size) {
    let newArr = [];
    for (let i = 0; i < arr.length; i += size) {
      newArr.push(arr.slice(i, i + size));
    }
    return newArr;
  }

  componentWillMount() {
    this.setState(prev => {
      prev.currentUser = {
        roles: [
          { name: 'ADMIN' },
        ]
      };
      return prev;
    });
    this.voteInfo();
  }

  back() {
    this.props.history.goBack();
  }

  async voteInfo() {
    Election.findReviewedElections(this.props.match.params.electionId).then(data => {
      this.setState({ dulVoteList: this.chunk(data.reviewVote, 2) });
      this.setState({ consentGroupName: data.consent.groupName });
      this.setState({ consentName: data.consent.name });
      this.setState({ sDul: data.election.translatedUseRestriction });
      this.setState({ projectTitle: data.election.projectTitle });
      this.setState({ finalVote: data.election.finalVote });
      this.setState({ finalRationale: data.election.finalRationale });
      this.setState({ finalVoteDate: Utils.formatDate(data.election.finalVoteDate) });
    });
  }

  initialState() {
    return {
      voteStatus: '',
      createDate: '',
      hasUseRestriction: true,
      projectTitle: '',
      consentName: '',
      sDul: '',
      dulElection: {
        finalVote: '',
        finalRationale: '',
        finalVoteDate: ''
      },
      dulVoteList: [ [], [] ],
    };
  }


  download = (e) => {
    const filename = e.target.getAttribute('filename');
    const value = e.target.getAttribute('value');

  };

  downloadDUL = (e) => {
    Files.getDulFile(this.props.match.params.consentId, this.state.consentName);
  };

  positiveVote = (e) => {

  };

  logVote = (e) => {

  };

  render() {

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
            a({ id: "btn_back", onClick: () => this.back(), className: "btn vote-button vote-button-back vote-button-bigger" }, [
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
              vote: this.state.finalVote,
              voteDate: this.state.finalVoteDate,
              rationale: this.state.finalRationale,
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
                return h(Fragment, {key: rIndex}, [
                  div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                    row.map((vm, vIndex) => {
                      return h(Fragment, {key: vIndex}, [
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

