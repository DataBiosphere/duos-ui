import { Component } from 'react';
import { div, hh, form, label, input, span, hr, ul, li, a } from 'react-hyperscript-helpers';
import { Researcher } from '../libs/ajax';
import { Storage } from '../libs/storage';
import { PageHeading } from '../components/PageHeading';

export const ResearcherProfile = hh(class ResearcherProfile extends Component {

  constructor(props) {
    super(props);

    this.state = {
      researcherProfile: {},
      fieldStatus: {},
      profileName: 'Diego Gil'
    };
    this.getResearcherProfile = this.getResearcherProfile.bind(this);

    this.handleChange = this.handleChange.bind(this);
    this.handlePIChange = this.handlePIChange.bind(this);
    this.handlePI2Change = this.handlePI2Change.bind(this);
  }

  componentWillMount() {
    this.getResearcherProfile();
  }

  componentDidUpdate() {
    console.log("RESEARCHER PROFILE =", this.state.researcherProfile);
  }

  async getResearcherProfile() {

    const profile = await Researcher.getResearcherProfile(Storage.getCurrentUser().dacUserId);
    this.setState({researcherProfile: profile});
  }

  handleChange(event) {
    // let field = {};
    let fieldName = event.target.name;
    let fieldValue = event.target.value;
    console.log('handleChange: ', fieldName, fieldValue);

    if (fieldName === 'profileAcademicEmail') {
      if (fieldValue !== 'nlopez@broadinstitute.org') {
        console.log('error ....');
        this.setState(prev => {
          prev.fieldStatus.email = 'error';
          return prev;
        });
      } else {
        console.log('no error ....');
        this.setState(prev => {
          prev.fieldStatus.email = '';
          return prev;
        });
      }
    }
    // this.setState(field, () => {
    //   console.log(JSON.stringify(this.state, null, 2));
    // });
    // console.log(JSON.stringify(this.state, null, 2));
  }

  handlePIChange(event) {
    let field = {};
    console.log(event.target.id, event.target.name);
    if (event.target.id === 'isThePI') {
      this.setState({'isThePI': "true"}, () => {
        console.log(JSON.stringify(this.state, null, 2));
      });
    } else {
      this.setState({'isThePI': "false"}, () => {
        console.log(JSON.stringify(this.state, null, 2));
      });
    }
  }

  handlePI2Change(event) {
    let field = {};
    console.log(event.target.id, event.target.name);
    if (event.target.id === 'doHavePI') {
      this.setState({'havePI': "true"}, () => {
        console.log(JSON.stringify(this.state, null, 2));
      });
    } else {
      this.setState({'havePI': "false"}, () => {
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

      div({className: "container"}, [
        div({className: "row no-margin"}, [
          div({className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12"}, [
            PageHeading({
              id: "researcherProfile",
              color: "common",
              title: "Your Profile",
              description: "Please complete the following information to be able to request access to dataset(s)"
            }),
            hr({className: "section-separator"}),
          ]),
          div({className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12 no-padding"}, [
            form({name: "researcherForm"}, [
              div({className: "form-group"}, [
                div({className: "col-lg-12 col-md-12 col-sm-12 col-xs-12"}, [
                  label({
                    id: "lbl_profileName", className: "control-label"
                  }, ["Full Name*"]),
                  input({
                    id: "profileName",
                    type: "text",
                    onChange: this.handleChange,
                    className: "form-control ",
                    // + (researcherForm.profileName.$invalid && showValidationMessages) ? 'form-control required-field-error' : "",
                    value: this.state.profileName,
                    required: true
                  }),
                  span({
                    className: "cancel-color required-field-error-span",
                    isRendered: (this.state.profileName === undefined && showValidationMessages)
                  }, ["Full Name is required"]),
                ]),

                div({className: "col-lg-12 col-md-12 col-sm-12 col-xs-12"}, [
                  label({
                    id: "lbl_profileAcademicEmail",
                    className: "control-label"
                  }, ["Academic/Business Email Address*"]),
                  input({
                    id: "profileAcademicEmail",
                    name: "profileAcademicEmail",
                    type: "email",
                    onChange: this.handleChange,
                    value: this.state.researcherProfile.email,
                    className: "form-control ",
                    // + (researcherForm.profileAcademicEmail.$invalid && showValidationMessages) ? 'form-control required-field-error' : "",
                    required: true
                  }),
                  span({
                    className: "cancel-color required-field-error-span",
                    isRendered: this.state.fieldStatus.email === 'error'
                  }, ["Email Address is empty or has invalid format"]),
                ]),

                div({className: "col-lg-12 col-md-12 col-sm-12 col-xs-12"}, [
                  label({id: "lbl_profileInstitution", className: "control-label"}, ["Institution Name*"]),
                  input({
                    id: "profileInstitution",
                    name: "profileInstitution",
                    type: "text",
                    className: "form-control ",
                    //  + (researcherForm.profileInstitution.$invalid && showValidationMessages) ? 'form-control required-field-error' : "",
                    onChange: this.handleChange,
                    value: this.state.profileInstitution,
                    required: true
                  }),
                  span({
                    className: "cancel-color required-field-error-span",
                    isRendered: (this.state.profileInstitution === undefined && showValidationMessages)
                  }, ["Institution Name is required"]),
                ]),
                div({className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"}, [
                  div({className: "row fsi-row-lg-level fsi-row-md-level no-margin"}, [
                    div({className: "col-lg-6 col-md-6 col-sm-6 col-xs-6"}, [
                      label({id: "lbl_profileDepartment", className: "control-label"}, ["Department*"]),
                      input({
                        id: "profileDepartment",
                        name: "profileDepartment",
                        type: "text",
                        className: "form-control ",
                        //  + (researcherForm.profileDepartment.$invalid && showValidationMessages) ? 'form-control required-field-error' : "",
                        onChange: this.handleChange,
                        value: this.state.profileDepartment,
                        required: true
                      }),
                      span({
                        className: "cancel-color required-field-error-span",
                        isRendered: (this.state.profileDepartment === undefined && showValidationMessages)
                      }, ["Department is required"]),
                    ]),
                    div({className: "col-lg-6 col-md-6 col-sm-6 col-xs-6"}, [
                      label({
                        id: "lbl_profileDivision",
                        className: "control-label"
                      }, ["Division ", span({className: "italic"}, ["(optional)"]),]),
                      input({
                        id: "profileDivision",
                        name: "profileDivision",
                        type: "text",
                        className: "form-control",
                        onChange: this.handleChange,
                        value: this.state.profileDivision
                      })
                    ]),
                  ]),
                ]),
                div({className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"}, [
                  div({className: "row fsi-row-lg-level fsi-row-md-level no-margin"}, [
                    div({className: "col-lg-6 col-md-6 col-sm-6 col-xs-6"}, [
                      label({id: "lbl_profileAddress1", className: "control-label"}, ["Street Address 1*"]),
                      input({
                        id: "profileAddress1",
                        name: "profileAddress1",
                        type: "text",
                        className: "form-control ",
                        //  + (researcherForm.profileAddress1.$invalid && showValidationMessages) ? 'form-control required-field-error' : "",
                        onChange: this.handleChange,
                        value: this.state.profileAddress1,
                        required: true
                      }),
                      span({
                        className: "cancel-color required-field-error-span",
                        isRendered: (this.state.profileAddress1 === undefined && showValidationMessages)
                      }, ["Street Address is required"]),
                    ]),
                    div({className: "col-lg-6 col-md-6 col-sm-6 col-xs-6"}, [
                      label({
                        id: "lbl_profileAddress2",
                        className: "control-label"
                      }, ["Street Address 2 ", span({className: "italic"}, ["(optional)"])]),
                      input({
                        id: "profileAddress2",
                        name: "profileAddress2",
                        type: "text",
                        className: "form-control",
                        onChange: this.handleChange,
                        value: this.state.profileAddress2
                      }),
                    ]),
                  ]),
                ]),

                div({className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"}, [
                  div({className: "row fsi-row-lg-level fsi-row-md-level no-margin"}, [
                    div({className: "col-lg-6 col-md-6 col-sm-6 col-xs-6"}, [
                      label({id: "lbl_profileCity", className: "control-label"}, ["City*"]),
                      input({
                        id: "profileCity",
                        name: "profileCity",
                        type: "text",
                        className: "form-control ",
                        //  + (researcherForm.profileCity.$invalid && showValidationMessages) ? 'form-control required-field-error' : "",
                        onChange: this.handleChange,
                        value: this.state.profileCity,
                        required: true
                      }),
                      span({
                        className: "cancel-color required-field-error-span",
                        isRendered: (this.state.profileCity === undefined && showValidationMessages)
                      }, ["City is required"]),
                    ]),
                    div({className: "col-lg-6 col-md-6 col-sm-6 col-xs-6"}, [
                      label({id: "lbl_profileState", className: "control-label"}, ["State*"]),
                      input({
                        id: "profileState",
                        name: "profileState",
                        type: "text",
                        className: "form-control ",
                        //  + (researcherForm.profileState.$invalid && showValidationMessages) ? 'form-control required-field-error' : "",
                        onChange: this.handleChange,
                        value: this.state.profileState,
                        required: true
                      }),
                      span({
                        className: "cancel-color required-field-error-span",
                        isRendered: (this.state.profileState === undefined && showValidationMessages)
                      }, ["State is required"]),
                    ]),
                  ]),
                ]),

                div({className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding"}, [
                  div({className: "row fsi-row-lg-level fsi-row-md-level no-margin"}, [
                    div({className: "col-lg-6 col-md-6 col-sm-6 col-xs-6"}, [
                      label({id: "lbl_profileZip", className: "control-label"}, ["Zip/Postal Code*"]),
                      input({
                        id: "profileZip",
                        name: "profileZip",
                        type: "text",
                        className: "form-control ",
                        //  + (researcherForm.profileZip.$invalid && showValidationMessages) ? 'form-control required-field-error' : "",
                        onChange: this.handleChange,
                        value: this.state.profileZip,
                        required: true
                      }),
                      span({
                        className: "cancel-color required-field-error-span",
                        isRendered: (this.state.profileZip === undefined && showValidationMessages)
                      }, ["Zip/Postal Code is required"]),
                    ]),
                    div({className: "col-lg-6 col-md-6 col-sm-6 col-xs-6"}, [
                      label({id: "lbl_profileCountry", className: "control-label"}, ["Country*"]),
                      input({
                        id: "profileCountry",
                        name: "profileCountry",
                        type: "text",
                        className: "form-control ",
                        //  + (researcherForm.profileCountry.$invalid && showValidationMessages) ? 'form-control required-field-error' : "",
                        onChange: this.handleChange,
                        value: this.state.profileCountry,
                        required: true
                      }),
                      span({
                        className: "cancel-color required-field-error-span",
                        isRendered: (this.state.profileCountry === undefined && showValidationMessages)
                      }, ["Country is required"]),
                    ]),
                  ]),
                ]),
              ]),

              div({className: "form-group"}, [
                div({className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group"}, [
                  label({
                    id: "lbl_isThePI",
                    className: "control-label ",
                    //  + (researcherForm.isThePI.$invalid && showValidationMessages) ? 'cancel-color' : ''
                  }, [
                    "Are you the Principal Investigator?* ",
                    span({
                      className: "glyphicon glyphicon-question-sign tooltip-icon",
                      "tooltip-class": "tooltip-class-dark",
                      "tooltip-trigger": "true",
                      "tooltip-placement": "right",
                      tooltip: "This information is required in order to classify users as bonafide researchers as part of the process of Data Access approvals."
                    })
                  ])
                ]),

                div({className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group"}, [
                  div({className: "radio-inline"}, [
                    input({
                      id: "isThePI",
                      name: "isThePI",
                      type: "radio",
                      className: "radiobutton",
                      className: "regular-radio",
                      onChange: this.handlePIChange,
                      value: this.state.isThePI,
                      onClick: this.clearNotRelatedPIFields,
                      required: true
                    }),
                    label({htmlFor: "isThePI"}, []),
                    label({id: "lbl_isThePI", htmlFor: "isThePI", className: "radio-button-text"}, ["Yes"]),

                    input({
                      id: "isNotThePI",
                      name: "isThePI",
                      type: "radio",
                      className: "radiobutton",
                      className: "regular-radio",
                      onChange: this.handlePIChange,
                      value: this.state.isThePI,
                      onClick: this.clearNotRelatedPIFields,
                      required: true
                    }),
                    label({htmlFor: "isNotThePI"}, []),
                    label({id: "lbl_isNotThePI", htmlFor: "isNotThePI", className: "radio-button-text"}, ["No"]),
                  ]),
                  span({
                    className: "cancel-color required-field-error-span",
                    isRendered: (this.state.isThePI === undefined && showValidationMessages)
                    // researcherForm.havePI.$invalid && showValidationMessages
                  }, ["Required field"]),
                ]),
              ]),

              div({isRendered: this.state.isThePI === "false", className: "form-group"}, [
                div({className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group"}, [
                  label({
                    className: "control-label ",
                    //  + (researcherForm.havePI.$invalid && showValidationMessages) ? 'cancel-color' : ''
                  }, ["Do you have a Principal Investigator?*"]),
                ]),

                div({className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group"}, [
                  div({className: "radio-inline", disabled: this.state.isThePI !== "false"}, [
                    input({
                      id: "doHavePI",
                      name: "havePI",
                      type: "radio",
                      onChange: this.handlePI2Change,
                      value: this.state.havePI,
                      className: "regular-radio",
                      onClick: this.clearCommonsFields,
                      disabled: this.state.isThePI !== "false",
                      required: this.state.isThePI === "false"
                    }),
                    label({htmlFor: "doHavePI"}, []),
                    label({id: "lbl_doHavePI", htmlFor: "doHavePI", className: "radio-button-text"}, ["Yes"]),

                    input({
                      id: "doNotHavePI",
                      name: "havePI",
                      type: "radio",
                      onChange: this.handlePI2Change,
                      value: this.state.havePI,
                      className: "regular-radio",
                      onClick: this.clearNoHasPIFields,
                      disabled: this.state.isThePI !== "false",
                      required: this.state.isThePI === "false"
                    }),
                    label({htmlFor: "doNotHavePI"}, []),
                    label({id: "lbl_doNotHavePI", htmlFor: "doNotHavePI", className: "radio-button-text"}, ["No"]),
                  ]),
                  span({
                    className: "cancel-color required-field-error-span",
                    isRendered: (this.state.havePI === undefined && showValidationMessages)
                  }, ["Required field"]),
                ]),
              ]),

              div({isRendered: this.state.havePI === "true", className: "form-group"}, [
                div({className: "col-lg-12 col-md-12 col-sm-12 col-xs-12"}, [
                  label({id: "lbl_profilePIName", className: "control-label"}, ["Principal Investigator Name*"]),
                  input({
                    id: "profilePIName",
                    name: "profilePIName",
                    type: "text",
                    className: "form-control ",
                    //  + (researcherForm.profilePIName.$invalid && showValidationMessages) ? 'form-control required-field-error' : "",                   
                    onChange: this.handleChange,
                    value: this.state.piName,
                    required: this.state.havePI === "true",
                  }),
                  span({
                    className: "cancel-color required-field-error-span",
                    isRendered: (this.state.piName === undefined && showValidationMessages)
                  }, ["Principal Investigator is required"]),
                ]),

                div({className: "col-lg-12 col-md-12 col-sm-12 col-xs-12"}, [
                  label({
                    id: "lbl_profilePIEmail",
                    className: "control-label"
                  }, ["Principal Investigator Email Address*"]),
                  input({
                    id: "profilePIEmail",
                    name: "profilePIEmail",
                    type: "email",
                    className: "form-control ",
                    //  + (researcherForm.profilePIEmail.$invalid && showValidationMessages) ? 'form-control required-field-error' : "",                   
                    onChange: this.handleChange,
                    value: this.state.piEmail,
                    required: this.state.havePI === "true",
                  }),
                  span({
                    className: "cancel-color required-field-error-span",
                    isRendered: ((this.state.piEmail === undefined || this.state.piEmail.indexOf('@') === -1) && showValidationMessages)
                    // (researcherForm.profilePIEmail.$invalid && showValidationMessages)
                  }, ["Email Address is empty or has invalid format"]),
                ]),

                div({className: "col-lg-12 col-md-12 col-sm-12 col-xs-12"}, [
                  label({
                    id: "lbl_profileEraCommons",
                    className: "control-label"
                  }, ["eRA Commons ID ", span({className: "italic"}, ["(optional)"])]),
                  input({
                    id: "profileEraCommons",
                    name: "profileEraCommons",
                    type: "text",
                    className: "form-control",
                    onChange: this.handleChange,
                    value: this.state.eRACommonsID
                  }),
                ]),

                div({className: "col-lg-12 col-md-12 col-sm-12 col-xs-12"}, [
                  label({
                    id: "lbl_profilePubmedID",
                    className: "control-label"
                  }, ["Pubmed ID of a publication ", span({className: "italic"}, ["(optional)"])]),
                  input({
                    id: "profilePubmedID",
                    name: "profilePubmedID",
                    type: "text",
                    className: "form-control",
                    onChange: this.handleChange,
                    value: this.state.pubmedID
                  }),
                ]),

                div({className: "col-lg-12 col-md-12 col-sm-12 col-xs-12"}, [
                  label({
                    id: "lbl_profileScientificURL",
                    className: "control-label"
                  }, ["URL of a scientific publication ", span({className: "italic"}, ["(optional)"])]),
                  input({
                    id: "profileScientificURL",
                    name: "profileScientificURL",
                    type: "text",
                    className: "form-control",
                    onChange: this.handleChange,
                    value: this.state.scientificURL
                  }),
                ]),
              ]),

              div({
                isRendered: (this.state.isThePI === "true" || this.state.havePI === "false"),
                className: "form-group",
                style: {"border": "5px solid red"}
              }, [
                div({className: "col-lg-12 col-md-12 col-sm-12 col-xs-12"}, [
                  label({
                    id: "lbl_profileEraCommons",
                    className: "control-label"
                  }, ["eRA Commons ID ", span({className: "italic"}, ["(optional)"]),]),
                  input({
                    id: "profileEraCommons",
                    name: "profileEraCommons",
                    type: "text",
                    className: "form-control",
                    onChange: this.handleChange,
                    value: this.state.eRACommonsID
                  }),
                ]),

                div({className: "col-lg-12 col-md-12 col-sm-12 col-xs-12"}, [
                  label({
                    id: "lbl_profilePubmedID",
                    className: "control-label"
                  }, ["Pubmed ID of a publication ", span({className: "italic"}, ["(optional)"])]),
                  input({
                    id: "profilePubmedID",
                    name: "profilePubmedID",
                    type: "text",
                    className: "form-control",
                    onChange: this.handleChange,
                    value: this.state.pubmedID
                  }),
                ]),

                div({className: "col-lg-12 col-md-12 col-sm-12 col-xs-12"}, [
                  label({
                    id: "lbl_profileScientificURL",
                    className: "control-label"
                  }, ["URL of a scientific publication ", span({className: "italic"}, ["(optional)"])]),
                  input({
                    id: "profileScientificURL",
                    name: "profileScientificURL",
                    type: "text",
                    className: "form-control",
                    onChange: this.handleChange,
                    value: this.state.scientificURL
                  }),
                ]),
              ]),

              ul({className: "no-style-list"}, [
                div({className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 multi-step-pager"}, [
                  li({className: "italic default-color"}, ["*Required field"]),
                  li({className: "f-right multi-step-next"}, [
                    a({
                      isRendered: true,
                      // isRendered: "!this.state.completed",
                      disabled: "researcherForm.$invalid",
                      href: "",
                      onClick: this.submit,
                      className: "common-background"
                    }, ["Submit"]),
                    a({
                      isRendered: false,
                      // isRendered: "this.state.completed",
                      href: "",
                      onClick: this.submit,
                      className: "common-background"
                    }, ["Update"]),
                  ]),
                  li({isRendered: "!this.state.completed", className: "f-right multi-step-save"}, [
                    a({href: "", onClick: this.saveProfile, className: "common-color"}, ["Continue later"]),
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
