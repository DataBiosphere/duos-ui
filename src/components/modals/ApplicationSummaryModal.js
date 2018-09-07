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
        datasetDetail: [],
        researchType: [],
        purposeStatements: [],
        diseases: ['disease1', 'disease2', 'disease3']
      }
    }

    this.closeHandler = this.closeHandler.bind(this);
    this.afterOpenHandler = this.afterOpenHandler.bind(this);
    this.OKHandler = this.OKHandler.bind(this);
  };

  OKHandler() {
    // this is the method for handling OK click
    // we might do something here, adding a user for instance
    // or delegate it to the parent....
    // DO SOMETHING HERE ...

    // and call parent's OK Handler
    this.props.onOKRequest('addDataset');
  }

  closeHandler() {
    // this is the method to handle Cancel click
    // could do some cleaning here 
    // or delegate it to the parent
    // we need to use it to close the
    // DO SOMETHING HERE ...

    // and call parent's close handler
    this.props.onCloseRequest('addDataset');
  }

  afterOpenHandler() {
    // DO SOMETHING HERE ...

    // and call parent's after open handler
    this.props.onAfterOpen('addDataset');

  }

  render() {

    const { summary } = this.state;

    return (

      BaseModal({
        showModal: this.props.showModal,
        onRequestClose: this.closeHandler,
        onAfterOpen: this.afterOpenHandler,
        imgSrc: "/images/icon_dataset_add.png",
        color: "dataset",
        iconSize: 'large',
        title: "Application Summary",
        description: 'Data Access Request Application Summary',
        action: { label: "Add", handler: this.OKHandler }
      },
        [

          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 admin-modal-content app-summary-modal-content app-summary-modal-first-content" }, [
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
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [summary.researcherName]),
              div({ isRendered: "electionStatus !== 'Closed'" }, [
                b({}, ["Status: "]),
                summary.status,
                div({ isRendered: "ApplicationModal.rationaleCheck() && summary.status === bonafideResearcher" }, [b({}, ["Comment:"]), summary.rationale]),
                div({ isRendered: "ApplicationModal.rationaleCheck() && summary.status !== bonafideResearcher" }, [b({}, ["Rationale:"]), summary.rationale]),
              ]),

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
          hr({}),

          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 app-summary-modal-content" }, [
            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Datasets"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [
                ul({}, [
                  summary.datasetDetail.map(row => {
                    return h(Fragment, {}, [
                      li({}, [
                        b({}, [row.key]), "   ", row.data]),
                      div({ isRendered: "calledFromAdmin && summary.needDOApproval !== 'Approval not needed.'" }, [summary.needDOApproval]),
                      div({ isRendered: "calledFromAdmin && (summary.needDOApproval === 'Approved by Data Owner(s).' || summary.needDOApproval === 'Denied by Data Owner(s).')" }, [
                        span({ className: "glyphicon glyphicon-download-alt access-color", style: { "marginRight": "10px" } }, []),
                        a({ onClick: "ApplicationModal.downloadDetail()", style: { "cursor": "pointer" } }, ["Download Datasets Vote Summary"]),
                      ])
                    ])
                  }),
                ]),
              ]),
            ]),
            hr({}),
          ]),
          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 app-summary-modal-content" }, [
            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Type of research"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [
                ul({}, [
                  summary.researchType.map(rt => {
                    return h(Fragment, {}, [
                      li({}, [
                        b({}, [rt.title]),
                        rt.description
                      ])
                    ])
                  })
                ]),
              ]),
            ]),
            hr({}),
          ]),
          div({ isRendered: "summary.thereDiseases === true", className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 app-summary-modal-content" }, [
            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Disease area(s)"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [
                ul({}, [
                  summary.diseases.map(disease => {
                    return h(Fragment, {}, [
                      li({}, [
                        disease
                      ])
                    ])
                  })
                ]),
              ]),
            ]),
            hr({}),
          ]),
          div({ isRendered: "summary.therePurposeStatements === true", className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 app-summary-modal-content" }, [
            div({ className: "row" }, [
              label({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-4 control-label access-color" }, ["Purpose Statement"]),
              div({ className: "col-lg-9 col-md-9 col-sm-9 col-xs-8 response-label" }, [
                ul({}, [
                  summary.purposeStatements.map(rt => {
                    return h(Fragment, {}, [
                      li({ className: rt.manualReview ? 'cancel-color' : '' }, [
                        b({}, [rt.title]),
                        rt.description
                      ])
                    ])
                  })
                ]),
              ]),
            ]),
            div({ isRendered: "summary.sensitivePopulation === true", className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 alert-danger cancel-color" }, [
              "This research involves studying a sensitive population and requires manual review."
            ]),
            hr({}),
          ]),
          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 app-summary-modal-content" }, [
            div({ isRendered: "summary.requiresManualReview === true && summary.sensitivePopulation === false", className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 alert-danger cancel-color" }, [
              "This research requires manual review."
            ]),
          ]),

          div({ className: "modal-footer admin-modal-footer app-summary-modal-footer" }, [
            button({ className: "col-lg-3 col-md-3 col-sm-4 col-xs-6 btn access-background", onClick: "ApplicationModal.cancel()" }, ["Close"]),
          ])
        ])
    );
  }
});
