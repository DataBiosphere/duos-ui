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

  return div({className: 'markdown-body'}, [
    h1({style: {color: '#00609f'}}, ['Terms of Service']),
    tosText
  ]);
}
