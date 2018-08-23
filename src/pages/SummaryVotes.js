import { Component } from 'react';
import { div, hr, hh, h2, img, span, a, h3 } from 'react-hyperscript-helpers';
import { StatsBox } from '../components/StatsBox';
import { PageHeading } from '../components/PageHeading';
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
                        PageHeading({
                          imgSrc: "../images/icon_statistics.png",
                          iconSize: "large",
                          color: "common",
                          title: "Votes Statistics",
                          description: "Summary statistics on the Data Access Committee and votes system"
                        }),
                    ]),
                ]),
              hr({ className: "section-separator" }),

              div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [

                div({ className: "row stats-title" },
                  [
                    h2({ className: "col-lg-10 col-md-9 col-sm-8 col-xs-12 pvotes-box-title dul-color" },
                      [
                        img({ src: "/images/icon_dul.png", alt: "Translation icon", className: "pvotes-icons" }),
                        "Data Use Limitations Statistics",
                        div({ className: "pvotes-box-title-description" },
                          [
                            "Summary of votes on whether the consent limitations were accurately converted into a structured format"
                          ]),
                      ]),
                    a({
                        onClick: () => this.getFile("TranslateDUL"),
                        ngshow: "roles.showStatistics($root.currentUser.roles, $root.userRoles)",
                        className: "col-lg-2 col-md-3 col-sm-4 col-xs-12 search-reviewed download-button dul-background"
                      },
                      [
                        span({
                        }, ["Download stats"]),
                        span({ className: "glyphicon glyphicon-download caret-margin", "aria-hidden": "true" }),
                      ])
                  ]),

                div({ className: "row fsi-row-lg-level fsi-row-md-level " }, [
                  StatsBox({
                    subtitle: "All Cases", data: this.chartData.dulTotal, options: 'dulTotal',
                    className: "result_chart", iconName:"glyphicon-chevron-right"
                  }),
                  StatsBox({
                    subtitle: "Reviewed cases results", data: this.chartData.dulReviewed, options: 'dulReviewed',
                    className: "result_chart"
                  })
                ]),

                div({ className: "row stats-title" },
                  [
                    h2({ className: "col-lg-10 col-md-9 col-sm-8 col-xs-12 pvotes-box-title access-color" },
                      [
                        img({ src: "/images/icon_access.png", alt: "Access icon", className: "pvotes-icons" }),
                        "Data Access Statistics",
                        div({ className: "pvotes-box-title-description" },
                          [
                            "Summary of votes on whether the researcher should be allowed to access a research study"
                          ]),
                      ]),
                    a({
                        onClick: () => this.getFile("DataAccess"),
                        ngshow: "roles.showStatistics($root.currentUser.roles, $root.userRoles)",
                        name: "Download", className: "col-lg-2 col-md-3 col-sm-4 col-xs-12 download-button search-reviewed access-background"
                      },
                      [
                        span({}, ["Download stats"]),
                        span({ className: "glyphicon glyphicon-download caret-margin", "aria-hidden": "true" })
                      ]),
                  ]),

                h3({ className: "stats-box-title no-margin" }, [
                  div({ className: "cm-inside-box-title access-color" }, [
                    "1. Should data access be granted to this applicant ?"
                  ]),
                ]),

                div({ className: "row fsi-row-lg-level fsi-row-md-level" }, [
                  StatsBox({
                    subtitle: "All Cases", data: this.chartData.accessTotal, options: 'accessTotal',
                    className: "result_chart", clickHandler: () => this.getDarReport('reviewed', 'ReviewedDataAccessRequests.tsv'), buttonLabel: 'Download all cases'
                  }),
                  StatsBox({
                    subtitle: "Reviewed cases results", data: this.chartData.accessReviewed, options: 'accessReviewed',
                    className: "result_chart", clickHandler: () => this.getDarReport('approved', 'ApprovedDataAccessRequests.tsv'), buttonLabel: 'Download approved cases'
                  })
                ]),


                hr({ className: "box-separator" }),

                h3({ className: "stats-box-title no-margin" }, [
                  div({ className: "cm-inside-box-title access-color" }, ["2. Was the research purpose accurately converted to a structured format ?"]),
                ]),
                div({ className: "row fsi-row-lg-level fsi-row-md-level" }, [
                  StatsBox({
                    subtitle: "All Cases", data: this.chartData.RPTotal, options: 'RPTotal',
                    className: "result_chart"
                  }),
                  StatsBox({
                    subtitle: "Reviewed cases results", data: this.chartData.RPReviewed, options: 'RPReviewed',
                    className: "result_chart"
                  }),

                ]),


                hr({ className: "box-separator" }),

                h3({ className: "stats-box-title no-margin" }, [
                  div({ className: "cm-inside-box-title access-color" }, ["Evaluation of automated matching in comparison with the Data Access Committee decision"]),
                ]),
                div({ className: "row fsi-row-lg-level fsi-row-md-level" }, [
                  StatsBox({
                    subtitle: "All Cases", data: this.chartData.VaultReviewed, options: 'VaultReviewed',
                    className: "result_chart"
                  }),
                  StatsBox({
                    subtitle: "Reviewed cases results", data: this.chartData.Agreement, options: 'Agreement',
                    className: "result_chart"
                  }),

                ])
              ])
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

