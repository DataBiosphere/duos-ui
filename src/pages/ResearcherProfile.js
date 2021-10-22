import {useState, useEffect} from 'react';
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

export default function ResearcherProfile(props) {

  const [isLoading, setIsLoading] = useState(true);
  const [fieldStatus, setFieldStatus] = useState({});
  const [showDialogSubmit, setShowDialogSubmit] = useState(false);
  const [showDialogSave, setShowDialogSave] = useState(false);
  const [additionalEmail, setAdditionalEmail] = useState('');
  const [institutionId, setInstitutionId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [profile, setProfile] = useState({
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
  });
  const [showRequired, setShowRequired] = useState(false);
  const [invalidFields, setInvalidFields] = useState({
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
  });
  let [showValidationMessages, setShowValidationMessages] = useState(false); //temp fix
  const [validateFields, setValidateFields] = useState(false);
  const [institutionList, setInstitutionList] = useState([]);
  let [notificationData, setNotificationData] = useState(); //temp fix
  const [currentUser, setCurrentUser] = useState();

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        await getResearcherProfile();
        props.history.push('profile');
        notificationData = await NotificationService.getBannerObjectById('eRACommonsOutage');
        setNotificationData(notificationData);
        setCurrentUser(Storage.getCurrentUser());
        setIsLoading(false);
      } catch (error) {
        Notification.showError({text: 'Error: Unable to retrieve user data from server'});
      } finally {
        setIsLoading(false);
      }
    };
  }, []);

  const getResearcherProfile = async () => {
    const user = await User.getMe();
    const researcherProps = getPropertyValuesFromUser(user);
    const institutionList = await Institution.list();

    if (isEmpty(user.roles)) {
      setRoles([{ 'roleId': 5, 'name': USER_ROLES.researcher }]);
    } else {
      setRoles(user.roles);
    }
    setAdditionalEmail(isNil(user.additionalEmail) ? '' : user.additionalEmail);
    setInstitutionId(user.institutionId);
    setInstitutionList(institutionList);
    profile.academicEmail = researcherProps.academicEmail || user.email;
    profile.address1 = researcherProps.address1;
    profile.address2 = researcherProps.address2;
    profile.checkNotifications = (researcherProps.checkNotifications === 'true');
    profile.city = researcherProps.city;
    profile.completed = researcherProps.completed;
    profile.country = researcherProps.country;
    profile.department = researcherProps.department;
    profile.division = researcherProps.division;
    profile.eRACommonsID = researcherProps.eraCommonsId;
    profile.havePI = researcherProps.havePI;
    profile.isThePI = researcherProps.isThePI;
    profile.linkedIn = researcherProps.linkedIn;
    profile.orcid = researcherProps.orcid;
    profile.piEmail = researcherProps.piEmail;
    profile.piName = researcherProps.piName;
    profile.profileName = user.displayName;
    profile.pubmedID = researcherProps.pubmedID;
    profile.researcherGate = researcherProps.researcherGate;
    profile.scientificURL = researcherProps.scientificURL;
    profile.state = researcherProps.state;
    profile.zipcode = researcherProps.zipcode;
    setProfile(profile);
  };

  const handleChange = (event) => {
    const field = event.target.name;
    const value = event.target.value;

    profile[field] = value;
    setProfile(profile);
    if (validateFields) {
      validateUserFields();
    }

    if (field === 'country') {
      if (value !== 'United States of America') {
        profile.setState('');
        setProfile(profile);
        if (validateFields) {
          validateUserFields();
        }
      }
    }
  };

  const validateUserFields = () => {
    if (!isValid(profile.profileName)) {
      invalidFields.profileName = true;
      showValidationMessages = true;
    }

    if (!isValid(profile.academicEmail) || profile.academicEmail.indexOf('@') === -1) {
      invalidFields.academicEmail = true;
      showValidationMessages = true;
    }

    if (!isValidNumber(institutionId)) {
      invalidFields.institution = true;
      showValidationMessages = true;
    }

    if (!isValid(profile.department)) {
      invalidFields.department = true;
      showValidationMessages = true;
    }

    if (!isValid(profile.address1)) {
      invalidFields.address1 = true;
      showValidationMessages = true;
    }

    if (!isValid(profile.city)) {
      invalidFields.city = true;
      showValidationMessages = true;
    }

    if (!isValidState(profile.state)) {
      invalidFields.state = true;
      showValidationMessages = true;
    }

    if (!isValid(profile.country)) {
      invalidFields.country = true;
      showValidationMessages = true;
    }

    if (!isValid(profile.zipcode)) {
      invalidFields.zipcode = true;
      showValidationMessages = true;
    }

    if (profile.isThePI === null) {
      invalidFields.isThePI = true;
      showValidationMessages = true;
    }

    if (profile.isThePI === 'false' && profile.havePI === 'true') {
      if (!isValid(profile.piEmail) || profile.piEmail.indexOf('@') === -1) {
        invalidFields.piEmail = true;
        showValidationMessages = true;
      }
      if (!isValid(profile.piName)) {
        invalidFields.piName = true;
        showValidationMessages = true;
      }
    }
    
    if (profile.isThePI === 'false' && profile.havePI === '') {
      invalidFields.havePI = true;
      showValidationMessages = true;
    }

    setInvalidFields(invalidFields);
    setShowValidationMessages(showValidationMessages);
    return showValidationMessages;
  }

  const isValid = (value) => {
    let isValid = false;
    if (value !== '' && value !== null && value !== undefined) {
      isValid = true;
    }
    return isValid;
  }

  const isValidNumber = (value) => {
    let isValid = false;
    if (value !== 0 && value !== null && value !== undefined) {
      isValid = true;
    }
    return isValid;
  }

  const isValidState = (value) => {
    const stateSelected = (!isNil(value) && !isEmpty(value));
    const inUS = (profile.country === 'United States of America' || profile.country === '');
    if (inUS && stateSelected) {
      return true;
    }
    return !inUS;
  }

  const handleRadioChange = (event, field, value) => {
    profile[field] = value;
    setProfile(profile);
    if (field === 'isThePI') {
      clearNotRelatedPIFields();
    }
    if (field === 'havePI' && (value === true || value === 'true')) {
      clearCommonsFields();
    } else if (field === 'havePI' && (value === false || value === 'false')) {
      clearNoHasPIFields();
    }
    if (validateFields) {
      validateUserFields();
    }
  };

  const handleCheckboxChange = (event) => {
    profile.checkNotifications = event.target.checked;
    setProfile(profile);
  };

  const handleAdditionalEmailChange = (event) => {
    profile.additionalEmail = event.target.value;
    setProfile(profile);
  };

  const clearNotRelatedPIFields = () => {
    clearCommonsFields();
    profile.havePI = '';
    setProfile(profile);
    clearPIData();
  };

  const clearNoHasPIFields = () => {
    clearPIData();
    clearCommonsFields();
  };

  const clearCommonsFields = () => {
    profile.eRACommonsID = '';
    setProfile(profile);
  };

  const clearPIData = () => {
    profile.piName = '';
    profile.piEmail = '';
    setProfile(profile);
  };

  const submitForm = (event) => {
    event.preventDefault();
    // not implemented yet
  };

  const cleanObject = (obj) => {
    // Removes any zero length properties from a copy of the object
    return omitBy(obj, (s) => { return isNil(s) || trim(s.toString()).length === 0; });
  };

  // When posting a user's researcher properties, library cards and entries are
  // not valid properties for update.
  const cloneProfile = (profile) => {
    return omit(cloneDeep(profile), ['libraryCards', 'libraryCardEntries']);
  };

  const generateCountryNames = () => {
    const USA = option({ value: 'United States of America'}, ['United States of America']);
    const empty = option({ value: ''}, ['']);
    const countryNames = getNames().map((name) => option({value: name}, [name]));
    const index = countryNames.indexOf(USA);
    countryNames.splice(index, 1);
    countryNames.splice(0, 0, USA);
    countryNames.splice(0, 0, empty);
    return countryNames;
  };

  const generateStateNames = () => {
    const empty = option({ value: ''}, ['']);
    const UsaStates = require('usa-states').UsaStates;
    const stateNames = (new UsaStates().arrayOf('names')).map((name) => option({value: name}, [name]));
    stateNames.splice(0, 0, empty);
    return stateNames;
  };

  const generateInstitutionSelectionDisplay = () => {
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

  const countryNames = generateCountryNames();
  const stateNames = generateStateNames();
  const libraryCards = get(currentUser, 'libraryCards', []);
  let isSigningOfficial = get(currentUser, 'isSigningOfficial', false);
  const userEmail = get(currentUser, 'email');

  return (
    div({ className: 'container' }, [
      div({ className: 'row no-margin' }, [
        div({ className: 'col-md-10 col-md-offset-1 col-sm-12 col-xs-12' }, [
          Notification({notificationData}),
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
                  onChange: handleChange,
                  className: 'form-control',
                  value: isNil(profile.profileName) ? '' : profile.profileName,
                }),
              ]),

              div({ className: 'col-xs-12' }, [
                label({
                  id: 'lbl_profileAcademicEmail',
                  className: 'control-label'
                }, ['Academic/Business Email Address']),
                input({
                  id: 'profileAcademicEmail',
                  name: 'academicEmail',
                  type: 'email',
                  value: userEmail,
                  className: 'form-control',
                  disabled: true
                })
              ]),

              div({ className: 'col-xs-12 rp-group checkbox' }, [
                input({
                  type: 'checkbox',
                  id: 'chk_sendNotificationsAcademicEmail',
                  name: 'checkNotifications',
                  className: 'checkbox-inline rp-checkbox',
                  checked: isNil(profile.checkNotifications) ? false : profile.checkNotifications,
                  onChange: handleCheckboxChange
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
                  onChange: handleAdditionalEmailChange,
                  className: 'form-control',
                  value: isNil(additionalEmail) ? '' : additionalEmail
                }),
                span({
                  className: 'cancel-color required-field-error-span',
                  isRendered: (additionalEmail.indexOf('@') === -1) && showValidationMessages
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
                    location: props.location
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
                      onChange: handleChange,
                      value: isNil(profile.linkedIn) ? '' : profile.linkedIn
                    })
                  ]),
                  div({ className: 'col-sm-4 col-xs-12' }, [
                    label({ id: 'lbl_profileOrcid', className: 'control-label' }, ['ORCID iD']),
                    input({
                      id: 'profileOrcid',
                      name: 'orcid',
                      type: 'text',
                      className: 'form-control',
                      onChange: handleChange,
                      value: isNil(profile.orcid) ? '' : profile.orcid
                    })
                  ]),
                  div({ className: 'col-sm-4 col-xs-12' }, [
                    label({ id: 'lbl_profileResearcherGate', className: 'control-label' }, ['ResearchGate ID']),
                    input({
                      id: 'profileResearcherGate',
                      name: 'researcherGate',
                      type: 'text',
                      className: 'form-control',
                      onChange: handleChange,
                      value: isNil(profile.researcherGate) ? '' : profile.researcherGate,
                    })
                  ])
                ])
              ]),

              div({ className: 'col-xs-12', style: { 'marginTop': '20px' } }, [
                label({ id: 'lbl_profileInstitution', className: 'control-label' }, [
                  'Institution Name* ',
                  span({
                    className: 'glyphicon glyphicon-question-sign tooltip-icon',
                    'data-tip': (isSigningOfficial && !isNil(institutionId)) ?
                      'As a "Signing Official", your institution cannot be changed here. Please submit a support request via the "Contact Us" form to have it changed.' :
                      'If your preferred institution cannot be found, please submit a support request via the "Contact Us" form to have it added.',
                    'data-for': 'tip_profileState',
                  })
                ]),
                generateInstitutionSelectionDisplay()
              ]),

              div({ className: 'col-xs-12 no-padding' }, [
                div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                  div({ className: 'col-xs-6' }, [
                    label({ id: 'lbl_profileDepartment', className: 'control-label' }, ['Department*']),
                    input({
                      id: 'profileDepartment',
                      name: 'department',
                      type: 'text',
                      className: 'form-control',
                      onChange: handleChange,
                      value: isNil(profile.department) ? '' : profile.department,
                    })
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
                      onChange: handleChange,
                      value: isNil(profile.division) ? '' : profile.division
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
                      className: 'form-control',
                      onChange: handleChange,
                      value: isNil(profile.address1) ? '' : profile.address1,
                    })
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
                      onChange: handleChange,
                      value: isNil(profile.address2) ? '' : profile.address2
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
                      className: 'form-control',
                      onChange: handleChange,
                      value: isNil(profile.city) ? '' : profile.city,
                      required: true
                    })
                  ]),

                  div({ className: 'col-xs-6' }, [
                    label({ id: 'lbl_profileState', className: 'control-label'}, ['State* ',
                      span({
                        className: 'glyphicon glyphicon-question-sign tooltip-icon',
                        'data-tip': 'State cannot be selected if a non-US Country is selected.',
                        'data-for': 'tip_profileState',
                      })
                    ]),
                    select({
                      id: 'profileState',
                      name: 'state',
                      onChange: handleChange,
                      value: profile.state,
                      className: 'form-control',
                      disabled: (profile.country !== '' && profile.country !== 'United States of America')
                    }, stateNames ),
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
                      className: 'form-control',
                      onChange: handleChange,
                      value: isNil(profile.zipcode) ? '' : profile.zipcode,
                    })
                  ]),

                  div({ className: 'col-xs-6 rp-group' }, [
                    label({ id: 'lbl_profileCountry', className: 'control-label' }, ['Country*']),
                    select({
                      id: 'profileCountry',
                      name: 'country',
                      onChange: handleChange,
                      value: profile.country,
                      className: 'form-control',
                    }, countryNames )
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
                  value: profile.isThePI,
                  onChange: handleRadioChange,
                  id: 'rad_isThePI',
                  name: 'isThePI',
                  required: true
                })
              ])
            ]),

            div({ isRendered: profile.isThePI === 'false', className: 'form-group' }, [

              div({ className: 'col-xs-12' }, [
                label({
                  className: 'control-label '
                }, ['Do you have a Principal Investigator?*'])
              ]),

              div({ className: 'col-xs-12 rp-group' }, [
                YesNoRadioGroup({
                  value: profile.havePI,
                  onChange: handleRadioChange,
                  id: 'rad_havePI',
                  name: 'havePI',
                })
              ]),

              div({ isRendered: profile.havePI === true || profile.havePI === 'true', className: 'form-group' }, [
                div({ className: 'col-xs-12' }, [
                  label({ id: 'lbl_profilePIName', className: 'control-label' }, ['Principal Investigator Name*']),
                  input({
                    id: 'profilePIName',
                    name: 'piName',
                    type: 'text',
                    className: 'form-control ',
                    onChange: handleChange,
                    value: isNil(profile.zipcode) ? '' : profile.piName,
                  }),
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
                    onChange: handleChange,
                    value: isNil(profile.piEmail) ? '' : profile.piEmail,
                    required: profile.havePI === true
                  })
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
                    onChange: handleChange,
                    value: isNil(profile.eRACommonsID) ? '' : profile.eRACommonsID
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
                  onChange: handleChange,
                  value: isNil(profile.pubmedID) ? '' : profile.pubmedID
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
                  onChange: handleChange,
                  value: profile.scientificURL
                })
              ])
            ]),

            div({ className: 'row margin-top-20' }, [
              div({ className: 'col-lg-4 col-xs-6' }, [
                div({ className: 'italic default-color' }, ['*Required field'])
              ]),

              div({ className: 'col-lg-8 col-xs-6' }, [
                button({ id: 'btn_submit', onClick: submitForm, className: 'f-right btn-primary common-background' }, [
                  'Submit'
                ]),
                h(ReactTooltip, {
                  id: 'tip_profileState',
                  place: 'left',
                  effect: 'solid',
                  multiline: true,
                  className: 'tooltip-wrapper'
                }),
                h(ReactTooltip, {
                  id: 'tip_isThePI',
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
};