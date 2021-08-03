import {cloneDeep, isEmpty, isNil, get, trim, omitBy } from 'lodash';
import { Component } from 'react';
import {button, div, form, h, hh, hr, input, label, option, select, span, textarea} from 'react-hyperscript-helpers';
import { LibraryCards } from '../components/LibraryCards';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { eRACommons } from '../components/eRACommons';
import { PageHeading } from '../components/PageHeading';
import { YesNoRadioGroup } from '../components/YesNoRadioGroup';
import { Researcher, User, Institution } from '../libs/ajax';
import { Storage } from '../libs/storage';
import { NotificationService } from '../libs/notificationService';
import { Notification } from '../components/Notification';
import { USER_ROLES } from '../libs/utils';
import {getNames} from "country-list";
import ReactTooltip from "react-tooltip";
import { SearchSelect } from '../components/SearchSelect';
import { filter } from 'lodash/fp';
import {getPropertyValuesFromUser} from "../libs/utils";

export const ResearcherProfile = hh(class ResearcherProfile extends Component {

  constructor(props) {
    super(props);
    this.state = this.initialState();
  }

  async componentDidMount() {
    const currentUser = await User.getMe();
    await this.getResearcherProfile(currentUser);
    this.props.history.push('profile');
    const institutionList = await Institution.list();
    const notificationData = await NotificationService.getBannerObjectById('eRACommonsOutage');
    this.setState(prev => {
      prev.notificationData = notificationData;
      prev.currentUser = cloneDeep(currentUser);
      if (isNil(currentUser.additionalEmail)) {
        prev.currentUser.additionalEmail = '';
      }
      if (isNil(currentUser.displayName)) {
        prev.currentUser.displayName = '';
      }
      prev.institutionList = institutionList;
      return prev;
    });
  }

  initialState() {
    return {
      loading: true,
      fieldStatus: {},
      showDialogSubmit: false,
      showDialogSave: false,
      currentUser: {},
      profileProperties: {},
      profileName: '',
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

  getResearcherProfile = async (currentUser) => {
    if (Storage.getData('researcher') !== null) {
      Storage.removeData('researcher');
    }

    this.setState(prev => {
      //if there are no roles, add researcher role
      if (isEmpty(currentUser.roles)) {
        prev.currentUser.roles = [{ 'roleId': 5, 'name': USER_ROLES.researcher }];
      }

      let profileProperties = getPropertyValuesFromUser(currentUser);
      prev.profileProperties = profileProperties;

      // This ensures that we have a boolean for `checkNotifications`
      if (profileProperties.checkNotifications === '') {
        prev.profileProperties.checkNotifications = false;
      }
      return prev;

    });
  };

  handleChange = (event) => {
    let field = event.target.name;
    let value = event.target.value;

    this.setState(prev => {
      prev.profileProperties[field] = value;
      return prev;
    }, () => {
      if (this.state.validateFields) {
        this.researcherFieldsValidation();
      }
    });
    //clear out state field if the user selects
    //another country or clears out the country field
    if (field === "country") {
      if (value !== "United States of America") {
        this.setState(prev => {
          prev.profileProperties.state = "";
          return prev;
        }, () => {
          if (this.state.validateFields) {
            this.researcherFieldsValidation();
          }
        });
      }
    }
  };

  handleChangeDisplayName = (e) => {
    const value = e.target.value;
    this.setState(prev => {
      prev.currentUser.displayName = value;
      return prev;
    });
  };

  handleAdditionalEmailChange = (e) => {
    const value = e.target.value;
    this.setState(prev => {
      prev.currentUser.additionalEmail = value;
      return prev;
    });
  };

  handleCheckboxChange = (e) => {
    const value = e.target.checked;
    this.setState(prev => {
      prev.profileProperties.checkNotifications = value;
      return prev;
    });
  };


  handleRadioChange = (e, field, value) => {

    this.setState(prev => {
      prev.profileProperties[field] = value;
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

    if (!this.isValid(this.state.currentUser.displayName)) {
      profileName = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.profileProperties.academicEmail) || this.state.profileProperties.academicEmail.indexOf('@') === -1) {
      academicEmail = true;
      showValidationMessages = true;
    }

    if (!this.isValidNumber(this.state.currentUser.institutionId)) {
      institution = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.profileProperties.department)) {
      department = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.profileProperties.address1)) {
      address1 = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.profileProperties.city)) {
      city = true;
      showValidationMessages = true;
    }

    if (!this.isValidState(this.state.profileProperties.state)) {
      state = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.profileProperties.country)) {
      country = true;
      showValidationMessages = true;
    }

    if (!this.isValid(this.state.profileProperties.zipcode)) {
      zipcode = true;
      showValidationMessages = true;
    }

    if (this.state.profileProperties.isThePI === '') {
      isThePI = true;
      showValidationMessages = true;
    }

    if (this.state.profileProperties.isThePI === 'false' && this.state.profileProperties.havePI === 'true') {
      if (!this.isValid(this.state.profileProperties.piEmail) || this.state.profileProperties.piEmail.indexOf('@') === -1) {
        piEmail = true;
        showValidationMessages = true;
      }
      if (!this.isValid(this.state.profileProperties.piName)) {
        piName = true;
        showValidationMessages = true;
      }
    }

    if (this.state.profileProperties.isThePI === 'false' && this.state.profileProperties.havePI === '') {
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
      //if all required fields have been completed and are valid, update the profile completion status to be true
      //so they can 'submit' their profile and will be allowed to submit dars.
      //if the required fields are not valid, mark the completion status as false so that the user can 'save' their
      //profile and continue working on it later but cannot submit dars until it is completed
      prev.profileProperties.completed = !showValidationMessages;
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
    const inUS = (this.state.profileProperties.country === "United States of America" || this.state.profileProperties.country === "");
    if (inUS && stateSelected) {
      return true;
    }
    return !inUS;
  }

  clearNotRelatedPIFields = () => {
    this.clearCommonsFields();
    this.setState(prev => {
      prev.profileProperties.havePI = '';
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
      prev.profileProperties.eRACommonsID = '';
      prev.profileProperties.pubmedID = '';
      prev.profileProperties.scientificURL = '';
      return prev;
    });
  };

  clearPIData = () => {
    this.setState(prev => {
      prev.profileProperties.piName = '';
      prev.profileProperties.piEmail = '';
      return prev;
    });
  };

  cleanObject = (obj) => {
    // Removes any zero length properties from a copy of the object
    return omitBy(obj, (s) => { return trim(s.toString()).length === 0; });
  };

  saveProfile = (event) => {
    event.preventDefault();
    this.setState({ showDialogSave: true });
  };

  submit = (event) => {
    this.setState({ validateFields: true });
    event.preventDefault();
    let errorsShowed = this.researcherFieldsValidation();
    if (errorsShowed === false) {
      this.setState(prev => {
        prev.showDialogSubmit = true;
        prev.showValidationMessages = false;
        return prev;
      });
    }
  };

  dialogHandlerUpdateUser = (answer) => async () => {
    if (answer === true) {
      let profile = this.state.profileProperties;
      //profile = this.cleanObject(profile);
      //updates fields saved in user properties
      await Researcher.updateProperties(this.state.currentUser.dacUserId, true, profile);
      //updates fields saved on the user
      const payload = { updatedUser: this.state.currentUser };
      await User.update(payload, this.state.currentUser.dacUserId);
      this.props.history.push({ pathname: 'dataset_catalog' });
    }
    this.setState({ showDialogSubmit: false });
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

  render() {
    const countryNames = this.generateCountryNames();
    const stateNames = this.generateStateNames();
    const { currentUser, profileProperties, showValidationMessages } = this.state;
    const isResearcher = isNil(currentUser.roles) ? false : currentUser.roles.some((role) => role.roleId === 5);
    const libraryCards = get(currentUser, 'libraryCards', []);
    const lcInstitutions = filter((institution) => libraryCards.includes(institution.id))(this.state.institutionList);

    return (

      div({ className: 'container' }, [
        div({ className: 'row no-margin' }, [
          div({ className: 'col-md-10 col-md-offset-1 col-sm-12 col-xs-12' }, [
            Notification({notificationData: this.state.notificationData}),
            PageHeading({
              id: 'researcherProfile',
              color: 'common',
              title: 'Your Profile',
              description: isResearcher ? 'Please complete the following information to be able to request access to dataset(s)' : ''
            }),
            hr({ className: 'section-separator' })
          ]),
          div({ className: 'col-md-10 col-md-offset-1 col-sm-12 col-xs-12 no-padding' }, [
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
                    onChange: (e) => this.handleChangeDisplayName(e),
                    className: (this.state.invalidFields.profileName && showValidationMessages) ?
                      'form-control required-field-error' :
                      'form-control',
                    value: currentUser.displayName,
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
                    value: profileProperties.academicEmail,
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
                    checked: profileProperties.checkNotifications,
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
                    value: currentUser.additionalEmail
                  }),
                  span({
                    className: 'cancel-color required-field-error-span',
                    //email is allowed to be empty but if it is not empty, it must have the correct format
                    isRendered: showValidationMessages && currentUser.additionalEmail.length !== 0 && (currentUser.additionalEmail.indexOf('@') === -1)
                  }, ['Email Address has invalid format'])
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
                      className: 'col-lg-4 col-md-4 col-sm-6 col-xs-12',
                      destination: 'profile',
                      onNihStatusUpdate: () => {},
                      location: this.props.location,
                      currentUser: currentUser
                    }),
                    div({ className: '' }, [
                      label({ id: 'lbl_profileLibraryCard', className: 'control-label' }, ['Library Cards']),
                      LibraryCards({
                        style: { display: 'flex', flexFlow: 'row wrap' },
                        isRendered: !isNil(currentUser),
                        libraryCards: lcInstitutions
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
                        value: profileProperties.linkedIn
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
                        value: profileProperties.orcid
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
                        value: profileProperties.researcherGate
                      })
                    ])
                  ])
                ]),

                div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12', style: { 'marginTop': '20px' } }, [
                  label({ id: 'lbl_profileInstitution', className: 'control-label' }, [
                    'Institution Name* ',
                    span({
                      className: 'glyphicon glyphicon-question-sign tooltip-icon',
                      "data-tip": "If your preferred institution cannot be found, please submit a ticket to have it added.",
                      'data-for': 'tip_profileState',
                    })
                  ]),
                  h(SearchSelect, {
                    id: 'Institution',
                    label: 'institution',
                    onSelection: (selection) => {
                      this.setState(prev => {
                        prev.currentUser.institutionId = selection;
                        return prev;
                      }, () => {
                        if (this.state.validateFields) {
                          this.researcherFieldsValidation();
                        }
                      });
                    },
                    options: this.state.institutionList.map(institution => {
                      return {
                        key: institution.id,
                        displayText: institution.name
                      };
                    }),
                    placeholder: 'Please Select an Institution',
                    searchPlaceholder: 'Search for Institution...',
                    value: currentUser.institutionId,
                    className: (this.state.invalidFields.institution && showValidationMessages) ?
                      'form-control required-field-error' :
                      'form-control',
                    required: true
                  }),
                  span({
                    className: 'cancel-color required-field-error-span',
                    isRendered: this.state.invalidFields.institution && showValidationMessages
                  }, ['Institution Name is required'])
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
                        value: profileProperties.department,
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
                        value: profileProperties.division
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
                        className: ((profileProperties.address1 === '' || this.state.invalidFields.address1) && showValidationMessages) ?
                          'form-control required-field-error' :
                          'form-control',
                        onChange: this.handleChange,
                        value: profileProperties.address1,
                        required: true
                      }),
                      span({
                        className: 'cancel-color required-field-error-span',
                        isRendered: (profileProperties.address1 === '' || this.state.invalidFields.address1) && showValidationMessages
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
                        value: profileProperties.address2
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
                        value: profileProperties.city,
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
                        value: profileProperties.state,
                        className: (this.state.invalidFields.state && showValidationMessages) ? 'form-control required-field-error' : 'form-control',
                        required: true,
                        disabled: (profileProperties.country !== "" && profileProperties.country !== "United States of America")
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
                        value: profileProperties.zipcode,
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
                        value: profileProperties.country,
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
                    value: profileProperties.isThePI,
                    onChange: this.handleRadioChange,
                    id: 'rad_isThePI',
                    name: 'isThePI',
                    required: true
                  })
                ]),
                span({
                  className: 'cancel-color required-field-error-span',
                  style: { 'marginLeft': '15px' },
                  isRendered: this.state.invalidFields.isThePI && showValidationMessages
                }, ['Required field'])
              ]),

              div({ isRendered: profileProperties.isThePI === 'false', className: 'form-group' }, [

                div({ className: 'col-xs-12' }, [
                  label({
                    className: 'control-label '
                  }, ['Do you have a Principal Investigator?*'])
                ]),

                div({ className: 'col-xs-12 rp-group' }, [
                  YesNoRadioGroup({
                    value: profileProperties.havePI,
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

                div({ isRendered: profileProperties.havePI === true || profileProperties.havePI === 'true', className: 'form-group' }, [
                  div({ className: 'col-xs-12' }, [
                    label({ id: 'lbl_profilePIName', className: 'control-label' }, ['Principal Investigator Name*']),
                    input({
                      id: 'profilePIName',
                      name: 'piName',
                      type: 'text',
                      className: 'form-control ',
                      onChange: this.handleChange,
                      value: profileProperties.piName,
                      required: profileProperties.havePI === true
                    }),
                    span({
                      className: 'cancel-color required-field-error-span',
                      isRendered: this.state.invalidFields.piName && showValidationMessages
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
                      value: profileProperties.piEmail,
                      required: profileProperties.havePI === true
                    }),
                    span({
                      className: 'cancel-color required-field-error-span',
                      isRendered: (this.state.invalidFields.piEmail && profileProperties.piEmail.indexOf('@') === -1) && showValidationMessages
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
                      value: profileProperties.eraCommonsId
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
                    value: profileProperties.pubmedID
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
                    value: profileProperties.scientificURL
                  })
                ])
              ]),

              div({ className: 'row margin-top-20' }, [
                div({ className: 'col-lg-4 col-xs-6' }, [
                  div({ className: 'italic default-color' }, ['*Required field'])
                ]),

                div({ className: 'col-lg-8 col-xs-6' }, [
                  button({ id: 'btn_submit', onClick: this.submit, className: 'f-right btn-primary common-background' }, [
                    span({ isRendered: profileProperties.completed }, ['Submit'])
                  ]),
                  ConfirmationDialog({
                    title: 'Submit Profile',
                    color: 'common',
                    showModal: this.state.showDialogSubmit,
                    action: { label: 'Yes', handler: this.dialogHandlerUpdateUser }
                  }, [div({ className: 'dialog-description' }, ['Are you sure you want to submit your Profile information?'])]),

                  button({
                    id: 'btn_continueLater', isRendered: !profileProperties.completed, onClick: this.saveProfile,
                    className: 'f-right btn-secondary common-color'
                  }, ['Continue later']),

                  ConfirmationDialog({
                    title: 'Continue later',
                    color: 'common',
                    showModal: this.state.showDialogSave,
                    action: { label: 'Yes', handler: this.dialogHandlerUpdateUser }
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
