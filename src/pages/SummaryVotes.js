import { Component } from 'react';
import { div, hr, hh, span, a, h3 } from 'react-hyperscript-helpers';
import { StatsBox } from '../components/StatsBox';
import { PageHeading } from '../components/PageHeading';
import { PageSubHeading } from '../components/PageSubHeading';
import { Summary } from '../libs/ajax'

export const SummaryVotes = hh(class SummaryVotes extends Component {

  chartData = {
    accessTotal: [
      ['Results', 'Votes'],
      ['Reviewed cases', 50],
      ['Pending cases', 18]
    ],
    accessReviewed: [
      ['Results', 'Votes'],
      ['Yes', 40],
      ['No', 10]
    ],
    dulTotal: [
      ['Results', 'Votes'],
      ['Reviewed cases', 200],
      ['Pending cases', 45]
    ],
    dulReviewed: [
      ['Results', 'Votes'],
      ['Yes', 90],
      ['No', 110]
    ],
    RPTotal: [
      ['Results', 'Votes'],
      ['Reviewed cases', 80],
      ['Pending cases', 10]
    ],
    RPReviewed: [
      ['Results', 'Votes'],
      ['Yes', 40],
      ['No', 40]
    ],
    VaultReviewed: [
      ['Results', 'Votes'],
      ['Yes', 100],
      ['No', 50]
    ],
    Agreement: [
      ['Results', 'Votes'],
      ['Agreement', 40],
      ['Disagreement', 10]
    ]
  };

  constructor(props) {
    super(props);
    this.state = {
      showModal: false
    };
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.addDul = this.addDul.bind(this);
  }

  handleOpenModal() {
    this.setState({ showModal: true });
  }

  handleCloseModal() {
    this.setState({ showModal: false });
  }

  render() {    
    
    return (
      div({ className: "container" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({ id: "summaryVotes", imgSrc: "/images/icon_statistics.png", iconSize: "large", color: "common", title: "Votes Statistics", description: "Summary statistics on the Data Access Committee and votes system" }),
          ]),
        ]),
        hr({ className: "section-separator" }),

        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-md-9 col-sm-8 col-xs-12 no-padding" }, [
            PageSubHeading({ imgSrc: "/images/icon_dul.png", color: "dul", title: "Data Use Limitations Statistics", description: "Summary of votes on whether the consent limitations were accurately converted into a structured format" }),
          ]),

          a({
            className: "col-lg-2 col-md-3 col-sm-4 col-xs-12 search-reviewed download-button dul-background",
            onClick: () => this.getFile("TranslateDUL"),
            isRendered: "roles.showStatistics($root.currentUser.roles, $root.userRoles)"
          }, [
              span({}, ["Download stats"]),
              span({ className: "glyphicon glyphicon-download caret-margin", "aria-hidden": "true" }),
            ]),
        ]),

        div({ className: "row fsi-row-lg-level fsi-row-md-level" }, [
          StatsBox({
            subtitle: "All Cases",
            data: this.chartData.dulTotal,
            options: 'dul',
            className: "result_chart"
          }),

          StatsBox({
            subtitle: "Reviewed cases results",
            data: this.chartData.dulReviewed,
            options: 'dul',
            className: "result_chart"
          })
        ]),

        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-md-9 col-sm-8 col-xs-12 no-padding" }, [
            PageSubHeading({ imgSrc: "/images/icon_access.png", color: "access", title: "Data Access Statistics", description: "Summary of votes on whether the researcher should be allowed to access a research study" }),
          ]),

          a({
            className: "col-lg-2 col-md-3 col-sm-4 col-xs-12 search-reviewed download-button access-background",
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
            subtitle: "All Cases",
            data: this.chartData.accessTotal,
            options: 'access',
            className: "result_chart",
            clickHandler: () => this.getDarReport('reviewed', 'ReviewedDataAccessRequests.tsv'),
            buttonLabel: 'Download all cases'
          }),
          StatsBox({
            subtitle: "Reviewed cases results",
            data: this.chartData.accessReviewed,
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
            subtitle: "All Cases",
            data: this.chartData.RPTotal,
            options: 'access',
            className: "result_chart"
          }),
          StatsBox({
            subtitle: "Reviewed cases results",
            data: this.chartData.RPReviewed,
            options: 'access',
            className: "result_chart"
          }),
        ]),

        hr({ className: "box-separator" }),

        h3({ className: "stats-box-title access-color" }, ["Evaluation of automated matching in comparison with the Data Access Committee decision"]),

        div({ className: "row fsi-row-lg-level fsi-row-md-level" }, [
          StatsBox({
            subtitle: "Cases reviewed by automated matching",
            data: this.chartData.VaultReviewed,
            options: 'access',
            className: "result_chart"
          }),
          StatsBox({
            subtitle: "Agreement between automated matching and Data Access Committee",
            data: this.chartData.Agreement,
            options: 'access',
            className: "result_chart"
          }),
        ]),
      ])
    )
  }


  addDul() {
    console.log('addDul')
  }

  addUser() {
    console.log('addUser');
  }

  addDataSets() {
    console.log('addDataSets');
  }

  setTimeout() {
    console.log('setTimeout');
  }

  addOntology() {
    console.log('addOntology');
  }

  getFile(fileName) {
    const URI = `/consent/cases/summary/file?fileType=${fileName}`;
    Summary.getFile(URI).then(
      blob => {
        if (blob.size !== 0) {
          this.createBlobFile('summary.txt', blob);
        }
      }
    );
  }

  getDarReport(fileType, fileName) {
    console.log("getDarReport");
    const URI = `/dataRequest/${fileType}`;
    Summary.getFile(URI).then(
      blob => {
        if (blob.size !== 0) {
          this.createBlobFile(fileName, blob)
        }
      }
    );
  }

  createBlobFile(fileName, blob) {
    const url = window.URL.createObjectURL(blob);
    let a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  }

});
