import {ToS} from '../libs/ajax';
import {div} from 'react-hyperscript-helpers';
import React, {useEffect, useState} from 'react';
import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';


export default function TermsOfService() {

  const formatMarkdown = (markdown) => {
    return <ReactMarkdown
      components={{a: (props) => <a target={'_blank'} {...props}/>}}>
      {DOMPurify.sanitize(markdown)}
    </ReactMarkdown>;
  };

  const [tosText, setTosText] = useState('');

  useEffect(() => {
    const init = async () => {
      const text = await ToS.getDUOSText();
      setTosText(text.replace('https://app.terra.bio/#', '/'));
    };
    init();
  }, []);

  return div({className: 'markdown-body'}, [formatMarkdown(tosText)]);
}
