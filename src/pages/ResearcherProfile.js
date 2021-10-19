import {Component} from 'react';
import {getNames} from 'country-list';
import {cloneDeep, find, get, isEmpty, isNil, omit, omitBy, trim} from 'lodash';
import ReactTooltip from 'react-tooltip';
import {button, div, form, h, hh, hr, input, label, option, select, span, textarea,} from 'react-hyperscript-helpers';
import {LibraryCards} from '../components/LibraryCards';
import {ConfirmationDialog} from '../components/ConfirmationDialog';
import {eRACommons} from '../components/eRACommons';
import {PageHeading} from '../components/PageHeading';
import {YesNoRadioGroup} from '../components/YesNoRadioGroup';
import {Notification} from '../components/Notification';
import {SearchSelect} from '../components/SearchSelect';
import {Institution, Researcher, User} from '../libs/ajax';
import {NotificationService} from '../libs/notificationService';
import {Storage} from '../libs/storage';
import {getPropertyValuesFromUser, setUserRoleStatuses, USER_ROLES,} from '../libs/utils';

export const ResearcherProfile = hh(class ResearcherProfile extends Component {

  constructor(props) {
    super(props);
    this.state = this.initialState();
  }

  async componentDidMount() {
    await this.getResearcherProfile();
    this.props.history.push('profile');
    const notificationData = await NotificationService.getBannerObjectById('eRACommonsOutage');
    this.setState(prev => {
      prev.notificationData = notificationData;
      prev.currentUser = Storage.getCurrentUser();
      return prev;
    });
  }

  initialState() {
    return {
      loading: true,
      fieldStatus: {},
      showDialogSubmit: false,
      showDialogSave: false,
      additionalEmail: '',
      institutionId: null,
      roles: [],
      profile: {
        academicEmail: '',
        address1: '',
        address2: '',
        checkNotifications: false,
        city: '',
        completed: undefined,
        country: '',
        department: '',
        division: '',
        eRACommonsID: '',
        havePI: null,
        isThePI: null,
        linkedIn: '',
        orcid: '',
        piEmail: '',
        piName: '',
        profileName: '',
        pubmedID: '',
        researcherGate: '',
        scientificURL: '',
        state: undefined,
        zipcode: ''
      },
      showRequired: false,
      invalidFields: {
        profileName: false,
        academicEmail: false,
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
        institution: false
      },
      showValidationMessages: false,
      validateFields: false,
      institutionList: []
    };
  }

  getResearcherProfile = async () => {
    const user = await User.getMe();
    const researcherProps = getPropertyValuesFromUser(user);
    const institutionList = await Institution.list();

    this.setState(prev => {
      if (isEmpty(user.roles)) {
        prev.roles = [{ 'roleId': 5, 'name': USER_ROLES.researcher }];
      } else {
        prev.roles = user.roles;
      }
      prev.additionalEmail = isNil(user.additionalEmail) ? '' : user.additionalEmail;
      prev.institutionId = user.institutionId;
      prev.institutionList = institutionList;
      prev.profile.academicEmail = researcherProps.academicEmail || user.email;
      prev.profile.address1 = researcherProps.address1;
      prev.profile.address2 = researcherProps.address2;
      prev.profile.checkNotifications = (researcherProps.checkNotifications === 'true');
      prev.profile.city = researcherProps.city;
      prev.profile.completed = researcherProps.completed;
      prev.profile.country = researcherProps.country;
      prev.profile.department = researcherProps.department;
      prev.profile.division = researcherProps.division;
      prev.profile.eRACommonsID = researcherProps.eraCommonsId;
      prev.profile.havePI = researcherProps.havePI;
      prev.profile.isThePI = researcherProps.isThePI;
      prev.profile.linkedIn = researcherProps.linkedIn;
      prev.profile.orcid = researcherProps.orcid;
      prev.profile.piEmail = researcherProps.piEmail;
      prev.profile.piName = researcherProps.piName;
      prev.profile.profileName = user.displayName;
      prev.profile.pubmedID = researcherProps.pubmedID;
      prev.profile.researcherGate = researcherProps.researcherGate;
      prev.profile.scientificURL = researcherProps.scientificURL;
      prev.profile.state = researcherProps.state;
      prev.profile.zipcode = researcherProps.zipcode;
      return prev;
    }, () => {
      if (this.state.profile.completed !== undefined && this.state.profile.completed !== '') {
        this.setState(prev => {
          prev.profile.completed = JSON.parse(this.state.profile.completed);
          return prev;
        });
      }
    });
  };

  handleChange = (event) => {
    let field = event.target.name;
    let value = event.target.value;

    this.setState(prev => {
      prev.profile[field] = value;
      return prev;
    }, () => {
      if (this.state.validateFields) {
        this.validateUserFields();
      }
    });
    //clear out state field if the user selects
    //another country or clears out the country field
    if (field === "country") {
      if (value !== "United States of America") {
        this.setState(prev => {
          prev.profile.state = "";
          return prev;
        }, () => {
          if (this.state.validateFields) {
            this.validateUserFields();
          }
        });
      }
    }
  };

  validateUserFields() {
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

    if (!this.isValidNumber(this.state.institutionId)) {
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
  }

  isValidNumber(value) {
    let isValid = false;
    if (value !== 0 && value !== null && value !== undefined) {
      isValid = true;
    }
    return isValid;
  }

  isValidState(value) {
    const stateSelected = (!isNil(value) && !isEmpty(value));
    const inUS = (this.state.profile.country === "United States of America" || this.state.profile.country === "");
    if (inUS && stateSelected) {
      return true;
    }
    return !inUS;
  }

  submit = (event) => {
    this.setState({ validateFields: true });
    event.preventDefault();
    const errorsShowed = this.validateUserFields();
    if (errorsShowed === false) {
      this.setState(prev => {
        prev.showDialogSubmit = true;
        prev.showValidationMessages = false;
        return prev;
      });
    }
  };

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
        this.validateUserFields();
      }
    });
  };

  clearNotRelatedPIFields = () => {
    this.clearCommonsFields();
    this.setState(prev => {
      prev.profile.havePI = '';
      return prev;
    }, () => {
      this.clearPIData();
    });
  };

  clearNoHasPIFields = () => {
    this.clearPIData();
    this.clearCommonsFields();
  };

  clearCommonsFields = () => {
    this.setState(prev => {
      prev.profile.eRACommonsID = '';
      return prev;
    });
  };

  clearPIData = () => {
    this.setState(prev => {
      prev.profile.piName = '';
      prev.profile.piEmail = '';
      return prev;
    });
  };

  saveProfile = (event) => {
    event.preventDefault();
    this.setState({ showDialogSave: true });
  };

  cleanObject = (obj) => {
    // Removes any zero length properties from a copy of the object
    return omitBy(obj, (s) => { return isNil(s) || trim(s.toString()).length === 0; });
  };

  saveProperties = async (profile) => {
    await Researcher.createProperties(profile);
    await this.saveUser();
    this.setState({ showDialogSubmit: false });
    this.props.history.push({ pathname: 'dataset_catalog' });
  };

  dialogHandlerSubmit = (answer) => async () => {
    if (answer === true) {
      let profile = this.state.profile;
      profile = this.cleanObject(profile);
      profile.completed = true;
      if (this.state.profile.completed === undefined) {
        await this.saveProperties(profile);
      } else {
        await this.updateResearcher(profile);
      }

    } else {
      this.setState({ showDialogSubmit: false });
    }
  };

  updateResearcher = async (profile) => {
    const profileClone = this.cloneProfile(profile);
    await Researcher.updateProperties(Storage.getCurrentUser().dacUserId, true, profileClone);
    await this.saveUser();
    this.setState({ showDialogSubmit: false });
    this.props.history.push({ pathname: 'dataset_catalog' });
  };

  saveUser = async () => {
    const currentUserUpdate = Storage.getCurrentUser();
    delete currentUserUpdate.email;
    currentUserUpdate.displayName = this.state.profile.profileName;
    currentUserUpdate.additionalEmail = this.state.additionalEmail;
    currentUserUpdate.roles = this.state.roles;
    currentUserUpdate.institutionId = this.state.institutionId;
    const payload = { updatedUser: currentUserUpdate };
    let updatedUser = await User.update(payload, currentUserUpdate.dacUserId);
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

  dialogHandlerSave = (answer) => async () => {
    if (answer === true) {
      let profile = this.state.profile;
      profile.completed = false;
      const profileClone = this.cloneProfile(profile);
      await Researcher.updateProperties(this.state.currentUser.dacUserId, false, profileClone);
      this.props.history.push({ pathname: 'dataset_catalog' });
    }

    this.setState({ showDialogSave: false });
  };

  // When posting a user's researcher properties, library cards and entries are
  // not valid properties for update.
  cloneProfile = (profile) => {
    return omit(cloneDeep(profile), ['libraryCards', 'libraryCardEntries']);
  };

  generateCountryNames = () => {
    const USA = option({ value: "United States of America"}, ["United States of America"]);
    const empty = option({ value: ""}, [""]);
    const countryNames = getNames().map((name) => option({value: name}, [name]));
    const index = countryNames.indexOf(USA);
    countryNames.splice(index, 1);
    countryNames.splice(0, 0, USA);
    countryNames.splice(0, 0, empty);
    return countryNames;
  };

  generateStateNames = () => {
    const empty = option({ value: ""}, [""]);
    const UsaStates = require('usa-states').UsaStates;
    const stateNames = (new UsaStates().arrayOf("names")).map((name) => option({value: name}, [name]));
    stateNames.splice(0, 0, empty);
    return stateNames;
  };

  generateInstitutionSelectionDisplay = () => {
    // If the user is not an SO, or does not have an existing institution,
    // allow the user to select an institution from the available list.
    // If the user is an SO and has an assigned institution, prevent the
    // selection of a new institution as that will result in an error.
    const { currentUser, institutionId, institutionList } = this.state;
    let isSigningOfficial = get(currentUser, 'isSigningOfficial', false);

    if (isNil(institutionId) || !isSigningOfficial) {
      const { invalidFields, showValidationMessages, validateFields } = this.state;
      return div({},
        [
          h(SearchSelect, {
            id: 'Institution',
            label: 'institution',
            onSelection: (selection) => {
              this.setState(prev => {
                prev.institutionId = selection;
                return prev;
              }, () => {
                if (validateFields) {
                  this.validateUserFields();
                }
              });
            },
            options: institutionList.map(institution => {
              return {
                key: institution.id,
                displayText: institution.name,
              };
            }),
            placeholder: 'Please Select an Institution',
            searchPlaceholder: 'Search for Institution...',
            value: this.state.institutionId,
            className: (invalidFields.institution && showValidationMessages) ?
              'form-control required-field-error' :
              'form-control',
            required: true,
          }),
          span({
            className: 'cancel-color required-field-error-span',
            isRendered: invalidFields.institution && showValidationMessages,
          }, ['Institution Name is required']),
        ]);
    } else {
      let institution = find(institutionList,{id: institutionId});
      return div({
        className: 'col-xs-12',
        style: {padding: 0},
      }, [
        input({
          id: 'profileInstitution',
          name: 'institution',
          type: 'text',
          disabled: true,
          className: 'form-control',
          value: (isNil(institution) ? '' : institution.name),
        }),
      ]);
    }
  };

  render() {
    const countryNames = this.generateCountryNames();
    const stateNames = this.generateStateNames();
    let completed = this.state.profile.completed;
    const { currentUser, institutionId, showValidationMessages } = this.state;
    const libraryCards = get(this.state.currentUser, 'libraryCards', []);
    let isSigningOfficial = get(currentUser, 'isSigningOfficial', false);

    return (

      div({ className: 'container' }, [
        div({ className: 'row no-margin' }, [
          div({ className: 'col-md-10 col-md-offset-1 col-sm-12 col-xs-12' }, [
            Notification({notificationData: this.state.notificationData}),
            PageHeading({
              id: 'researcherProfile',
              color: 'common',
              title: 'Your Profile',
              description: 'Please complete the following information to be able to request access to dataset(s)'
            }),
            hr({ className: 'section-separator' })
          ]),
          div({ className: 'col-md-10 col-md-offset-1 col-xs-12 no-padding' }, [
            form({ name: 'researcherForm' }, [
              div({ className: 'form-group' }, [
                div({ className: 'col-xs-12' }, [
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
                    value: isNil(this.state.profile.profileName) ? '' : this.state.profile.profileName,
                    required: true
                  }),
                  span({
                    className: 'cancel-color required-field-error-span',
                    isRendered: this.state.invalidFields.profileName && showValidationMessages
                  }, ['Full Name is required'])
                ]),

                div({ className: 'col-xs-12' }, [
                  label({
                    id: 'lbl_profileAcademicEmail',
                    className: 'control-label'
                  }, ['Academic/Business Email Address*']),
                  input({
                    id: 'profileAcademicEmail',
                    name: 'academicEmail',
                    type: 'email',
                    value: isNil(this.state.profile.academicEmail) ? '' : this.state.profile.academicEmail,
                    className: ((this.state.invalidFields.academicEmail) && showValidationMessages) ?
                      'form-control required-field-error' :
                      'form-control',
                    disabled: true
                  })
                ]),

                div({ className: 'col-xs-12 rp-group checkbox' }, [
                  input({
                    type: 'checkbox',
                    id: 'chk_sendNotificationsAcademicEmail',
                    name: 'checkNotifications',
                    className: 'checkbox-inline rp-checkbox',
                    checked: isNil(this.state.profile.checkNotifications) ? false : this.state.profile.checkNotifications,
                    onChange: this.handleCheckboxChange
                  }),
                  label({ className: 'regular-checkbox rp-choice-questions', htmlFor: 'chk_sendNotificationsAcademicEmail' },
                    ['Send Notifications to my Academic/Business Email Address'])
                ]),

                div({ className: 'col-xs-12' }, [
                  label({
                    id: 'lbl_notificationsEmail', className: 'control-label'
                  }, ['Enter an additional email to receive DUOS notifications ', span({ className: 'italic display-inline' }, ['(optional)'])]),
                  input({
                    id: 'additionalEmail',
                    name: 'additionalEmail',
                    type: 'text',
                    onChange: this.handleAdditionalEmailChange,
                    className: 'form-control',
                    value: isNil(this.state.additionalEmail) ? '' : this.state.additionalEmail
                  }),
                  span({
                    className: 'cancel-color required-field-error-span',
                    isRendered: (this.state.additionalEmail.indexOf('@') === -1) && showValidationMessages
                  }, ['Email Address is empty or has invalid format'])
                ])
              ]),

              div({ className: 'form-group' }, [
                div({ className: 'col-xs-12', style: { 'marginTop': '20px' } }, [
                  label({ className: 'control-label rp-title-question default-color' }, [
                    'Researcher Identification*',
                    span({}, ['Please authenticate your eRA Commons account to submit Data Access Requests. Other profiles are optional:'])
                  ])
                ]),

                div({ className: 'col-xs-12 no-padding' }, [
                  div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                    eRACommons({
                      className: 'col-md-4 col-sm-6 col-xs-12',
                      destination: 'profile',
                      onNihStatusUpdate: () => {},
                      location: this.props.location
                    }),
                    div({ className: '' }, [
                      label({ id: 'lbl_profileLibraryCard', className: 'control-label' }, ['Library Cards']),
                      LibraryCards({
                        style: { display: 'flex', flexFlow: 'row wrap' },
                        isRendered: !isNil(libraryCards),
                        libraryCards: libraryCards
                      })
                    ])
                  ])
                ]),

                div({ className: 'col-xs-12 no-padding' }, [
                  div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                    div({ className: 'col-sm-4 col-xs-12' }, [
                      label({ id: 'lbl_profileLinkedIn', className: 'control-label' }, ['LinkedIn Profile']),
                      input({
                        id: 'profileLinkedIn',
                        name: 'linkedIn',
                        type: 'text',
                        className: 'form-control',
                        onChange: this.handleChange,
                        value: isNil(this.state.profile.linkedIn) ? '' : this.state.profile.linkedIn
                      })
                    ]),
                    div({ className: 'col-sm-4 col-xs-12' }, [
                      label({ id: 'lbl_profileOrcid', className: 'control-label' }, ['ORCID iD']),
                      input({
                        id: 'profileOrcid',
                        name: 'orcid',
                        type: 'text',
                        className: 'form-control',
                        onChange: this.handleChange,
                        value: isNil(this.state.profile.orcid) ? '' : this.state.profile.orcid
                      })
                    ]),
                    div({ className: 'col-sm-4 col-xs-12' }, [
                      label({ id: 'lbl_profileResearcherGate', className: 'control-label' }, ['ResearchGate ID']),
                      input({
                        id: 'profileResearcherGate',
                        name: 'researcherGate',
                        type: 'text',
                        className: 'form-control',
                        onChange: this.handleChange,
                        value: isNil(this.state.profile.researcherGate) ? '' : this.state.profile.researcherGate,
                      })
                    ])
                  ])
                ]),

                div({ className: 'col-xs-12', style: { 'marginTop': '20px' } }, [
                  label({ id: 'lbl_profileInstitution', className: 'control-label' }, [
                    'Institution Name* ',
                    span({
                      className: 'glyphicon glyphicon-question-sign tooltip-icon',
                      "data-tip": (isSigningOfficial && !isNil(institutionId)) ?
                        "As a 'Signing Official', your institution cannot be changed here. Please submit a support request via the 'Contact Us' form to have it changed." :
                        "If your preferred institution cannot be found, please submit a support request via the 'Contact Us' form to have it added.",
                      'data-for': 'tip_profileState',
                    })
                  ]),
                  this.generateInstitutionSelectionDisplay()
                ]),

                div({ className: 'col-xs-12 no-padding' }, [
                  div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                    div({ className: 'col-xs-6' }, [
                      label({ id: 'lbl_profileDepartment', className: 'control-label' }, ['Department*']),
                      input({
                        id: 'profileDepartment',
                        name: 'department',
                        type: 'text',
                        className: (this.state.invalidFields.department && showValidationMessages) ?
                          'form-control required-field-error' :
                          'form-control',
                        onChange: this.handleChange,
                        value: isNil(this.state.profile.department) ? '' : this.state.profile.department,
                        required: true
                      }),
                      span({
                        className: 'cancel-color required-field-error-span',
                        isRendered: this.state.invalidFields.department && showValidationMessages
                      }, ['Department is required'])
                    ]),
                    div({ className: 'col-xs-6' }, [
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
                        value: isNil(this.state.profile.division) ? '' : this.state.profile.division
                      })
                    ])
                  ])
                ]),

                div({ className: 'col-xs-12 no-padding' }, [
                  div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                    div({ className: 'col-xs-6' }, [
                      label({ id: 'lbl_profileAddress1', className: 'control-label' }, ['Street Address 1*']),
                      input({
                        id: 'profileAddress1',
                        name: 'address1',
                        type: 'text',
                        className: ((this.state.profile.address1 === '' || this.state.invalidFields.address1) && showValidationMessages) ?
                          'form-control required-field-error' :
                          'form-control',
                        onChange: this.handleChange,
                        value: isNil(this.state.profile.address1) ? '' : this.state.profile.address1,
                        required: true
                      }),
                      span({
                        className: 'cancel-color required-field-error-span',
                        isRendered: (this.state.profile.address1 === '' || this.state.invalidFields.address1) && showValidationMessages
                      }, ['Street Address is required'])
                    ]),
                    div({ className: 'col-xs-6' }, [
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
                        value: isNil(this.state.profile.address2) ? '' : this.state.profile.address2
                      })
                    ])
                  ])
                ]),

                div({ className: 'col-xs-12 no-padding' }, [
                  div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                    div({ className: 'col-xs-6' }, [
                      label({ id: 'lbl_profileCity', className: 'control-label' }, ['City*']),
                      input({
                        id: 'profileCity',
                        name: 'city',
                        type: 'text',
                        className: (this.state.invalidFields.city && showValidationMessages) ? 'form-control required-field-error' : 'form-control',
                        onChange: this.handleChange,
                        value: isNil(this.state.profile.city) ? '' : this.state.profile.city,
                        required: true
                      }),
                      span({
                        className: 'cancel-color required-field-error-span',
                        isRendered: this.state.invalidFields.city && showValidationMessages
                      }, ['City is required'])
                    ]),

                    div({ className: 'col-xs-6' }, [
                      label({ id: 'lbl_profileState', className: 'control-label'}, ['State* ',
                        span({
                          className: 'glyphicon glyphicon-question-sign tooltip-icon',
                          "data-tip": "State cannot be selected if a non-US Country is selected.",
                          'data-for': 'tip_profileState',
                        })
                      ]),
                      select({
                        id: 'profileState',
                        name: 'state',
                        onChange: this.handleChange,
                        value: this.state.profile.state,
                        className: (this.state.invalidFields.state && showValidationMessages) ? 'form-control required-field-error' : 'form-control',
                        required: true,
                        disabled: (this.state.profile.country !== "" && this.state.profile.country !== "United States of America")
                      }, stateNames ),
                      span({
                        className: 'cancel-color required-field-error-span',
                        isRendered: this.state.invalidFields.state && showValidationMessages
                      }, ['State is required if you live in the United States'])
                    ])
                  ])
                ]),

                div({ className: 'col-xs-12 no-padding' }, [
                  div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                    div({ className: 'col-xs-6 rp-group' }, [
                      label({ id: 'lbl_profileZip', className: 'control-label' }, ['Zip/Postal Code*']),
                      input({
                        id: 'profileZip',
                        name: 'zipcode',
                        type: 'text',
                        className: (this.state.invalidFields.zipcode && showValidationMessages) ?
                          'form-control required-field-error' :
                          'form-control',
                        onChange: this.handleChange,
                        value: isNil(this.state.profile.zipcode) ? '' : this.state.profile.zipcode,
                        required: true
                      }),
                      span({
                        className: 'cancel-color required-field-error-span',
                        isRendered: this.state.invalidFields.zipcode && showValidationMessages
                      }, ['Zip/Postal Code is required'])
                    ]),

                    div({ className: 'col-xs-6 rp-group' }, [
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

              div({ className: 'form-group' }, [
                div({ className: 'col-xs-12', style: { 'marginTop': '15px' } }, [
                  label({
                    id: 'lbl_isThePI',
                    className: 'control-label '
                  }, [
                    'Are you the Principal Investigator?* ',
                    span({
                      className: 'glyphicon glyphicon-question-sign tooltip-icon',
                      'data-tip': 'This information is required in order to classify users as bonafide researchers as part of the process of Data Access approvals.',
                      'data-for': 'tip_isThePI'
                    })
                  ])
                ]),

                div({ className: 'col-xs-12 rp-group' }, [
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

              div({ isRendered: this.state.profile.isThePI === 'false', className: 'form-group' }, [

                div({ className: 'col-xs-12' }, [
                  label({
                    className: 'control-label '
                  }, ['Do you have a Principal Investigator?*'])
                ]),

                div({ className: 'col-xs-12 rp-group' }, [
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
                  div({ className: 'col-xs-12' }, [
                    label({ id: 'lbl_profilePIName', className: 'control-label' }, ['Principal Investigator Name*']),
                    input({
                      id: 'profilePIName',
                      name: 'piName',
                      type: 'text',
                      className: 'form-control ',
                      onChange: this.handleChange,
                      value: isNil(this.state.profile.zipcode) ? '' : this.state.profile.piName,
                      required: this.state.profile.havePI === true
                    }),
                    span({
                      className: 'cancel-color required-field-error-span',
                      isRendered: (this.state.profile.piName === '' || this.state.invalidFields.piName) && showValidationMessages
                    }, ['Principal Investigator is required'])
                  ]),

                  div({ className: 'col-xs-12' }, [
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
                      value: isNil(this.state.profile.piEmail) ? '' : this.state.profile.piEmail,
                      required: this.state.profile.havePI === true
                    }),
                    span({
                      className: 'cancel-color required-field-error-span',
                      isRendered: (this.state.invalidFields.piEmail && this.state.profile.piEmail.indexOf('@') === -1) && showValidationMessages
                    }, ['Email Address is empty or has invalid format'])
                  ]),

                  div({ className: 'col-xs-12' }, [
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
                      value: isNil(this.state.profile.eRACommonsID) ? '' : this.state.profile.eRACommonsID
                    })
                  ])
                ])
              ]),

              div({ className: 'form-group' }, [
                div({ className: 'col-xs-12' }, [
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
                    value: isNil(this.state.profile.pubmedID) ? '' : this.state.profile.pubmedID
                  })
                ]),

                div({ className: 'col-xs-12 rp-last-group' }, [
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
                div({ className: 'col-lg-4 col-xs-6' }, [
                  div({ className: 'italic default-color' }, ['*Required field'])
                ]),

                div({ className: 'col-lg-8 col-xs-6' }, [
                  button({ id: 'btn_submit', onClick: this.submit, className: 'f-right btn-primary common-background' }, [
                    'Submit'
                  ]),
                  ConfirmationDialog({
                    title: 'Submit Profile',
                    color: 'common',
                    showModal: this.state.showDialogSubmit,
                    action: { label: 'Yes', handler: this.dialogHandlerSubmit }
                  }, [div({ className: 'dialog-description' }, ['Are you sure you want to submit your Profile information?'])]),

                  button({
                    id: 'btn_continueLater', isRendered: completed !== true, onClick: this.saveProfile,
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
                  ]),
                  h(ReactTooltip, {
                    id: "tip_profileState",
                    place: 'left',
                    effect: 'solid',
                    multiline: true,
                    className: 'tooltip-wrapper'
                  }),
                  h(ReactTooltip, {
                    id: "tip_isThePI",
                    place: 'left',
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
