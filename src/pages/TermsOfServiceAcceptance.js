import {div, h, h1} from 'react-hyperscript-helpers';
import {useCallback, useEffect, useState} from 'react';
import {TosService} from '../libs/tosService';
import {Storage} from '../libs/storage';
import {Navigation, researcherProfileComplete} from '../libs/utils';
import SimpleButton from '../components/SimpleButton';
import {Theme} from '../libs/theme';

export default function TermsOfServiceAcceptance(props) {

  const [tosText, setTosText] = useState('');
  const {history} = props;

  useEffect(() => {
    const init = async () => {
      const text = await TosService.getFormattedText();
      setTosText(text);
    };
    init();
  }, []);

  const acceptToS = useCallback(async () => {
    const user = await Storage.getCurrentUser();
    await TosService.acceptTos();
    await Storage.setUserIsLogged(true);

    if (user.isResearcher && !researcherProfileComplete(user)) {
      history.push('/profile');
      return;
    }

    Navigation.back(user, history);
  }, [history]);

  const acceptButton = h(SimpleButton, {
    keyProp: 'tos-accept',
    label: 'Accept Terms of Service',
    isRendered: true,
    onClick: acceptToS,
    baseColor: Theme.palette.secondary,
    additionalStyle: {
      textTransform: 'none',
      marginLeft: '1rem',
      padding: '5px 10px',
      fontSize: '1.45rem',
    },
  });

  const signOut = async () => {
    await Storage.setUserIsLogged(false);
    await Storage.clearStorage();
    history.push('/');
  };

  const rejectButton = h(SimpleButton, {
    keyProp: 'tos-accept',
    label: 'Reject Terms of Service',
    isRendered: true,
    onClick: signOut,
    baseColor: 'darkgray',
    hoverStyle: {
      backgroundColor: '#d13b07',
      color: 'white'
    },
    additionalStyle: {
      textTransform: 'none',
      padding: '5px 10px',
      fontSize: '1.45rem',
    },
  });

  return div({style: TosService.getBackgroundStyle()}, [
    div({style: TosService.getContainerStyle(), className: 'markdown-body'}, [
      h1({style: {marginLeft: '25px'}}, ['DUOS Terms of Service']),
      div({style: TosService.getScrollableStyle()}, [tosText]),
      div({
        style: {
          marginTop: '.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'right',
        }
      }, [
        rejectButton,
        acceptButton
      ])
    ])
  ]);
}
