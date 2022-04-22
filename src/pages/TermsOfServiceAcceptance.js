import {div, h1, span} from 'react-hyperscript-helpers';
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

  return div({className: 'markdown-body'}, [
    h1({style: {color: '#00609f'}}, ['Terms of Service']),
    tosText,
    div({className: 'markdown-body'}, [span({}, ['Button!!!'])])
  ]);
}
