import { Component, Fragment } from 'react';
import { div, b, ul, h, li, hr, button, label, span, hh, a } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { DataSet } from '../../libs/ajax'

let USER_ID = 5;

export const ApplicationSummaryModal = hh(class ApplicationSummaryModal extends Component {

  constructor() {
    super();
    this.state = {
      summary: {
        darCode: 'XYZ-1000',
        principalInvestigator: 'Nadya Lopez Zalba',
        researcherName: 'Nadya Researcher',
        status: 'bonafideResearcher',
        rationale: 'just because',
        electionStatus: '',
        institutionName: 'Belatrix',
        projectTitle: 'MyFirstProject',
        needDOApproval: 'Approved by Data Owner(s).',
        datasetDetail: [
          { key: "SC-20156", data: "Dataset Name" }
        ],
        researchType: [
          { title: "Type Title 1", description: "Description description description description description description" },
          { title: "Type Title 2", description: "Description description description description" }
        ],
        thereDiseases: true,
        diseases: ['disease1', 'disease2', 'disease3'],
        therePurposeStatements: false,
        purposeStatements: [
          { title: "Purpose Title 1", description: "Purpose Description 1", manualReview: true },
          { title: "Purpose Title 2", description: "Purpose Description 2", manualReview: false },
          { title: "Purpose Title 3", description: "Purpose Description 3", manualReview: true },
          { title: "Purpose Title 4", description: "Purpose Description 4", manualReview: false },
        ],
        sensitivePopulation: false,
        requiresManualReview: false
      },
      calledFromAdmin: true,
    }

    this.closeHandler = this.closeHandler.bind(this);
    this.OKHandler = this.OKHandler.bind(this);
  };

  OKHandler() {
    // this is the method for handling OK click
    // we might do something here, adding a user for instance
    // or delegate it to the parent....
  }

  closeHandler() {
    // this is the method to handle Cancel click
  }

  render() {

    const { summary } = this.state;

    return (

      BaseModal({
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        color: "access",
        type: "informative",
        iconSize: 'none',
        title: "Application Summary",
        description: 'Data Access Request Application Summary',
        action: { label: "Close", handler: this.OKHandler }
      },
        [
          div({ className: "summary" }, [
            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Data Access Request ID"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [summary.darCode]),
            ]),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Principal Investigator"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [summary.principalInvestigator]),
            ]),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Researcher"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [
                div({}, [summary.researcherName]),
                div({ isRendered: summary.electionStatus !== 'Closed', className: "bold" }, [
                  "Status: ",
                  summary.status
                ]),
                div({ isRendered: summary.status === "bonafideResearcher", className: "bold" }, [
                  // "ApplicationModal.rationaleCheck() && summary.status === bonafideResearcher"
                  "Comment: ",
                  summary.rationale
                ]),
                div({ isRendered: summary.status !== "bonafideResearcher", className: "bold" }, [
                  // "ApplicationModal.rationaleCheck() && summary.status !== bonafideResearcher"
                  "Rationale: ",
                  summary.rationale
                ])
              ]),
            ]),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Institution Name"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [summary.institutionName]),
            ]),

            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Project Title"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [summary.projectTitle]),
            ]),

            div({ className: "row" }, [
              hr({}),
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Dataset(s)"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [
                ul({}, [
                  summary.datasetDetail.map((row, Index) => {
                    return h(Fragment, { key: Index }, [
                      li({}, [b({}, [row.key]), " ", row.data]),
                      div({ isRendered: this.calledFromAdmin && summary.needDOApproval !== 'Approval not needed.' }, [summary.needDOApproval]),
                      div({ isRendered: this.calledFromAdmin && (summary.needDOApproval === 'Approved by Data Owner(s).' || summary.needDOApproval === 'Denied by Data Owner(s).') }, [
                        span({ className: "glyphicon glyphicon-download-alt hover-color", style: { "marginRight": "10px" } }),
                        a({ onClick: this.downloadDetail, className: "bold hover-color" }, ["Download Datasets Vote Summary"]),
                      ])
                    ])
                  })
                ])
              ])
            ]),

            div({ className: "row" }, [
              hr({}),
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Type of research"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [
                ul({}, [
                  summary.researchType.map((rt, Index) => {
                    return h(Fragment, { key: Index }, [
                      li({}, [b({}, [rt.title]), " ", rt.description]),
                    ])
                  })
                ]),
              ]),
            ]),

            div({ isRendered: summary.thereDiseases === true, className: "row" }, [
              hr({}),
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Disease area(s)"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [
                ul({}, [
                  summary.diseases.map((disease, Index) => {
                    return h(Fragment, { key: Index }, [
                      li({}, [disease])
                    ])
                  })
                ]),
              ]),
            ]),

            div({ isRendered: summary.therePurposeStatements === true, className: "row" }, [
              hr({}),
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Purpose Statement"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [
                ul({}, [
                  summary.purposeStatements.map((rt, Index) => {
                    return h(Fragment, { key: Index }, [
                      li({ className: rt.manualReview ? 'cancel-color' : '' }, [
                        b({}, [rt.title]), " ", rt.description
                      ])
                    ])
                  })
                ]),
              ]),
            ]),

            div({ isRendered: summary.sensitivePopulation === true, className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 alert-danger cancel-color" }, [
              "This research involves studying a sensitive population and requires manual review."
            ]),

            div({ isRendered: summary.requiresManualReview === true && summary.sensitivePopulation === false, className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 alert-danger cancel-color" }, [
              "This research requires manual review."
            ])
          ])
        ])
    );
  }
});
