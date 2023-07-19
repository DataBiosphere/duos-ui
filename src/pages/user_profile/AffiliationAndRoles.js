import { useEffect, useState, useCallback } from 'react';
import { Institution, User } from '../../libs/ajax';
import { find, isNil, isNumber } from 'lodash';
import { div, p, h1, h, input, button } from 'react-hyperscript-helpers';
import { Notifications, getPropertyValuesFromUser } from '../../libs/utils';
import { Storage } from '../../libs/storage';
import { FormField, FormFieldTypes } from '../../components/forms/forms';


export default function AffilliationAndRole(props) {

  const {
    user,
    userProps
  } = props;

  const [profile, setProfile] = useState({
    roles: '',
    institutionId: undefined,
    suggestedInstitution: undefined,
    selectedSigningOfficialId: undefined,
    suggestedSigningOfficial: undefined,
    id: undefined
  });

  const [institutionList, setInstitutionList] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState();

  const [signingOfficialList, setSigningOfficialList] = useState([]);
  const [currentSigningOfficial, setCurrentSigningOfficial] = useState(null);

  useEffect(() => {
    const init = async () => {
      console.log(userProps)
      try {
          await getResearcherInfo();
          setInstitutionList(await Institution.list());
      } catch (error) {
          Notifications.showError({text: 'Error: Unable to retrieve user data from server'});
      }
    };
    
    init();

  }, []);

  const getResearcherInfo = async () => {

    const rolesList = []

    for (let i = 0; i < user.roles.length; i++) {
        const newRole = user.roles[i].name
        rolesList.push(newRole)
    }
    const allRoles = rolesList.join(", ")

    setProfile({
      roles: allRoles,
      institutionId: user.institutionId || userProps.institutionId,
      suggestedInstitution: userProps.suggestedInstitution,
      selectedSigningOfficialId: parseInt(userProps.selectedSigningOfficialId),
      suggestedSigningOfficial: userProps.suggestedSigningOfficial,
      id: user.userId
    });

};

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
    console.log(user)
    return user.isSigningOfficial;
  };

  const findSigningOfficial = useCallback((id) => {
    return signingOfficialList.find((so) => so.userId === id);
  }, [signingOfficialList]);

  const submitForm = async (event) => {
    console.log("here")
    event.preventDefault();
    await updateInstitution();
  };

  const formIsValid = () => {
    return !hasInstitution() || !isSigningOfficial();
  };

  const updateInstitution = async () => {
    console.log(profile.institutionId)
    console.log(profile.suggestedInstitution)
    const payload = {
      institutionId: profile.institutionId,
      suggestedInstitution: profile.suggestedInstitution
    };

    let updatedUser = await User.updateSelf(payload);
    return updatedUser;
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

  return div({
        className: 'container',
        style: {
          color: '#333F52',
        },
      }, [
        div({ className: 'row no-margin'}, [
          div({
            className: 'col-md-10 col-md-offset-1 col-xs-12 no-padding',
            style: {
            } }, [
            h1({style: {
              color: '#01549F',
              fontSize: '20px',
              fontWeight: '600',
            } }, ['Affiliation & Role']),
            div({ className: '', style: { 'marginTop': '20px' } }, []),
            div({ style: 
                {
                    color: '#000',
                    fontFamily: 'Montserrat',
                    fontSize: '16px',
                    fontStyle: 'normal',
                    fontWeight: '600',
                    lineHeight: 'normal'
                } 
            },
                 [
                    p({}, ['Institution']),
                    // div ({style: {fontWeight: '400', 'marginTop': '10px'}}, [
                    //     h(FormField, {
                    //     id: 'institution',
                    //     type: FormFieldTypes.TEXT,
                    //     defaultValue: institution,
                    //   }),
                    // ]),
                    generateInstitutionSelectionDisplay(),
                    button({
                      id: 'btn_submit',
                      onClick: submitForm,
                      className: 'f-right btn-primary common-background',
                      style: {
                        marginTop: '2rem',
                      },
                      disabled: !formIsValid(),
                    }, ['Save']),
                    div({ className: '', style: { 'marginTop': '83px' } }, []),
                    p({}, ['Role']),
                 ]),
            p({}, [profile.roles]),
          ])
        ])
  ])

}