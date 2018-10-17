import { Component, Fragment } from 'react';
import { div, button, i, span, b, a, hr, h4, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { CollapsiblePanel } from '../components/CollapsiblePanel';
import { SingleResultBox } from '../components/SingleResultBox';
import { CollectResultBox } from '../components/CollectResultBox';
import { Election, Files } from '../libs/ajax';
import { Storage } from '../libs/storage';
import { Config } from '../libs/config';
import { LoadingIndicator } from '../components/LoadingIndicator';

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

  componentDidMount() {
    const currentUser = Storage.getCurrentUser();
    this.setState({
      loading: true,
      currentUser: currentUser,
      electionId: this.props.match.params.electionId,
    }, () => {
      this.voteInfo();
    });
  }

  back() {
    this.props.history.goBack();
  }

  async voteInfo() {
    let electionReview = await Election.findReviewedElections(this.state.electionId);
    if (typeof electionReview === 'undefined') {
      this.props.history.push('/reviewd_cases');
    }
    
    if (electionReview.election.finalRationale === 'null') {
      electionReview.election.finalRationale = '';
    }

    this.setState({
      electionReview: electionReview,
      consentName: electionReview.consent.name,
      election: electionReview.election,
      dul: electionReview.election.dataUseLetter,
      downloadUrl: await Config.getApiUrl() + 'consent/' + electionReview.consent.consentId + '/dul',
      dulName: electionReview.election.dulName,
      sDul: electionReview.election.translatedUseRestriction,
      finalRationale: electionReview.election.finalRationale,

      status: electionReview.election.status,
      finalVote: electionReview.election.finalVote,
      dulVoteList: this.chunk(electionReview.reviewVote, 2),
      chartData: this.getGraphData(electionReview.reviewVote),
      consentGroupName: electionReview.consent.groupName,
      consentId: electionReview.election.referenceId,
    }, () => {
      this.setState({
        loading: false,
      });
    });
  }

  getGraphData(reviewVote) {
    let yes = 0;
    let no = 0;
    let empty = 0;
    for (var i = 0; i < reviewVote.length; i++) {
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
    const chartData = [
      ['Results', 'Votes'],
      ['YES', yes],
      ['NO', no],
      ['Pending', empty]
    ];
    return chartData;
  }

  initialState() {
    return {
      loading: true,
    };
  }

  downloadDUL = (e) => {
    Files.getDulFileByElectionId(this.state.electionReview.election.referenceId, this.state.electionReview.election.electionId, this.state.electionReview.election.dulName);
  };

  render() {

    if (this.state.loading) { return LoadingIndicator(); }

    const { chartData } = this.state;

    const consentData = span({ className: "consent-data" }, [
      b({ className: "pipe", isRendered: this.state.consentGroupName }, [this.state.consentGroupName]),
      this.state.consentName
    ]);

    return (

      div({ className: "container container-wide" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-md-9 col-sm-9 col-xs-12 no-padding" }, [
            PageHeading({ id: "recordsDul", imgSrc: "/images/icon_dul.png", iconSize: "medium", color: "dul", title: "Data Use Limitations - Results Record", description: consentData }),
          ]),
          div({ className: "col-lg-2 col-md-3 col-sm-3 col-xs-12 no-padding" }, [
            a({ id: "btn_back", onClick: () => this.back(), className: "btn-primary btn-back" }, [
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
              button({ id: "btn_downloadDataUseLetter", className: "col-lg-6 col-md-6 col-sm-6 col-xs-12 btn-secondary btn-download-pdf hover-color", onClick: this.downloadDUL }, ["Download Data Use Letter"]),
            ])
          ]),

          div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 panel panel-primary cm-boxes" }, [
            div({ className: "panel-heading cm-boxhead dul-color" }, [
              h4({}, ["Structured Limitations"]),
            ]),
            div({ id: "panel_structuredDul", className: "panel-body cm-boxbody translated-restriction",  dangerouslySetInnerHTML: { __html: this.state.sDul } }, [])
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
              vote: this.state.election.finalVote,
              voteDate: this.state.election.finalVoteDate,
              rationale: this.state.election.finalRationale,
              chartData: chartData
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
            ]),
        ]),
      ])
    );
  }
}

export default DulResultRecords;

