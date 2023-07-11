import {useState, useEffect, useCallback} from 'react';
import {find, isNil, isNumber} from 'lodash';
import {button, div, form, h, h2, hr, input, label, p, a} from 'react-hyperscript-helpers';
import {eRACommons} from '../components/eRACommons';
import {PageHeading} from '../components/PageHeading';
import {Notification} from '../components/Notification';
import {FormField, FormFieldTypes, FormValidators} from '../components/forms/forms';
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

  const [selectedInstitution, setSelectedInstitution] = useState();
  const [signingOfficialList, setSigningOfficialList] = useState([]);
  const [currentSigningOfficial, setCurrentSigningOfficial] = useState(null);

  const [notificationData, setNotificationData] = useState();

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        await getResearcherProfile();

        setInstitutionList(await Institution.list());
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

        setSelectedInstitution(institution);

        setSigningOfficialList((institution.signingOfficials ? institution.signingOfficials : []));
      });
    } else {
      setSelectedInstitution(null);
    }
  }, [profile.institutionId]);

  useEffect(() => {
    setCurrentSigningOfficial(findSigningOfficial(profile.selectedSigningOfficialId));
  }, [profile.selectedSigningOfficialId, signingOfficialList, findSigningOfficial]);

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
      institutionId: user.institutionId || userProps.institutionId,
      suggestedInstitution: userProps.suggestedInstitution,
      selectedSigningOfficialId: parseInt(userProps.selectedSigningOfficialId),
      suggestedSigningOfficial: userProps.suggestedSigningOfficial,
      eraCommonsId: userProps.eraCommonsId,
      profileName: user.displayName,
      email: user.email,
      id: user.userId
    });
  };

  const handleSupportRequestsChange = ({key, value}) => {
    let newSupportRequests = Object.assign({}, supportRequests, {[key]: value});
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
          h(FormField, {
            id: 'institutionId',
            type: FormFieldTypes.SELECT,
            selectOptions: (institutionList).map((i) => {
              return {
                institutionId: i.id,
                displayText: i.name,
              };
            }),
            placeholder: 'Search for Institution...',
            isCreatable: true,
            defaultValue: {
              institutionId: selectedInstitution?.institutionId,
              suggestedInstitution: profile.suggestedInstitution,
              displayText: (
                (!isNil(selectedInstitution)
                  ? `${selectedInstitution.name}`
                  : (!isNil(profile.suggestedInstitution)
                    ? `${profile.suggestedInstitution}`
                    : ''))
              ),
            },
            selectConfig: {
              clearValue: () => {
                setProfile(Object.assign({},
                  profile,
                  {
                    institutionId: undefined,
                    suggestedInstitution: undefined
                  }));
              },
            },
            onChange: ({value}) => {
              if (!isNil(value?.institutionId)) {
                setProfile(Object.assign({}, profile, {
                  institutionId: value?.institutionId,
                  suggestedInstitution: undefined
                }));
              } else {
                setProfile(Object.assign({}, profile, {
                  institutionId: undefined,
                  suggestedInstitution: value?.displayText
                }));
              }
            }
          }),
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

  const onChange = ({key, value}) => {
    setProfile(Object.assign({}, profile, {[key]: value}));
  };

  const findSigningOfficial = useCallback((id) => {
    return signingOfficialList.find((so) => so.userId === id);
  }, [signingOfficialList]);

  return (
    div({
      className: 'container',
      style: {
        color: '#333F52',
      },
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
                h(FormField, {
                  type: FormFieldTypes.TEXT,
                  title: 'Full Name',
                  validators: [FormValidators.REQUIRED],
                  id: 'profileName',
                  defaultValue: profile.profileName,
                  onChange,
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
            ]),
          ])
        ])
      ])
    ])
  );
}