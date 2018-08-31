import React, { Component } from 'react';
import { div, hr, h2, br, h, b, small, h3, h4, a, span, form, ol, ul, li, label, button, input, textarea } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { YesNoRadioGroup } from '../components/YesNoRadioGroup';
import Select, { createFilter } from 'react-select';

import './DataAccessRequestApplication.css';

const filterConfig = {
  ignoreCase: true,
  ignoreAccents: false,
  trim: false,
  matchFromStart: false,
}

class DataAccessRequestApplication extends Component {

  focus1;
  focus2;
  focus3;
  focus4;
  selectedOntologies;

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
        rus: 'this is RUS',
        non_tech_rus: 'non tech rus...',
        other: false,
        othertext: '',
        datasets: [],
        ontologies: [],
      }
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
    console.log(e);
    const field = e.target.name;
    const value = e.target.value;
    this.setState(prev => { prev.formData[field] = value; return prev; });
    console.log(JSON.stringify(this.state.formData, null, 2));
  }

  // if (field === "inputInvestigator") { this.setState(prev => { prev.formData.investigator = value; return prev; }) }
  // if (field === "inputInstitution") { this.setState(prev => { prev.formData.institution = value; return prev; }) }
  // if (field === "inputDepartment") { this.setState(prev => { prev.formData.department = value; return prev; }) }
  // if (field === "inputDivision") { this.setState(prev => { prev.formData.division = value; return prev; }) }
  // if (field === "inputAddress1") { this.setState(prev => { prev.formData.address1 = value; return prev; }) }
  // if (field === "inputAddress2") { this.setState(prev => { prev.formData.address2 = value; return prev; }) }
  // if (field === "inputCity") { this.setState(prev => { prev.formData.city = value; return prev; }) }
  // if (field === "inputState") { this.setState(prev => { prev.formData.state = value; return prev; }) }
  // if (field === "inputZipcode") { this.setState(prev => { prev.formData.zipcode = value; return prev; }) }
  // if (field === "inputCountry") { this.setState(prev => { prev.formData.country = value; return prev; }) }
  // if (field === "inputTitle") { this.setState(prev => { prev.formData.projectTile = value; return prev; }) }
  // if (field === "inputRUS") { this.setState(prev => { prev.formData.rus = value; return prev; }) }
  //    if (field==="inputInstitution") { this.setState(prev => { prev.formData.institution = value; return prev; })}
  //    if (field==="inputInstitution") { this.setState(prev => { prev.formData.institution = value; return prev; })}
  //    if (field==="inputInstitution") { this.setState(prev => { prev.formData.institution = value; return prev; })}
  //    if (field==="inputInstitution") { this.setState(prev => { prev.formData.institution = value; return prev; })}
  //    if (field==="inputInstitution") { this.setState(prev => { prev.formData.institution = value; return prev; })}


  step1 = (e) => {
    this.setState(prev => {
      prev.step = 1;
      return prev;
    });
    setTimeout(
      () => {
        this.focus1.current.focus();
      },
      300
    );
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

  }

  partialSave = (e) => {

  }

  componentDidMount() {
    this.focus1 = React.createRef();
    this.focus2 = React.createRef();
    this.focus3 = React.createRef();
    this.focus4 = React.createRef();
  }

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

    let atLeastOneCheckboxChecked = true;
    let showValidationMessages = false;

    let step1 = {
      inputInstitution: {
        invalid: false
      },
      inputInvestigator: {
        invalid: false
      },
      inputDepartment: {
        invalid: false
      },
      inputAddress1: {
        invalid: false
      },
      inputCity: {
        invalid: false
      },
      inputZipCode: {
        invalid: false
      },
      inputCountry: {
        invalid: false
      },
      inputTitle: {
        invalid: false
      }
    }

    let step2 = {
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
                "ui-sref": ".step1",
                onClick: this.step1,
                className: "col-lg-3 col-md-6 col-sm-6 col-xs-12 access-color jumbotron box-vote multi-step-title "
                  + (this.state.step === 1 ? 'active' : '')
              }, [
                  small({}, ["Step 1"]),
                  "Researcher Information",
                  span({ className: "glyphicon glyphicon-chevron-right", "aria-hidden": "true" }, [])
                ]),

              a({
                "ui-sref": ".step2",
                onClick: this.step2,
                className: "col-lg-3 col-md-6 col-sm-6 col-xs-12 access-color jumbotron box-vote multi-step-title "
                  + (this.state.step === 2 ? 'active' : '')
              }, [
                  small({}, ["Step 2"]),
                  "Data Access Request",
                  span({ className: "glyphicon glyphicon-chevron-right", "aria-hidden": "true" }, [])
                ]),

              a({
                "ui-sref": ".step3",
                onClick: this.step3,
                className: "col-lg-3 col-md-6 col-sm-6 col-xs-12 access-color jumbotron box-vote multi-step-title "
                  + (this.state.step === 3 ? 'active' : '')
              }, [
                  small({}, ["Step 3"]),
                  "Research Purpose Statement",
                  span({ className: "glyphicon glyphicon-chevron-right", "aria-hidden": "true" }, [])
                ]),

              a({
                "ui-sref": ".step4",
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
          div({ id: "form-views", "ui-view": "true" }, [

            //------------------ Step 1--------------------------------------
            div({ isRendered: this.state.step === 1 }, [

              div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [
                div({ className: "admin-alerts rp-alerts", isRendered: "!completed" }, [
                          /*alert*/ div({ type: "danger", className: "alert-title cancel-color" }, [
                    h4({}, [
                      "Please submit ",
                      a({ href: "/researcher_profile", className: "hover-color" }, ["Your Profile"]),
                      " to be able to create a Data Access Request"]),
                  ]),
                ]),

                div({ className: "cm-subtitle access-color no-padding" }, [h3({}, ["1. Researcher Information"]),]),

                div({ className: "form-group" }, [
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-title-question" }, [
                      "1.1 Principal Investigator",
                      span({}, ["By typing in the name of the principal investigator, I certify that he or she is aware of this research study."]),]),
                  ]),
                  span({ className: "cancel-color required-field-error-span", isRendered: step1.inputInvestigator.invalid && showValidationMessages }, [
                    span({}, ["* Required field"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    input({
                      ref: this.focus1,
                      value: this.state.formData.investigator, onChange: this.handleChange, type: "text", name: "investigator", id: "inputInvestigator", disabled: false,
                      className: step1.inputInvestigator.invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control', required: true
                    }),
                  ]),
                ]),

                div({ className: "form-group" }, [
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-title-question" }, ["1.2 Organization Information"]),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                    label({ className: "control-label" }, [
                      "Institution Name ",
                      span({ className: "cancel-color required-field-error-span", isRendered: step1.inputInstitution.invalid && showValidationMessages }, [
                        span({}, ["* Required field"]),
                      ]),
                    ]),
                    input({
                      value: this.state.formData.institution, onChange: this.handleChange, type: "text", name: "institution", id: "inputInstitution", disabled: false,
                      className: step1.inputInstitution.invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control',
                      required: "required"
                    }),
                  ]),

                  div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                    label({ className: "control-label" }, [
                      "Department ",
                      span({ className: "cancel-color required-field-error-span", isRendered: step1.inputDepartment.invalid && showValidationMessages }, [
                        span({}, ["* Required field"]),
                      ]),
                    ]),
                    input({
                      value: this.state.formData.department, onChange: this.handleChange, type: "text", name: "department", id: "inputDepartment", disabled: false,
                      className: step1.inputDepartment.invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control',
                      required: "required"
                    }),
                  ]),

                  div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                    label({ className: "control-label" }, ["Division"]),
                    input({ value: this.state.formData.division, onChange: this.handleChange, type: "text", name: "division", id: "inputDivision", className: "form-control", disabled: false }),
                  ]),

                  div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                    label({ className: "control-label" }, [
                      "Street Address 1",
                      span({ className: "cancel-color required-field-error-span", isRendered: step1.inputAddress1.invalid && showValidationMessages }, [
                        span({}, ["* Required field"]),
                      ]),
                    ]),
                    input({
                      value: this.state.formData.address1, onChange: this.handleChange, type: "text", name: "address1", id: "inputAddress1",
                      className: step1.inputAddress1.$invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control',
                      required: "required", disabled: false
                    }),
                  ]),

                  div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                    label({ className: "control-label" }, ["Street Address 2"]),
                    input({ value: this.state.formData.address2, onChange: this.handleChange, type: "text", name: "address2", id: "inputAddress2", className: "form-control", disabled: false }),
                  ]),

                  div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                    label({ className: "control-label" }, ["City",
                      span({ className: "cancel-color required-field-error-span", isRendered: step1.inputCity.invalid && showValidationMessages }, [
                        span({}, ["* Required field"]),
                      ]),
                    ]),
                    input({
                      value: this.state.formData.city, onChange: this.handleChange, type: "text", name: "city", id: "inputCity",
                      className: step1.inputCity.invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control',
                      required: "required", disabled: false
                    }),
                  ]),

                  div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-12" }, [
                    label({ className: "control-label" }, ["State"]),
                    input({ value: this.state.formData.state, onChange: this.handleChange, type: "text", name: "state", id: "inputState", className: "form-control", disabled: false }, [
                    ]),
                  ]),

                  div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-4" }, [
                    label({ className: "control-label" }, ["Zip/Postal Code",
                      span({ className: "cancel-color required-field-error-span", isRendered: step1.inputZipCode.invalid && showValidationMessages }, [
                        span({}, ["* Required field"]),
                      ]),
                    ]),
                    input({
                      value: this.state.formData.zipcode, onChange: this.handleChange, type: "text", name: "zipCode", id: "inputZipCode",
                      className: step1.inputZipCode.invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control',
                      required: "required", disabled: false
                    }),
                  ]),

                  div({ className: "col-lg-8 col-md-8 col-sm-8 col-xs-8 rp-group" }, [
                    label({ className: "control-label" }, ["Country",
                      span({ className: "cancel-color required-field-error-span", isRendered: step1.inputCountry.invalid && showValidationMessages }, [
                        span({}, ["* Required field"]),
                      ]),
                    ]),
                    input({
                      value: this.state.formData.country, onChange: this.handleChange, type: "text", name: "country", id: "inputCountry",
                      className: step1.inputCountry.invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control',
                      required: "required", disabled: false
                    }),
                  ]),
                ]),

                div({ className: "form-group" }, [
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-title-question" }, [
                      "1.3 Descriptive Title of Project",
                      span({}, ["Please note that coordinated requests by collaborating institutions should each use the same title."]),
                    ]),
                  ]),
                  span({ className: "cancel-color required-field-error-span", isRendered: step1.inputTitle.invalid && showValidationMessages }, [
                    span({}, ["* Required field"]),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group" }, [
                    input({
                      value: this.state.formData.projectTitle, onChange: this.handleChange, type: "text", name: "projectTitle", id: "inputTitle",
                      className: step1.inputTitle.invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control',
                      required: "required", disabled: this.state.formData.dar_code !== null
                    }),
                  ]),
                ]),

                ul({ className: "pager wizard" }, [
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
                div({ className: "cm-subtitle access-color no-padding" }, [h3({}, ["2. Data Access Request"])]),
                div({ className: "form-group" }, [
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-title-question" }, [
                      "2.1 Dataset ID",
                      span({}, ["Please type the ID of the datasets you would like to request access to for this study."]),
                    ]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group " }, [

                    h(Select, {
                      isMulti: true,
                      autoFocus: true,
                      value: this.state.formData.datasets,
                      onChange: this.onDatasetsChange,
                      options: this.datasetOptions, // search_datasets($query)"
                      placeholder: "Please select datasets ...",
                      className: "basic-multi-select",
                      classNamePrefix: "select",
                      // filterOption: createFilter(filterConfig),
                    }),

                  ]),
                ]),
                div({ className: "form-group" }, [
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-title-question" }, [
                      "2.2 Research use statement (RUS)",
                      span({}, ["A RUS is a brief description of the applicant’s proposed use of the dataset(s). The RUS will be reviewed by all parties responsible for data covered by this Data Access Request. Please note that if access is approved, you agree that the RUS, along with your name and institution, will be included on this website to describe your research project to the public.",
                        br(),
                        "Please enter your RUS in the area below. The RUS should be one or two paragraphs in length and include research objectives, the study design, and an analysis plan (including the phenotypic characteristics that will be tested for association with genetic variants). If you are requesting multiple datasets, please describe how you will use them. Examples of RUS can be found at ",
                        a({ target: "_blank", "ng-href": "this.url", "ng-mousedown": "openGWAS()" }, ["here"], ".")
                      ]),
                    ]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    textarea({
                      ref: this.focus2,
                      value: this.state.formData.rus, onChange: this.handleChange, name: "rus", id: "inputRUS",
                      className: step2.inputRUS.invalid && showValidationMessages ? ' required-field-error form-control' : 'form-control',
                      maxLength: "2200", rows: "6",
                      required: "required", placeholder: "Please limit your RUS to 2200 characters.", disabled: this.state.formData.dar_code !== null
                    }),
                  ]),
                ]),
                div({ className: "form-group" }, [
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-title-question" }, [
                      "2.3 Non-Technical summary",
                      span({}, ["Please enter below a non-technical summary of your RUS suitable for understanding by the general public (written at a high school reading level or below)."
                      ]),
                    ]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    textarea({
                      value: this.state.formData.non_tech_rus, onChange: this.handleChange, name: "non_tech_rus", id: "inputNonTechRUS",
                      className: step2.inputNonTechRUS.invalid && showValidationMessages ? ' required-field-error form-control' : 'form-control',
                      maxLength: "1100", rows: "3", required: "required", placeholder: "Please limit your non-technical summary to 1100 characters.",
                      disabled: this.state.formData.dar_code !== null
                    }),
                  ]),
                ]),
                div({ className: "form-group" }, [
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-title-question" }, [
                      "2.4 Type of Research",
                      span({}, ["Select all applicable options."]),
                    ]),
                  ]),
                  span({ className: "cancel-color required-field-error-span", isRendered: !atLeastOneCheckboxChecked && showValidationMessages }, [
                    span({}, ["* At least one of the fields is required"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    div({ className: "checkbox" }, [
                      input({
                        value: this.state.formData.diseases, onChange: this.handleChange, name:'diseases', id: "checkDiseases", type: "checkbox", className: "checkbox-inline rp-checkbox",
                        name: "checkDiseases", disabled: (this.state.formData.dar_code !== null)
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
                        value: "this.state.formData.methods", id: "checkMethods", type: "checkbox", disabled: (this.state.formData.dar_code !== null),
                        className: "checkbox-inline rp-checkbox", name: "checkMethods"
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
                        value: "this.state.formData.controls", id: "checkControls", type: "checkbox", disabled: (this.state.formData.dar_code !== null),
                        className: "checkbox-inline rp-checkbox", name: "checkControls"
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
                        value: "this.state.formData.population", id: "checkPopulation", type: "checkbox", disabled: (this.state.formData.dar_code !== null),
                        className: "checkbox-inline rp-checkbox", name: "checkPopulation"
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
                        value: "this.state.formData.hmb", id: "checkHmb", type: "checkbox", className: "checkbox-inline rp-checkbox",
                        name: "checkHmb", disabled: (this.state.formData.dar_code !== null)
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
                        value: "this.state.formData.poa", id: "checkPoa", type: "checkbox", className: "checkbox-inline rp-checkbox",
                        name: "checkPoa", disabled: (this.state.formData.dar_code !== null)
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
                        value: this.state.formData.other, id: "checkOther", type: "checkbox", className: "checkbox-inline rp-checkbox",
                        name: "checkOther", disabled: (this.state.formData.dar_code !== null)
                      }),
                      label({ className: "regular-checkbox rp-choice-questions", htmlFor: "checkOther" }, [span({}, ["2.4.7 Other:"]),]),
                    ]),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    input({
                      value: this.state.formData.othertext, type: "text", name: "inputOther", id: "inputOther",
                      required: this.state.formData.other, className: step2.inputOther.invalid && this.state.formData.other && showValidationMessages ? ' required-field-error form-control' : 'form-control',
                      disabled: this.state.formData.dar_code !== null || this.state.formData.other !== true, placeholder: "Please specify if selected"
                    }),
                  ]),
                ]),
                div({ className: "form-group" }, [
                  div({ className: " col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group " }, [
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
                ul({ className: "pager wizard" }, [
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
                div({ className: "cm-subtitle access-color no-padding" }, [h3({}, ["3. Research Purpose Statement"]),]),
                div({ className: "form-group" }, [
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-title-question" }, ["3.1 In order to ensure appropriate review, please answer the questions below:"]),
                  ]),
                  span({ className: "cancel-color required-field-error-span", isRendered: "!step3isValidated && showValidationMessages" }, [
                    span({}, ["* All fields are required"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({
                      className: "control-label rp-choice-questions", "tooltip-class": "tooltip-class", "tooltip-trigger": "true"
                      , "tooltip-placement": "right", tooltip: "*"
                    }, ["3.1.1 Will this data be used exclusively or partially for a commercial purpose?"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [

                    YesNoRadioGroup({ value: this.state.formData.forProfit, name: 'exclusive' }),

                    // div({ className: "radio-inline" }, [
                    //   input({
                    //     ref: this.focus3,
                    //     value: this.state.formData.forProfit, "ng-value": true, type: "radio", className: "regular-radio", id: "exclusiveYes",
                    //     name: "exclusive", required: true, disabled: (this.state.formData.dar_code !== null)
                    //   }),
                    //   label({ htmlFor: "exclusiveYes" }, []),
                    //   label({ htmlFor: "exclusiveYes", className: "radio-button-text" }, ["Yes"]),
                    //   input({
                    //     value: this.state.formData.forProfit, "ng-value": false, type: "radio", className: "regular-radio", id: "exclusiveNo",
                    //     name: "exclusive", required: true, disabled: (this.state.formData.dar_code !== null)
                    //   }),
                    //   label({ htmlFor: "exclusiveNo" }, []),
                    //   label({ htmlFor: "exclusiveNo", className: "radio-button-text" }, ["No"]),
                    // ]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-choice-questions" }, ["3.1.2 Please indicate if this study is limited to one gender?"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    div({ className: "radio-inline" }, [
                      input({
                        value: this.state.formData.onegender, "ng-value": true, type: "radio", className: "regular-radio", id: "oneGenderYes",
                        name: "onegender", required: true, disabled: (this.state.formData.dar_code !== null)
                      }),
                      label({ htmlFor: "oneGenderYes" }, []),
                      label({ htmlFor: "oneGenderYes", className: "radio-button-text" }, ["Yes"]),
                      input({
                        value: this.state.formData.onegender, "ng-value": false, type: "radio", className: "regular-radio", id: "oneGenderNo",
                        name: "onegender", required: true, disabled: (this.state.formData.dar_code !== null)
                      }),
                      label({ htmlFor: "oneGenderNo" }, []),
                      label({ htmlFor: "oneGenderNo", className: "radio-button-text" }, ["No"]),
                    ]),
                    div({ isRendered: this.state.formData.onegender === true, className: "multi-step-fields", disabled: (this.state.formData.dar_code !== null) }, [
                      span({}, ["Please specify"]),
                      div({ className: "radio-inline" }, [
                        input({
                          value: this.state.formData.gender, value: "F", type: "radio", className: "regular-radio", id: "genderFemale",
                          required: this.state.formData.onegender, disabled: (this.state.formData.dar_code !== null)
                        }),
                        label({ htmlFor: "genderFemale" }, []),
                        label({ htmlFor: "genderFemale", className: "radio-button-text" }, ["Female"]),
                        input({
                          value: this.state.formData.gender, value: "M", type: "radio", className: "regular-radio", id: "genderMale",
                          required: this.state.formData.onegender, disabled: (this.state.formData.dar_code !== null)
                        }),
                        label({ htmlFor: "genderMale" }, []),
                        label({ htmlFor: "genderMale", className: "radio-button-text" }, ["Male"]),
                      ]),
                    ]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-choice-questions" }, ["3.1.3 Please indicate if this study is restricted to a  pediatric population (under the age of 18)?"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    div({ className: "radio-inline" }, [
                      input({
                        value: this.state.formData.pediatric, "ng-value": true, type: "radio", className: "regular-radio", id: "pediatricYes",
                        name: "pediatric", required: true, disabled: (this.state.formData.dar_code !== null)
                      }),
                      label({ htmlFor: "pediatricYes" }, []),
                      label({ htmlFor: "pediatricYes", className: "radio-button-text" }, ["Yes"]),
                      input({
                        value: this.state.formData.pediatric, "ng-value": false, type: "radio", className: "regular-radio", id: "pediatricNo",
                        name: "pediatric", required: true, disabled: (this.state.formData.dar_code !== null)
                      }),
                      label({ htmlFor: "pediatricNo" }, []),
                      label({ htmlFor: "pediatricNo", className: "radio-button-text" }, ["No"]),
                    ]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-choice-questions" }, ["3.1.4 Does the research aim involve the study of illegal behaviors (violence, domestic abuse, prostitution, sexual victimization)?"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    div({ className: "radio-inline" }, [
                      input({
                        value: this.state.formData.illegalbehave, "ng-value": true, type: "radio", className: "regular-radio", id: "illegalBehaveYes",
                        name: "illegalBehave", required: true, disabled: (this.state.formData.dar_code !== null)
                      }),
                      label({ htmlFor: "illegalBehaveYes" }, []),
                      label({ htmlFor: "illegalBehaveYes", className: "radio-button-text" }, ["Yes"]),
                      input({
                        value: this.state.formData.illegalbehave, "ng-value": false, type: "radio", className: "regular-radio", id: "illegalBehaveNo",
                        name: "illegalBehave", required: true
                      }),
                      label({ htmlFor: "illegalBehaveNo" }, []),
                      label({ htmlFor: "illegalBehaveNo", className: "radio-button-text" }, ["No"]),
                    ]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-choice-questions" }, ["3.1.5 Does the research aim involve the study of alcohol or drug abuse, or abuse of other addictive products?"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    div({ className: "radio-inline" }, [
                      input({
                        value: this.state.formData.addiction, disabled: (this.state.formData.dar_code !== null), "ng-value": true, type: "radio", className: "regular-radio", id: "addictionYes",
                        name: "addiction", required: true
                      }),
                      label({ htmlFor: "addictionYes" }, []),
                      label({ htmlFor: "addictionYes", className: "radio-button-text" }, ["Yes"]),
                      input({
                        value: this.state.formData.addiction, disabled: (this.state.formData.dar_code !== null), "ng-value": false, type: "radio", className: "regular-radio", id: "addictionNo",
                        name: "addiction", required: true
                      }),
                      label({ htmlFor: "addictionNo" }, []),
                      label({ htmlFor: "addictionNo", className: "radio-button-text" }, ["No"]),
                    ]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-choice-questions" }, ["3.1.6 Does the research aim involve the study of sexual preferences or sexually transmitted diseases?"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    div({ className: "radio-inline" }, [
                      input({
                        "value": "this.state.formData.sexualdiseases", "ng-value": true, type: "radio", className: "regular-radio", id: "sexualDiseasesYes",
                        name: "sexualdiseases", required: true, disabled: (this.state.formData.dar_code !== null)
                      }),
                      label({ htmlFor: "sexualDiseasesYes" }, []),
                      label({ htmlFor: "sexualDiseasesYes", className: "radio-button-text" }, ["Yes"]),
                      input({
                        "value": "this.state.formData.sexualdiseases", "ng-value": false, type: "radio", className: "regular-radio", id: "sexualDiseasesNo",
                        name: "sexualdiseases", required: true
                      }),
                      label({ htmlFor: "sexualDiseasesNo" }, []),
                      label({ htmlFor: "sexualDiseasesNo", className: "radio-button-text" }, ["No"]),
                    ]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-choice-questions" }, ["3.1.7 Does the research aim involve the study of any stigmatizing illnesses?"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    div({ className: "radio-inline" }, [
                      input({
                        "value": "this.state.formData.stigmatizediseases", disabled: (this.state.formData.dar_code !== null), "ng-value": true, type: "radio", className: "regular-radio", id: "stigmatizeDiseasesYes",
                        name: "stigmatizediseases", required: true
                      }),
                      label({ htmlFor: "stigmatizeDiseasesYes" }, []),
                      label({ htmlFor: "stigmatizeDiseasesYes", className: "radio-button-text" }, ["Yes"]),
                      input({
                        "value": "this.state.formData.stigmatizediseases", disabled: (this.state.formData.dar_code !== null), "ng-value": false, type: "radio", className: "regular-radio", id: "stigmatizeDiseasesNo",
                        name: "stigmatizediseases", required: true
                      }),
                      label({ htmlFor: "stigmatizeDiseasesNo" }, []),
                      label({ htmlFor: "stigmatizeDiseasesNo", className: "radio-button-text" }, ["No"]),
                    ]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({
                      className: "control-label rp-choice-questions", "tooltip-class": "tooltip-class", "tooltip-trigger": "true"
                      , "tooltip-placement": "right", tooltip: "*", "tooltip-container": "body", "tooltip-animation": "false"
                    }, ["3.1.8 Does the study target a vulnerable population as defined in 456 CFR (children, prisoners, pregnant women, mentally disabled persons, or \[\"SIGNIFICANTLY\"\] economically or educationally disadvantaged persons)?"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    div({ className: "radio-inline" }, [
                      input({
                        "value": "this.state.formData.vulnerablepop", disabled: (this.state.formData.dar_code !== null), "ng-value": true, type: "radio", className: "regular-radio", id: "vulnerablePopYes",
                        name: "vulnerablepop", required: true
                      }),
                      label({ htmlFor: "vulnerablePopYes" }, []),
                      label({ htmlFor: "vulnerablePopYes", className: "radio-button-text" }, ["Yes"]),
                      input({
                        "value": "this.state.formData.vulnerablepop", disabled: (this.state.formData.dar_code !== null), "ng-value": false, type: "radio", className: "regular-radio", id: "vulnerablePopNo",
                        name: "vulnerablepop", required: true
                      }),
                      label({ htmlFor: "vulnerablePopNo" }, []),
                      label({ htmlFor: "vulnerablePopNo", className: "radio-button-text" }, ["No"]),
                    ]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-choice-questions" }, ["3.1.9 Does the research aim involve the study of Population Origins/Migration patterns?"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    div({ className: "radio-inline" }, [
                      input({
                        "value": "this.state.formData.popmigration", disabled: (this.state.formData.dar_code !== null), "ng-value": true, type: "radio", className: "regular-radio", id: "popMigrationYes",
                        name: "popmigration", required: true
                      }),
                      label({ htmlFor: "popMigrationYes" }, []),
                      label({ htmlFor: "popMigrationYes", className: "radio-button-text" }, ["Yes"]),
                      input({
                        "value": "this.state.formData.popmigration", disabled: (this.state.formData.dar_code !== null), "ng-value": false, type: "radio", className: "regular-radio", id: "popMigrationNo",
                        name: "popmigration", required: true
                      }),
                      label({ htmlFor: "popMigrationNo" }, []),
                      label({ htmlFor: "popMigrationNo", className: "radio-button-text" }, ["No"]),
                    ]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-choice-questions" }, ["3.1.10 Does the research aim involve the study of psychological traits, including intelligence, attention, emotion?"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    div({ className: "radio-inline" }, [
                      input({
                        "value": "this.state.formData.psychtraits", "ng-value": true, type: "radio", className: "regular-radio", id: "psychTraitsYes",
                        name: "psychtraits", required: true, disabled: (this.state.formData.dar_code !== null)
                      }),
                      label({ htmlFor: "psychTraitsYes" }, []),
                      label({ htmlFor: "psychTraitsYes", className: "radio-button-text" }, ["Yes"]),
                      input({
                        "value": "this.state.formData.psychtraits", "ng-value": false, type: "radio", className: "regular-radio", id: "psychTraitsNo",
                        name: "psychtraits", required: true, disabled: (this.state.formData.dar_code !== null)
                      }),
                      label({ htmlFor: "psychTraitsNo" }, []),
                      label({ htmlFor: "psychTraitsNo", className: "radio-button-text" }, ["No"]),
                    ]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                    label({ className: "control-label rp-choice-questions" }, ["3.1.11 Does the research correlate ethnicity, race, or gender with genotypic or other phenotypic variables, for purposes beyond biomedical or health-related research, or in ways that are not easily related to Health?"]),
                  ]),
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group rp-last-group" }, [
                    div({ className: "radio-inline" }, [
                      input({
                        "value": "this.state.formData.nothealth", disabled: (this.state.formData.dar_code !== null), "ng-value": true, type: "radio", className: "regular-radio", id: "notHealthYes",
                        name: "nothealth", required: true
                      }),
                      label({ htmlFor: "notHealthYes" }, []),
                      label({ htmlFor: "notHealthYes", className: "radio-button-text" }, ["Yes"]),
                      input({
                        "value": "this.state.formData.nothealth", disabled: (this.state.formData.dar_code !== null), "ng-value": false, type: "radio", className: "regular-radio", id: "notHealthNo",
                        name: "nothealth", required: true
                      }),
                      label({ htmlFor: "notHealthNo" }, []),
                      label({ htmlFor: "notHealthNo", className: "radio-button-text" }, ["No"]),
                    ]),
                  ]),
                ]),
                ul({ className: "pager wizard" }, [
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
                div({ className: "cm-subtitle access-color no-padding" }, [h3({}, ["4. Attestation Statement"])]),
                div({ className: "form-group" }, [
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

                // span({ className:"admin-alerts rp-alerts", isRendered:"showValidationMessages"},[
                //     alert({ type:"danger", className:"alert-title cancel-color"},[
                //         h4({},["Please, complete all required fields."]),
                //         ]),
                // ]),

                // span({ className:"admin-alerts rp-alerts" isRendered:"problemSavingRequest"},[
                //     a({lert type:"danger", className:"alert-title cancel-color"},[
                //         h4({},["Some errors occurred, Data Access Request Application couldn't be created.]),
                //     </alert}),
                // ]),

                ul({ className: "pager wizard", style: { "marginTop": "0!important" } }, [
                  div({ className: "row multi-step-pager" }, [

                    li({ className: "previous f-left multi-step-prev" }, [
                      a({ onClick: this.step3, className: "access-background" }, [
                        span({ className: "glyphicon glyphicon-chevron-left", "aria-hidden": "true" }), "Previous Step"]),
                    ]),

                    li({ className: "next f-right multi-step-next" }, [
                      button({ isRendered: this.state.formData.dar_code === null, className: "access-background bold", onClick: this.attestAndSave }, [
                        "Attest and Send"
                      ]),
                    ]),

                    li({ isRendered: this.state.formData.dar_code === null, className: "next f-right multi-step-save access-color" }, [
                      a({ ref: this.focus4, onClick: this.partialSave }, [span({ className: "access-color" }, ["Save"]),]),
                    ]),
                  ]),
                ]),
              ]),
            ]),
          ])
        ])
      ])
    );
  }
}

export default DataAccessRequestApplication;


