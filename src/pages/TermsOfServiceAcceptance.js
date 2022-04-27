import {button, div, h1} from 'react-hyperscript-helpers';
import {useCallback, useEffect, useState} from 'react';
import {TosService} from "../libs/tosService";
import {Storage} from '../libs/storage';
import {Navigation} from '../libs/utils';

export default function TermsOfServiceAcceptance(props) {

  const [tosText, setTosText] = useState('');
  const {history} = props;

  const acceptButtonStyle = {
    backgroundColor: 'rgb(0, 96, 159)',
    color: 'white',
    border: '1px solid rgb(0, 96, 159)',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.45rem',
    padding: '5px 10px',
    cursor: 'pointer',
    fontWeight: '600',
    marginLeft: '1rem',
  };

  const rejectButtonStyle = Object.assign({}, acceptButtonStyle, {
    color: 'black',
    backgroundColor: 'rgb(255, 255, 255)'
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'right',
        }
      }, [
        button({style: rejectButtonStyle}, ["Reject TOS"]),
        button({style: acceptButtonStyle, onClick: acceptToS}, ["Accept TOS"])
      ])
    ])
  ]);
}
