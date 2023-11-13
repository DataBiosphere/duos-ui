import React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { TosService } from '../libs/tosService';
import { Storage } from '../libs/storage';
import SimpleButton from '../components/SimpleButton';
import { Theme } from '../libs/theme';

export default function TermsOfServiceAcceptance(props) {
  const [tosText, setTosText] = useState('');
  const { history } = props;

  useEffect(() => {
    const init = async () => {
      const text = await TosService.getFormattedText();
      setTosText(text);
    };
    init();
  }, []);

  const acceptToS = useCallback(async () => {
    await TosService.acceptTos();
    await Storage.setUserIsLogged(true);

    // if there is a redirectTo, we should go to that. otherwise, just go to the appropriate
    // user's profile.
    const queryParams = new URLSearchParams(window.location.search);
    const redirect = queryParams.get('redirectTo') ? queryParams.get('redirectTo') : '/profile';

    history.push(redirect);
  }, [history]);

  const acceptButton = <SimpleButton
    keyProp='tos-accept'
    label='Accept Terms of Service'
    isRendered={true}
    onClick={acceptToS}
    baseColor={Theme.palette.secondary}
    additionalStyle={{
      textTransform: 'none',
      marginLeft: '1rem',
      padding: '5px 10px',
      fontSize: '1.45rem',
    }}
  />;

  const signOut = async () => {
    await Storage.setUserIsLogged(false);
    await Storage.clearStorage();
    history.push('/');
  };

  const rejectButton = <SimpleButton
    keyProp='tos-accept'
    label='Reject Terms of Service'
    isRendered={true}
    onClick={signOut}
    baseColor='darkgray'
    hoverStyle={{
      backgroundColor: '#d13b07',
      color: 'white'
    }}
    additionalStyle={{
      textTransform: 'none',
      padding: '5px 10px',
      fontSize: '1.45rem',
    }}
  />;

  return (
    <div style={TosService.getBackgroundStyle()}>
      <div style={{ ...TosService.getContainerStyle(), ...{ className: 'markdown-body' } }}>
        <h1 style={{ marginLeft: '25px' }}>DUOS Terms of Service</h1>
        <div style={TosService.getScrollableStyle()}>{tosText}</div>
        <div style={{ marginTop: '.5rem', display: 'flex', alignItems: 'center', justifyContent: 'right' }}>
          {rejectButton}
          {acceptButton}
        </div>
      </div>
    </div>
  );
}
