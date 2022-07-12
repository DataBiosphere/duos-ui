import {useState, useEffect} from 'react';
import {cloneDeep, find, isEmpty, isNil, isNumber, omit, trim} from 'lodash';
import ReactTooltip from 'react-tooltip';
import {button, div, form, h, hr, ul, li, input, label, span, textarea,} from 'react-hyperscript-helpers';
import {LibraryCards} from '../components/LibraryCards';
import {eRACommons} from '../components/eRACommons';
import {PageHeading} from '../components/PageHeading';
import {YesNoRadioGroup} from '../components/YesNoRadioGroup';
import {Notification} from '../components/Notification';
import {SearchSelectOrText} from '../components/SearchSelectOrText';
import {AuthenticateNIH, Institution, Researcher, User} from '../libs/ajax';
import {NotificationService} from '../libs/notificationService';
import {Alert} from '../components/Alert';
import {Storage} from '../libs/storage';
import {getPropertyValuesFromUser, setUserRoleStatuses, USER_ROLES, isEmailAddress} from '../libs/utils';

export default function ResearcherProfile(props) {
  const [profile, setProfile] = useState({
    profileName: '',
    institutionId: undefined,
    completed: undefined
  });

  const [currentUser, setCurrentUser] = useState();
  const [userRoles, setUserRoles] = useState([]);
  const [researcherFieldsComplete, setResearcherFieldsComplete] = useState(false);
  const [incompleteFields, setIncompleteFields] = useState([]);
  const [isNewProfile, setIsNewProfile] = useState(false);

  const [institutionList, setInstitutionList] = useState([]);
  const [signingOfficialList, setSigningOfficialList] = useState([]);

  const [notificationData, setNotificationData] = useState();

  useEffect(() => {
    const init = async () => {
      try {
        await getResearcherProfile();

        setInstitutionList(await Institution.list());

        props.history.push('profile');
        setNotificationData(await NotificationService.getBannerObjectById('eRACommonsOutage'));

        setCurrentUser(Storage.getCurrentUser());
      } catch (error) {
        Notification.showError({text: 'Error: Unable to retrieve user data from server'});
      }
    };

    init();
  }, [props.history]);

  useEffect(() => {
    let incompletes = [];

    if (!isValid(profile.profileName)) {
      incompletes.push('Name');
    }

    if (!isNumber(profile.institutionId) || profile.institutionId === 0) {
      incompletes.push('Institution');
    }

    setIncompleteFields(incompletes);
    setResearcherFieldsComplete(incompletes.length === 0);
  }, [profile]);

  const isValid = (value) => {
    return !isEmpty(trim(value.toString()));
  };

  const hasInstitution = () => {
    return profile.institutionId || profile.suggestedInstitution;
  }

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
      institutionId: user.institutionId,
      eraCommonsId: userProps.eraCommonsId,
      profileName: user.displayName,
    });
  };

  const handleChange = (event) => {
    let field = event.target.name;
    let value = event.target.value;

    let newProfile = Object.assign({}, profile, {[field]: value});
    setProfile(newProfile);
  };

  const handleCheckboxChange = (event) => {
    setProfile(Object.assign({}, profile, {checkNotifications: event.target.checked}));
  };

  const eraValidate = async () => {
    // Temporary fix until eRACommons.js is updated to share re-render info.

    const user = await User.getMe();
    const userProps = getPropertyValuesFromUser(user);
    const expirationCount = isNil(userProps.eraExpiration) ? 0 : AuthenticateNIH.expirationCount(userProps.eraExpiration);

    return (!isNil(userProps.eraCommonsId) && userProps.eraAuthorized === 'true' && expirationCount >= 0);
  };

  const submitForm = async (event) => {
    event.preventDefault();

    const eraValid = await eraValidate();
    const profileCompleted = researcherFieldsComplete && eraValid;

    const newProfile = Object.assign({}, profile, {completed: profileCompleted});

    if (isNewProfile) {
      await createUserProperties(newProfile);
    } else {
      await updateUserProperties(newProfile);
    }
  };

  const createUserProperties = async (profile) => {
    await Researcher.createProperties(profile);
    await updateUser();
    props.history.push({ pathname: 'dataset_catalog' });
  };

  const updateUserProperties = async (profile) => {
    const profileClone = cloneProfile(profile);
    await Researcher.updateProperties(Storage.getCurrentUser().userId, researcherFieldsComplete, profileClone);
    await updateUser();
    props.history.push({ pathname: 'dataset_catalog' });
  };

  const updateUser = async () => {
    const currentUserUpdate = Storage.getCurrentUser();
    delete currentUserUpdate.email;
    currentUserUpdate.displayName = profile.profileName;
    currentUserUpdate.roles = userRoles;
    currentUserUpdate.institutionId = profile.institutionId;
    const payload = { updatedUser: currentUserUpdate };
    let updatedUser = await User.update(payload, currentUserUpdate.userId);
    updatedUser = Object.assign({}, updatedUser, setUserRoleStatuses(updatedUser, Storage));
    return updatedUser;
  };

  const cloneProfile = (profile) => {
    return omit(cloneDeep(profile), ['libraryCards', 'libraryCardEntries']);
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
    // or 

    return 
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
          form({
            name: 'researcherForm', 

            // prevent enter from submitting the form, so that
            // users can hit enter on the institution search bar.
            onKeyDown: (e) => {
              if (e.key == "Enter") {
                e.preventDefault();
              }
            }
          }, [
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
                ])
              ]),

              div({ className: 'col-xs-12', style: { 'marginTop': '20px' } }, [
                label({ id: 'lbl_profileInstitution', className: 'control-label' }, [
                  'Institution Name* ',
                ]),
                div({},
                  [
                    h(SearchSelectOrText, {
                      id: 'Institution',
                      label: 'institution',
                      onPresetSelection: async (selection) => {
                        setSigningOfficialList([]); // reset

                        setProfile(Object.assign({}, profile, {institutionId: selection, suggestedInstitution: undefined}));

                        const institution = await Institution.getById(selection);
                        
                        if (!institution) {
                          return;
                        }

                        setSigningOfficialList((institution.signingOfficials ? institution.signingOfficials : []));
                      },
                      onManualSelection: (selection) => {
                        if (selection == "") {
                          setProfile(Object.assign({}, profile, {institutionId: undefined, suggestedInstitution: undefined}));
                        } else {
                          setProfile(Object.assign({}, profile, {institutionId: undefined, suggestedInstitution: selection}));
                        }
                      },
                      options: institutionList.map(institution => {
                        return {
                          key: institution.id,
                          displayText: institution.name,
                        };
                      }),
                      placeholder: 'Please Select an Institution',
                      searchPlaceholder: 'Search for Institution...',
                      className: 'form-control'
                    })
                  ]
                ),
              ]),


              div({ className: 'col-xs-12', style: { 'marginTop': '20px' } }, [
                label({ id: 'lbl_profileInstitution', className: 'control-label' }, [
                  'Signing Official* ',
                ]),
                div({},
                  [
                    h(SearchSelectOrText, {
                      id: 'SigningOfficial',
                      label: 'SigningOfficial',
                      onPresetSelection: (selection) => {
                        setProfile(Object.assign({}, profile, {signingOfficialId: selection, suggestedSigningOfficial: undefined}));
                      },
                      onManualSelection: (selection) => {
                        if (selection == "") {
                          setProfile(Object.assign({}, profile, {signingOfficialId: undefined, suggestedSigningOfficial: undefined}));
                        } else {
                          setProfile(Object.assign({}, profile, {signingOfficialId: undefined, suggestedSigningOfficial: selection}));
                        }
            
            
                      },
                      options: signingOfficialList.map(signingOfficial => {
                        return {
                          key: signingOfficial.userId,
                          displayText: signingOfficial.displayName,
                        };
                      }),
                      placeholder: 'Please Select a Signing Official',
                      searchPlaceholder: 'Search for a Signing Official...',
                      value: profile.signingOfficial,
                      className: 'form-control'
                    })
                  ]
                ),
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
                ])
              ])
            ]),
          ])
        ])
      ])
    ])
  );
}