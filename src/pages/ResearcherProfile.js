import {useState, useEffect} from 'react';
import {find, isNil, isNumber} from 'lodash';
import {button, div, form, h, h2, hr, input, label, p, a, textarea} from 'react-hyperscript-helpers';
import {eRACommons} from '../components/eRACommons';
import {PageHeading} from '../components/PageHeading';
import {Notification} from '../components/Notification';
import {SearchSelectOrText} from '../components/SearchSelectOrText';
import {Institution, Support, User} from '../libs/ajax';
import {NotificationService} from '../libs/notificationService';
import {Storage} from '../libs/storage';
import { Notifications, getPropertyValuesFromUser, isEmailAddress} from '../libs/utils';

export default function ResearcherProfile(props) {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState({
    profileName: '',
    institutionId: undefined,
    suggestedInstitution: undefined,
    selectedSigningOfficialId: undefined,
    suggestedSigningOfficial: undefined,
    eraCommonsId: undefined,
    email: undefined,
    id: undefined
  });

  const possibleSupportRequests = [
    {
      key: 'checkRegisterDataset',
      label: 'Register a dataset'
    },
    {
      key: 'checkRequestDataAccess',
      label: 'Request access to data',
    },
    {
      key: 'checkSOPermissions',
      label: `I am a Signing Official and I want to issue permissions to my institution's users`
    },
    {
      key: 'checkJoinDac',
      label: 'I am looking to join a DAC'
    }
  ];

  const [supportRequests, setSupportRequests] = useState({
    checkRegisterDataset: false,
    checkRequestDataAccess: false,
    checkSOPermissions: false,
    checkJoinDac: false,
    extraRequest: undefined
  });

  const [institutionList, setInstitutionList] = useState([]);
  const [signingOfficialList, setSigningOfficialList] = useState([]);

  const [notificationData, setNotificationData] = useState();

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        await getResearcherProfile();

        setInstitutionList(await Institution.list());

        props.history.push('profile');
        setNotificationData(await NotificationService.getBannerObjectById('eRACommonsOutage'));
        setIsLoading(false);
      } catch (error) {
        Notifications.showError({text: 'Error: Unable to retrieve user data from server'});
        setIsLoading(false);
      }
    };

    init();
  }, [props.history]);

  useEffect(() => {
    if (profile.institutionId) {
      Institution.getById(profile.institutionId).then((institution) => {
        if (!institution) {
          return;
        }

        setSigningOfficialList((institution.signingOfficials ? institution.signingOfficials : []));
      });
    }
  }, [profile.institutionId]);

  const hasInstitution = () => {
    return (isNumber(profile.institutionId) && profile.institutionId !== 0) || (profile.suggestedInstitution !== undefined && profile.suggestedInstitution !== '');
  };

  const isSigningOfficial = () => {
    return Storage.getCurrentUser().isSigningOfficial;
  };

  const profileNameIsValid = () => {
    return profile.profileName.length >= 4;
  };

  const suggestSigningOfficialValid = () => {
    return (isNil(profile.suggestedSigningOfficial)||'' == profile.suggestedSigningOfficial) || isEmailAddress(profile.suggestedSigningOfficial);
  };

  const formIsValid = () => {
    return profileNameIsValid() && suggestSigningOfficialValid();
  };

  const getResearcherProfile = async () => {
    const user = await User.getMe();

    const userProps = getPropertyValuesFromUser(user);

    setProfile({
      institutionId: userProps.institutionId,
      suggestedInstitution: userProps.suggestedInstitution,
      selectedSigningOfficialId: parseInt(userProps.selectedSigningOfficialId),
      suggestedSigningOfficial: userProps.suggestedSigningOfficial,
      eraCommonsId: userProps.eraCommonsId,
      profileName: user.displayName,
      email: user.email,
      id: user.userId
    });
  };

  const handleChange = (event) => {
    let field = event.target.name;
    let value = event.target.value;

    let newProfile = Object.assign({}, profile, {[field]: value});
    setProfile(newProfile);
  };

  const handleSupportRequestsChange = (event) => {
    let field = event.target.name;
    let value = event.target.type === 'checkbox'
      ? event.target.checked
      : event.target.value;
    let newSupportRequests = Object.assign({}, supportRequests, {[field]: value});
    setSupportRequests(newSupportRequests);
  };

  const submitForm = async (event) => {
    event.preventDefault();

    await updateUser();
    await sendSupportRequests();
    props.history.push({ pathname: 'dataset_catalog' });
  };

  const updateUser = async () => {
    const payload = {
      displayName: profile.profileName,
      eraCommonsId: profile.eraCommonsId,
      institutionId: profile.institutionId,
      suggestedInstitution: profile.suggestedInstitution,
      selectedSigningOfficialId: profile.selectedSigningOfficialId,
      suggestedSigningOfficial: profile.suggestedSigningOfficial,
    };

    let updatedUser = await User.updateSelf(payload);
    return updatedUser;
  };

  const processSupportRequests = () => {
    const filteredRequests = possibleSupportRequests.filter(request => supportRequests[request.key]);
    return [
      filteredRequests.length > 0,
      filteredRequests
        .map(x => `- ${x.label}`)
        .join('\n')
    ];
  };

  const sendSupportRequests = async () => {
    const [hasSupportRequests, requestText] = processSupportRequests();

    // if there are no supportRequests, don't create a new support ticket
    if (!hasSupportRequests) {
      return;
    }

    const ticketInfo = {
      attachmentToken: [],
      type: 'task',
      subject: `DUOS: User Request for ${profile.profileName}`,
      description: `User (${profile.id}, ${profile.email}) has selected the following options:\n`
        + requestText
        + (supportRequests.extraRequest ? `\n- ${supportRequests.extraRequest}` : '')
    };

    const ticket = Support.createTicket(
      profile.profileName, ticketInfo.type, profile.email,
      ticketInfo.subject,
      ticketInfo.description,
      ticketInfo.attachmentToken,
      'User Profile Page'
    );

    const response = await Support.createSupportRequest(ticket);
    if (response.status === 201) {
      Notifications.showSuccess(
        {text: 'Sent Requests Successfully', layout: 'topRight', timeout: 1500}
      );
    } else {
      Notifications.showError({
        text: `ERROR ${response.status} : Unable To Send Requests`,
        layout: 'topRight',
      });
    }
  };

  const generateInstitutionSelectionDisplay = () => {

    if (!isSigningOfficial() || (isNil(profile.institutionId) && isNil(profile.suggestedInstitution))) {
      return div({},
        [
          h(SearchSelectOrText, {
            id: 'Institution',
            label: 'institution',
            onPresetSelection: async (selection) => {
              setSigningOfficialList([]); // reset

              setProfile(Object.assign({}, profile, {institutionId: selection, suggestedInstitution: undefined}));
            },
            onManualSelection: (selection) => {
              if (selection == '') {
                setProfile(Object.assign({}, profile, {institutionId: undefined, suggestedInstitution: undefined}));
              } else {
                setProfile(Object.assign({}, profile, {institutionId: null, suggestedInstitution: selection}));
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
            placeholder: 'Search for Institution...',
            className: 'form-control'
          })
        ]
      );
    } else {
      let institution = (profile.institutionId ? find(institutionList, {id: profile.institutionId}) : null);

      const institutionName = (institution ? institution.name : profile.suggestedInstitution);


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
          value: institutionName,
        }),
      ]);
    }
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
              if (e.key == 'Enter') {
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
                  onBlur: handleChange,
                }),

                p(
                  {
                    isRendered: !profileNameIsValid() && !isLoading,
                    style: {
                      fontStyle: 'italic',
                      color: '#D13B07',
                    }
                  },
                  ['Profile name must be at least four characters.'])
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
                p({}, [
                  'An ',
                  a({href:'https://www.era.nih.gov/register-accounts/understanding-era-commons-accounts.htm'},
                    ['eRA Commons ID']),
                  ' will be required to submit a dar.'
                ])
              ]),

              div({ className: 'col-xs-12 no-padding' }, [
                div({ className: 'row fsi-row-lg-level fsi-row-md-level no-margin' }, [
                  eRACommons({
                    className: 'col-md-4 col-sm-6 col-xs-12',
                    destination: 'profile',
                    onNihStatusUpdate: () => {},
                    location: props.location,
                    header: false
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
                generateInstitutionSelectionDisplay(),


              ]),


              div({
                className: 'col-xs-12',
                style: { 'marginTop': '20px' },
                isRendered: hasInstitution() && !isSigningOfficial(),
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
                        if (selection == '') {
                          setProfile(Object.assign({}, profile, {selectedSigningOfficialId: undefined, suggestedSigningOfficial: undefined}));
                        } else {
                          setProfile(Object.assign({}, profile, {selectedSigningOfficialId: null, suggestedSigningOfficial: selection}));
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
                p(
                  {
                    isRendered: !suggestSigningOfficialValid(),
                    style: {
                      fontStyle: 'italic',
                      color: '#D13B07',
                    }
                  },
                  ['Please provide your signing official\'s email.']),
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

              div({
                className: 'row no-margin',
                style: { padding: '0 15px' }
              }, [
                div({
                  className: 'col-lg-12 col-xs-12',
                  style: {
                    backgroundColor: '#F2F6FB',
                    padding: 25,
                    marginTop: 40
                  }
                }, [
                  h2({
                    id: 'lbl_supportRequests',
                    style: { ...headerStyle, marginTop: 0 },
                  }, ['Which of the following are you looking to do?*']),

                  possibleSupportRequests.map(supportRequest => {
                    return div({ className: 'col-xs-12 checkbox', key: supportRequest.key }, [
                      input({
                        type: 'checkbox',
                        id: `chk_${supportRequest.key}`,
                        name: supportRequest.key,
                        className: 'checkbox-inline checkbox',
                        checked: supportRequests[supportRequest.id],
                        onChange: handleSupportRequestsChange
                      }),
                      label({ className: 'regular-checkbox', htmlFor: `chk_${supportRequest.key}` },
                        [supportRequest.label])
                    ]);
                  }),

                  div({ className: 'col-xs-12' }, [
                    div({ style: { margin: '15px 0 10px' }}, [
                      `Is there anything else you'd like to request?`
                    ]),

                    textarea({
                      value: supportRequests.extraRequest,
                      onChange: handleSupportRequestsChange,
                      className: 'form-control col-xs-12',
                      name: 'extraRequest',
                      id: 'supportRequests_extraRequest',
                      maxLength: '512',
                      rows: '3',
                      placeholder: 'Enter your request'
                    })
                  ])
                ])
              ]),




              div({
                className: 'row',
                style: { margin: '20px 0' }
              }, [
                div({ className: 'col-lg-4 col-xs-6' }, [
                  div({ className: 'italic default-color' }, ['*Required field'])
                ]),

                div({ className: 'col-lg-8 col-xs-6' }, [
                  button({
                    id: 'btn_submit',
                    onClick: submitForm,
                    className: 'f-right btn-primary common-background',
                    style: {
                      marginTop: '2rem',
                    },
                    disabled: !formIsValid(),
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