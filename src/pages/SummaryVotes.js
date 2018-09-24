import { Component } from 'react';
import { div, hr, hh, span, a, h3 } from 'react-hyperscript-helpers';
import { StatsBox } from '../components/StatsBox';
import { PageHeading } from '../components/PageHeading';
import { PageSubHeading } from '../components/PageSubHeading';
import { PendingCases, StatFiles, Summary } from '../libs/ajax'
import { LoadingIndicator } from '../components/LoadingIndicator';

export const SummaryVotes = hh(class SummaryVotes extends Component {


  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      loading: true,
      chartData: this.initialState()
    };

    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.addDul = this.addDul.bind(this);
  }

  componentDidMount() {
    this.getSummaryInfo();
  }

  initialState() {
    return {
      accessTotal: [
        ['Results', 'Votes'],
        ['Reviewed cases', 0],
        ['Pending cases', 0]
      ],
      accessReviewed: [
        ['Results', 'Votes'],
        ['Yes', 0],
        ['No', 0]
      ],
      dulTotal: [
        ['Results', 'Votes'],
        ['Reviewed cases', 0],
        ['Pending cases', 0]
      ],
      dulReviewed: [
        ['Results', 'Votes'],
        ['Yes', 0],
        ['No', 0]
      ],
      RPTotal: [
        ['Results', 'Votes'],
        ['Reviewed cases', 0],
        ['Pending cases', 0]
      ],
      RPReviewed: [
        ['Results', 'Votes'],
        ['Yes', 0],
        ['No', 0]
      ],
      VaultReviewed: [
        ['Results', 'Votes'],
        ['Yes', 0],
        ['No', 0]
      ],
      Agreement: [
        ['Results', 'Votes'],
        ['Agreement', 0],
        ['Disagreement', 0]
      ]
    };
  }

  getSummaryInfo() {
    PendingCases.findSummary({}, {}).then( summaryData => {
      this.setState(prev => {
        prev.chartData = summaryData;
        prev.loading = false;
        return prev;
      });
    });
  }

  handleOpenModal() {
    this.setState({ showModal: true });
  }

  handleCloseModal() {
    this.setState({ showModal: false });
  }

  render() {

    if (this.state.loading) { return LoadingIndicator(); }

    return (
      div({ className: "container" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({
              id: "summaryVotes",
              imgSrc: "/images/icon_statistics.png",
              iconSize: "large",
              color: "common",
              title: "Votes Statistics",
              description: "Summary statistics on the Data Access Committee and votes system"
            }),
          ]),
        ]),
        hr({ className: "section-separator" }),

        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-md-9 col-sm-8 col-xs-12 no-padding" }, [
            PageSubHeading({
              id: "summaryVotesDul",
              imgSrc: "/images/icon_dul.png",
              color: "dul",
              title: "Data Use Limitations Statistics",
              description: "Summary of votes on whether the consent limitations were accurately converted into a structured format"
            }),
          ]),

          a({
            id: "btn_downloadStatsDul",
            className: "col-lg-2 col-md-3 col-sm-4 col-xs-12 search-wrapper download-button dul-background",
            onClick: () => this.getFile("TranslateDUL"),
            isRendered: "roles.showStatistics($root.currentUser.roles, $root.userRoles)"
          }, [
              span({}, ["Download stats"]),
              span({ className: "glyphicon glyphicon-download caret-margin", "aria-hidden": "true" }),
            ]),
        ]),

        div({ className: "row fsi-row-lg-level fsi-row-md-level" }, [
          StatsBox({
            id: "allCasesDul",
            subtitle: "All Cases",
            data: this.state.chartData.dulTotal,
            options: 'dul',
            className: "result_chart"
          }),

          StatsBox({
            id: "reviewedCasesDul",
            subtitle: "Reviewed cases results",
            data: this.state.chartData.dulReviewed,
            options: 'dul',
            className: "result_chart"
          })
        ]),

        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-md-9 col-sm-8 col-xs-12 no-padding" }, [
            PageSubHeading({
              id: "summaryVotesAccess",
              imgSrc: "/images/icon_access.png",
              color: "access",
              title: "Data Access Statistics",
              description: "Summary of votes on whether the researcher should be allowed to access a research study"
            }),
          ]),

          a({
            id: "btn_downloadStatsAccess",
            className: "col-lg-2 col-md-3 col-sm-4 col-xs-12 search-wrapper download-button access-background",
            onClick: () => this.getFile("DataAccess"),
            isRendered: "roles.showStatistics($root.currentUser.roles, $root.userRoles)"
          }, [
              span({}, ["Download stats"]),
              span({ className: "glyphicon glyphicon-download caret-margin", "aria-hidden": "true" }),
            ]),
        ]),

        h3({ className: "statsSubtitle access-color" }, ["1. Should data access be granted to this applicant ?"]),

        div({ className: "row fsi-row-lg-level fsi-row-md-level" }, [
          StatsBox({
            id: "allCasesAccess",
            subtitle: "All Cases",
            data: this.state.chartData.accessTotal,
            options: 'access',
            className: "result_chart",
            clickHandler: () => this.getDarReport('reviewed', 'ReviewedDataAccessRequests.tsv'),
            buttonLabel: 'Download all cases'
          }),
          StatsBox({
            id: "reviewedCasesAccess",
            subtitle: "Reviewed cases results",
            data: this.state.chartData.accessReviewed,
            options: 'access',
            className: "result_chart",
            clickHandler: () => this.getDarReport('approved', 'ApprovedDataAccessRequests.tsv'),
            buttonLabel: 'Download approved cases'
          })
        ]),

        hr({ className: "box-separator" }),

        h3({ className: "stats-box-title access-color" }, ["2. Was the research purpose accurately converted to a structured format ?"]),

        div({ className: "row fsi-row-lg-level fsi-row-md-level" }, [
          StatsBox({
            id: "allCasesRP",
            subtitle: "All Cases",
            data: this.state.chartData.RPTotal,
            options: 'access',
            className: "result_chart"
          }),
          StatsBox({
            id: "reviewedCasesRP",
            subtitle: "Reviewed cases results",
            data: this.state.chartData.RPReviewed,
            options: 'access',
            className: "result_chart"
          }),
        ]),

        hr({ className: "box-separator" }),

        h3({ className: "stats-box-title access-color" }, ["Evaluation of automated matching in comparison with the Data Access Committee decision"]),

        div({ className: "row fsi-row-lg-level fsi-row-md-level" }, [
          StatsBox({
            id: "automatedCases",
            subtitle: "Cases reviewed by automated matching",
            data: this.state.chartData.VaultReviewed,
            options: 'access',
            className: "result_chart"
          }),
          StatsBox({
            id: "agreement",
            subtitle: "Agreement between automated matching and Data Access Committee",
            data: this.state.chartData.Agreement,
            options: 'access',
            className: "result_chart"
          }),
        ]),
      ])
    )
  }


  addDul() {

  }

  addUser() {

  }

  addDataSets() {

  }

  setTimeout() {

  }

  addOntology() {

  }

  getFile(fileName) {
    const URI = `/consent/cases/summary/file?fileType=${fileName}`;
    if (fileName === 'TranslateDUL') {
      Summary.getFile(URI, 'summary.txt');
    } else {
      Summary.getFile(URI, 'DAR_summary.txt');
    }
  }

  getDarReport(fileType, fileName) {
    StatFiles.getDARsReport(fileType, fileName);
  }

});
