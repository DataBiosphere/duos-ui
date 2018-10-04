import { Component } from 'react';
import { div, h, hh, form, label, input, span, hr, ul, li, a, button } from 'react-hyperscript-helpers';
import { Researcher } from '../libs/ajax';
import { Storage } from '../libs/storage';
import { PageHeading } from '../components/PageHeading';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import ReactTooltip from 'react-tooltip';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { YesNoRadioGroup } from '../components/YesNoRadioGroup';

export const ResearcherProfile = hh(class ResearcherProfile extends Component {

  constructor(props) {
    super(props);
    this.state = this.initialState();

    this.getResearcherProfile = this.getResearcherProfile.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handlePIChange = this.handlePIChange.bind(this);
    this.handlePI2Change = this.handlePI2Change.bind(this);
    this.clearNotRelatedPIFields = this.clearNotRelatedPIFields.bind(this);
    this.clearCommonsFields = this.clearCommonsFields.bind(this);
    this.clearNoHasPIFields = this.clearNoHasPIFields.bind(this);
    this.saveProfile = this.saveProfile.bind(this);
    this.submit = this.submit.bind(this);
    this.deleteNihAccount = this.deleteNihAccount.bind(this);
    this.redirectToNihLogin = this.redirectToNihLogin.bind(this);
  }

  componentDidMount() {

    this.getResearcherProfile();
  }

  initialState() {
    return {
      loading: true,
      fieldStatus: {},
      showDialogSubmit: false,
      showDialogSave: false,
      researcherProfile: {
        academicEmail: '',
        address1: '',
        address2: '',
        city: '',
        completed: '',
        country: '',
        department: '',
        division: '',
        eRACommonsID: '',
        havePI: 'false',
        institution: '',
        isThePI: 'false',
        linkedIn: '',
        nihUsername: '',
        orcid: '',
        piEmail: '',
        piName: '',
        profileName: '',
        pubmedID: '',
        researcherGate: '',
        scientificURL: '',
        state: '',
        zipcode: '',
      }
    };
  }

  async getResearcherProfile() {
    const profile = await Researcher.getResearcherProfile(Storage.getCurrentUser().dacUserId);
    this.setState(prev => {
      prev.researcherProfile.zipcode = profile.zipcode;
      prev.researcherProfile.profileName = profile.profileName;
      prev.researcherProfile.country = profile.country;
      prev.researcherProfile.institution = profile.institution;
      prev.researcherProfile.city = profile.city;
      prev.researcherProfile.address1 = profile.address1;
      prev.researcherProfile.academicEmail = profile.academicEmail;
      prev.researcherProfile.completed = profile.completed;
      prev.researcherProfile.state = profile.state;
      prev.researcherProfile.isThePI = profile.isThePI;
      prev.researcherProfile.department = profile.department;
      prev.researcherProfile.nihUsername = profile.nihUsername;
      prev.researcherProfile.eraExpirationCount = 10;
    }, () => {
      // let completed = this.state.researcherProfile.completed;
      if (this.state.researcherProfile.completed !== undefined) {
        this.state.researcherProfile.completed = JSON.parse(this.state.researcherProfile.completed);
      }
      // let isThePI = undefined;
      if (this.state.researcherProfile.isThePI !== undefined) {
        this.state.researcherProfile.isThePI = JSON.parse(this.state.researcherProfile.isThePI);
      }

      let havePI = undefined;
      if (this.state.researcherProfile.havePI !== undefined) {
        havePI = JSON.parse(this.state.researcherProfile.havePI);
      }

      this.setState({
        loading: false
      })
    });
  }

  deleteNihAccount() {

  }

  redirectToNihLogin() {

  }

  handleChange(event) {
    let field = event.target.name;
    let value = event.target.value;

    this.setState(prev => { prev.researcherProfile[field] = value; return prev; });

    if (field === 'profileAcademicEmail') {
      if (value !== '') {
        this.setState(prev => {
          prev.fieldStatus.email = 'error';
          return prev;
        });
      } else {
        this.setState(prev => {
          prev.fieldStatus.email = '';
          return prev;
        });
      }
    }
  }

  handleRadioChange = (e, field, value) => {
    this.setState(prev => { prev.researcherProfile[field] = value; return prev; });
  };

  handlePIChange(event) {
    let researcherProfile = this.state.researcherProfile;
    if (event.target.id === 'rad_isThePI') {
      researcherProfile.isThePI = true;
      this.setState({ researcherProfile: researcherProfile }, () => { });
    } else {
      researcherProfile.isThePI = false;
      this.setState({ researcherProfile: researcherProfile }, () => { });
    }
  }

  handlePI2Change(event) {
    let researcherProfile = this.state.researcherProfile;
    if (event.target.id === 'rad_doHavePI') {
      researcherProfile.havePI = true;
      this.setState({ researcherProfile: researcherProfile }, () => { });
    } else {
      researcherProfile.havePI = false;
      this.setState({ researcherProfile: researcherProfile }, () => { });
    }
  }

  clearNotRelatedPIFields() {
    this.clearCommonsFields();
    this.setState(prev => {
      prev.researcherProfile.havePi = undefined;
      return prev;
    }, () => {
      this.clearPIData();
    });

  }

  clearNoHasPIFields() {
    this.clearPIData();
    this.clearCommonsFields();
  }

  clearCommonsFields() {
    this.setState(prev => {
      prev.researcherProfile.eRACommonsID = undefined;
      prev.researcherProfile.pubmedID = undefined;
      prev.researcherProfile.scientificURL = undefined;
      return prev;
    });
  }

  clearPIData() {
    this.setState(prev => {
      prev.researcherProfile.piName = undefined;
      prev.researcherProfile.piEmail = undefined;
      return prev;
    });
  }

  saveOProfile() {

  }

  saveProfile(event) {
    event.preventDefault();
    this.setState({ showDialogSave: true });
  }

  submit(event) {
    event.preventDefault();
    this.setState({ showDialogSubmit: true });
  }

  dialogHandlerSubmit = (answer) => (e) => {
    if (answer === true) {
      this.setState(prev => {
        prev.researcherProfile.completed = true;
        return prev;
      }, () => {
      });
      Researcher.update(Storage.getCurrentUser().dacUserId, false, this.state.researcherProfile);
    }
    this.setState({ showDialogSubmit: false });
    this.props.history.push({ pathname: 'dataset_catalog' });
  };

  dialogHandlerSave = (answer) => (e) => {
    if (answer === true) {
      this.setState(prev => {
        prev.researcherProfile.completed = false;
        return prev;
      }, () => {
      });
      Researcher.update(Storage.getCurrentUser().dacUserId, false, this.state.researcherProfile);
    }
    this.setState({ showDialogSave: false });
    this.props.history.push({ pathname: 'dataset_catalog' });
  };

  render() {

    if (this.state.loading) { return LoadingIndicator(); }

    let completed = this.state.researcherProfile.completed;
    if (completed !== undefined) {
      completed = JSON.parse(this.state.researcherProfile.completed);
    }
    let isThePI = undefined;
    if (this.state.researcherProfile.isThePI !== undefined) {
      isThePI = JSON.parse(this.state.researcherProfile.isThePI);
    }

    let havePI = undefined;
    if (this.state.researcherProfile.havePI !== undefined) {
      havePI = JSON.parse(this.state.researcherProfile.havePI);
    }

    const showValidationMessages = true;

    return (

      div({ className: "container" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [
            PageHeading({
              id: "researcherProfile",
              color: "common",
              title: "Your Profile",
              description: "Please complete the following information to be able to request access to dataset(s)"
            }),
            hr({ className: "section-separator" }),
          ]),
          div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12 no-padding" }, [
            form({ name: "researcherForm" }, [
              div({ className: "form-group" }, [
                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({
                    id: "lbl_profileName", className: "control-label"
                  }, ["Full Name*"]),
                  input({
                    id: "profileName",
                    name: "profileName",
                    type: "text",
                    onChange: this.handleChange,
                    className: "form-control ",
                    value: this.state.researcherProfile.profileName,
                    required: true
                  }),
                  span({
                    className: "cancel-color required-field-error-span",
                    isRendered: (this.state.researcherProfile.profileName === '' && showValidationMessages)
                  }, ["Full Name is required"])
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({
                    id: "lbl_profileAcademicEmail",
                    className: "control-label"
                  }, ["Academic/Business Email Address*"]),
                  input({
                    id: "profileAcademicEmail",
                    name: "academicEmail",
                    type: "email",
                    onChange: this.handleChange,
                    value: this.state.researcherProfile.academicEmail,
                    className: "form-control ",
                    // + (researcherForm.profileAcademicEmail.$invalid && showValidationMessages) ? 'form-control required-field-error' : "",
                    required: true
                  }),
                  span({
                    className: "cancel-color required-field-error-span",
                    isRendered: this.state.researcherProfile.academicEmail === ''
                  }, ["Email Address is empty or has invalid format"]),
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12", style: { 'marginTop': '20px' } }, [
                  label({ className: "control-label rp-title-question default-color" }, [
                    "Researcher Identification ", span({ className: "italic display-inline" }, ["(optional)"]),
                    span({}, ["Please authenticate your eRA Commons account or provide a link to one of your other profiles:"])
                  ]),
                  //properly handle validations, at least one is required
                  span({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding cancel-color required-field-error-span", isRendered: false }, ["At least one of the following is required"]),
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
                  div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                    div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                      label({ id: "lbl_profileLinkedIn", className: "control-label" }, ["NIH eRA Commons ID"]),
                      //show when appropriate
                      div({ isRendered: true }, [
                        a({ onClick: this.redirectToNihLogin, target: "_blank", className: "auth-button eRACommons" }, [
                          div({ className: "logo" }, []),
                          span({}, ["Authenticate your account"])
                        ])
                      ]),
                      //show when appropriate
                      div({ isRendered: false }, [
                        div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
                          div({ className: "auth-id" }, [this.state.researcherProfile.nihUsername]),
                          button({ onClick: this.deleteNihAccount, className: "close auth-clear" }, [
                            span({ className: "glyphicon glyphicon-remove-circle", "data-tip": "", "data-for": "tip_clearNihAccount" })
                          ]),
                          h(ReactTooltip, { id: "tip_clearNihAccount", place: 'right', effect: 'solid', multiline: true, className: 'tooltip-wrapper' }, ["Clear account"]),
                        ]),

                        div({ className: "col-lg-12 col-md-12 col-sm-6 col-xs-12 no-padding" }, [
                          div({ isRendered: this.state.researcherProfile.eraExpirationCount !== 0, className: "default-color display-block" }, ["Your NIH authentication will expire in " + this.state.researcherProfile.eraExpirationCount + " days"]),
                          div({ isRendered: this.state.researcherProfile.eraExpirationCount === 0, className: "default-color display-block" }, ["Your NIH authentication expired"]),
                        ]),
                        div({ isRendered: this.state.researcherProfile.dar_code !== null, className: "col-lg-12 col-md-12 col-sm-6 col-xs-12 no-padding" }, [
                          div({ className: "auth-id" }, [this.state.researcherProfile.nihUsername])
                        ])
                      ]),

                    ]),
                    div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                      label({ id: "lbl_profileLinkedIn", className: "control-label" }, ["LinkedIn Profile"]),
                      input({
                        id: "profileLinkedIn",
                        name: "linkedIn",
                        type: "text",
                        className: "form-control",
                        onChange: this.handleChange,
                        value: this.state.researcherProfile.linkedIn
                      })
                    ])
                  ])
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
                  div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                    div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                      label({ id: "lbl_profileOrcid", className: "control-label" }, ["ORCID iD"]),
                      input({
                        id: "profileOrcid",
                        name: "orcid",
                        type: "text",
                        className: "form-control",
                        onChange: this.handleChange,
                        value: this.state.researcherProfile.orcid
                      })
                    ]),
                    div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                      label({ id: "lbl_profileResearcherGate", className: "control-label" }, ["Researcher Gate ID"]),
                      input({
                        id: "profileResearcherGate",
                        name: "researcherGate",
                        type: "text",
                        className: "form-control",
                        onChange: this.handleChange,
                        value: this.state.researcherProfile.researcherGate
                      })
                    ])
                  ])
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12", style: { 'marginTop': '20px' } }, [
                  label({ id: "lbl_profileInstitution", className: "control-label" }, ["Institution Name*"]),
                  input({
                    id: "profileInstitution",
                    name: "institution",
                    type: "text",
                    className: "form-control ",
                    onChange: this.handleChange,
                    value: this.state.researcherProfile.institution,
                    required: true
                  }),
                  span({
                    className: "cancel-color required-field-error-span",
                    isRendered: (this.state.researcherProfile.institution === '' && showValidationMessages)
                  }, ["Institution Name is required"]),
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
                  div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                    div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                      label({ id: "lbl_profileDepartment", className: "control-label" }, ["Department*"]),
                      input({
                        id: "profileDepartment",
                        name: "department",
                        type: "text",
                        className: "form-control ",
                        onChange: this.handleChange,
                        value: this.state.researcherProfile.department,
                        required: true
                      }),
                      span({
                        className: "cancel-color required-field-error-span",
                        isRendered: (this.state.researcherProfile.department === '' && showValidationMessages)
                      }, ["Department is required"]),
                    ]),
                    div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                      label({
                        id: "lbl_profileDivision",
                        className: "control-label"
                      }, ["Division ", span({ className: "italic" }, ["(optional)"])]),
                      input({
                        id: "profileDivision",
                        name: "division",
                        type: "text",
                        className: "form-control",
                        onChange: this.handleChange,
                        value: this.state.researcherProfile.division
                      })
                    ])
                  ])
                ]),
                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
                  div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                    div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                      label({ id: "lbl_profileAddress1", className: "control-label" }, ["Street Address 1*"]),
                      input({
                        id: "profileAddress1",
                        name: "address1",
                        type: "text",
                        className: "form-control ",
                        onChange: this.handleChange,
                        value: this.state.researcherProfile.address1,
                        required: true
                      }),
                      span({
                        className: "cancel-color required-field-error-span",
                        isRendered: (this.state.researcherProfile.address1 === '' && showValidationMessages)
                      }, ["Street Address is required"]),
                    ]),
                    div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                      label({
                        id: "lbl_profileAddress2",
                        className: "control-label"
                      }, ["Street Address 2 ", span({ className: "italic" }, ["(optional)"])]),
                      input({
                        id: "profileAddress2",
                        name: "address2",
                        type: "text",
                        className: "form-control",
                        onChange: this.handleChange,
                        value: this.state.researcherProfile.address2
                      })
                    ])
                  ])
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
                  div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                    div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                      label({ id: "lbl_profileCity", className: "control-label" }, ["City*"]),
                      input({
                        id: "profileCity",
                        name: "city",
                        type: "text",
                        className: "form-control ",
                        onChange: this.handleChange,
                        value: this.state.researcherProfile.city,
                        required: true
                      }),
                      span({
                        className: "cancel-color required-field-error-span",
                        isRendered: (this.state.researcherProfile.city === '' && showValidationMessages)
                      }, ["City is required"]),
                    ]),
                    div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                      label({ id: "lbl_profileState", className: "control-label" }, ["State*"]),
                      input({
                        id: "profileState",
                        name: "state",
                        type: "text",
                        className: "form-control ",
                        onChange: this.handleChange,
                        value: this.state.researcherProfile.state,
                        required: true
                      }),
                      span({
                        className: "cancel-color required-field-error-span",
                        isRendered: (this.state.researcherProfile.state === '' && showValidationMessages)
                      }, ["State is required"])
                    ])
                  ])
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
                  div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                    div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6 rp-group" }, [
                      label({ id: "lbl_profileZip", className: "control-label" }, ["Zip/Postal Code*"]),
                      input({
                        id: "profileZip",
                        name: "zipcode",
                        type: "text",
                        className: "form-control ",
                        onChange: this.handleChange,
                        value: this.state.researcherProfile.zipcode,
                        required: true
                      }),
                      span({
                        className: "cancel-color required-field-error-span",
                        isRendered: (this.state.researcherProfile.zipcode === '' && showValidationMessages)
                      }, ["Zip/Postal Code is required"]),
                    ]),
                    div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6 rp-group" }, [
                      label({ id: "lbl_profileCountry", className: "control-label" }, ["Country*"]),
                      input({
                        id: "profileCountry",
                        name: "country",
                        type: "text",
                        className: "form-control ",
                        onChange: this.handleChange,
                        value: this.state.researcherProfile.country,
                        required: true
                      }),
                      span({
                        className: "cancel-color required-field-error-span",
                        isRendered: (this.state.researcherProfile.country === '' && showValidationMessages)
                      }, ["Country is required"]),
                    ]),
                  ]),
                ]),
              ]),

              div({ className: "form-group" }, [
                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12", style: { 'marginTop': '15px' } }, [
                  label({
                    id: "lbl_isThePI",
                    className: "control-label ",
                  }, [
                      "Are you the Principal Investigator?* ",
                      span({ className: "glyphicon glyphicon-question-sign tooltip-icon", "data-tip": "", "data-for": "tip_isthePI" }),
                      h(ReactTooltip, {
                        id: "tip_isthePI",
                        effect: 'solid',
                        multiline: true,
                        className: 'tooltip-wrapper'
                      }, ["This information is required in order to classify users as bonafide researchers as part of the process of Data Access approvals."])
                    ])
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                  YesNoRadioGroup({
                    value: this.state.researcherProfile.isThePI, onChange: this.handleRadioChange,
                    id: 'rad_isThePI', name: 'isThePI', required: true
                  })
                ]),

                // div({ className: "radio-inline" }, [
                //   label({ id: "lbl_isThePI", htmlFor: "rad_isThePI", className: "radio-wrapper" }, [
                //     input({
                //       id: "rad_isThePI",
                //       name: "isThePI",
                //       type: "radio",
                //       onChange: this.handlePIChange,
                //       checked: isThePI,
                //       onClick: this.clearNotRelatedPIFields,
                //       required: true
                //     }),
                //     span({ className: "radio-check" }),
                //     span({ className: "radio-label" }, ["Yes"])
                //   ]),

                //   label({ id: "lbl_isNotThePI", htmlFor: "rad_isNotThePI", className: "radio-wrapper" }, [
                //     input({
                //       id: "rad_isNotThePI",
                //       name: "isThePI",
                //       type: "radio",
                //       onChange: this.handlePIChange,
                //       checked: (isThePI === undefined ? undefined : !isThePI),
                //       onClick: this.clearNotRelatedPIFields,
                //       required: true
                //     }),
                //     span({ className: "radio-check" }),
                //     span({ className: "radio-label" }, ["No"])
                //   ])
                // ]),
                span({
                  className: "cancel-color required-field-error-span",
                  isRendered: (isThePI === '' && showValidationMessages)
                }, ["Required field"])
              ]),

              div({ isRendered: isThePI === false, className: "form-group" }, [

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({
                    className: "control-label ",
                    //  + (researcherForm.havePI.$invalid && showValidationMessages) ? 'cancel-color' : ''
                  }, ["Do you have a Principal Investigator?*"])
                ]),


                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                  YesNoRadioGroup({
                    value: this.state.researcherProfile.havePI, onChange: this.handleRadioChange,
                    id: 'rad_havePI', name: 'havePI', required: true
                  })
                ]),

                // div({ className: "radio-inline", disabled: isThePI !== false }, [
                //   label({ id: "lbl_doHavePI", htmlFor: "rad_doHavePI", className: "radio-wrapper" }, [
                //     input({
                //       id: "rad_doHavePI",
                //       name: "havePI",
                //       type: "radio",
                //       onChange: this.handlePI2Change,
                //       value: havePI,
                //       checked: havePI,
                //       onClick: this.clearCommonsFields,
                //       disabled: isThePI !== false,
                //       required: isThePI === false
                //     }),
                //     span({ className: "radio-check" }),
                //     span({ className: "radio-label" }, ["Yes"])
                //   ]),

                //   label({ id: "lbl_doNotHavePI", htmlFor: "rad_doNotHavePI", className: "radio-wrapper" }, [
                //     input({
                //       id: "rad_doNotHavePI",
                //       name: "havePI",
                //       type: "radio",
                //       onChange: this.handlePI2Change,
                //       value: havePI,
                //       checked: (havePI === undefined ? undefined : !havePI),
                //       onClick: this.clearNoHasPIFields,
                //       disabled: isThePI !== false,
                //       required: isThePI === false
                //     }),
                //     span({ className: "radio-check" }),
                //     span({ className: "radio-label" }, ["No"])
                //   ]),
                //   span({
                //     className: "cancel-color required-field-error-span",
                //     isRendered: (this.state.researcherProfile.havePI === '' && showValidationMessages)
                //   }, ["Required field"])
                // ])

                div({ isRendered: this.state.researcherProfile.havePI === true || this.state.researcherProfile.havePI === 'true', className: "form-group" }, [
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                    label({ id: "lbl_profilePIName", className: "control-label" }, ["Principal Investigator Name*"]),
                    input({
                      id: "profilePIName",
                      name: "piName",
                      type: "text",
                      className: "form-control ",
                      onChange: this.handleChange,
                      value: this.state.researcherProfile.piName,
                      required: this.state.researcherProfile.havePI === true,
                    }),
                    span({
                      className: "cancel-color required-field-error-span",
                      isRendered: (this.state.researcherProfile.piName === '' && showValidationMessages)
                    }, ["Principal Investigator is required"]),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                    label({
                      id: "lbl_profilePIEmail",
                      className: "control-label"
                    }, ["Principal Investigator Email Address*"]),
                    input({
                      id: "profilePIEmail",
                      name: "piEmail",
                      type: "email",
                      className: "form-control ",
                      onChange: this.handleChange,
                      value: this.state.researcherProfile.piEmail,
                      required: this.state.researcherProfile.havePI === true,
                    }),
                    span({
                      className: "cancel-color required-field-error-span",
                      isRendered: ((this.state.researcherProfile.piEmail === undefined || this.state.researcherProfile.piEmail.indexOf('@') === -1) && showValidationMessages)
                    }, ["Email Address is empty or has invalid format"]),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                    label({
                      id: "lbl_profileEraCommons",
                      className: "control-label"
                    }, ["eRA Commons ID ", span({ className: "italic" }, ["(optional)"])]),
                    input({
                      id: "profileEraCommons", // si existe lo tengo que guardar. Aparece si el usuario no es el PI.
                      name: "eRACommonsID",
                      type: "text",
                      className: "form-control",
                      onChange: this.handleChange,
                      value: this.state.researcherProfile.eRACommonsID
                    }),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                    label({
                      id: "lbl_profilePubmedID",
                      className: "control-label"
                    }, ["Pubmed ID of a publication ", span({ className: "italic" }, ["(optional)"])]),
                    input({
                      id: "pubmedID",
                      name: "pubmedID",
                      type: "text",
                      className: "form-control",
                      onChange: this.handleChange,
                      value: this.state.researcherProfile.pubmedID
                    }),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                    label({
                      id: "lbl_profileScientificURL",
                      className: "control-label"
                    }, ["URL of a scientific publication ", span({ className: "italic" }, ["(optional)"])]),
                    input({
                      id: "profileScientificURL",
                      name: "scientificURL",
                      type: "text",
                      className: "form-control",
                      onChange: this.handleChange,
                      value: this.state.researcherProfile.scientificURL
                    })
                  ])
                ])
              ]),

              div({ isRendered: (isThePI === true || havePI === false), className: "form-group" }, [
                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({
                    id: "lbl_profilePubmedID",
                    className: "control-label"
                  }, ["Pubmed ID of a publication ", span({ className: "italic" }, ["(optional)"])]),
                  input({
                    id: "profilePubmedID",
                    name: "pubmedID",
                    type: "text",
                    className: "form-control",
                    onChange: this.handleChange,
                    value: this.state.researcherProfile.pubmedID
                  })
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-last-group" }, [
                  label({
                    id: "lbl_profileScientificURL",
                    className: "control-label"
                  }, ["URL of a scientific publication ", span({ className: "italic" }, ["(optional)"])]),
                  input({
                    id: "profileScientificURL",
                    name: "scientificURL",
                    type: "text",
                    className: "form-control",
                    onChange: this.handleChange,
                    value: this.state.researcherProfile.scientificURL
                  })
                ])
              ]),

              div({ className: "row no-margin" }, [
              div({ className: "col-lg-4 col-md-6 col-sm-6 col-xs-6" }, [
                div({ className: "italic default-color" }, ["*Required field"])
              ]),

              div({ className: "col-lg-8 col-md-6 col-sm-6 col-xs-6" }, [
                button({ id: "btn_submit", onClick: this.submit, className: "f-right btn-primary common-background" }, [
                  span({ isRendered: !completed }, ["Submit"]),
                  span({ isRendered: completed }, ["Update"]),
                ]),
                ConfirmationDialog({
                  title: 'Submit Profile',
                  color: 'common',
                  showModal: this.state.showDialogSubmit,
                  action: { label: "Yes", handler: this.dialogHandlerSubmit }
                }, [div({ className: "dialog-description" }, ["Are you sure you want to submit your Profile information?"]),]),

                button({ id: "btn_continueLater", isRendered: !completed, onClick: this.saveProfile, className: "f-right btn-secondary common-color" }, ["Continue later"]),

                ConfirmationDialog({
                  title: 'Continue later',
                  color: 'common',
                  showModal: this.state.showDialogSave,
                  action: { label: "Yes", handler: this.dialogHandlerSave }
                }, [div({ className: "dialog-description" }, ["Are you sure you want to leave this page? Please remember that you need to submit your Profile information to be able to create a Data Access Request."]),])
              ])
            ])
            ])
          ])
        ])
      ])
    );
  }
});