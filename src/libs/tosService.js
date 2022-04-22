import ReactMarkdown from "react-markdown";
import DOMPurify from "dompurify";
import React from "react";
import {ToS} from "./ajax";


export const TosService = {

  getFormattedText: async () => {
    const markdown = await ToS.getDUOSText();
    const text = markdown.replace('https://app.terra.bio/#', '/');
    return <ReactMarkdown
      components={{a: (props) => <a target={'_blank'} {...props}/>}}>
      {DOMPurify.sanitize(text)}
    </ReactMarkdown>;
  },

  acceptTos: async () => {
    return await ToS.acceptToS();
  },

};
