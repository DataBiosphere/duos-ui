import { Component, Fragment } from 'react';
import { div, b, ul, h, li, hr, label, span, hh, a } from 'react-hyperscript-helpers';
import { BaseModal } from '../BaseModal';
import { DAR, Election } from '../../libs/ajax'


export const ApplicationSummaryModal = hh(class ApplicationSummaryModal extends Component {

  constructor(props) {
    super(props);
    this.state = { summary: {} };
    this.state = {
      dataRequestId: null,
      summary: {
        darCode: '',
        principalInvestigator: '',
        researcherName: '',
        status: '',
        rationale: '',
        electionStatus: '',
        institutionName: '',
        projectTitle: '',
        needDOApproval: '',
        datasetDetail: [
        ],
        researchType: [
        ],
        thereDiseases: false,
        diseases: [],
        therePurposeStatements: false,
        purposeStatements: [
        ],
        sensitivePopulation: false,
        requiresManualReview: false
      },
      calledFromAdmin: false,
    }
    this.closeHandler = this.closeHandler.bind(this);
    this.downloadDetail = this.downloadDetail.bind(this);
  };

  closeHandler() {
    this.props.onCloseRequest('summaryModal');
  }

  static async getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.dataRequestId !== undefined 
      && (prevState.dataRequestId === undefined || prevState.dataRequestId === null)) {
      let darDetails = await DAR.getDarModalSummary(nextProps.dataRequestId);
      if (darDetails.status === "pending") {
        darDetails.status = "Pending for review";
      } else if (darDetails.status === "rejected") {
        darDetails.status = "Non-Bonafide researcher";
      } else {
        darDetails.status = "Bonafide researcher";
      }
      if (darDetails.rationale !== null && darDetails.rationale !== '' && darDetails.rationale !== undefined) {
        darDetails.rationaleCheck = true;
      } else {
        darDetails.rationaleCheck = false;
      }

      return {
        dataRequestId: nextProps.dataRequestId,
        summary: darDetails,
        calledFromAdmin: nextProps.calledFromAdmin
      };
    }
  }

  async downloadDetail() {
    Election.downloadDatasetVotesForDARElection(this.state.dataRequestId, "datasetVotesSummary.txt");
  }

  render() {

    const { summary } = this.state;

    return (

      BaseModal({
        id: "applicationSummaryModal",
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        color: "access",
        type: "informative",
        iconSize: 'none',
        title: "Application Summary",
        description: 'Data Access Request Application Summary',
        action: { label: "Close", handler: this.closeHandler }
      },
        [
          div({ className: "summary" }, [
            div({ className: "row" }, [
              label({ id: "lbl_darCode", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Data Access Request ID"]),
              div({ id: "txt_darCode", className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [summary.darCode]),
            ]),

            div({ className: "row" }, [
              label({ id: "lbl_PI", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Principal Investigator"]),
              div({ id: "txt_PI", className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [summary.principalInvestigator]),
            ]),

            div({ className: "row" }, [
              label({ id: "lbl_researcher", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Researcher"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [
                div({}, [summary.researcherName]),
                div({ id: "txt_status", isRendered: summary.electionStatus !== 'Closed' }, [
                  span({ className: "bold" }, ["Status: "]),
                  summary.status
                ]),
                div({ id: "txt_comment", isRendered: summary.rationaleCheck && summary.status === "bonafideResearcher" }, [
                  span({ className: "bold" }, ["Comment: "]),
                  summary.rationale
                ]),
                div({ id: "txt_rationale", isRendered: summary.rationaleCheck && summary.status !== "bonafideResearcher" }, [
                  span({ className: "bold" }, ["Rationale: "]),
                  summary.rationale
                ])
              ]),
            ]),

            div({ className: "row" }, [
              label({ id: "lbl_institution", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Institution Name"]),
              div({ id: "txt_institution", className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [summary.institutionName]),
            ]),

            div({ className: "row" }, [
              label({ id: "lbl_projectTitle", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Project Title"]),
              div({ id: "txt_projectTitle", className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [summary.projectTitle]),
            ]),

            div({ className: "row" }, [
              hr({}),
              label({ id: "lbl_dataset", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Dataset(s)"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [
                ul({}, [
                  Object.entries(summary.datasetDetail).map((row, Index) => {
                    return h(Fragment, { key: Index }, [
                      li({ id: "txt_dataset" + Index }, [b({}, [row[Index]]), " ", row[Index + 1]]),
                      div({ isRendered: this.state.calledFromAdmin && summary.needDOApproval !== 'Approval not needed.' }, [summary.needDOApproval]),
                      div({ isRendered: this.state.calledFromAdmin && (summary.needDOApproval === 'Approved by Data Owner(s).' || summary.needDOApproval === 'Denied by Data Owner(s).') }, [
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
              label({ id: "lbl_typeResearch", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Type of research"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [
                ul({}, [
                  summary.researchType.map((rt, Index) => {
                    return h(Fragment, { key: Index }, [
                      li({ id: "txt_typeResearch" + Index }, [b({}, [rt.title]), " ", rt.description]),
                    ])
                  })
                ]),
              ]),
            ]),

            div({ isRendered: summary.thereDiseases === true, className: "row" }, [
              hr({}),
              label({ id: "lbl_disease", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Disease area(s)"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [
                ul({}, [
                  summary.diseases.map((disease, Index) => {
                    return h(Fragment, { key: Index }, [
                      li({ id: "txt_disease" + Index }, [disease])
                    ])
                  })
                ]),
              ]),
            ]),

            div({ isRendered: summary.therePurposeStatements === true, className: "row" }, [
              hr({}),
              label({ id: "lbl_statement", className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Purpose Statement"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [
                ul({}, [
                  summary.purposeStatements.map((rt, Index) => {
                    return h(Fragment, { key: Index }, [
                      li({ id: "txt_statement" + Index, className: rt.manualReview ? 'cancel-color' : '' }, [
                        b({}, [rt.title]), " ", rt.description
                      ])
                    ])
                  })
                ]),
              ]),
            ]),

            div({ id: "txt_sensitivePopulation", isRendered: summary.sensitivePopulation === true, className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 alert-danger cancel-color" }, [
              "This research involves studying a sensitive population and requires manual review."
            ]),

            div({ id: "txt_manualReview", isRendered: summary.requiresManualReview === true && summary.sensitivePopulation === false, className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 alert-danger cancel-color" }, [
              "This research requires manual review."
            ])
          ])
        ])
    );
  }
});
