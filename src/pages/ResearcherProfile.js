import { Component } from 'react';
import { div, h, hh, form, label, input, span, hr, a, button } from 'react-hyperscript-helpers';
import { Researcher, User, AuthenticateNIH } from '../libs/ajax';
import { Storage } from '../libs/storage';
import { PageHeading } from '../components/PageHeading';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import ReactTooltip from 'react-tooltip';
import { YesNoRadioGroup } from '../components/YesNoRadioGroup';
import { Config } from '../libs/config';
import * as qs from 'query-string';

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
    this.saveUser = this.saveUser.bind(this);
  }

  async componentDidMount() {
    this.getResearcherProfile();
    if (this.props.location !== undefined && this.props.location.search !== "") {
      let isFcUser = await this.verifyUser();
      if (!isFcUser) {
        isFcUser = await this.registerUsertoFC(this.state.profile);
      }
      if (isFcUser) {
        const parsedToken = qs.parse(this.props.location.search);
        const decodedNihAccount = await this.verifyToken(parsedToken);
        if (decodedNihAccount !== null) {
          await AuthenticateNIH.saveNihUsr(decodedNihAccount, Storage.getCurrentUser().dacUserId);
          await this.getResearcherProfile();
          this.props.history.push('profile');
        }
      }
    }
    ReactTooltip.rebuild();
  }

  async verifyToken(parsedToken) {
    return await AuthenticateNIH.verifyNihToken(parsedToken).then(
      (decoded) => decoded,
      (error) => {
        this.setState({nihError: true});
        return null;
      }
    );
  }

  async verifyUser() {
    let isFcUser = await AuthenticateNIH.fireCloudVerifyUsr().catch(
      (callback) => {
        return false;
      });
    return isFcUser !== undefined && isFcUser !== false &&  isFcUser.enabled.google === true;
  }

  async registerUsertoFC(profile) {
    return await AuthenticateNIH.fireCloudRegisterUsr(profile).then(
      (success) => {
        // user has been successfully registered to firecloud.
        return true;
      },
      (fail) => {
        this.setState({nihError: true});
        return false;
      })
  }

  initialState() {
    return {
      loading: true,
      isResearcher: Storage.getCurrentUser().isResearcher,
      fieldStatus: {},
      showDialogSubmit: false,
      showDialogSave: false,
      additionalEmail: '',
      nihError: false,
      nihErrorMessage: "Something went wrong. Please try again. ",
      expirationCount: -1,
      profile: {
        eraAuthorized: false,
        checkNotifications: false,
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
    let rp = {};
    let profile = await Researcher.getResearcherProfile(Storage.getCurrentUser().dacUserId);
    const currentUser = Storage.getCurrentUser();
    const user = await User.getByEmail(currentUser.email);
    if (profile.profileName === undefined) {
      profile.profileName = user.displayName;
    }

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
      for (key in profile) {
        if (key === 'checkNotifications') {
          prev.profile[key] = profile[key] === 'true' ? true : false;
        } else {
          prev.profile[key] = profile[key];
        }

      }
      prev.nihError = false;
      prev.additionalEmail = user.additionalEmail === null ? '' : user.additionalEmail;
      prev.expirationCount = expirationCount;
      prev.profile.eraAuthorized = profile.eraAuthorized !== undefined ? profile.eraAuthorized : false;
      return prev;
    }, () => {
      if (this.state.profile.completed !== undefined && this.state.profile.completed !== "") {
        this.setState(prev => {
          prev.profile.completed =  JSON.parse(this.state.profile.completed);
          return prev;
        });
      }
      ReactTooltip.rebuild();
    });
  }

  deleteNihAccount() {
    AuthenticateNIH.eliminateAccount(Storage.getCurrentUser().dacUserId).then(result => {
      this.setState(prev => {
        prev.profile.eraAuthorized = false;
        return prev;
      });
    });
  }

  async redirectToNihLogin() {
    const nihUrl = `${await Config.getNihUrl()}??redirect-url=`;
    const landingUrl = nihUrl.concat(window.location.origin + "/profile?jwt%3D%7Btoken%7D");
    Storage.setData('researcher', this.state.profile);
    window.location.href = landingUrl;
  }

  handleChange = (event) => {
    let field = event.target.name;
    let value = event.target.value;

    this.setState(prev => {
      prev.profile[field] = value;
      return prev;
    }, () => {
      if (this.state.validateFields) {
        this.researcherFieldsValidation();
      }
    });
  };

  researcherFieldsValidation() {
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

    if (!this.isValid(this.state.profile.profileName)) {
      profileName = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.profile.academicEmail) || this.state.profile.academicEmail.indexOf('@') === -1) {
      academicEmail = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.profile.institution)) {
      institution = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.profile.department)) {
      department = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.profile.address1)) {
      address1 = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.profile.city)) {
      city = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.profile.state)) {
      state = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.profile.country)) {
      country = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.profile.zipcode)) {
      zipcode = true;
      showValidationMessages = true;
    }

    if (this.state.profile.isThePI === null) {
      isThePI = true;
      showValidationMessages = true;
    }

    if (this.state.profile.isThePI === 'false' && this.state.profile.havePI === 'true') {
      if (!this.isValid(this.state.profile.piEmail) || this.state.profile.piEmail.indexOf('@') === -1) {
        piEmail = true;
        showValidationMessages = true;
      }
      if (!this.isValid(this.state.profile.piName)) {
        piName = true;
        showValidationMessages = true;
      }
    }

    if (this.state.profile.isThePI === 'false' && this.state.profile.havePI === '') {
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
    let errorsShowed = false;
    if (this.state.isResearcher) {
      errorsShowed = this.researcherFieldsValidation();
    } else if (this.state.profile.profileName === '' || (this.state.additionalEmail !== '' && this.state.additionalEmail.indexOf('@') === -1)) {
      this.setState(prev => {
        prev.showValidationMessages = true;
        return true;
      });
      errorsShowed = true;
    }
    if (errorsShowed === false) {
      this.setState(prev => {
        prev.showDialogSubmit = true;
        prev.showValidationMessages = false;
        return prev;
      });
    }
  }

  handleRadioChange = (e, field, value) => {

    this.setState(prev => { prev.profile[field] = value; return prev; },
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
          this.researcherFieldsValidation();
        }
      });
  };

  clearNotRelatedPIFields() {
    this.clearCommonsFields();
    this.setState(prev => {
      prev.profile.havePI = '';
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
      prev.profile.eRACommonsID = '';
      prev.profile.pubmedID = '';
      prev.profile.scientificURL = '';
      return prev;
    });
  }

  clearPIData() {
    this.setState(prev => {
      prev.profile.piName = '';
      prev.profile.piEmail = '';
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
      if (this.state.isResearcher) {
        let profile = this.profileCopy(this.state.profile);
        profile = this.cleanObject(profile);
        profile.completed = true;
        if (this.state.profile.completed === undefined) {
          Researcher.createResearcherProperties(Storage.getCurrentUser().dacUserId, false, profile).then(resp => {
            this.saveUser().then(resp => {
              this.setState({ showDialogSubmit: false });
              this.props.history.push({ pathname: 'dataset_catalog' });
            });            
          });
        } else {
          Researcher.update(Storage.getCurrentUser().dacUserId, true, profile).then(resp => {
            this.saveUser().then(resp => {
              this.setState({ showDialogSubmit: false });
              this.props.history.push({ pathname: 'dataset_catalog' });
            });            
          });
        }
      
      }
      else {
        this.saveUser().then(resp => {
          this.setState({ showDialogSubmit: false });
          this.props.history.goBack();
        });
      }

    } else {
      this.setState({ showDialogSubmit: false });
    }
  };

  async saveUser() {
    const currentUser = Storage.getCurrentUser();
    currentUser.displayName = this.state.profile.profileName;
          let map = {
            dacUserId: currentUser.dacUserId,
            email: currentUser.email,
            displayName: this.state.profile.profileName,
            additionalEmail: this.state.additionalEmail
          };
    await User.updateMainFields(map, currentUser.dacUserId);
  };

  handleCheckboxChange = (e) => {
    const value = e.target.checked;
    this.setState(prev => {
      prev.profile.checkNotifications = value;
      return prev;
    });
  };

  handleAdditionalEmailChange = (e) => {
    const value = e.target.value;
    this.setState(prev => {
      prev.additionalEmail = value;
      return prev;
    });
  };

  
  dialogHandlerSave = (answer) => (e) => {
    if (answer === true) {
      let profile = this.profileCopy(this.state.profile);
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
    let completed = this.state.profile.completed;
    const showValidationMessages = this.state.showValidationMessages;

    return (

      div({ className: "container" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [
            PageHeading({
              id: "researcherProfile",
              color: "common",
              title: "Your Profile",
              description: this.state.isResearcher ? "Please complete the following information to be able to request access to dataset(s)" : ""
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
                    value: this.state.profile.profileName,
                    required: true
                  }),
                  span({
                    className: "cancel-color required-field-error-span",
                    isRendered: this.state.invalidFields.profileName && showValidationMessages
                  }, ["Full Name is required"])
                ]),

                div({ isRendered: this.state.isResearcher, className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({
                    id: "lbl_profileAcademicEmail",
                    className: "control-label"
                  }, ["Academic/Business Email Address*"]),
                  input({
                    id: "profileAcademicEmail",
                    name: "academicEmail",
                    type: "email",
                    onChange: this.handleChange,
                    value: this.state.profile.academicEmail,
                    className: ((this.state.invalidFields.academicEmail) && showValidationMessages) ? 'form-control required-field-error' : "form-control",
                    required: true
                  }),
                  span({
                    className: "cancel-color required-field-error-span",
                    isRendered: (this.state.invalidFields.academicEmail && this.state.profile.academicEmail.indexOf('@') === -1) && showValidationMessages
                  }, ["Email Address is empty or has invalid format"]),
                ]),

                div({ isRendered: this.state.isResearcher, className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group checkbox" }, [
                  input({
                    type: "checkbox",
                    id: "chk_sendNotificationsAcademicEmail",
                    name: "checkNotifications",
                    className: "checkbox-inline rp-checkbox",
                    checked: this.state.profile.checkNotifications,
                    onChange: this.handleCheckboxChange
                  }),
                  label({ className: "regular-checkbox rp-choice-questions", htmlFor: "chk_sendNotificationsAcademicEmail" }, ["Send Notifications to my Academic/Business Email Address"]),
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 " + (!this.state.isResearcher ? 'rp-last-group' : '') }, [
                  label({
                    id: "lbl_notificationsEmail", className: "control-label"
                  }, ["Enter an additional email to receive DUOS notifications ", span({ className: "italic display-inline" }, ["(optional)"]),]),
                  input({
                    id: "additionalEmail",
                    name: "additionalEmail",
                    type: "text",
                    onChange: this.handleAdditionalEmailChange,
                    className: "form-control",
                    value: this.state.additionalEmail,
                  }),
                  span({
                    className: "cancel-color required-field-error-span",
                    isRendered: (this.state.additionalEmail.indexOf('@') === -1) && showValidationMessages
                  }, ["Email Address is empty or has invalid format"]),                ])
              ]),

              div({ isRendered: this.state.isResearcher, className: "form-group" }, [
                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12", style: { 'marginTop': '20px' } }, [
                  label({ className: "control-label rp-title-question default-color" }, [
                    "Researcher Identification ", span({ className: "italic display-inline" }, ["(optional)"]),
                    span({}, ["Please authenticate your eRA Commons account or provide a link to one of your other profiles:"])
                  ]),
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
                  div({ className: "row fsi-row-lg-level fsi-row-md-level no-margin" }, [
                    div({ className: "col-lg-6 col-md-6 col-sm-6 col-xs-6" }, [
                      label({ id: "lbl_profileNIH", className: "control-label" }, ["NIH eRA Commons ID"]),
                      div({ isRendered: !this.state.profile.eraAuthorized || this.state.expirationCount < 0 }, [
                        a({ onClick: this.redirectToNihLogin, target: "_blank", className: "auth-button eRACommons" }, [
                          div({ className: "logo" }, []),
                          span({}, ["Authenticate your account"])
                        ])
                      ]),
                      span({
                        className: "cancel-color required-field-error-span",
                        isRendered: this.state.nihError
                      // }, ["Something went wrong. Please try again. "]),
                      }, [this.state.nihErrorMessage]),
                      div({ isRendered: this.state.profile.eraAuthorized}, [
                        div({ isRendered: this.state.expirationCount >= 0, className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
                          div({ className: "auth-id" }, [this.state.profile.nihUsername]),
                          button({ type: "button", onClick: this.deleteNihAccount, className: "close auth-clear" }, [
                            span({ className: "glyphicon glyphicon-remove-circle", "data-tip": "", "data-for": "tip_clearNihAccount" })
                          ]),

                        ]),

                        div({ className: "col-lg-12 col-md-12 col-sm-6 col-xs-12 no-padding auth-message" }, [
                          div({ isRendered: this.state.expirationCount >= 0 }, ["Your NIH authentication will expire in " + this.state.expirationCount + " days"]),
                          div({ isRendered: this.state.expirationCount < 0 }, ["Your NIH authentication expired"]),
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
                        value: this.state.profile.linkedIn
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
                        value: this.state.profile.orcid
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
                        value: this.state.profile.researcherGate
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
                    value: this.state.profile.institution,
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
                        value: this.state.profile.department,
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
                        value: this.state.profile.division
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
                        className: ((this.state.profile.address1 === '' || this.state.invalidFields.address1) && showValidationMessages) ? 'form-control required-field-error' : "form-control",
                        onChange: this.handleChange,
                        value: this.state.profile.address1,
                        required: true
                      }),
                      span({
                        className: "cancel-color required-field-error-span",
                        isRendered: (this.state.profile.address1 === '' || this.state.invalidFields.address1) && showValidationMessages
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
                        value: this.state.profile.address2
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
                        value: this.state.profile.city,
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
                        value: this.state.profile.state,
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
                        value: this.state.profile.zipcode,
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
                        value: this.state.profile.country,
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

              div({ isRendered: this.state.isResearcher, className: "form-group" }, [
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
                    value: this.state.profile.isThePI,
                    onChange: this.handleRadioChange,
                    id: 'rad_isThePI',
                    name: 'isThePI',
                    required: true
                  })
                ]),
                span({
                  className: "cancel-color required-field-error-span",
                  style: { 'marginLeft': '15px' },
                  isRendered: (this.state.profile.isThePI === null || this.state.invalidFields.isThePI) && showValidationMessages
                }, ["Required field"])
              ]),

              div({ isRendered: this.state.profile.isThePI === 'false' &&  this.state.isResearcher, className: "form-group" }, [

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                  label({
                    className: "control-label ",
                  }, ["Do you have a Principal Investigator?*"])
                ]),

                div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group" }, [
                  YesNoRadioGroup({
                    value: this.state.profile.havePI,
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

                div({ isRendered: this.state.profile.havePI === true || this.state.profile.havePI === 'true', className: "form-group" }, [
                  div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12" }, [
                    label({ id: "lbl_profilePIName", className: "control-label" }, ["Principal Investigator Name*"]),
                    input({
                      id: "profilePIName",
                      name: "piName",
                      type: "text",
                      className: "form-control ",
                      onChange: this.handleChange,
                      value: this.state.profile.piName,
                      required: this.state.profile.havePI === true,
                    }),
                    span({
                      className: "cancel-color required-field-error-span",
                      isRendered: (this.state.profile.piName === '' || this.state.invalidFields.piName) && showValidationMessages
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
                      value: this.state.profile.piEmail,
                      required: this.state.profile.havePI === true,
                    }),
                    span({
                      className: "cancel-color required-field-error-span",
                      isRendered: (this.state.invalidFields.piEmail && this.state.profile.piEmail.indexOf('@') === -1) && showValidationMessages
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
                      value: this.state.profile.eRACommonsID
                    })
                  ])
                ])
              ]),

              div({  isRendered: this.state.isResearcher, className: "form-group" }, [
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
                    value: this.state.profile.pubmedID
                  })
                ]),

                div({ isRendered: this.state.isResearcher, className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-last-group" }, [
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
                    value: this.state.profile.scientificURL
                  })
                ])
              ]),

              div({ className: "row no-margin" }, [
                div({ className: "col-lg-4 col-md-6 col-sm-6 col-xs-6" }, [
                  div({ className: "italic default-color" }, ["*Required field"])
                ]),

                div({ className: "col-lg-8 col-md-6 col-sm-6 col-xs-6" }, [
                  button({ id: "btn_submit", onClick: this.submit, className: "f-right btn-primary common-background" }, [
                    span({ isRendered: ((!completed || completed === undefined)) && this.state.isResearcher }, ["Submit"]),
                    span({ isRendered: (completed === true || !this.state.isResearcher) }, ["Update"]),
                  ]),
                  ConfirmationDialog({
                    title: 'Submit Profile',
                    color: 'common',
                    showModal: this.state.showDialogSubmit,
                    action: { label: "Yes", handler: this.dialogHandlerSubmit }
                  }, [div({ className: "dialog-description" }, ["Are you sure you want to submit your Profile information?"]),]),

                  button({ id: "btn_continueLater", isRendered: !completed && this.state.isResearcher, onClick: this.saveProfile, className: "f-right btn-secondary common-color" }, ["Continue later"]),

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
