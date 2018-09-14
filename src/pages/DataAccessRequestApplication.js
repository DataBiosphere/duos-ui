import { Component } from 'react';
import { div, hr, br, h, small, h3, a, span, form, ol, ul, li, label, button, input, textarea, img } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { YesNoRadioGroup } from '../components/YesNoRadioGroup';
import { OptionsRadioGroup } from '../components/OptionsRadioGroup';
import { Alert } from '../components/Alert';
import Select, { createFilter } from 'react-select';
import { ConfirmationDialog } from '../components/ConfirmationDialog';


import './DataAccessRequestApplication.css';

const filterConfig = {
  ignoreCase: true,
  ignoreAccents: false,
  trim: false,
  matchFromStart: false,
};

class DataAccessRequestApplication extends Component {

  datasetOptions = [
    { label: 'ORSP-12245| Dataset XYZ aaa', value: "10000", clearableValue: true },
    { label: 'ORSP-22245| Dataset XYZ aab', value: "10100", clearableValue: true },
    { label: 'ORSP-32245| Dataset XYZ abb', value: "10200", clearableValue: true },
    { label: 'ORSP-42245| Dataset XYZ bbb', value: "10300", clearableValue: true },
    { label: 'ORSP-52245| Dataset XYZ baa', value: "10400", clearableValue: true },
    { label: 'ORSP-62245| Dataset XYZ bba', value: "10500", clearableValue: true },
    { label: 'ORSP-72245| Dataset XYZ bbb', value: "10600", clearableValue: true },
    { label: 'ORSP-82245| Dataset XYZ caa', value: "10700", clearableValue: true },
    { label: 'ORSP-92245| Dataset XYZ cca', value: "10800", clearableValue: true },
    { label: 'ORSP-02245| Dataset XYZ ccc', value: "10900", clearableValue: true },
  ];

  diseaseOptions = [
    { label: 'Lung Cancer', value: 'OID-100100', clearableValue: true },
    { label: 'Blefaritis', value: 'OID-100200', clearableValue: true },
    { label: 'Sphynal Cancer', value: 'OID-100300', clearableValue: true },
    { label: 'Eye Cancer', value: 'OID-100400', clearableValue: true },
    { label: 'Adenocarcinoma', value: 'OID-100500', clearableValue: true },
    { label: 'Miocarditis', value: 'OID-100500', clearableValue: true },
    { label: 'Pancreatic cancer', value: 'OID-100700', clearableValue: true },
  ];

  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      step: 1,
      formData: {
        dar_code: null,
        rus: 'this is RUS aaa',
        non_tech_rus: 'non tech rus...aaa',
        other: true,
        othertext: 'este es otro texto  ...',
        eraAuthorized: false,
        nihUsername: "username",
        eraExpirationCount: 15,
        isLinkedinAuthorized: false,
        linkedinProfile: "profile",
        datasets: [
          {
            label: 'ORSP-12245| Dataset XYZ aaa',
            value: '10000',
            clearableValue: true
          },
          {
            label: 'ORSP-62245| Dataset XYZ bba',
            value: '10500',
            clearableValue: true
          }
        ],
        ontologies: [
          {
            label: 'Blefaritis',
            value: 'OID-100200',
            clearableValue: true
          },
          {
            label: 'Adenocarcinoma',
            value: 'OID-100500',
            clearableValue: true
          },
          {
            label: 'Pancreatic cancer',
            value: 'OID-100700',
            clearableValue: true
          }
        ],
        onegender: true,
        diseases: true,
        methods: true,
        controls: true,
        population: true,
        hmb: true,
        poa: true,
        forProfit: true,
        gender: 'M',
        pediatric: true,
        illegalbehave: false,
        addiction: true,
        sexualdiseases: false,
        stigmatizediseases: true,
        vulnerablepop: false,
        popmigration: true,
        psychtraits: false,
        nothealth: true,
        investigator: 'Diego A. Gil',
        researcher: 'Diego A. Gil',
        projectTitle: 'Sample Data Access Review'
      },
      completed: true,
      showDialogSubmit: false,
      showDialogSave: false,
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

  handleChange = (e) => {
    const field = e.target.name;
    const value = e.target.value;
    this.setState(prev => { prev.formData[field] = value; return prev; });
  }

  handleCheckboxChange = (e) => {
    const field = e.target.name;
    const value = e.target.checked;
    this.setState(prev => { prev.formData[field] = value; return prev; });
  }

  handleRadioChange = (e, field, value) => {
    this.setState(prev => { prev.formData[field] = value; return prev; });
  }

  step1 = (e) => {
    this.setState(prev => {
      prev.step = 1;
      return prev;
    });
  }

  step2 = (e) => {
    this.setState(prev => {
      prev.step = 2;
      return prev;
    });
  }

  step3 = (e) => {
    this.setState(prev => {
      prev.step = 3;
      return prev;
    });
    window.scrollTo(0, 0);
  }

  step4 = (e) => {
    this.setState(prev => {
      prev.step = 4;
      return prev;
    });
    window.scrollTo(0, 0);
  }

  attestAndSave = (e) => {
    // implement full save on mongodb here ... after validations
    console.log(JSON.stringify(this.state.formData, null, 2));
    this.setState({ showDialogSubmit: true });
  }

  partialSave = (e) => {
    // implement partial save on mongodb here ... no validations
    console.log(JSON.stringify(this.state.formData, null, 2));
    this.setState({ showDialogSave: true });
  }

  dialogHandlerSubmit = (answer) => (e) => {
    this.setState({ showDialogSubmit: false });
  };
  
  dialogHandlerSave = (answer) => (e) => {
    this.setState({ showDialogSave: false });
  };

  onOntologiesChange = (data, action) => {
    console.log('data', data);
    console.log('action', action);
    this.setState(prev => {
      prev.formData.ontologies = data;
      return prev;
    });
  }

  onDatasetsChange = (data, action) => {
    console.log('data', data);
    console.log('action', action);
    this.setState(prev => {
      prev.formData.datasets = data;
      return prev;
    });
  }

  render() {

    let atLeastOneCheckboxChecked = false;
    let showValidationMessages = false;
    let problemSavingRequest = false;

    let step1 = {
      inputResearcher: {
        invalid: false
      },
      inputInvestigator: {
        invalid: false
      },
      inputTitle: {
        invalid: false
      }
    }

    let step2 = {
      inputDatasets: {
        invalid: false
      },
      inputRUS: {
        invalid: false
      },
      inputNonTechRUS: {
        invalid: false
      },
      inputOther: {
        invalid: false
      }
    }

    let step3 = {
      inputPurposes: {
        invalid: false
      }
    }

    const profileUnsubmitted = span({}, [
      "Please submit ",
      a({ href: "/researcher_profile", className: "hover-color" }, ["Your Profile"]),
      " to be able to create a Data Access Request"
    ]);

    const profileSubmitted = span({}, [
      "Please make sure ",
      a({ href: "/researcher_profile", className: "hover-color" }, ["Your Profile"]),
      " is updated, as it will be submited with your DAR Application"
    ]);


    return (

      div({ className: "container " }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({
              imgSrc: "/images/icon_add_access.png", iconSize: "medium", color: "access", title: "Data Access Request Application",
              description: "The section below includes a series of questions intended to allow our Data Access Committee to evaluate a newly developed semi-automated process of data access control."
            }),
          ]),
        ]),
        hr({ className: "section-separator" }),
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [
            div({ className: "row fsi-row-lg-level fsi-row-md-level multi-step-buttons no-margin" }, [

              a({
                onClick: this.step1,
                className: "col-lg-3 col-md-6 col-sm-6 col-xs-12 access-color jumbotron box-vote multi-step-title "
                  + (this.state.step === 1 ? 'active' : '')
              }, [
                  small({}, ["Step 1"]),
                  "Researcher Information",
                  span({ className: "glyphicon glyphicon-chevron-right", "aria-hidden": "true" }, [])
                ]),

              a({
                onClick: this.step2,
                className: "col-lg-3 col-md-6 col-sm-6 col-xs-12 access-color jumbotron box-vote multi-step-title "
                  + (this.state.step === 2 ? 'active' : '')
              }, [
                  small({}, ["Step 2"]),
                  "Data Access Request",
                  span({ className: "glyphicon glyphicon-chevron-right", "aria-hidden": "true" }, [])
                ]),

              a({
                onClick: this.step3,
                className: "col-lg-3 col-md-6 col-sm-6 col-xs-12 access-color jumbotron box-vote multi-step-title "
                  + (this.state.step === 3 ? 'active' : '')
              }, [
                  small({}, ["Step 3"]),
                  "Research Purpose Statement",
                  span({ className: "glyphicon glyphicon-chevron-right", "aria-hidden": "true" }, [])
                ]),

              a({
                onClick: this.step4,
                className: "col-lg-3 col-md-6 col-sm-6 col-xs-12 access-color jumbotron box-vote multi-step-title "
                  + (this.state.step === 4 ? 'active' : '')
              }, [
                  small({}, ["Step 4"]),
                  "Attestation Statement",
                  span({ className: "glyphicon glyphicon-chevron-right", "aria-hidden": "true" }, [])
                ])

            ]),
          ]),
        ]),
        form({ name: "form", "noValidate": true }, [
          div({ id: "form-views" }, [

            //------------------ Step 1--------------------------------------
            div({ isRendered: this.state.step === 1 }, [

              div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [

                div({ isRendered: this.state.completed === false, className: "rp-alert" }, [
                  Alert({ id: "profileUnsubmitted", type: "danger", title: profileUnsubmitted })
                ]),
                div({ isRendered: this.state.completed === true, className: "rp-alert" }, [
                  Alert({ id: "profileSubmitted", type: "info", title: profileSubmitted })
                ]),

                h3({ className: "rp-form-title access-color" }, ["1. Researcher Information"]),

                div({ className: "form-group" }, [
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-title-question" }, ["1.1 Researcher*"]),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    input({
                      type: "text",
                      name: "researcher",
                      id: "inputResearcher",
                      value: this.state.formData.investigator,
                      onChange: this.handleChange,
                      disabled: false,
                      className: step1.inputResearcher.invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control',
                      required: true
                    }),
                    span({ isRendered: (step1.inputResearcher.invalid) && (showValidationMessages), className: "cancel-color required-field-error-span" }, ["Required field"]),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group checkbox" }, [
                    input({
                      type: "checkbox",
                      id: "checkCollaborator",
                      name: "checkCollaborator",
                      className: "checkbox-inline rp-checkbox",
                      disable: this.state.formData.dar_code !== null
                    }),
                    label({ className: "regular-checkbox rp-choice-questions", htmlFor: "checkCollaborator" }, ["I am a collaborator of the PI/Data Custodian for the selected dataset(s)"]),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-6 col-xs-12 rp-group" }, [
                    label({ className: "control-label" }, [
                      "NIH eRA Commons ID*",
                    ]),

                    div({ isRendered: this.state.formData.eraAuthorized !== true }, [
                      a({ onClick: "RPApplication.redirectToNihLogin()", target: "_blank", className: "auth-button eRACommons" }, [
                        div({ className: "logo" }, []),
                        span({}, ["Authenticate your account"])
                      ])
                    ]),

                    div({ isRendered: (this.state.formData.eraAuthorized === true) && (this.state.formData.dar_code === null) }, [
                      div({ className: "col-lg-12 col-md-12 col-sm-6 col-xs-12 rp-group" }, [
                        div({ className: "auth-id" }, [this.state.formData.nihUsername]),
                        button({
                          onClick: "deleteNihAccount()", className: "close auth-clear",
                          // tooltip-class: "tooltip-class-dark", tooltip-trigger tooltip-placement: "right" tooltip:"Clear account"
                        }, [
                            span({ className: "glyphicon glyphicon-remove-circle" })
                          ])
                      ]),

                      div({ className: "col-lg-12 col-md-12 col-sm-6 col-xs-12 no-padding" }, [
                        div({ isRendered: this.state.formData.eraExpirationCount !== 0, className: "default-color display-block" }, ["Your NIH authentication will expire in " + this.state.formData.eraExpirationCount + " days"]),
                        div({ isRendered: this.state.formData.eraExpirationCount === 0, className: "default-color display-block" }, ["Your NIH authentication expired"]),
                      ]),
                      div({ isRendered: this.state.formData.dar_code !== null, className: "col-lg-12 col-md-12 col-sm-6 col-xs-12 no-padding" }, [
                        div({ className: "auth-id" }, [this.state.formData.nihUsername])
                      ]),
                    ]),
                    span({ isRendered: (this.state.formData.eraAuthorized !== true) && showValidationMessages, className: "cancel-color required-field-error-span" }, ["Required field"])
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-6 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-title-question default-color" }, [
                      "Researcher Identification*",
                      span({}, ["Please authenticate either your LinkedIn or your ORCID iD"]),
                    ])
                  ]),

                  div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12 rp-group" }, [
                    div({ isRendered: this.state.formData.isLinkedinAuthorized !== true }, [
                      a({ onClick: "linkedinAuth()", target: "_blank" }, [
                        img({ className: "auth-button linkedin" }),
                      ])
                    ]),
                    div({ isRendered: (this.state.formData.isLinkedinAuthorized) && (this.state.formData.linkedinProfile) }, [
                      a({ onClick: "openProfile()", target: "_blank", className: "hover-color auth-link" }, ["LinkedIn Profile Link"]),
                      button({ isRendered: this.state.formData.dar_code === undefined, onClick: "removeLinkedinProfile()", className: "close auth-clear", }, ["LinkedIn Profile Link"]),
                      // tooltip-class:"tooltip-class-dark", tooltip-trigger tooltip-placement:"right", tooltip:"Clear account"
                    ]),
                    span({ isRendered: (this.state.formData.isLinkedinAuthorized !== true) && showValidationMessages, className: "cancel-color required-field-error-span no-padding" }, ["Required field"]),
                  ]),
                ]),

                div({ className: "form-group" }, [
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-title-question" }, [
                      "1.2 Principal Investigator* ",
                      span({}, ["By typing in the name of the principal investigator, I certify that he or she is aware of this research study."]),]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    input({
                      type: "text",
                      name: "investigator",
                      id: "inputInvestigator",
                      value: this.state.formData.investigator,
                      onChange: this.handleChange,
                      disabled: false,
                      className: step1.inputInvestigator.invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control',
                      required: true
                    }),
                    span({ className: "cancel-color required-field-error-span", isRendered: (step1.inputInvestigator.invalid) && (showValidationMessages) }, ["Required field"]),
                  ]),
                ]),

                div({ className: "form-group" }, [
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-title-question" }, [
                      "1.3 Descriptive Title of Project* ",
                      span({}, ["Please note that coordinated requests by collaborating institutions should each use the same title."]),
                    ]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group" }, [
                    input({
                      type: "text",
                      name: "projectTitle",
                      id: "inputTitle",
                      value: this.state.formData.projectTitle,
                      onChange: this.handleChange,
                      className: step1.inputTitle.invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control',
                      required: true,
                      disabled: this.state.formData.dar_code !== null
                    }),
                    span({ className: "cancel-color required-field-error-span", isRendered: step1.inputTitle.invalid && showValidationMessages }, ["Required field"]),
                  ]),
                ]),

                ul({ className: "pager" }, [
                  div({ className: "row multi-step-pager" }, [
                    li({ className: "next f-right multi-step-next" }, [
                      a({ onClick: this.step2, className: "access-background" }, ["Next Step", span({ className: "glyphicon glyphicon-chevron-right", "aria-hidden": "true" }, []),
                      ]),
                    ]),
                    li({ isRendered: this.state.formData.dar_code === null, className: "next f-right multi-step-save" }, [
                      a({ onClick: this.partialSave }, [span({ className: "access-color" }, ["Save"]),]),
                    ]),
                  ]),
                ]),

              ]),
            ]),

            //------------------ Step 2--------------------------------------
            div({ isRendered: this.state.step === 2 }, [
              div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [

                h3({ className: "rp-form-title access-color" }, ["2. Data Access Request"]),

                div({ className: "form-group" }, [
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-title-question" }, [
                      "2.1 Select Dataset(s)*",
                      span({}, ["Please start typing the Dataset Name, Sample Collection ID, or PI of the dataset(s) for which you would like to request access:"]),
                    ]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    h(Select, {
                      id: "inputDatasets",
                      isMulti: true,
                      autoFocus: true,
                      value: this.state.formData.datasets,
                      onChange: this.onDatasetsChange,
                      options: this.datasetOptions, // search_datasets($query)"
                      placeholder: "Dataset Name, Sample Collection ID, or PI",
                      className: "basic-multi-select",
                      classNamePrefix: "select",
                      required: true
                      // filterOption: createFilter(filterConfig),
                    }),
                    span({ className: "cancel-color required-field-error-span", isRendered: step2.inputDatasets.invalid && showValidationMessages }, ["Required field"]),
                  ]),

                ]),

                div({ className: "form-group" }, [
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-title-question" }, [
                      "2.2 Research use statement (RUS)* ",
                      span({}, ["A RUS is a brief description of the applicant’s proposed use of the dataset(s). The RUS will be reviewed by all parties responsible for data covered by this Data Access Request. Please note that if access is approved, you agree that the RUS, along with your name and institution, will be included on this website to describe your research project to the public.",
                        br(),
                        "Please enter your RUS in the area below. The RUS should be one or two paragraphs in length and include research objectives, the study design, and an analysis plan (including the phenotypic characteristics that will be tested for association with genetic variants). If you are requesting multiple datasets, please describe how you will use them. Examples of RUS can be found at ",
                        a({ target: "_blank", href: "http://epi.grants.cancer.gov/dac/examples.html" }, ["here"], ".")
                      ]),
                    ]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    textarea({
                      value: this.state.formData.rus, onChange: this.handleChange,
                      name: "rus",
                      id: "inputRUS",
                      className: step2.inputRUS.invalid && showValidationMessages ? ' required-field-error form-control' : 'form-control',
                      maxLength: "2200",
                      rows: "6",
                      required: true,
                      placeholder: "Please limit your RUS to 2200 characters.",
                      disabled: this.state.formData.dar_code !== null
                    }),
                    span({ className: "cancel-color required-field-error-span", isRendered: step2.inputRUS.invalid && showValidationMessages }, ["Required field"]),
                  ]),
                ]),

                div({ className: "form-group" }, [
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-title-question" }, [
                      "2.3 Non-Technical summary* ",
                      span({}, ["Please enter below a non-technical summary of your RUS suitable for understanding by the general public (written at a high school reading level or below)."
                      ]),
                    ]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    textarea({
                      value: this.state.formData.non_tech_rus,
                      onChange: this.handleChange,
                      name: "non_tech_rus",
                      id: "inputNonTechRUS",
                      className: step2.inputNonTechRUS.invalid && showValidationMessages ? 'required-field-error form-control' : 'form-control',
                      maxLength: "1100",
                      rows: "3",
                      required: true,
                      placeholder: "Please limit your non-technical summary to 1100 characters.",
                      disabled: this.state.formData.dar_code !== null
                    }),
                    span({ className: "cancel-color required-field-error-span", isRendered: step2.inputNonTechRUS.invalid && showValidationMessages }, ["Required field"]),
                  ]),
                ]),

                div({ className: "form-group" }, [
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-title-question" }, [
                      "2.4 Type of Research* ",
                      span({}, ["Select all applicable options."]),
                    ]),
                  ]),
                  div({ className: "row no-margin" }, [
                    span({ className: "cancel-color required-field-error-span", isRendered: !atLeastOneCheckboxChecked && showValidationMessages, style: { 'marginLeft': '15px' } }, ["At least one of the fields is required"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    div({ className: "checkbox" }, [
                      input({
                        checked: this.state.formData.diseases, onClick: this.handleCheckboxChange, name: 'diseases', id: "checkDiseases", type: "checkbox", className: "checkbox-inline rp-checkbox",
                        disabled: (this.state.formData.dar_code !== null)
                      }),
                      label({ className: "regular-checkbox rp-choice-questions", htmlFor: "checkDiseases" }, [
                        span({}, ["2.4.1 Disease-related studies: "]),
                        "The primary purpose of the research is to learn more about a particular disease or disorder (e.g., type 2 diabetes), a trait (e.g., blood pressure), or a set of related conditions (e.g., autoimmune diseases, psychiatric disorders)."
                      ]),
                    ]),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    div({ className: "checkbox" }, [
                      input({
                        checked: this.state.formData.methods, onClick: this.handleCheckboxChange, id: "checkMethods", type: "checkbox", disabled: (this.state.formData.dar_code !== null),
                        className: "checkbox-inline rp-checkbox", name: "methods"
                      }),
                      label({ className: "regular-checkbox rp-choice-questions", htmlFor: "checkMethods" }, [
                        span({}, ["2.4.2 Methods development and validation studies: "]),
                        "The primary purpose of the research is to develop and/or validate new methods for analyzing or interpreting data (e.g., developing more powerful methods to detect epistatic, gene-environment, or other types of complex interactions in genome-wide association studies). Data will be used for developing and/or validating new methods."
                      ]),
                    ]),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    div({ className: "checkbox" }, [
                      input({
                        checked: this.state.formData.controls, onClick: this.handleCheckboxChange, id: "checkControls", type: "checkbox", disabled: (this.state.formData.dar_code !== null),
                        className: "checkbox-inline rp-checkbox", name: "controls"
                      }),
                      label({ className: "regular-checkbox rp-choice-questions", htmlFor: "checkControls" }, [
                        span({}, ["2.4.3 Controls: "]),
                        "The reason for this request is to increase the number of controls available for a comparison group (e.g., a case-control study)."
                      ]),
                    ]),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    div({ className: "checkbox" }, [
                      input({
                        checked: this.state.formData.population, onClick: this.handleCheckboxChange, id: "checkPopulation", type: "checkbox", disabled: (this.state.formData.dar_code !== null),
                        className: "checkbox-inline rp-checkbox", name: "population"
                      }),
                      label({ className: "regular-checkbox rp-choice-questions", htmlFor: "checkPopulation" }, [
                        span({}, ["2.4.4 Population structure or normal variation studies: "]),
                        "The primary purpose of the research is to understand variation in the general population (e.g., genetic substructure of a population)."
                      ]),
                    ]),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    div({ className: "checkbox" }, [
                      input({
                        checked: this.state.formData.hmb, onClick: this.handleCheckboxChange, id: "checkHmb", type: "checkbox", className: "checkbox-inline rp-checkbox",
                        name: "hmb", disabled: (this.state.formData.dar_code !== null)
                      }),
                      label({ className: "regular-checkbox rp-choice-questions", htmlFor: "checkHmb" }, [
                        span({}, ["2.4.5 Health/medical/biomedical research: "]),
                        "The primary purpose of the study is to investigate a health/medical/biomedical (or biological) phenomenon or condition."
                      ]),
                    ]),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    div({ className: "checkbox" }, [
                      input({
                        checked: this.state.formData.poa, onClick: this.handleCheckboxChange, id: "checkPoa", type: "checkbox", className: "checkbox-inline rp-checkbox",
                        name: "poa", disabled: (this.state.formData.dar_code !== null)
                      }),
                      label({ className: "regular-checkbox rp-choice-questions", htmlFor: "checkPoa" }, [
                        span({}, ["2.4.6 Population origins or ancestry research: "]),
                        "The outcome of this study is expected to provide new knowledge about the origins of a certain population or its ancestry."
                      ]),
                    ]),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    div({ className: "checkbox" }, [
                      input({
                        checked: this.state.formData.other, onClick: this.handleCheckboxChange, id: "checkOther", type: "checkbox", className: "checkbox-inline rp-checkbox",
                        name: "other", disabled: (this.state.formData.dar_code !== null)
                      }),
                      label({ className: "regular-checkbox rp-choice-questions", htmlFor: "checkOther" }, [span({}, ["2.4.7 Other:"]),]),
                    ]),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    input({
                      type: "text",
                      name: "othertext",
                      id: "inputOtherText",
                      value: this.state.formData.othertext,
                      onChange: this.handleChange,
                      required: this.state.formData.other, className: step2.inputOther.invalid && this.state.formData.other && showValidationMessages ? ' required-field-error form-control' : 'form-control',
                      disabled: this.state.formData.dar_code !== null || this.state.formData.other !== true,
                      placeholder: "Please specify if selected"
                    }),
                    span({ className: "cancel-color required-field-error-span", isRendered: step2.inputOther.invalid && this.state.formData.other && showValidationMessages }, ["Required field"]),
                  ]),
                ]),

                div({ className: "form-group" }, [
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-title-question" }, [
                      "2.5 Please state the disease area(s) this study focus on ",
                      span({}, ["Choose any number of Disease Ontology ; or none."]),
                    ]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group " }, [
                    h(Select, {
                      // defaultValue:{[colourOptions[2], colourOptions[3]]},
                      isMulti: true,
                      value: this.state.formData.ontologies,
                      onChange: this.onOntologiesChange,
                      options: this.diseaseOptions, //search_ontologies($query)"
                      placeholder: "Plase select diseases ...",
                      className: "basic-multi-select",
                      classNamePrefix: "select",
                      filterOption: createFilter(filterConfig)
                    }),
                  ]),
                ]),

                ul({ className: "pager" }, [
                  div({ className: "row multi-step-pager" }, [
                    li({ className: "previous f-left multi-step-prev" }, [
                      a({ onClick: this.step1, className: "access-background" }, [
                        span({ className: "glyphicon glyphicon-chevron-left", "aria-hidden": "true" }, []), "Previous Step"]),
                    ]),

                    li({ className: "next f-right multi-step-next" }, [
                      a({ onClick: this.step3, className: "access-background" }, [
                        "Next Step",
                        span({ className: "glyphicon glyphicon-chevron-right", "aria-hidden": "true" }, []),]),
                    ]),

                    li({ isRendered: this.state.formData.dar_code === null, className: "next f-right multi-step-save access-color" }, [
                      a({ onClick: this.partialSave }, [span({ className: "access-color" }, ["Save"]),]),
                    ]),
                  ]),
                ]),
              ]),
            ]),

            //------------------ Step 3--------------------------------------
            div({ isRendered: this.state.step === 3 }, [
              div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [

                h3({ className: "rp-form-title access-color" }, ["3. Research Purpose Statement"]),

                div({ className: "form-group" }, [
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-title-question" }, ["3.1 In order to ensure appropriate review, please answer the questions below:"]),
                  ]),
                  div({ className: "row no-margin" }, [
                    span({ className: "cancel-color required-field-error-span", isRendered: step3.inputPurposes.invalid && showValidationMessages, style: { 'marginLeft': '15px' } }, ["All fields are required"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({
                      className: "control-label rp-choice-questions"
                      // "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right", tooltip: "*"
                    }, ["3.1.1 Will this data be used exclusively or partially for a commercial purpose?"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    YesNoRadioGroup({ value: this.state.formData.forProfit, onChange: this.handleRadioChange, name: 'forProfit', 
                    disabled: (this.state.formData.dar_code !== null), required: true }),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-choice-questions" }, ["3.1.2 Please indicate if this study is limited to one gender?"]),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    YesNoRadioGroup({ value: this.state.formData.onegender, onChange: this.handleRadioChange, name: 'onegender',
                     disabled: (this.state.formData.dar_code !== null), required: true }),
                    div({ isRendered: this.state.formData.onegender === 'true' || this.state.formData.onegender === true,
                     className: "multi-step-fields", disabled: (this.state.formData.dar_code !== null) }, [
                      span({}, ["Please specify"]),
                      OptionsRadioGroup({
                        value: this.state.formData.gender,
                        optionLabels: ['Female', "Male"],
                        optionValues: ['F', 'M'],
                        name: 'gender',
                        onChange: this.handleRadioChange
                      }),
                    ]),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-choice-questions" }, ["3.1.3 Please indicate if this study is restricted to a  pediatric population (under the age of 18)?"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    YesNoRadioGroup({ value: this.state.formData.pediatric, onChange: this.handleRadioChange, name: 'pediatric', disabled: (this.state.formData.dar_code !== null), required: true }),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-choice-questions" }, ["3.1.4 Does the research aim involve the study of illegal behaviors (violence, domestic abuse, prostitution, sexual victimization)?"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    YesNoRadioGroup({ value: this.state.formData.illegalbehave, onChange: this.handleRadioChange, name: 'illegalbehave', disabled: (this.state.formData.dar_code !== null), required: true }),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-choice-questions" }, ["3.1.5 Does the research aim involve the study of alcohol or drug abuse, or abuse of other addictive products?"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    YesNoRadioGroup({ value: this.state.formData.addiction, onChange: this.handleRadioChange, name: 'addiction', disabled: (this.state.formData.dar_code !== null), required: true }),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-choice-questions" }, ["3.1.6 Does the research aim involve the study of sexual preferences or sexually transmitted diseases?"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    YesNoRadioGroup({ value: this.state.formData.sexualdiseases, onChange: this.handleRadioChange, name: 'sexualdiseases', disabled: (this.state.formData.dar_code !== null), required: true }),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-choice-questions" }, ["3.1.7 Does the research aim involve the study of any stigmatizing illnesses?"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    YesNoRadioGroup({ value: this.state.formData.stigmatizediseases, onChange: this.handleRadioChange, name: 'stigmatizediseases', disabled: (this.state.formData.dar_code !== null), required: true }),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({
                      className: "control-label rp-choice-questions",
                      // "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right", tooltip: "*", "tooltip-container": "body", "tooltip-animation": "false"
                    }, ["3.1.8 Does the study target a vulnerable population as defined in 456 CFR (children, prisoners, pregnant women, mentally disabled persons, or [\"SIGNIFICANTLY\"] economically or educationally disadvantaged persons)?"]),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    YesNoRadioGroup({ value: this.state.formData.vulnerablepop, onChange: this.handleRadioChange, name: 'vulnerablepop', disabled: (this.state.formData.dar_code !== null), required: true }),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-choice-questions" }, ["3.1.9 Does the research aim involve the study of Population Origins/Migration patterns?"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    YesNoRadioGroup({ value: this.state.formData.popmigration, onChange: this.handleRadioChange, name: 'popmigration', disabled: (this.state.formData.dar_code !== null), required: true }),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-choice-questions" }, ["3.1.10 Does the research aim involve the study of psychological traits, including intelligence, attention, emotion?"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    YesNoRadioGroup({ value: this.state.formData.psychtraits, onChange: this.handleRadioChange, name: 'psychtraits', disabled: (this.state.formData.dar_code !== null), required: true }),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-choice-questions" }, ["3.1.11 Does the research correlate ethnicity, race, or gender with genotypic or other phenotypic variables, for purposes beyond biomedical or health-related research, or in ways that are not easily related to Health?"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group" }, [
                    YesNoRadioGroup({ value: this.state.formData.nothealth, onChange: this.handleRadioChange, name: 'nothealth', disabled: (this.state.formData.dar_code !== null), required: true }),
                  ]),
                ]),

                ul({ className: "pager" }, [
                  div({ className: "row multi-step-pager" }, [
                    li({ className: "previous f-left multi-step-prev" }, [
                      a({ onClick: this.step2, className: "access-background" }, [span({
                        className: "glyphicon glyphicon-chevron-left", "aria-hidden": "true"
                      }, []), "Previous Step"]),
                    ]),

                    li({ className: "next f-right multi-step-next" }, [
                      a({ onClick: this.step4, className: "access-background" }, [
                        "Next Step",
                        span({ className: "glyphicon glyphicon-chevron-right", "aria-hidden": "true" }, []),]),
                    ]),

                    li({ isRendered: this.state.formData.dar_code === null, className: "next f-right multi-step-save access-color" }, [
                      a({ onClick: this.partialSave }, [span({ className: "access-color" }, ["Save"]),]),
                    ]),
                  ]),
                ]),
              ]),
            ]),
            //------------------ Step 4--------------------------------------
            div({ isRendered: this.state.step === 4 }, [
              div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [

                h3({ className: "rp-form-title access-color" }, ["4. Attestation Statement"]),

                div({ className: "row no-margin form-group" }, [
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-title-question" }, ["I attest to the following:"]),
                  ]),

                  ol({ className: "rp-accept-statement rp-last-group" }, [
                    li({}, ["Data will only be used for approved research"]),
                    li({}, ["Data confidentiality will be protected and the investigator will never make any attempt at \"re-identification\""]),
                    li({}, ["All applicable laws, local institutional policies, and terms and procedures specific to the study’s data access policy will be followed."]),
                    li({}, ["No attempts will be made to identify individual study participants from whom data were obtained."]),
                    li({}, ["Data will not be sold or shared with third parties."]),
                    li({}, ["The contributing investigator(s) who conducted the original study and the funding organizations involved in supporting the original study will be acknowledged in publications resulting from the analysis of those data."]),
                  ]),
                ]),

                div({ className: "row no-margin" }, [
                  div({ isRendered: showValidationMessages, className: "rp-alert" }, [
                    Alert({ id: "formErrors", type: "danger", title: "Please, complete all required fields." })
                  ]),

                  div({ isRendered: problemSavingRequest, className: "rp-alert" }, [
                    Alert({ id: "problemSavingRequest", type: "danger", title: "Some errors occurred, Data Access Request Application couldn't be created." })
                  ]),
                ]),

                ul({ className: "pager", style: { "marginTop": "0 !important" } }, [
                  div({ className: "row multi-step-pager" }, [
                    li({ className: "previous f-left multi-step-prev" }, [
                      a({ onClick: this.step3, className: "access-background" }, [
                        span({ className: "glyphicon glyphicon-chevron-left", "aria-hidden": "true" }), "Previous Step"]),
                    ]),

                    li({ isRendered: this.state.formData.dar_code === null, className: "next f-right multi-step-next" }, [
                      a({ onClick: this.attestAndSave, className: "access-background bold" }, ["Attest and Send"]),
                    ]),
                    ConfirmationDialog({
                      title: 'Data Request Confirmation', color: 'access', showModal: this.state.showDialogSubmit, action: { label: "Yes", handler: this.dialogHandlerSubmit }
                    }, [div({ className: "dialog-description" }, ["Are you sure you want to send this Data Access Request Application?"]),]),

                    li({ isRendered: this.state.formData.dar_code === null, className: "next f-right multi-step-save access-color" }, [
                      a({ onClick: this.partialSave }, [span({ className: "access-color" }, ["Save"]),]),
                    ]),
                    ConfirmationDialog({
                      title: 'Save changes?', color: 'access', showModal: this.state.showDialogSave, action: { label: "Yes", handler: this.dialogHandlerSave }
                    }, [div({ className: "dialog-description" }, ["Are you sure you want to save this Data Access Request? Previous changes will be overwritten."]),]),
                  ])
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


