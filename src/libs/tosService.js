import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';
import React from 'react';
import { ToS } from './ajax/ToS';
import homeHeaderBackground from '../images/home_header_background.png';


export const TosService = {

  getBackgroundStyle: () => {
    return {
      marginTop: '-50px',
      paddingTop: '25px',
      minHeight: '900px',
      backgroundImage: `linear-gradient(to right, transparent, white 50%), url(${homeHeaderBackground})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover'
    };
  },

  getContainerStyle: () => {
    return {
      margin: '50px',
      maxWidth: '800px',
      padding: '1.5rem',
      height: '100%',
      backgroundColor: 'white',
      boxShadow: 'rgb(0 0 0 / 12%) 0 3px 2px 1px',
      borderRadius: '5px',
    };
  },

  getScrollableStyle: () => {
    return {
      marginLeft: '25px',
      marginTop: '2rem',
      maxWidth: '800px',
      height: '400px',
      overflowX: 'hidden',
      overflowY: 'auto',
    };
  },

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

  rejectTos: async () => {
    return await ToS.rejectToS();
  },

};
