import { Component } from 'react';
import { div, hh, form, h2, label, input, span, hr, small, ul, li, a } from 'react-hyperscript-helpers';

export const ResearcherProfile = hh(class ResearcherProfile extends Component {

  constructor(props) {
    super(props);
    this.state = {
      profileName: 'Diego Gil'
    }
    this.handleChange = this.handleChange.bind(this);
    this.handlePIChange = this.handlePIChange.bind(this);
    this.handlePI2Change = this.handlePI2Change.bind(this);
  }

  handleChange(event) {
    let field = {};
    field[event.target.name] = event.target.value;
    this.setState(field, () => {
      console.log(JSON.stringify(this.state, null, 2));
    });
    console.log(JSON.stringify(this.state, null, 2));
  }

  handlePIChange(event) {
    // let field = {};
    console.log(event.target.id, event.target.name);
    if (event.target.id === 'isThePI') {
      this.setState({ 'isThePI': "true" }, () => {
        console.log(JSON.stringify(this.state, null, 2));
      });
    } else {
      this.setState({ 'isThePI': "false" }, () => {
        console.log(JSON.stringify(this.state, null, 2));
      });
    }
  }

  handlePI2Change(event) {
    // let field = {};
    console.log(event.target.id, event.target.name);
    if (event.target.id === 'doHavePI') {
      this.setState({ 'havePI': "true" }, () => {
        console.log(JSON.stringify(this.state, null, 2));
      });
    } else {
      this.setState({ 'havePI': "false" }, () => {
        console.log(JSON.stringify(this.state, null, 2));
      });
    }
  }

  clearNotRelatedPIFields() {

  }

  clearCommonsFields() {

  }

  clearNoHasPIFields() {

  }

  saveOProfile() {

  }

  submit() {

  }
  render() {

    const showValidationMessages = true;
    return (

      div({ className: "container" }, [
        div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [
          h2({ className: "cm-title common-color" }, [
            div({ id: "dacUser" }, ["Your Profile"]),
            small({}, ["Please complete the following information to be able to request access to dataset(s)"]),
          ]),
          hr({ className: "section-separator" }),
          div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12 no-padding" }, [
            form({ name: "researcherForm", "noValidate": "true" }, [
              div({ className: "form-group" }, [
                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({ className: "control-label" }, ["Full Name*"]),
                  input({ type: "text", className: "form-control", name: "profileName", id: "profileName", onChange: this.handleChange, value: this.state.profileName })
                ]),
                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({ className: "control-label" }, ["Academic / Business Email Address*"]),
                  input({
                    type: "email", className: "form-control", name: "profileAcademicEmail", id: "profileAcademicEmail",
                    onChange: this.handleChange, value: this.state.profileAcademicEmail,
                    "ng-class": "researcherForm.profileAcademicEmail.$invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control'",
                    "required": "true"
                  }),
                ]),

                span({
                  className: "cancel-color required-field-error-span",
                  isRendered: (this.state.profileAcademicEmail === undefined || this.state.profileAcademicEmail.indexOf('@') === -1) && showValidationMessages
                }, [
                    span({}, ["Email Address is empty or has invalid format"]),
                  ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({ className: "control-label" }, ["Institution Name*"]),
                  input({
                    type: "text", className: "form-control", name: "profileInstitution", id: "profileInstitution", onChange: this.handleChange, value: this.state.profileInstitution,
                    "ng-class": "researcherForm.profileInstitution.$invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control'",
                    "required": "true"
                  }),
                ]),

                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                  label({ className: "control-label" }, ["Department *"]),
                  input({
                    type: "text", className: "form-control", name: "profileDepartment", id: "profileDepartment", onChange: this.handleChange, value: this.state.profileDepartment,
                    "ng-class": "researcherForm.profileDepartment.$invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control'", "required": "true"
                  }),
                ]),
                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                  label({ className: "control-label" }, ["Division", span({ className: "italic" }, ["(optional)"]),]),
                  input({ type: "text", className: "form-control", name: "profileDivision", id: "profileDivision", onChange: this.handleChange, value: this.state.profileDivision })
                ]),

                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                  label({ className: "control-label" }, ["Street Address 1*"]),
                  input({ type: "text", className: "form-control", name: "profileAddress1", id: "profileAddress1", onChange: this.handleChange, value: this.state.profileAddress1, "ng-class": "researcherForm.profileAddress1.$invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control'", "required": "true" }),
                ]),
                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                  label({ className: "control-label" }, ["Street Address 2", span({ className: "italic" }, ["(optional)"])]),
                  input({ type: "text", className: "form-control", name: "profileAddress2", id: "profileAddress2", onChange: this.handleChange, value: this.state.profileAddress2 }),
                ]),

                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                  label({ className: "control-label" }, ["City *"]),
                  input({ type: "text", className: "form-control", name: "profileCity", id: "profileCity", onChange: this.handleChange, value: this.state.profileCity, "ng-class": "researcherForm.profileCity.$invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control'", "required": "true" }),
                ]),
                div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                  label({ className: "control-label" }, ["State", span({ className: "italic" }, ["(optional)"]),]),
                  input({ type: "text", className: "form-control", name: "profileState", id: "profileState", onChange: this.handleChange, value: this.state.profileState }),
                ]),

                div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-4" }, [
                  label({ className: "control-label" }, ["Zip / Postal Code*"]),
                  input({ type: "text", className: "form-control", name: "profileZip", id: "profileZip", onChange: this.handleChange, value: this.state.profileZip, "ng-class": "researcherForm.profileZip.$invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control'", "required": "true" }),
                ]),
                div({ className: "col-lg-8 col-md-8 col-sm-8 col-xs-8" }, [
                  label({ className: "control-label" }, ["Country *"]),
                  input({ type: "text", className: "form-control", name: "profileCountry", id: "profileCountry", onChange: this.handleChange, value: this.state.profileCountry, "ng-class": "researcherForm.profileCountry.$invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control'", "required": "true" }),
                ]),
              ]),

              div({ className: "form-group" }, [
                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                  label({ className: "researcherForm.isThePI.$invalid && showValidationMessages ? 'cancel-color control-label' : 'control-label'" }, [
                    "Are you the Principal Investigator?*",
                    span({
                      className: "glyphicon glyphicon-question-sign tooltip-icon", "tooltip-class": "tooltip-class-dark", "tooltip-trigger": "true", "tooltip-placement": "right",
                      tooltip: "This information is required in order to classify users as bonafide researchers as part of the process of Data Access approvals."
                    })
                  ])
                ]),
                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                  div({ className: "radio-inline" }, [
                    input({ onChange: this.handlePIChange, value: this.state.isThePI, type: "radio", className: "regular-radio", id: "isThePI", name: "isThePI", onClick: this.clearNotRelatedPIFields, "required": "true" }),
                    // label({ for: "isThePI" }, []),
                    label({ for: "isThePI", className: "radio-button-text" }, ["Yes"]),

                    input({ onChange: this.handlePIChange, value: this.state.isThePI, type: "radio", className: "regular-radio", id: "isNotThePI", name: "isThePI", onClick: this.clearNotRelatedPIFields, "required": "true" }),
                    // label({ for: "isNotThePI" }, []),
                    label({ for: "isNotThePI", className: "radio-button-text" }, ["No"]),
                  ]),
                ]),
              ]),

              div({ isRendered: this.state.isThePI === "false", className: "form-group" }, [
                span({ className: "cancel-color required-field-error-span", isRendered: "researcherForm.havePI.$invalid && showValidationMessages" }, [
                  span({}, ["* Required field"]),
                ]),
                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                  label({ "ng-class": "researcherForm.havePI.$invalid && showValidationMessages ? 'cancel-color control-label' : 'control-label'" }, ["Do you have a Principal Investigator?*"]),
                ]),
                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                  div({ className: "radio-inline", "ng-disabled": this.state.isThePI !== false }, [
                    input({ onChange: this.handlePI2Change, value: this.state.havePI, "ng-value": "true", type: "radio", className: "regular-radio", id: "doHavePI", name: "havePI", onClick: this.clearCommonsFields, "ng-disabled": this.state.isThePI !== "false", "ng-required": this.state.isThePI === "false" }),
                    // label({ for: "doHavePI" }, []),
                    label({ for: "doHavePI", className: "radio-button-text" }, ["Yes"]),

                    input({ onChange: this.handlePI2Change, value: this.state.havePI, "ng-value": "false", type: "radio", className: "regular-radio", id: "doNotHavePI", name: "havePI", onClick: this.clearNoHasPIFields, "ng-disabled": this.state.isThePI !== "false", "ng-required": this.state.isThePI === "false" }),
                    // label({ for: "doNotHavePI" }, []),
                    label({ for: "doNotHavePI", className: "radio-button-text" }, ["No"]),
                  ]),
                ]),
              ]),

              div({ isRendered: this.state.havePI === "true", className: "form-group" }, [

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({ className: "control-label" }, ["Principal Investigator Name*"]),
                  input({
                    type: "text", className: "form-control", name: "profilePIName", id: "profilePIName", onChange: this.handleChange, value: this.state.piName,
                    "ng-required": this.state.havePI === true,
                    "ng-class": "researcherForm.profilePIName.$invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control'"
                  }),
                ]),
                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({ className: "control-label" }, ["Principal Investigator Email Address*"]),
                  input({ type: "email", className: "form-control", name: "profilePIEmail", id: "profilePIEmail", onChange: this.handleChange, value: this.state.piEmail, "ng-required": this.state.havePI === true, "ng-class": "researcherForm.profilePIEmail.$invalid && showValidationMessages ? 'form-control required-field-error' : 'form-control'" }),
                  span({ className: "cancel-color required-field-error-span", isRendered: "researcherForm.profilePIEmail.$invalid && showValidationMessages" }),
                  span({}, ["Email Address is empty or has invalid format"]),
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({ className: "control-label" }, ["eRA Commons ID", span({ className: "italic" }, ["(optional)"]),]),
                  input({ type: "text", className: "form-control", name: "profileEraCommons", id: "profileEraCommons", onChange: this.handleChange, value: this.state.eRACommonsID }),
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({ className: "control-label" }, ["Pubmed ID of a publication", span({ className: "italic" }, ["(optional)"]),]),
                  input({ type: "text", className: "form-control", name: "profilePubmedID", id: "profilePubmedID", onChange: this.handleChange, value: this.state.pubmedID })
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({ className: "control-label" }, ["URL of a scientific publication", span({ className: "italic" }, ["(optional)"]),]),
                  input({ type: "text", className: "form-control", name: "profileScientificURL", id: "profileScientificURL", onChange: this.handleChange, value: this.state.scientificURL }),
                ]),
              ]),

              div({ isRendered: this.state.isThePI === "true" || this.state.havePI === "false", className: "form-group", style: { "border": "5px solid red" } }, [
                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({ className: "control-label" }, ["eRA Commons ID", span({ className: "italic" }, ["(optional)"]),]),
                  input({ type: "text", className: "form-control", name: "profileEraCommons", onChange: this.handleChange, value: this.state.eRACommonsID }),
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({ className: "control-label" }, ["Pubmed ID of a publication", span({ className: "italic" }, ["(optional)"]),]),
                  input({ type: "text", className: "form-control", name: "profilePubmedID", onChange: this.handleChange, value: this.state.pubmedID })
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({ className: "control-label" }, ["URL of a scientific publication", span({ className: "italic" }, ["(optional)"]),]),
                  input({ type: "text", className: "form-control", name: "profileScientificURL", onChange: this.handleChange, value: this.state.scientificURL })
                ]),
              ]),

              ul({ className: "no-style-list" }, [
                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 multi-step-pager" }, [
                  li({ className: "italic default-color" }, ["*Required field"]),
                  li({ isRendered: "!this.state.completed", className: "f-right multi-step-next" }, [
                    a({ "ng-disabled": "researcherForm.$invalid", href: "", onClick: this.submit, className: "common-background" }, ["Submit"]),
                  ]),
                  li({ isRendered: "!this.state.completed", className: "f-right multi-step-save" }, [
                    a({ href: "", onClick: this.saveProfile, className: "common-color" }, ["Continue later"]),
                  ]),
                  li({ isRendered: this.state.completed, className: "f-right multi-step-next" }, [
                    a({ href: "", onClick: this.submit, className: "common-background" }, ["Update"]),
                  ]),
                ]),
              ]),
            ]),
          ]),
        ]),
      ])
    );
  }

});
