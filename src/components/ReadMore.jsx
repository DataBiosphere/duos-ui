import React from 'react';
import { useEffect, useState } from 'react';
import ReactTooltip from 'react-tooltip';

export const ReadMore = ({
  inline = false,
  content = [<span key='content'>{''}</span>],
  moreContent = [<span key='moreContent'>{''}</span>],
  className = '',
  style = {},
  readStyle = {},
  charLimit = 100,
  hideUnderLimit = false,
  readMoreText = 'Read More',
  readLessText = 'Read Less',
}) => {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    ReactTooltip.rebuild();
  });

  const getUnderLimit = () => {
    return !content || content.length <= charLimit;
  };

  const getInlineContent = () => {
    const content = expanded
      ? content
      : content.slice(0, charLimit) + (hideUnderLimit
        ? getUnderLimit() ? '' : ' ...'
        : ' ...');
    return (
      <span className={className} style={style}>
        {content}
      </span>
    );
  };

  const getFormattedContent = () => {
    return expanded ? [...content, ...moreContent] : content;
  };

  const getContent = () => {
    return inline ? getInlineContent() : getFormattedContent();
  };

  const readMore = () => {
    setExpanded(true);
  };

  const readLess = () => {
    setExpanded(false);
  };

  const getReadLink = (fun, text, classes) => {
    const { linkElements, linkElementsStyle } = inline
      ? { linkElements: [text], linkElementsStyle: {} }
      : {
        linkElements: [
          text,
          <span key='chevron' className={classes} style={{ padding: '0 1rem' }} aria-hidden="true" />,
        ],
        linkElementsStyle: readStyle,
      };
    return (
      <a onClick={() => fun()} style={linkElementsStyle}>
        {linkElements}
      </a>
    );
  };

  const readLink = expanded ?
    getReadLink(readLess, readLessText, 'glyphicon glyphicon-chevron-up') :
    getReadLink(readMore, readMoreText, 'glyphicon glyphicon-chevron-down');

  return (
    <div>
      {getContent()}
      {hideUnderLimit && getUnderLimit() || readLink}
    </div>
  );
};
