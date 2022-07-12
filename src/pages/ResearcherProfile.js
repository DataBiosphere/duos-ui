import {useState, useEffect} from 'react';
import {cloneDeep, find, isEmpty, isNil, isNumber, omit, trim} from 'lodash';
import ReactTooltip from 'react-tooltip';
import {button, div, form, h, hr, ul, li, input, label, span, p, textarea,} from 'react-hyperscript-helpers';
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
    suggestedInstitution: undefined,
    selectedSigningOfficialId: undefined, 
    suggestedSigningOfficial: undefined,
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

    if (!hasInstitution()) {
      incompletes.push('Institution');
    }

    setIncompleteFields(incompletes);
    setResearcherFieldsComplete(incompletes.length === 0);
  }, [profile]);

  useEffect(() => {
    if (profile.institutionId) {
      Institution.getById(profile.institutionId).then((institution) => {
        if (!institution) {
          return;
        }
    
        setSigningOfficialList((institution.signingOfficials ? institution.signingOfficials : []));    
      });
    }
  }, [profile.institutionId])

  const isValid = (value) => {
    return !isEmpty(trim(value.toString()));
  };

  const hasInstitution = () => {
    return (isNumber(profile.institutionId) && profile.institutionId !== 0) || (profile.suggestedInstitution !== undefined && profile.suggestedInstitution !== "");
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
      institutionId: userProps.institutionId,
      suggestedInstitution: userProps.suggestedInstitution,
      selectedSigningOfficialId: parseInt(userProps.selectedSigningOfficialId),
      suggestedSigningOfficial: userProps.suggestedSigningOfficial,
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

    await updateUser();
    props.history.push({ pathname: 'dataset_catalog' });
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
    currentUserUpdate.suggestedInstitution = profile.suggestedInstitution;
    currentUserUpdate.selectedSigningOfficialId = profile.selectedSigningOfficialId;
    currentUserUpdate.suggestedSigningOfficial = profile.suggestedSigningOfficial;

    const payload = currentUserUpdate;
    console.log("PAYLOAD", payload)
    let updatedUser = await User.update(payload, currentUserUpdate.userId);
    console.log("UPDATED",updatedUser)
    console.log("UPDATED PROPS", getPropertyValuesFromUser(updatedUser));

    //updatedUser = Object.assign({}, updatedUser, setUserRoleStatuses(updatedUser, Storage));
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

  const headerStyle = {
    fontWeight: 'bold',
    color: '#333F52',
    fontSize: '16px',
    marginTop: '1.5rem',
    marginBottom: '1rem'
  };

  return (
    div({ 
      className: 'container' ,
      style: {
        color: '#333F52',
      }
    }, [
      div({ className: 'row no-margin' }, [
        div({ className: 'col-md-10 col-md-offset-1 col-sm-12 col-xs-12' }, [
          Notification({notificationData}),
          PageHeading({
            id: 'researcherProfile',
            color: 'common',
            title: 'Your Profile',
            description: 'Please complete the form below to start using DUOS.'
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
                  id: 'lbl_profileName', 
                  className: 'control-label',
                  style: headerStyle,
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
            div({ className: 'flex' }, [
              div({ className: 'col-xs-12', style: { 'marginTop': '20px' } }, [
                label({ 
                  className: 'control-label',
                  style: headerStyle,
                }, [
                  'Researcher Identification*',
                ]),
                p({}, ['An eRA Commons ID will be required to submit a dar.'])
              ]),

              div({ className: 'col-xs-12 no-padding' }, [
                div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                  eRACommons({
                    className: 'col-md-4 col-sm-6 col-xs-12',
                    destination: 'profile',
                    onNihStatusUpdate: () => {},
                    location: props.location,
                    header: false,
                  }),
                ])
              ]),

              div({ className: 'col-xs-12', style: { 'marginTop': '20px' } }, [
                label({ 
                  id: 'lbl_profileInstitution', 
                  className: 'control-label',
                  style: headerStyle,
                }, [
                  'Institution* ',
                ]),
                p({}, ['Please select an institution or enter your institution name if not available from the dropdown.']),
                div({},
                  [
                    h(SearchSelectOrText, {
                      id: 'Institution',
                      label: 'institution',
                      onPresetSelection: async (selection) => {
                        setSigningOfficialList([]); // reset

                        setProfile(Object.assign({}, profile, {institutionId: selection, suggestedInstitution: undefined}));
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
                      value: profile.institutionId,
                      freetextValue: profile.suggestedInstitution,
                      placeholder: 'Please Select an Institution',
                      searchPlaceholder: 'Search for Institution...',
                      className: 'form-control'
                    })
                  ]
                ),
              ]),
              div({ 
                className: 'col-xs-12', 
                style: { 'marginTop': '20px' },
                isRendered: hasInstitution(),
              }, [
                label({ 
                  id: 'lbl_profileInstitution', 
                  className: 'control-label',
                  style: headerStyle,
                }, [
                  'Signing Official* ',
                ]),
                p({}, ['Please select your Signing Official or enter your signing official’s email address.']),
                div({},
                [
                  h(SearchSelectOrText, {
                    id: 'SigningOfficial',
                    label: 'SigningOfficial',
                    onPresetSelection: (selection) => {
                      setProfile(Object.assign({}, profile, {selectedSigningOfficialId: selection, suggestedSigningOfficial: undefined}));
                    },
                    onManualSelection: (selection) => {
                      if (selection == "") {
                        setProfile(Object.assign({}, profile, {selectedSigningOfficialId: undefined, suggestedSigningOfficial: undefined}));
                      } else {
                        setProfile(Object.assign({}, profile, {selectedSigningOfficialId: undefined, suggestedSigningOfficial: selection}));
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
                    value: profile.selectedSigningOfficialId,
                    freetextValue: profile.suggestedSigningOfficial,
                    className: 'form-control'
                  })
                ]),
                div({
                  style: {
                    marginTop: '2rem',
                    marginBottom: '2rem'
                  }
                }, [
                  p({}, ['If you are applying for data other than NIH data (ex. GTEx), and your Signing Official is not already registered, the DUOS team will reach out to your Signing Official to invite them to register and issue Library Card permissions so that you are able to submit a DAR.']),
                  p({
                    style: {
                      marginTop: '1rem',
                    }
                  }, ['Please feel free to contact your Signing Official to help advance this process.']),    
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
                ])
              ])
            ]),
          ])
        ])
      ])
    ])
  );
}