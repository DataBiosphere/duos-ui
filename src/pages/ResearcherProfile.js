import _, {isNil} from 'lodash';
import { Component } from 'react';
import {button, div, form, hh, hr, input, label, option, select, span, textarea} from 'react-hyperscript-helpers';
import { LibraryCards } from '../components/LibraryCards';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { eRACommons } from '../components/eRACommons';
import { PageHeading } from '../components/PageHeading';
import { YesNoRadioGroup } from '../components/YesNoRadioGroup';
import { Researcher, User } from '../libs/ajax';
import { Storage } from '../libs/storage';
import { NotificationService } from '../libs/notificationService';
import { Notification } from '../components/Notification';
import * as ld from 'lodash';
import { USER_ROLES, setUserRoleStatuses } from '../libs/utils';
import {getNames} from "country-list";

const USA = option({ value: "United States of America"}, ["United States of America"]);
const NA = option({ value: "N/A"}, ["N/A"]);
const countries = getNames();
const countryNames = countries.map(name => option({value: name}, [name]));
countryNames.splice(232, 1);
countryNames.splice(0, 0, USA);
const UsaStates = require('usa-states').UsaStates;
const states = (new UsaStates().arrayOf("names"));
const stateNames = (states.map(name => option({value: name}, [name])));
stateNames.splice(0,0, NA);

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
    this.saveUser = this.saveUser.bind(this);
  }

  async componentDidMount() {
    this.getResearcherProfile();
    this.props.history.push('profile');
    const notificationData = await NotificationService.getBannerObjectById('eRACommonsOutage');
    this.setState(prev => {
      prev.notificationData = notificationData;
      return prev;
    });

    //remove all states and countries that are not on the official lists as a result
    //of the old free-fill input boxes, set these to default values of USA for country
    //and N/A for state, this will not be valid input thus the user will need to
    //update their profile before they will be able to submit a DAR
    this.setState((prev) => {
      if (!states.includes(this.state.profile.state)) {
        prev.profile.state = "N/A"
      }
      if (!countries.includes(this.state.profile.country)) {
        prev.profile.country = "United States of America"
      }
      return prev;
    });

  }

  initialState() {
    return {
      loading: true,
      isResearcher: Storage.getCurrentUser().isResearcher,
      hasLibraryCard: false,
      fieldStatus: {},
      showDialogSubmit: false,
      showDialogSave: false,
      additionalEmail: '',
      roles: [],
      profile: {
        checkNotifications: false,
        academicEmail: '',
        address1: '',
        address2: '',
        city: '',
        completed: undefined,
        country: "United States of America",
        department: '',
        division: '',
        eRACommonsID: '',
        havePI: null,
        institution: '',
        isThePI: null,
        linkedIn: '',
        orcid: '',
        piEmail: '',
        piName: '',
        profileName: '',
        pubmedID: '',
        researcherGate: '',
        scientificURL: '',
        state: "N/A",
        zipcode: ''
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
        piEmail: false
      },
      showValidationMessages: false,
      validateFields: false
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
      Storage.removeData('researcher');
    } else {
      rp = profile;
      rp.profileName = profile.profileName === undefined ? Storage.getCurrentUser().displayName : profile.profileName;
    }

    this.setState(prev => {
      if (_.isEmpty(currentUser.roles)) {
        prev.roles = [{ 'roleId': 5, 'name': USER_ROLES.researcher }];
      } else {
        prev.roles = currentUser.roles;
      }
      prev.researcherProfile = profile;
      let key;
      for (key in profile) {
        if (key === 'checkNotifications') {
          prev.profile[key] = profile[key] === 'true' ? true : false;
        } else {
          prev.profile[key] = profile[key];
        }

      }
      prev.additionalEmail = user.additionalEmail === null ? '' : user.additionalEmail;
      return prev;
    }, () => {
      if (this.state.profile.completed !== undefined && this.state.profile.completed !== '') {
        this.setState(prev => {
          prev.profile.completed = JSON.parse(this.state.profile.completed);
          return prev;
        });
      }
    });
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

    if (!this.isValidState(this.state.profile.state)) {
      state = true;
      showValidationMessages = true;
    }

    if (!this.isValidCountry(this.state.profile.country)) {
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

  isValidState(value) {
    let isValid = false;
    const inUS = this.state.profile.country === "United States of America";
    if ( inUS && !isNil(value) && states.includes(value) ) {
      isValid = true;
    } else {
      if (!inUS && !isNil(value)) {
        isValid = true;
      }
    }
    return isValid;
  };

  isValidCountry(value) {
    let isValid = false;
    if (!isNil(value) && countries.includes(value)) {
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

    this.setState(prev => {
        prev.profile[field] = value;
        return prev;
      },
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

  saveProfile(event) {
    event.preventDefault();
    this.setState({ showDialogSave: true });
  }

  cleanObject = (obj) => {
    for (let key in obj) {
      if (obj[key] === '') {
        delete obj[key];
      }
    }
    return obj;
  };

  saveProperties(profile) {
    Researcher.createProperties(profile).then(resp => {
      this.saveUser().then(resp => {
        this.setState({ showDialogSubmit: false });
        this.props.history.push({ pathname: 'dataset_catalog' });
      });
    });
  }

  dialogHandlerSubmit = (answer) => (e) => {
    if (answer === true) {
      if (this.state.isResearcher) {
        let profile = this.state.profile;
        profile = this.cleanObject(profile);
        profile.completed = true;
        if (this.state.profile.completed === undefined) {
          this.saveProperties(profile);
        } else {
          this.updateResearcher(profile);
        }
      } else {
        this.saveUser().then(resp => {
          this.setState({ isResearcher: resp.isResearcher, showDialogSubmit: false });
        });
      }

    } else {
      this.setState({ showDialogSubmit: false });
    }
  };

  updateResearcher(profile) {
    const profileClone = this.cloneProfile(profile);
    Researcher.updateProperties(Storage.getCurrentUser().dacUserId, true, profileClone).then(resp => {
      this.saveUser().then(resp => {
        this.setState({ showDialogSubmit: false });
        this.props.history.push({ pathname: 'dataset_catalog' });
      });
    });
  };

  async saveUser() {
    const currentUser = Storage.getCurrentUser();
    currentUser.displayName = this.state.profile.profileName;
    currentUser.additionalEmail = this.state.additionalEmail;
    currentUser.roles = this.state.roles;
    const payload = { updatedUser: currentUser };
    let updatedUser = await User.update(payload, currentUser.dacUserId);
    updatedUser = Object.assign({}, updatedUser, setUserRoleStatuses(updatedUser, Storage));
    return updatedUser;
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
      let profile = this.state.profile;
      profile.completed = false;
      const profileClone = this.cloneProfile(profile);
      Researcher.updateProperties(Storage.getCurrentUser().dacUserId, false, profileClone);
      this.props.history.push({ pathname: 'dataset_catalog' });
    }

    this.setState({ showDialogSave: false });
  };

  // When posting a user's researcher properties, library cards and entries are
  // not valid properties for update.
  cloneProfile = (profile) => {
    return _.omit(_.cloneDeep(profile), ['libraryCards', 'libraryCardEntries']);
  };

  render() {
    let completed = this.state.profile.completed;
    const { researcherProfile, showValidationMessages } = this.state;
    const libraryCards = ld.get(researcherProfile, 'libraryCards', []);

    return (

      div({ className: 'container' }, [
        div({ className: 'row no-margin' }, [
          div({ className: 'col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12' }, [
            Notification({notificationData: this.state.notificationData}),
            PageHeading({
              id: 'researcherProfile',
              color: 'common',
              title: 'Your Profile',
              description: this.state.isResearcher ? 'Please complete the following information to be able to request access to dataset(s)' : ''
            }),
            hr({ className: 'section-separator' })
          ]),
          div({ className: 'col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12 no-padding' }, [
            form({ name: 'researcherForm' }, [
              div({ className: 'form-group' }, [
                div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                  label({
                    id: 'lbl_profileName', className: 'control-label'
                  }, ['Full Name*']),
                  input({
                    id: 'profileName',
                    name: 'profileName',
                    type: 'text',
                    onChange: this.handleChange,
                    className: (this.state.invalidFields.profileName && showValidationMessages) ?
                      'form-control required-field-error' :
                      'form-control',
                    value: this.state.profile.profileName,
                    required: true
                  }),
                  span({
                    className: 'cancel-color required-field-error-span',
                    isRendered: this.state.invalidFields.profileName && showValidationMessages
                  }, ['Full Name is required'])
                ]),

                div({ isRendered: this.state.isResearcher, className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                  label({
                    id: 'lbl_profileAcademicEmail',
                    className: 'control-label'
                  }, ['Academic/Business Email Address*']),
                  input({
                    id: 'profileAcademicEmail',
                    name: 'academicEmail',
                    type: 'email',
                    onChange: this.handleChange,
                    value: this.state.profile.academicEmail,
                    className: ((this.state.invalidFields.academicEmail) && showValidationMessages) ?
                      'form-control required-field-error' :
                      'form-control',
                    required: true
                  }),
                  span({
                    className: 'cancel-color required-field-error-span',
                    isRendered: (this.state.invalidFields.academicEmail && this.state.profile.academicEmail.indexOf('@') === -1) &&
                      showValidationMessages
                  }, ['Email Address is empty or has invalid format'])
                ]),

                div({ isRendered: this.state.isResearcher, className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group checkbox' }, [
                  input({
                    type: 'checkbox',
                    id: 'chk_sendNotificationsAcademicEmail',
                    name: 'checkNotifications',
                    className: 'checkbox-inline rp-checkbox',
                    checked: this.state.profile.checkNotifications,
                    onChange: this.handleCheckboxChange
                  }),
                  label({ className: 'regular-checkbox rp-choice-questions', htmlFor: 'chk_sendNotificationsAcademicEmail' },
                    ['Send Notifications to my Academic/Business Email Address'])
                ]),

                div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 ' + (!this.state.isResearcher ? 'rp-last-group' : '') }, [
                  label({
                    id: 'lbl_notificationsEmail', className: 'control-label'
                  }, ['Enter an additional email to receive DUOS notifications ', span({ className: 'italic display-inline' }, ['(optional)'])]),
                  input({
                    id: 'additionalEmail',
                    name: 'additionalEmail',
                    type: 'text',
                    onChange: this.handleAdditionalEmailChange,
                    className: 'form-control',
                    value: this.state.additionalEmail
                  }),
                  span({
                    className: 'cancel-color required-field-error-span',
                    isRendered: (this.state.additionalEmail.indexOf('@') === -1) && showValidationMessages
                  }, ['Email Address is empty or has invalid format'])
                ])
              ]),

              div({ isRendered: this.state.isResearcher, className: 'form-group' }, [
                div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12', style: { 'marginTop': '20px' } }, [
                  label({ className: 'control-label rp-title-question default-color' }, [
                    'Researcher Identification*',
                    span({}, ['Please authenticate your eRA Commons account to submit Data Access Requests. Other profiles are optional:'])
                  ])
                ]),

                div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding' }, [
                  div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                    eRACommons({
                      className: 'col-lg-4 col-md-4 col-sm-6 col-xs-12',
                      destination: 'profile',
                      onNihStatusUpdate: (nihValid) => {},
                      location: this.props.location
                    }),
                    div({ className: '' }, [
                      label({ id: 'lbl_profileLibraryCard', className: 'control-label' }, ['Library Cards']),
                      LibraryCards({
                        style: { display: 'flex', flexFlow: 'row wrap' },
                        isRendered: !ld.isNil(researcherProfile),
                        libraryCards: libraryCards
                      })
                    ])
                  ])
                ]),

                div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding' }, [
                  div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                    div({ className: 'col-lg-4 col-md-4 col-sm-4 col-xs-12' }, [
                      label({ id: 'lbl_profileLinkedIn', className: 'control-label' }, ['LinkedIn Profile']),
                      input({
                        id: 'profileLinkedIn',
                        name: 'linkedIn',
                        type: 'text',
                        className: 'form-control',
                        onChange: this.handleChange,
                        value: this.state.profile.linkedIn
                      })
                    ]),
                    div({ className: 'col-lg-4 col-md-4 col-sm-4 col-xs-12' }, [
                      label({ id: 'lbl_profileOrcid', className: 'control-label' }, ['ORCID iD']),
                      input({
                        id: 'profileOrcid',
                        name: 'orcid',
                        type: 'text',
                        className: 'form-control',
                        onChange: this.handleChange,
                        value: this.state.profile.orcid
                      })
                    ]),
                    div({ className: 'col-lg-4 col-md-4 col-sm-4 col-xs-12' }, [
                      label({ id: 'lbl_profileResearcherGate', className: 'control-label' }, ['ResearchGate ID']),
                      input({
                        id: 'profileResearcherGate',
                        name: 'researcherGate',
                        type: 'text',
                        className: 'form-control',
                        onChange: this.handleChange,
                        value: this.state.profile.researcherGate
                      })
                    ])
                  ])
                ]),

                div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12', style: { 'marginTop': '20px' } }, [
                  label({ id: 'lbl_profileInstitution', className: 'control-label' }, ['Institution Name*']),
                  input({
                    id: 'profileInstitution',
                    name: 'institution',
                    type: 'text',
                    className: (this.state.invalidFields.institution && showValidationMessages) ?
                      'form-control required-field-error' :
                      'form-control',
                    onChange: this.handleChange,
                    value: this.state.profile.institution,
                    required: true
                  }),
                  span({
                    className: 'cancel-color required-field-error-span',
                    isRendered: this.state.invalidFields.institution && showValidationMessages
                  }, ['Institution Name is required'])
                ]),

                div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding' }, [
                  div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                    div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-6' }, [
                      label({ id: 'lbl_profileDepartment', className: 'control-label' }, ['Department*']),
                      input({
                        id: 'profileDepartment',
                        name: 'department',
                        type: 'text',
                        className: (this.state.invalidFields.department && showValidationMessages) ?
                          'form-control required-field-error' :
                          'form-control',
                        onChange: this.handleChange,
                        value: this.state.profile.department,
                        required: true
                      }),
                      span({
                        className: 'cancel-color required-field-error-span',
                        isRendered: this.state.invalidFields.department && showValidationMessages
                      }, ['Department is required'])
                    ]),
                    div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-6' }, [
                      label({
                        id: 'lbl_profileDivision',
                        className: 'control-label'
                      }, ['Division ', span({ className: 'italic' }, ['(optional)'])]),
                      input({
                        id: 'profileDivision',
                        name: 'division',
                        type: 'text',
                        className: 'form-control',
                        onChange: this.handleChange,
                        value: this.state.profile.division
                      })
                    ])
                  ])
                ]),
                div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding' }, [
                  div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                    div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-6' }, [
                      label({ id: 'lbl_profileAddress1', className: 'control-label' }, ['Street Address 1*']),
                      input({
                        id: 'profileAddress1',
                        name: 'address1',
                        type: 'text',
                        className: ((this.state.profile.address1 === '' || this.state.invalidFields.address1) && showValidationMessages) ?
                          'form-control required-field-error' :
                          'form-control',
                        onChange: this.handleChange,
                        value: this.state.profile.address1,
                        required: true
                      }),
                      span({
                        className: 'cancel-color required-field-error-span',
                        isRendered: (this.state.profile.address1 === '' || this.state.invalidFields.address1) && showValidationMessages
                      }, ['Street Address is required'])
                    ]),
                    div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-6' }, [
                      label({
                        id: 'lbl_profileAddress2',
                        className: 'control-label'
                      }, ['Street Address 2 ', span({ className: 'italic' }, ['(optional)'])]),
                      input({
                        id: 'profileAddress2',
                        name: 'address2',
                        type: 'text',
                        className: 'form-control',
                        onChange: this.handleChange,
                        value: this.state.profile.address2
                      })
                    ])
                  ])
                ]),

                div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding' }, [
                  div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                    div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-6' }, [
                      label({ id: 'lbl_profileCity', className: 'control-label' }, ['City*']),
                      input({
                        id: 'profileCity',
                        name: 'city',
                        type: 'text',
                        className: (this.state.invalidFields.city && showValidationMessages) ? 'form-control required-field-error' : 'form-control',
                        onChange: this.handleChange,
                        value: this.state.profile.city,
                        required: true
                      }),
                      span({
                        className: 'cancel-color required-field-error-span',
                        isRendered: this.state.invalidFields.city && showValidationMessages
                      }, ['City is required'])
                    ]),
                    div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-6' }, [
                      label({ id: 'lbl_profileState', className: 'control-label'}, ['State*']),
                      select({
                        id: 'profileState',
                        name: 'state',
                        onChange: this.handleChange,
                        value: this.state.profile.state,
                        className: (this.state.invalidFields.state && showValidationMessages) ? 'form-control required-field-error' : 'form-control',
                        required: true
                      }, stateNames ),
                      span({
                        className: 'cancel-color required-field-error-span',
                        isRendered: this.state.invalidFields.state && showValidationMessages
                      }, ['State is required if you live in the United States'])
                    ])
                  ])
                ]),

                div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding' }, [
                  div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                    div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-6 rp-group' }, [
                      label({ id: 'lbl_profileZip', className: 'control-label' }, ['Zip/Postal Code*']),
                      input({
                        id: 'profileZip',
                        name: 'zipcode',
                        type: 'text',
                        className: (this.state.invalidFields.zipcode && showValidationMessages) ?
                          'form-control required-field-error' :
                          'form-control',
                        onChange: this.handleChange,
                        value: this.state.profile.zipcode,
                        required: true
                      }),
                      span({
                        className: 'cancel-color required-field-error-span',
                        isRendered: this.state.invalidFields.zipcode && showValidationMessages
                      }, ['Zip/Postal Code is required'])
                    ]),
                    div({ className: 'col-lg-6 col-md-6 col-sm-6 col-xs-6 rp-group' }, [
                      label({ id: 'lbl_profileCountry', className: 'control-label' }, ['Country*']),
                      select({
                        id: 'profileCountry',
                        name: 'country',
                        onChange: this.handleChange,
                        value: this.state.profile.country,
                        className: (this.state.invalidFields.country && showValidationMessages) ?
                          'form-control required-field-error' :
                          'form-control',
                        required: true
                      }, countryNames ),
                      span({
                        className: 'cancel-color required-field-error-span',
                        isRendered: this.state.invalidFields.country && showValidationMessages
                      }, ['Country is required'])
                    ])
                  ])
                ])
              ]),

              div({ isRendered: this.state.isResearcher, className: 'form-group' }, [
                div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12', style: { 'marginTop': '15px' } }, [
                  label({
                    id: 'lbl_isThePI',
                    className: 'control-label '
                  }, [
                    'Are you the Principal Investigator?* ',
                    span({
                      className: 'glyphicon glyphicon-question-sign tooltip-icon',
                      'data-tip': 'This information is required in order to classify users as bonafide researchers as part of the process of Data Access approvals.',
                      'data-for': 'tip_isthePI'
                    })
                  ])
                ]),

                div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                  YesNoRadioGroup({
                    value: this.state.profile.isThePI,
                    onChange: this.handleRadioChange,
                    id: 'rad_isThePI',
                    name: 'isThePI',
                    required: true
                  })
                ]),
                span({
                  className: 'cancel-color required-field-error-span',
                  style: { 'marginLeft': '15px' },
                  isRendered: (this.state.profile.isThePI === null || this.state.invalidFields.isThePI) && showValidationMessages
                }, ['Required field'])
              ]),

              div({ isRendered: this.state.profile.isThePI === 'false' && this.state.isResearcher, className: 'form-group' }, [

                div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                  label({
                    className: 'control-label '
                  }, ['Do you have a Principal Investigator?*'])
                ]),

                div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-group' }, [
                  YesNoRadioGroup({
                    value: this.state.profile.havePI,
                    onChange: this.handleRadioChange,
                    id: 'rad_havePI',
                    name: 'havePI',
                    required: true
                  })
                ]),
                span({
                  className: 'cancel-color required-field-error-span',
                  style: { 'marginLeft': '15px' },
                  isRendered: (this.state.invalidFields.havePI === 'true' || this.state.invalidFields.havePI) && showValidationMessages
                }, ['Required field']),

                div({ isRendered: this.state.profile.havePI === true || this.state.profile.havePI === 'true', className: 'form-group' }, [
                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                    label({ id: 'lbl_profilePIName', className: 'control-label' }, ['Principal Investigator Name*']),
                    input({
                      id: 'profilePIName',
                      name: 'piName',
                      type: 'text',
                      className: 'form-control ',
                      onChange: this.handleChange,
                      value: this.state.profile.piName,
                      required: this.state.profile.havePI === true
                    }),
                    span({
                      className: 'cancel-color required-field-error-span',
                      isRendered: (this.state.profile.piName === '' || this.state.invalidFields.piName) && showValidationMessages
                    }, ['Principal Investigator is required'])
                  ]),

                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                    label({
                      id: 'lbl_profilePIEmail',
                      className: 'control-label'
                    }, ['Principal Investigator Email Address*']),
                    input({
                      id: 'profilePIEmail',
                      name: 'piEmail',
                      type: 'email',
                      className: 'form-control ',
                      onChange: this.handleChange,
                      value: this.state.profile.piEmail,
                      required: this.state.profile.havePI === true
                    }),
                    span({
                      className: 'cancel-color required-field-error-span',
                      isRendered: (this.state.invalidFields.piEmail && this.state.profile.piEmail.indexOf('@') === -1) && showValidationMessages
                    }, ['Email Address is empty or has invalid format'])
                  ]),

                  div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                    label({
                      id: 'lbl_profileEraCommons',
                      className: 'control-label'
                    }, ['eRA Commons ID ', span({ className: 'italic' }, ['(optional)'])]),
                    input({
                      id: 'profileEraCommons',
                      name: 'eRACommonsID',
                      type: 'text',
                      className: 'form-control',
                      onChange: this.handleChange,
                      value: this.state.profile.eRACommonsID
                    })
                  ])
                ])
              ]),

              div({ isRendered: this.state.isResearcher, className: 'form-group' }, [
                div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
                  label({
                    id: 'lbl_profilePubmedID',
                    className: 'control-label'
                  }, ['Pubmed ID of a publication ', span({ className: 'italic' }, ['(optional)'])]),
                  input({
                    id: 'profilePubmedID',
                    name: 'pubmedID',
                    type: 'text',
                    className: 'form-control',
                    onChange: this.handleChange,
                    value: this.state.profile.pubmedID
                  })
                ]),

                div({ isRendered: this.state.isResearcher, className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12 rp-last-group' }, [
                  label({
                    id: 'lbl_profileScientificURL',
                    className: 'control-label'
                  }, ['URL of a scientific publication ', span({ className: 'italic' }, ['(optional)'])]),
                  textarea({
                    id: 'profileScientificURL',
                    name: 'scientificURL',
                    className: 'form-control',
                    maxLength: '512',
                    rows: '3',
                    onChange: this.handleChange,
                    value: this.state.profile.scientificURL
                  })
                ])
              ]),

              div({ className: 'row margin-top-20' }, [
                div({ className: 'col-lg-4 col-md-6 col-sm-6 col-xs-6' }, [
                  div({ className: 'italic default-color' }, ['*Required field'])
                ]),

                div({ className: 'col-lg-8 col-md-6 col-sm-6 col-xs-6' }, [
                  button({ id: 'btn_submit', onClick: this.submit, className: 'f-right btn-primary common-background' }, [
                    span({ isRendered: ((!completed || completed === undefined)) && this.state.isResearcher }, ['Submit']),
                    span({ isRendered: (completed === true || !this.state.isResearcher) }, ['Update'])
                  ]),
                  ConfirmationDialog({
                    title: 'Submit Profile',
                    color: 'common',
                    showModal: this.state.showDialogSubmit,
                    action: { label: 'Yes', handler: this.dialogHandlerSubmit }
                  }, [div({ className: 'dialog-description' }, ['Are you sure you want to submit your Profile information?'])]),

                  button({
                    id: 'btn_continueLater', isRendered: !completed && this.state.isResearcher, onClick: this.saveProfile,
                    className: 'f-right btn-secondary common-color'
                  }, ['Continue later']),

                  ConfirmationDialog({
                    title: 'Continue later',
                    color: 'common',
                    showModal: this.state.showDialogSave,
                    action: { label: 'Yes', handler: this.dialogHandlerSave }
                  }, [
                    div({ className: 'dialog-description' },
                      ['Are you sure you want to leave this page? Please remember that you need to submit your Profile information to be able to create a Data Access Request.'])
                  ]
                  ),
                ])
              ])
            ])
          ])
        ])
      ])
    );
  }
});
