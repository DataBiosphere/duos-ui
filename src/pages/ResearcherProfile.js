import { Component } from 'react';
import { div, h, hh, form, label, input, span, hr, a, button } from 'react-hyperscript-helpers';
<<<<<<< HEAD
import { Researcher, AuthenticateNIH } from '../libs/ajax';
=======
import { Researcher } from '../libs/ajax';
>>>>>>> e91a15aa0b00ba88642a96803bad846fee159cf9
import { Storage } from '../libs/storage';
import { PageHeading } from '../components/PageHeading';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import ReactTooltip from 'react-tooltip';
import { YesNoRadioGroup } from '../components/YesNoRadioGroup';
<<<<<<< HEAD
import { Config } from '../libs/config';
import * as qs from 'query-string';
=======
>>>>>>> e91a15aa0b00ba88642a96803bad846fee159cf9

export const ResearcherProfile = hh(class ResearcherProfile extends Component {

  constructor(props) {
    super(props);
    this.state = this.initialState();

    this.getResearcherProfile = this.getResearcherProfile.bind(this);

    this.clearNotRelatedPIFields = this.clearNotRelatedPIFields.bind(this);
    this.clearCommonsFields = this.clearCommonsFields.bind(this);
    this.clearNoHasPIFields = this.clearNoHasPIFields.bind(this);
    this.saveProfile = this.saveProfile.bind(this);
    this.submit = this.submit.bind(this);
    this.deleteNihAccount = this.deleteNihAccount.bind(this);
    this.redirectToNihLogin = this.redirectToNihLogin.bind(this);
  }

  componentDidMount() {
<<<<<<< HEAD
    if (this.props.location !== undefined && this.props.location.search !== "") {
      const parsed = qs.parse(this.props.location.search);
      AuthenticateNIH.verifyNihToken(parsed.token, Storage.getCurrentUser().dacUserId).then(
        result => {
          this.setState(prev => {
            prev.nihError = false;
            return prev;
          }, () => this.getResearcherProfile());
        }
      ).catch(error => {
        this.setState(prev => {
          prev.nihError = true;
          return prev;
        });
      });

    } else {
      this.getResearcherProfile();
    }

=======
    this.getResearcherProfile();
>>>>>>> e91a15aa0b00ba88642a96803bad846fee159cf9
  }

  initialState() {
    return {
<<<<<<< HEAD
      nihError: false,
      expirationCount: -1,
=======
>>>>>>> e91a15aa0b00ba88642a96803bad846fee159cf9
      fieldStatus: {},
      showDialogSubmit: false,
      showDialogSave: false,
      researcherProfile: {
<<<<<<< HEAD
        eraAuthorized: false,
=======
>>>>>>> e91a15aa0b00ba88642a96803bad846fee159cf9
        academicEmail: '',
        address1: '',
        address2: '',
        city: '',
        completed: undefined,
        country: '',
        department: '',
        division: '',
        eRACommonsID: '',
        havePI: null,
        institution: '',
        isThePI: null,
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
      },
      showRequired: false,
      invalidFields: {
        profileName: false,
        academicEmail: false,
        institution: false,
        department: false,
        address1: false,
        city: false,
        state: false,
        country: false,
        zipcode: false,
        havePI: false,
        isThePI: false,
        piName: false,
        piEmail: false,
      },
      showValidationMessages: false,
      validateFields: false,
    };
  }

  async getResearcherProfile() {
<<<<<<< HEAD
    let profile = await Researcher.getResearcherProfile(Storage.getCurrentUser().dacUserId);
    let rp = {};

    if (Storage.getData('researcher') !== null) {
      rp = Storage.getData('researcher');
      Storage.removeData('researcher');
      rp.eraAuthorized = profile.eraAuthorized;
      rp.eraExpiration = profile.eraExpiration;
      rp.nihUsername = profile.nihUsername;
    } else {
      rp = profile;
      rp.profileName = profile.profileName === undefined ? Storage.getCurrentUser().displayName : profile.profileName;
    }

    let expirationCount = await AuthenticateNIH.expirationCount(rp.eraExpiration);

    this.setState(prev => {
      let key;
      for (key in rp) {
        prev.researcherProfile[key] = rp[key];
      }
      prev.expirationCount = expirationCount;
      prev.researcherProfile.eraAuthorized = profile.eraAuthorized !== undefined ? profile.eraAuthorized : false;
=======
    const profile = await Researcher.getResearcherProfile(Storage.getCurrentUser().dacUserId);

    if (profile.profileName === undefined) {
      profile.profileName = Storage.getCurrentUser().displayName;
    }

    this.setState(prev => {
      let key;
      for (key in profile) {
        prev.researcherProfile[key] = profile[key];
      }
>>>>>>> e91a15aa0b00ba88642a96803bad846fee159cf9
      return prev;
    }, () => {
      if (this.state.researcherProfile.completed !== undefined && this.state.researcherProfile.completed !== "") {
        this.state.researcherProfile.completed = JSON.parse(this.state.researcherProfile.completed);
      }
      ReactTooltip.rebuild();
    });
  }

  deleteNihAccount() {
<<<<<<< HEAD
    AuthenticateNIH.eliminateAccount(Storage.getCurrentUser().dacUserId).then(result => {
      this.setState(prev => {
        prev.researcherProfile.eraAuthorized = false;
        return prev;
      });
    });
  }

  async redirectToNihLogin() {
    const nihUrl = `${await Config.getNihUrl()}??redirect-url=`;
    const landingUrl = nihUrl.concat(window.location.origin + "/researcher_profile?token%3D%7Btoken%7D");
    Storage.setData('researcher', this.state.researcherProfile);
    window.location.href = landingUrl;
=======

  }

  redirectToNihLogin() {

>>>>>>> e91a15aa0b00ba88642a96803bad846fee159cf9
  }

  handleChange = (event) => {
    let field = event.target.name;
    let value = event.target.value;

    this.setState(prev => {
      prev.researcherProfile[field] = value;
      return prev;
    }, () => {
      if (this.state.validateFields) {
        this.fieldsValidation();
      }
    });
  };

  fieldsValidation() {
    let profileName = false,
      academicEmail = false,
      institution = false,
      department = false,
      address1 = false,
      city = false,
      state = false,
      country = false,
      zipcode = false,
      havePI = false,
      isThePI = false,
      piEmail = false,
      piName = false,
      showValidationMessages = false;

    if (!this.isValid(this.state.researcherProfile.profileName)) {
      profileName = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.researcherProfile.academicEmail) || this.state.researcherProfile.academicEmail.indexOf('@') === -1) {
      academicEmail = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.researcherProfile.institution)) {
      institution = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.researcherProfile.department)) {
      department = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.researcherProfile.address1)) {
      address1 = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.researcherProfile.city)) {
      city = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.researcherProfile.state)) {
      state = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.researcherProfile.country)) {
      country = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.researcherProfile.zipcode)) {
      zipcode = true;
      showValidationMessages = true;
    }

    if (this.state.researcherProfile.isThePI === null) {
      isThePI = true;
      showValidationMessages = true;
    }

    if (this.state.researcherProfile.isThePI === 'false' && this.state.researcherProfile.havePI === 'true') {
      if (!this.isValid(this.state.researcherProfile.piEmail) || this.state.researcherProfile.piEmail.indexOf('@') === -1) {
        piEmail = true;
        showValidationMessages = true;
      }
      if (!this.isValid(this.state.researcherProfile.piName)) {
        piName = true;
        showValidationMessages = true;
      }
    }

    if (this.state.researcherProfile.isThePI === 'false' && this.state.researcherProfile.havePI === '') {
      havePI = true;
      showValidationMessages = true;
    }

    this.setState(prev => {
      prev.invalidFields.profileName = profileName;
      prev.invalidFields.academicEmail = academicEmail;
      prev.invalidFields.address1 = address1;
      prev.invalidFields.institution = institution;
      prev.invalidFields.department = department;
      prev.invalidFields.city = city;
      prev.invalidFields.state = state;
      prev.invalidFields.zipcode = zipcode;
      prev.invalidFields.havePI = havePI;
      prev.invalidFields.isThePI = isThePI;
      prev.invalidFields.country = country;
      prev.invalidFields.piName = piName;
      prev.invalidFields.piEmail = piEmail;
      prev.invalidFields.havePI = havePI;
      prev.showValidationMessages = showValidationMessages;
      return prev;
    });
    return showValidationMessages;
  }

  isValid(value) {
    let isValid = false;
    if (value !== '' && value !== null && value !== undefined) {
      isValid = true;
    }
    return isValid;
  };

  submit(event) {
    this.setState({ validateFields: true });

    event.preventDefault();
    const errorsShowed = this.fieldsValidation();
    if (errorsShowed === false) {
      this.setState(prev => {
        prev.showDialogSubmit = true;
        return prev;
      });
    }
  }

  handleRadioChange = (e, field, value) => {

    this.setState(prev => { prev.researcherProfile[field] = value; return prev; },
      () => {
        if (field === 'isThePI') {
          this.clearNotRelatedPIFields();
        }

        if (field === 'havePI' && (value === true || value === 'true')) {
          this.clearCommonsFields();
        } else if (field === 'havePI' && (value === false || value === 'false')) {
          this.clearNoHasPIFields();
        }
        if (this.state.validateFields) {
          this.fieldsValidation();
        }
      });
  };

  clearNotRelatedPIFields() {
    this.clearCommonsFields();
    this.setState(prev => {
      prev.researcherProfile.havePI = '';
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
      prev.researcherProfile.eRACommonsID = '';
      prev.researcherProfile.pubmedID = '';
      prev.researcherProfile.scientificURL = '';
      return prev;
    });
  }

  clearPIData() {
    this.setState(prev => {
      prev.researcherProfile.piName = '';
      prev.researcherProfile.piEmail = '';
      return prev;
    });
  }

  saveOProfile() {

  }

  saveProfile(event) {
    event.preventDefault();
    this.setState({ showDialogSave: true });
  }

  cleanObject = (obj) => {
    for (let key in obj) {
      if (obj[key] === "") {
        delete obj[key];
      }
    }
    return obj;
  };

  dialogHandlerSubmit = (answer) => (e) => {
    if (answer === true) {
      let profile = this.profileCopy(this.state.researcherProfile);

      profile = this.cleanObject(profile);
      profile.completed = true;

      if (this.state.researcherProfile.completed === undefined) {
        Researcher.createResearcherProperties(Storage.getCurrentUser().dacUserId, false, profile).then(resp => {
          // TODO : check status of PUT ? and show any error messages ?
        });
      } else {
        Researcher.update(Storage.getCurrentUser().dacUserId, true, profile).then(resp => {
          // TODO : check status of PUT ? and show any error messages ?
        });
      }
      this.props.history.push({ pathname: 'dataset_catalog' });
    }

    this.setState({ showDialogSubmit: false });
  };

  dialogHandlerSave = (answer) => (e) => {
    if (answer === true) {
      let profile = this.profileCopy(this.state.researcherProfile);
      profile.completed = false;
      Researcher.update(Storage.getCurrentUser().dacUserId, false, profile);
      this.props.history.push({ pathname: 'dataset_catalog' });
    }

    this.setState({ showDialogSave: false });
  };

  profileCopy = (fullProfile) => {
    let profile = {};
    let key;

    for (key in fullProfile) {
      if (key !== 'nihUsername') {
        profile[key] = fullProfile[key];
      }
    }
    return profile;
  };

  render() {

    let completed = this.state.researcherProfile.completed;
    if (completed !== undefined && completed !== "") {
      completed = JSON.parse(this.state.researcherProfile.completed);
    }

    const showValidationMessages = this.state.showValidationMessages;

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
                    className: (this.state.invalidFields.profileName && showValidationMessages) ? 'form-control required-field-error' : "form-control",
                    value: this.state.researcherProfile.profileName,
                    required: true
                  }),
                  span({
                    className: "cancel-color required-field-error-span",
                    isRendered: this.state.invalidFields.profileName && showValidationMessages
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
                    className: ((this.state.invalidFields.academicEmail) && showValidationMessages) ? 'form-control required-field-error' : "form-control",
                    required: true
                  }),
                  span({
                    className: "cancel-color required-field-error-span",
                    isRendered: (this.state.invalidFields.academicEmail && this.state.researcherProfile.academicEmail.indexOf('@') === -1) && showValidationMessages
                  }, ["Email Address is empty or has invalid format"]),
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12", style: { 'marginTop': '20px' } }, [
                  label({ className: "control-label rp-title-question default-color" }, [
                    "Researcher Identification ", span({ className: "italic display-inline" }, ["(optional)"]),
                    span({}, ["Please authenticate your eRA Commons account or provide a link to one of your other profiles:"])
                  ]),
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
                  div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                    div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
<<<<<<< HEAD
                      label({ id: "lbl_profileNIH", className: "control-label" }, ["NIH eRA Commons ID"]),
                      div({ isRendered: !this.state.researcherProfile.eraAuthorized || this.state.expirationCount < 0 }, [
=======
                      label({ id: "lbl_profileLinkedIn", className: "control-label" }, ["NIH eRA Commons ID"]),
                      div({ isRendered: true }, [
>>>>>>> e91a15aa0b00ba88642a96803bad846fee159cf9
                        a({ onClick: this.redirectToNihLogin, target: "_blank", className: "auth-button eRACommons" }, [
                          div({ className: "logo" }, []),
                          span({}, ["Authenticate your account"])
                        ])
                      ]),
<<<<<<< HEAD
                      span({
                        className: "cancel-color required-field-error-span",
                        isRendered: this.state.nihError
                      }, ["Something went wrong. Please try again. "]),
                      div({ isRendered: this.state.researcherProfile.eraAuthorized}, [
                        div({ isRendered: this.state.expirationCount >= 0, className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
                          div({ className: "auth-id" }, [this.state.researcherProfile.nihUsername]),
                          button({ type: "button", onClick: this.deleteNihAccount, className: "close auth-clear" }, [
                            span({ className: "glyphicon glyphicon-remove-circle", "data-tip": "", "data-for": "tip_clearNihAccount" })
                          ]),

                        ]),
                      
                        div({ className: "col-lg-12 col-md-12 col-sm-6 col-xs-12 no-padding auth-message" }, [
                          div({ isRendered: this.state.expirationCount >= 0 }, ["Your NIH authentication will expire in " + this.state.expirationCount + " days"]),
                          div({ isRendered: this.state.expirationCount < 0 }, ["Your NIH authentication expired"]),
=======
                      div({ isRendered: false }, [
                        div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
                          div({ className: "auth-id" }, [this.state.researcherProfile.nihUsername]),
                          button({ onClick: this.deleteNihAccount, className: "close auth-clear" }, [
                            span({ className: "glyphicon glyphicon-remove-circle", "data-tip": "Clear account", "data-for": "tip_clearNihAccount" })
                          ]),

                        ]),

                        div({ className: "col-lg-12 col-md-12 col-sm-6 col-xs-12 no-padding" }, [
                          div({ isRendered: this.state.researcherProfile.eraExpirationCount !== 0, className: "default-color display-block" }, ["Your NIH authentication will expire in " + this.state.researcherProfile.eraExpirationCount + " days"]),
                          div({ isRendered: this.state.researcherProfile.eraExpirationCount === 0, className: "default-color display-block" }, ["Your NIH authentication expired"]),
                        ]),
                        div({ isRendered: this.state.researcherProfile.dar_code !== null, className: "col-lg-12 col-md-12 col-sm-6 col-xs-12 no-padding" }, [
                          div({ className: "auth-id" }, [this.state.researcherProfile.nihUsername])
>>>>>>> e91a15aa0b00ba88642a96803bad846fee159cf9
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
                      label({ id: "lbl_profileResearcherGate", className: "control-label" }, ["ResearchGate ID"]),
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
                    className: (this.state.invalidFields.institution && showValidationMessages) ? 'form-control required-field-error' : "form-control",
                    onChange: this.handleChange,
                    value: this.state.researcherProfile.institution,
                    required: true
                  }),
                  span({
                    className: "cancel-color required-field-error-span",
                    isRendered: this.state.invalidFields.institution && showValidationMessages
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
                        className: (this.state.invalidFields.department && showValidationMessages) ? 'form-control required-field-error' : "form-control",
                        onChange: this.handleChange,
                        value: this.state.researcherProfile.department,
                        required: true
                      }),
                      span({
                        className: "cancel-color required-field-error-span",
                        isRendered: this.state.invalidFields.department && showValidationMessages
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
                        className: ((this.state.researcherProfile.address1 === '' || this.state.invalidFields.address1) && showValidationMessages) ? 'form-control required-field-error' : "form-control",
                        onChange: this.handleChange,
                        value: this.state.researcherProfile.address1,
                        required: true
                      }),
                      span({
                        className: "cancel-color required-field-error-span",
                        isRendered: (this.state.researcherProfile.address1 === '' || this.state.invalidFields.address1) && showValidationMessages
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
                        className: (this.state.invalidFields.city && showValidationMessages) ? 'form-control required-field-error' : "form-control",
                        onChange: this.handleChange,
                        value: this.state.researcherProfile.city,
                        required: true
                      }),
                      span({
                        className: "cancel-color required-field-error-span",
                        isRendered: this.state.invalidFields.city && showValidationMessages
                      }, ["City is required"]),
                    ]),
                    div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                      label({ id: "lbl_profileState", className: "control-label" }, ["State*"]),
                      input({
                        id: "profileState",
                        name: "state",
                        type: "text",
                        className: (this.state.invalidFields.state && showValidationMessages) ? 'form-control required-field-error' : "form-control",
                        onChange: this.handleChange,
                        value: this.state.researcherProfile.state,
                        required: true
                      }),
                      span({
                        className: "cancel-color required-field-error-span",
                        isRendered: this.state.invalidFields.state && showValidationMessages
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
                        className: (this.state.invalidFields.zipcode && showValidationMessages) ? 'form-control required-field-error' : "form-control",
                        onChange: this.handleChange,
                        value: this.state.researcherProfile.zipcode,
                        required: true
                      }),
                      span({
                        className: "cancel-color required-field-error-span",
                        isRendered: this.state.invalidFields.zipcode && showValidationMessages
                      }, ["Zip/Postal Code is required"]),
                    ]),
                    div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6 rp-group" }, [
                      label({ id: "lbl_profileCountry", className: "control-label" }, ["Country*"]),
                      input({
                        id: "profileCountry",
                        name: "country",
                        type: "text",
                        className: (this.state.invalidFields.country && showValidationMessages) ? 'form-control required-field-error' : "form-control",
                        onChange: this.handleChange,
                        value: this.state.researcherProfile.country,
                        required: true
                      }),
                      span({
                        className: "cancel-color required-field-error-span",
                        isRendered: this.state.invalidFields.country && showValidationMessages
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
                      span({ className: "glyphicon glyphicon-question-sign tooltip-icon", "data-tip": "This information is required in order to classify users as bonafide researchers as part of the process of Data Access approvals.", "data-for": "tip_isthePI" })
                    ])
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                  YesNoRadioGroup({
                    value: this.state.researcherProfile.isThePI,
                    onChange: this.handleRadioChange,
                    id: 'rad_isThePI',
                    name: 'isThePI',
                    required: true
                  })
                ]),
                span({
                  className: "cancel-color required-field-error-span",
                  style: { 'marginLeft': '15px' },
                  isRendered: (this.state.researcherProfile.isThePI === null || this.state.invalidFields.isThePI) && showValidationMessages
                }, ["Required field"])
              ]),

              div({ isRendered: this.state.researcherProfile.isThePI === 'false', className: "form-group" }, [

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({
                    className: "control-label ",
                  }, ["Do you have a Principal Investigator?*"])
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                  YesNoRadioGroup({
                    value: this.state.researcherProfile.havePI,
                    onChange: this.handleRadioChange,
                    id: 'rad_havePI',
                    name: 'havePI',
                    required: true
                  })
                ]),
                span({
                  className: "cancel-color required-field-error-span",
                  style: { 'marginLeft': '15px' },
                  isRendered: (this.state.invalidFields.havePI === 'true' || this.state.invalidFields.havePI) && showValidationMessages
                }, ["Required field"]),

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
                      isRendered: (this.state.researcherProfile.piName === '' || this.state.invalidFields.piName) && showValidationMessages
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
                      isRendered: (this.state.invalidFields.piEmail && this.state.researcherProfile.piEmail.indexOf('@') === -1) && showValidationMessages
                    }, ["Email Address is empty or has invalid format"]),
                  ]),

                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                    label({
                      id: "lbl_profileEraCommons",
                      className: "control-label"
                    }, ["eRA Commons ID ", span({ className: "italic" }, ["(optional)"])]),
                    input({
                      id: "profileEraCommons",
                      name: "eRACommonsID",
                      type: "text",
                      className: "form-control",
                      onChange: this.handleChange,
                      value: this.state.researcherProfile.eRACommonsID
                    })
                  ])
                ])
              ]),

              div({ className: "form-group" }, [
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
                    span({ isRendered: (!completed || completed === undefined) }, ["Submit"]),
                    span({ isRendered: (completed === true) }, ["Update"]),
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
                  }, [div({ className: "dialog-description" }, ["Are you sure you want to leave this page? Please remember that you need to submit your Profile information to be able to create a Data Access Request."])]
                  ),
                  h(ReactTooltip, {
                    id: "tip_clearNihAccount",
                    place: 'right',
                    effect: 'solid',
                    multiline: true,
                    className: 'tooltip-wrapper'
                  }),
                  h(ReactTooltip, {
                    id: "tip_isthePI",
                    effect: 'solid',
                    multiline: true,
                    className: 'tooltip-wrapper'
                  })
                ])
              ])
            ])
          ])
        ])
      ])
    );
  }
});
