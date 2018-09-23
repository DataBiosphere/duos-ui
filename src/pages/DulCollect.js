import { Component, Fragment } from 'react';
import { div, button, i, span, b, a, hr, h4, h3, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { SubmitVoteBox } from '../components/SubmitVoteBox';
import { SingleResultBox } from '../components/SingleResultBox';
import { CollectResultBox } from '../components/CollectResultBox';
import { Election, Files } from '../libs/ajax';
import { LoadingIndicator } from '../components/LoadingIndicator';

class DulCollect extends Component {

  constructor(props) {
    super(props);
    this.back = this.back.bind(this);
    this.state = this.initialState();
  }

  back() {
    this.props.history.goBack();
  }

  async componentDidMount() {
    const consentId = this.props.match.params.consentId;
    Election.electionReviewResource(consentId, 'TranslateDUL').then(
      data => {
        console.log(data);
        this.setState({
          loading: false,
          dulVoteList: this.chunk(data.reviewVote, 2),
          consentGroupName: data.consent.groupName,
          consentName: data.consent.name,
          translatedUseRestriction: data.election.translatedUseRestriction,
          projectTitle: data.election.projectTitle,
          finalVote: data.election.finalVote,
          finalRationale: data.election.finalRationale,
          finalVoteDate: data.election.finalVoteDate
        });
      });

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

  chunk(arr, size) {
    let newArr = [];
    for (let i = 0; i < arr.length; i += size) {
      newArr.push(arr.slice(i, i + size));
    }
    return newArr;
  }

  initialState() {
    return {
      loading: true,
      voteStatus: '',
      createDate: '',
      hasUseRestriction: Boolean,
      projectTitle: '',
      consentName: '',
      translatedUseRestriction: '',
      consentGroupName: '',
      finalVote: '',
      finalRationale: '',
      finalVoteDate: '',
      dulVoteList: []
    };
  }


  download = (e) => {
    // const filename = e.target.getAttribute('filename');
    // const value = e.target.getAttribute('value');

  };

  downloadDUL = (e) => {

    Files.getDulFile(this.props.match.params.consentId, this.state.consentName);
  };

  positiveVote = (e) => {

  };

  logVote = (e) => {

  };

  render() {

    if (this.state.loading) { return LoadingIndicator(); }

    const consentData = span({ className: "consent-data" }, [
      b({ className: "pipe" }, [this.state.consentGroupName]),
      this.state.consentName
    ]);

    return (

      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding" }, [
            PageHeading({ id: "collectDul", imgSrc: "/images/icon_dul.png", iconSize: "medium", color: "dul", title: "Collect votes for Data Use Limitations Congruence Review", description: consentData }),
          ]),
          div({ className: "col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding" }, [
            a({ id: "btn_back", onClick: () => this.back(), className: "btn vote-button vote-button-back vote-button-bigger" }, [
              i({ className: "glyphicon glyphicon-chevron-left" }), "Back"
            ])
          ]),
        ]),

        div({ className: "accordion-title dul-color" }, ["Were the data use limitations in the Data Use Letter accurately converted to structured limitations?"]),

        hr({ className: "section-separator", style: { 'marginTop': '0' } }),
        h4({ className: "hint" }, ["Please review the Data Use Letter, Structured Limitations, and DAC votes to determine if the Data Use Limitations were appropriately converted to Structured Limitations"]),

        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
          div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
            div({ className: "panel-heading cm-boxhead dul-color" }, [
              h4({}, ["Data Use Limitations"]),
            ]),
            div({ id: "panel_dul", className: "panel-body cm-boxbody" }, [
              button({ id: "btn_downloadDataUseLetter", className: "col-lg-6 col-md-6 col-sm-6 col-xs-12 btn download-pdf hover-color", onClick: this.downloadDUL }, ["Download Data Use Letter"]),
            ])
          ]),

          div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
            div({ className: "panel-heading cm-boxhead dul-color" }, [
              h4({}, ["Structured Limitations"]),
            ]),
            div({ id: "panel_structuredDul", className: "panel-body cm-boxbody translated-restriction" }, [this.state.translatedUseRestriction])
          ]),
        ]),

        //-----

        div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
          CollectResultBox({
            id: "dulCollectResult",
            title: "Vote Results",
            color: "dul",
            type: "stats",
            class: "col-lg-4 col-md-4 col-sm-12 col-xs-12",
            chartData: [
              ['Results', 'Votes'],
              ['Yes', 90],
              ['No', 110]
            ]
          }),

          div({ className: "col-lg-8 col-md-8 col-sm-12 col-xs-12 jumbotron box-vote-results dul-background-lighter" }, [
            SubmitVoteBox({
              id: "dulCollect",
              color: "dul",
              title: "Were the data use limitations in the Data Use Letter accurately converted to structured limitations?",
              isDisabled: "isFormDisabled",
              voteStatus: this.state.voteStatus,
              action: { label: "Vote", handler: this.submit }
            }),
          ]),
        ]),

        h3({ className: "cm-subtitle" }, ["Data Access Committee Votes"]),

        this.state.dulVoteList.map((row, rIndex) => {
          return h(Fragment, { key: rIndex }, [
            div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
              row.map((vm, vIndex) => {
                return h(Fragment, { key: vIndex }, [
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

      ])
    );
  }
}

export default DulCollect;

