import {useState, useEffect} from 'react';
import {getNames} from 'country-list';
import {cloneDeep, find, get, isEmpty, isNil, omit, omitBy, trim} from 'lodash';
import ReactTooltip from 'react-tooltip';
import {button, div, form, h, hr, ul, li, input, label, option, select, span, textarea,} from 'react-hyperscript-helpers';
import {LibraryCards} from '../components/LibraryCards';
import {eRACommons} from '../components/eRACommons';
import {PageHeading} from '../components/PageHeading';
import {YesNoRadioGroup} from '../components/YesNoRadioGroup';
import {Notification} from '../components/Notification';
import {SearchSelect} from '../components/SearchSelect';
import {Institution, Researcher, User} from '../libs/ajax';
import {NotificationService} from '../libs/notificationService';
import {Alert} from '../components/Alert';
import {Storage} from '../libs/storage';
import {getPropertyValuesFromUser, setUserRoleStatuses, USER_ROLES,} from '../libs/utils';

export default function ResearcherProfile(props) {
  const [profile, setProfile] = useState({
    profileName: '',
    academicEmail: '',
    checkNotifications: false,
    additionalEmail: '',
    eRACommonsID: '',
    linkedIn: '',
    orcid: '',
    researcherGate: '',
    institutionId: undefined,
    department: '',
    division: '',
    address1: '',
    address2: '',
    city: '',
    state: undefined,
    zipcode: '',
    country: '',
    isThePI: null,
    havePI: null,
    piName: '',
    piEmail: '',
    piERACommonsID: '',
    pubmedID: '',
    scientificURL: '',
    completed: undefined
  });

  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState();
  const [userRoles, setUserRoles] = useState([]);
  const [stateNames, setStateNames] = useState([]);
  const [countryNames, setCountryNames] = useState([]);
  const [researcherFieldsComplete, setResearcherFieldsComplete] = useState(false);
  const [incompleteFields, setIncompleteFields] = useState([]);
  const [isNewProfile, setIsNewProfile] = useState(false);

  const [institutionList, setInstitutionList] = useState([]);
  const [notificationData, setNotificationData] = useState();
  const libraryCards = get(currentUser, 'libraryCards', []);
  const isSigningOfficial = get(currentUser, 'isSigningOfficial', false);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        await getResearcherProfile();

        setInstitutionList(await Institution.list());
        generateCountryNames();
        generateStateNames();

        props.history.push('profile');
        setNotificationData(await NotificationService.getBannerObjectById('eRACommonsOutage'));

        setCurrentUser(Storage.getCurrentUser());
        setIsLoading(false);
      } catch (error) {
        Notification.showError({text: 'Error: Unable to retrieve user data from server'});
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [props.history]);

  useEffect(() => {
    const isValid = (value) => {
      let isValid = false;
      if (value !== '' && value !== null && value !== undefined) {
        isValid = true;
      }
      return isValid;
    };

    const isValidNumber = (value) => {
      let isValid = false;
      if (value !== 0 && value !== null && value !== undefined) {
        isValid = true;
      }
      return isValid;
    };

    const isValidState = (value) => {
      const stateSelected = (!isNil(value) && !isEmpty(value));
      const inUS = (profile.country === "United States of America" || profile.country === "");
      if (inUS && stateSelected) {
        return true;
      }
      return !inUS;
    };

    let incompletes = [];

    if (!isValid(profile.profileName)) {
      incompletes.push('Name');
    }

    if (!isValid(profile.academicEmail || profile.academicEmail.indexOf('@') === -1)) {
      incompletes.push('Email Address');
    }

    if (!isValidNumber(profile.institutionId)) {
      incompletes.push('Institution');
    }

    if (!isValid(profile.department)) {
      incompletes.push('Department');
    }

    if (!isValid(profile.address1)) {
      incompletes.push('Address');
    }

    if (!isValid(profile.city)) {
      incompletes.push('City');
    }

    if (!isValidState(profile.state)) {
      incompletes.push('State');
    }

    if (!isValid(profile.country)) {
      incompletes.push('Country');
    }

    if (!isValid(profile.zipcode)) {
      incompletes.push('Zip/Postal Code');
    }

    if (profile.isThePI === null || profile.isThePI === '' || (profile.isThePI === 'false' && profile.havePI === '')) {
      incompletes.push('Principal Investigator Information');
    }

    if (profile.isThePI === 'false' && profile.havePI === 'true') {
      if (!isValid(profile.piName)) {
        incompletes.push('Principal Investigator Name');
      }
      if (!isValid(profile.piEmail) || profile.piEmail.indexOf('@') === -1) {
        incompletes.push('Principal Investigator Email');
      }
    }

    setIncompleteFields(incompletes);
    setResearcherFieldsComplete(incompletes.length === 0);
  }, [profile]);

  const getResearcherProfile = async () => {
    const user = await User.getMe();
    const userProps = getPropertyValuesFromUser(user);

    if (isEmpty(user.roles)) {
      setUserRoles([{ 'roleId': 5, 'name': USER_ROLES.researcher }]);
    } else {
      setUserRoles(user.roles);
    }

    if (userProps.completed === undefined) {
      setIsNewProfile(true);
    }

    let tempCompleted = false;
    if(userProps.completed !== undefined && userProps.completed !== '') {
      tempCompleted = JSON.parse(userProps.completed);
    }

    setProfile({
      additionalEmail: isNil(user.additionalEmail) ? '' : user.additionalEmail,
      institutionId: user.institutionId,
      academicEmail: userProps.academicEmail || user.email,
      address1: userProps.address1,
      address2: userProps.address2,
      checkNotifications: (userProps.checkNotifications === 'true'),
      city: userProps.city,
      completed: tempCompleted || userProps.completed,
      country: userProps.country,
      department: userProps.department,
      division: userProps.division,
      eRACommonsID: userProps.eraCommonsId,
      piERACommonsID: userProps.piERACommonsID,
      havePI: userProps.havePI,
      isThePI: userProps.isThePI,
      linkedIn: userProps.linkedIn,
      orcid: userProps.orcid,
      piEmail: userProps.piEmail,
      piName: userProps.piName,
      profileName: user.displayName,
      pubmedID: userProps.pubmedID,
      researcherGate: userProps.researcherGate,
      scientificURL: userProps.scientificURL,
      state: userProps.state,
      zipcode: userProps.zipcode
    });
  };

  const handleChange = (event) => {
    let field = event.target.name;
    let value = event.target.value;

    let newProfile = Object.assign({}, profile, {[field]: value});

    if (field === 'country') {
      if (value !== 'United States of America') {
        newProfile.state = '';
      }
    }

    setProfile(newProfile);
  };

  const handleCheckboxChange = (event) => {
    setProfile(Object.assign({}, profile, {checkNotifications: event.target.checked}));
  };

  const handleRadioChange = (event, field, value) => {
    let newFields = {
      isThePI: profile.isThePI,
      havePI: profile.havePI
    };

    newFields[field] = value;

    if (profile.isThePI === true || profile.isThePI === 'true') {
      newFields.havePI = '';
    }
    if (profile.havePI === false || profile.havePI === 'false' || profile.havePI === '') {
      newFields.piName = '';
      newFields.piEmail = '';
      newFields.piERACommonsID = '';
    }

    setProfile(Object.assign({}, profile, newFields));
  };

  const submitForm = async (event) => {
    event.preventDefault();

    let newProfile = cleanObject(Object.assign({}, profile, {completed: researcherFieldsComplete}));
    setProfile(newProfile);
    console.log(newProfile.completed + " " + profile.completed); // to find where value is getting lost

    if (isNewProfile) {
      await createResearcher(profile);
    } else {
      await updateResearcher(profile);
    }
  };

  const createResearcher = async (profile) => {
    await Researcher.createProperties(profile);
    await updateUser();
    props.history.push({ pathname: 'dataset_catalog' });
  };

  const updateResearcher = async (profile) => {
    const profileClone = cloneProfile(profile);
    await Researcher.updateProperties(Storage.getCurrentUser().dacUserId, true, profileClone);
    await updateUser();
    props.history.push({ pathname: 'dataset_catalog' });
  };

  const updateUser = async () => {
    const currentUserUpdate = Storage.getCurrentUser();
    delete currentUserUpdate.email;
    currentUserUpdate.displayName = profile.profileName;
    currentUserUpdate.additionalEmail = profile.additionalEmail;
    currentUserUpdate.roles = userRoles;
    currentUserUpdate.institutionId = profile.institutionId;
    const payload = { updatedUser: currentUserUpdate };
    let updatedUser = await User.update(payload, currentUserUpdate.dacUserId);
    updatedUser = Object.assign({}, updatedUser, setUserRoleStatuses(updatedUser, Storage));
    return updatedUser;
  };

  const cleanObject = (obj) => {
    return omitBy(obj, (s) => { return isNil(s) || trim(s.toString()).length === 0; });
  };

  const cloneProfile = (profile) => {
    return omit(cloneDeep(profile), ['libraryCards', 'libraryCardEntries']);
  };

  const generateCountryNames = () => {
    const USA = option({ value: "United States of America"}, ["United States of America"]);
    const empty = option({ value: ""}, [""]);
    const countryNames = getNames().map((name) => option({value: name}, [name]));
    const index = countryNames.indexOf(USA);
    countryNames.splice(index, 1);
    countryNames.splice(0, 0, USA);
    countryNames.splice(0, 0, empty);
    setCountryNames(countryNames);
  };

  const generateStateNames = () => {
    const empty = option({ value: ""}, [""]);
    const UsaStates = require('usa-states').UsaStates;
    const stateNames = (new UsaStates().arrayOf("names")).map((name) => option({value: name}, [name]));
    stateNames.splice(0, 0, empty);
    setStateNames(stateNames);
  };

  const showIncompleteFields = () => {
    const listIncompleteFields = incompleteFields.map((field) =>
      li({ key: field }, [field])
    );
    return ul({}, [listIncompleteFields]);
  };

  const generateInstitutionSelectionDisplay = () => {
    // If the user is not an SO, or does not have an existing institution,
    // allow the user to select an institution from the available list.
    // If the user is an SO and has an assigned institution, prevent the
    // selection of a new institution as that will result in an error.

    if (isNil(profile.institutionId) || !isSigningOfficial) {
      return div({},
        [
          h(SearchSelect, {
            id: 'Institution',
            label: 'institution',
            onSelection: (selection) => {
              setProfile(Object.assign({}, profile, {institutionId: selection}));
            },
            options: institutionList.map(institution => {
              return {
                key: institution.id,
                displayText: institution.name,
              };
            }),
            placeholder: 'Please Select an Institution',
            searchPlaceholder: 'Search for Institution...',
            value: profile.institutionId,
            className: 'form-control'
          })
        ]);
    } else {
      let institution = find(institutionList, {id: profile.institutionId});
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
                  className: 'form-control',
                  defaultValue: profile.profileName,
                  onBlur: handleChange
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
                  className: 'form-control',
                  disabled: true,
                  defaultValue: profile.academicEmail,
                  onBlur: handleChange
                })
              ]),

              div({ className: 'col-xs-12 rp-group checkbox' }, [
                input({
                  type: 'checkbox',
                  id: 'chk_sendNotificationsAcademicEmail',
                  name: 'checkNotifications',
                  className: 'checkbox-inline rp-checkbox',
                  defaultChecked:  isNil(profile.checkNotifications) ? false : profile.checkNotifications,
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
                  className: 'form-control',
                  defaultValue: profile.additionalEmail,
                  onBlur: handleChange
                }),
                span({
                  className: 'cancel-color required-field-error-span',
                  isRendered: (!isNil(profile.additionalEmail) && profile.additionalEmail !== "" && profile.additionalEmail.indexOf('@') === -1)
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
                      defaultValue: profile.linkedIn,
                      onBlur: handleChange
                    })
                  ]),
                  div({ className: 'col-sm-4 col-xs-12' }, [
                    label({ id: 'lbl_profileOrcid', className: 'control-label' }, ['ORCID iD']),
                    input({
                      id: 'profileOrcid',
                      name: 'orcid',
                      type: 'text',
                      className: 'form-control',
                      defaultValue: profile.orcid,
                      onBlur: handleChange
                    })
                  ]),
                  div({ className: 'col-sm-4 col-xs-12' }, [
                    label({ id: 'lbl_profileResearcherGate', className: 'control-label' }, ['ResearchGate ID']),
                    input({
                      id: 'profileResearcherGate',
                      name: 'researcherGate',
                      type: 'text',
                      className: 'form-control',
                      defaultValue: profile.researcherGate,
                      onBlur: handleChange
                    })
                  ])
                ])
              ]),

              div({ className: 'col-xs-12', style: { 'marginTop': '20px' } }, [
                label({ id: 'lbl_profileInstitution', className: 'control-label' }, [
                  'Institution Name* ',
                  span({
                    className: 'glyphicon glyphicon-question-sign tooltip-icon',
                    'data-tip': (isSigningOfficial && !isNil(profile.institutionId)) ?
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
                      defaultValue: profile.department,
                      onBlur: handleChange
                    })
                  ]),
                  div({ className: 'col-xs-6' }, [
                    label({ id: 'lbl_profileDivision', className: 'control-label' }, ['Division ', span({ className: 'italic' }, ['(optional)'])]),
                    input({
                      id: 'profileDivision',
                      name: 'division',
                      type: 'text',
                      className: 'form-control',
                      defaultValue: profile.division,
                      onBlur: handleChange
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
                      defaultValue: profile.address1,
                      onBlur: handleChange
                    })
                  ]),
                  div({ className: 'col-xs-6' }, [
                    label({ id: 'lbl_profileAddress2', className: 'control-label' }, ['Street Address 2 ', span({ className: 'italic' }, ['(optional)'])]),
                    input({
                      id: 'profileAddress2',
                      name: 'address2',
                      type: 'text',
                      className: 'form-control',
                      defaultValue: profile.address2,
                      onBlur: handleChange
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
                      defaultValue: profile.city,
                      onBlur: handleChange
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
                      className: 'form-control',
                      value: profile.state,
                      disabled: (profile.country !== '' && profile.country !== 'United States of America'),
                      onChange: handleChange
                    }, stateNames )
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
                      defaultValue: profile.zipcode,
                      onBlur: handleChange
                    })
                  ]),

                  div({ className: 'col-xs-6 rp-group' }, [
                    label({ id: 'lbl_profileCountry', className: 'control-label' }, ['Country*']),
                    select({
                      id: 'profileCountry',
                      name: 'country',
                      className: 'form-control',
                      value: profile.country,
                      onChange: handleChange
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
                    'data-tip': 'This information is required in order to classify users as bona fide researchers as part of the process of Data Access approvals.',
                    'data-for': 'tip_isThePI'
                  })
                ])
              ]),

              div({ className: 'col-xs-12 rp-group' }, [
                YesNoRadioGroup({
                  id: 'rad_isThePI',
                  name: 'isThePI',
                  value: profile.isThePI,
                  onChange: handleRadioChange
                })
              ])
            ]),

            div({
              isRendered: profile.isThePI === 'false',
              className: 'form-group'
            }, [

              div({ className: 'col-xs-12' }, [
                label({
                  className: 'control-label '
                }, ['Do you have a Principal Investigator?*'])
              ]),

              div({ className: 'col-xs-12 rp-group' }, [
                YesNoRadioGroup({
                  id: 'rad_havePI',
                  name: 'havePI',
                  value: profile.havePI,
                  onChange: handleRadioChange
                })
              ]),

              div({
                isRendered: profile.havePI === true || profile.havePI === 'true',
                className: 'form-group'
              }, [
                div({ className: 'col-xs-12' }, [
                  label({ id: 'lbl_profilePIName', className: 'control-label' }, ['Principal Investigator Name*']),
                  input({
                    id: 'profilePIName',
                    name: 'piName',
                    type: 'text',
                    className: 'form-control',
                    defaultValue: profile.piName,
                    onBlur: handleChange
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
                    className: 'form-control',
                    defaultValue: profile.piEmail,
                    onBlur: handleChange
                  })
                ]),

                div({ className: 'col-xs-12' }, [
                  label({
                    id: 'lbl_profileEraCommons',
                    className: 'control-label'
                  }, ['Principal Investigator eRA Commons ID ', span({ className: 'italic' }, ['(optional)'])]),
                  input({
                    id: 'profileEraCommons',
                    name: 'piERACommonsID',
                    type: 'text',
                    className: 'form-control',
                    defaultValue: profile.piERACommonsID,
                    onBlur: handleChange
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
                  defaultValue: profile.pubmedID,
                  onBlur: handleChange
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
                  defaultValue: profile.scientificURL,
                  maxLength: '512',
                  rows: '3',
                  onBlur: handleChange
                })
              ])
            ]),

            div ({ className: 'row no-margin' }, [
              div ({
                isRendered: !researcherFieldsComplete,
                className: 'col-xs-12'
              },[
                Alert({
                  id: 'researcherIncompleteFields',
                  type: 'info',
                  title: 'Researchers: Please complete the following required fields before submitting Data Access Requests.',
                  description: showIncompleteFields()
                })
              ])
            ]),

            div({ className: 'row margin-top-20' }, [
              div({ className: 'col-lg-4 col-xs-6' }, [
                div({ className: 'italic default-color' }, ['*Required field'])
              ]),

              div({ className: 'col-lg-8 col-xs-6' }, [
                button({
                  id: 'btn_submit',
                  onClick: submitForm,
                  className: 'f-right btn-primary common-background'
                }, ['Save']),
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
}