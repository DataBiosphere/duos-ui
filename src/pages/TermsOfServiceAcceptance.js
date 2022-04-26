import {div, h1} from 'react-hyperscript-helpers';
import {useEffect, useState} from 'react';
import {TosService} from "../libs/tosService";
import {Navigation} from '../libs/utils';

export default function TermsOfServiceAcceptance() {

  const [tosText, setTosText] = useState('');

  useEffect(() => {
    const init = async () => {
      const text = await TosService.getFormattedText();
      setTosText(text);
    };
    init();
  }, []);

  return div({style: TosService.getBackgroundStyle()}, [
    div({style: TosService.getContainerStyle()}, [
      h1({style: {color: '#00609f', marginLeft: '25px'}}, ['DUOS Terms of Service']),
      div({style: TosService.getScrollableStyle()}, [tosText]),
      div({}, ["Accept TOS"]),
      div({}, ["Reject TOS"])
    ])
  ]);
}
