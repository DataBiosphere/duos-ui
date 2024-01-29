import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';
import React, { useEffect, useState } from 'react';
import { isEmpty } from 'lodash/fp';


export default function ScrollableMarkdownContainer(props) {
  const [text, setText] = useState('');
  const { markdown } = props;

  useEffect(() => {
    const init = async () => {
      fetch(markdown)
        .then((res) => res.text())
        .then((md) => {
          setText(md);
        });
    };
    init();
  }, [markdown]);

  const generateContent = (text) => {
    return (
      <ReactMarkdown components={{ a: (props) => <a target={'_blank'} {...props} /> }}>
        {DOMPurify.sanitize(text, null)}
      </ReactMarkdown>
    );
  };

  const content = generateContent(text);

  return (
    <div
      style={{
        maxWidth: '700px',
        minWidth: '700px',
        maxHeight: '200px',
        overflow: 'auto',
        marginBottom: '25px'
      }}
    >
      {!isEmpty(content) && content}
    </div>
  );
}
