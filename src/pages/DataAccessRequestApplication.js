import { Component } from 'react';
import { div, hr, h2, br, small, img, a, span, form } from 'react-hyperscript-helpers';

class DataAccessRequestApplication extends Component {

  constructor(props) {
    super(props);
    this.state = {
      showModal: false
    };
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
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
        div({ id: "form-container" }, [
          div({ className: "row fsi-row-lg-level fsi-row-md-level title-wrapper" }, [
            img({ src: "/images/icon_add_access.png", alt: "Create DAR icon", className: "cm-icons main-icon-title" }),
            h2({ className: "main-title margin-sm access-color" }, ["Data Access Request Application"]),
            br({}),
            div({ className: "main-title-description" },
              [
                "The section below includes a series of questions intended to allow our Data Access Committee to evaluate a newly developed semi-automated process of data access control."
              ]),
            hr({ className: "section-separator" }),
            div({ className: "row no-margin" }, [
              div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [
                div({ className: "row fsi-row-lg-level fsi-row-md-level multi-step-buttons no-margin" }, [
                  a({
                    "ng-class": "{active: RPApplication.$state.includes('rp_application.step1')}", "ui-sref": ".step1",
                    className: "col-lg-3 col-md-6 col-sm-6 col-xs-12 access-color jumbotron box-vote multi-step-title"
                  }, [
                      small({}, ["Step 1"]),
                      "Researcher Information",
                      span({ className: "glyphicon glyphicon-chevron-right", "aria-hidden": "true" }, [])
                    ]),
                  a({
                    "ng-class": "{active: RPApplication.$state.includes('rp_application.step2')}", "ui-sref": ".step2",
                    className: "col-lg-3 col-md-6 col-sm-6 col-xs-12 access-color jumbotron box-vote multi-step-title"
                  }, [
                      small({}, ["Step 2"]),
                      "Data Access Request",
                      span({ className: "glyphicon glyphicon-chevron-right", "aria-hidden": "true" }, [])
                    ]),
                  a({
                    "ng-class": "{active: RPApplication.$state.includes('rp_application.step3')}", "ui-sref": ".step3",
                    className: "col-lg-3 col-md-6 col-sm-6 col-xs-12 access-color jumbotron box-vote multi-step-title"
                  }, [
                      small({}, ["Step 3"]),
                      "Research Purpose Statement",
                      span({ className: "glyphicon glyphicon-chevron-right", "aria-hidden": "true" }, [])
                    ]),
                  a({
                    "ng-class": "{active: RPApplication.$state.includes('rp_application.step4')}", "ui-sref": ".step4",
                    className: "col-lg-3 col-md-6 col-sm-6 col-xs-12 access-color jumbotron box-vote multi-step-title"
                  }, [
                      small({}, ["Step 4"]),
                      "Attestation Statement",
                      span({ className: "glyphicon glyphicon-chevron-right", "aria-hidden": "true" }, [])
                    ])

                ]),
                form({ name: "form", "novalidate": true }, [
                  div({ id: "form-views", "ui-view": true }, [])
                ])
              ])
            ])
          ])
        ])
      ])
    );
  }
}

export default DataAccessRequestApplication;
