import {button, div, h1} from 'react-hyperscript-helpers';
import {useCallback, useEffect, useState} from 'react';
import {TosService} from "../libs/tosService";
import {Storage} from '../libs/storage';
import {Navigation} from '../libs/utils';

export default function TermsOfServiceAcceptance(props) {

  const [tosText, setTosText] = useState('');
  const {history, onSignOut} = props;

  const acceptButtonStyle = {
    alignItems: 'center',
    backgroundColor: 'rgb(0, 96, 159)',
    border: '1px solid rgb(0, 96, 159)',
    borderRadius: '4px',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    fontSize: '1.45rem',
    fontWeight: '600',
    justifyContent: 'center',
    marginLeft: '1rem',
    padding: '5px 10px',
  };

  const rejectButtonStyle = Object.assign({}, acceptButtonStyle, {
    backgroundColor: 'rgb(255, 255, 255)',
    color: 'black'
  });

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
    Navigation.back(user, history);
  }, [history]);


  return div({style: TosService.getBackgroundStyle()}, [
    div({style: TosService.getContainerStyle()}, [
      h1({style: {color: '#00609f', marginLeft: '25px'}}, ['DUOS Terms of Service']),
      div({style: TosService.getScrollableStyle()}, [tosText]),
      div({
        style: {
          marginTop: '.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'right',
        }
      }, [
        button({style: rejectButtonStyle, onClick: onSignOut}, ["Reject TOS"]),
        button({style: acceptButtonStyle, onClick: acceptToS}, ["Accept TOS"])
      ])
    ])
  ]);
}
