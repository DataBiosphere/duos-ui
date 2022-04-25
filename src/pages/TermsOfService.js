import {div, h1} from 'react-hyperscript-helpers';
import {useEffect, useState} from 'react';
import {TosService} from '../libs/tosService';


export default function TermsOfService() {

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
      h1({style: {color: '#00609f', marginLeft: '50px'}}, ['DUOS Terms of Service']),
      div({style: TosService.getScrollableStyle(), className: 'markdown-body'}, [tosText])
    ])
  ]);
}
