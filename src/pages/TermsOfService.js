import React from 'react';
import { useEffect, useState } from 'react';
import { Storage } from '../libs/storage';
import { TosService } from '../libs/tosService';
import SimpleButton from '../components/SimpleButton';

export default function TermsOfService(props) {
  const [tosText, setTosText] = useState('');
  const { history } = props;
  const isLogged = Storage.userIsLogged();

  useEffect(() => {
    const init = async () => {
      const text = await TosService.getFormattedText();
      setTosText(text);
    };
    init();
  }, []);

  const rejectAndSignOut = async () => {
    // update Sam that ToS was rejected
    await TosService.rejectTos();

    // log user out and send them back home.
    await Storage.setUserIsLogged(false);
    await Storage.clearStorage();
    history.push('/');
  };

  return (
    <div style={TosService.getBackgroundStyle()}>
      <div style={TosService.getContainerStyle()}>
        <h1 style={{ color: '#00609f', marginLeft: '25px' }}>DUOS Terms of Service</h1>
        <div style={TosService.getScrollableStyle()} className="markdown-body">
          {tosText}
        </div>
        {isLogged && <div style={{ display: 'flex', justifyContent: 'right', paddingRight: '5rem' }}>
          <SimpleButton
            keyProp="tos-accept"
            label="Reject Terms of Service"
            isRendered={true}
            onClick={rejectAndSignOut}
            baseColor="#d13b07"
            hoverStyle={{
              backgroundColor: '#b83206',
              color: 'white',
            }}
            additionalStyle={{
              textTransform: 'none',
              padding: '5px 10px',
              fontSize: '1.45rem',
            }}
          />
        </div>}
      </div>
    </div>
  );
}
