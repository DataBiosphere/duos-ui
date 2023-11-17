import React from 'react';
import { isNil } from 'lodash';

const margins = (iconSize) => {

  const MEDIUM = {
    marginLeft: '55px'
  };

  const LARGE = {
    marginLeft: '70px'
  };

  const NONE = {
    marginLeft: '0'
  };

  if (iconSize === 'none') {
    return NONE;
  } else if (iconSize === 'large') {
    return LARGE;
  } else {
    return MEDIUM;
  }
};

export const PageHeading = (props) => {
  const { id, title, description, imgSrc, color, iconSize, descriptionStyle } = props;

  const HEADING = {
    width: '100%',
    margin: '20px 0 10px 0',
    position: 'relative'
  };

  const ICON = {
    position: 'absolute',
    top: '0',
    left: '0',
    height: '50px'
  };

  const DESCRIPTION = {
    color: '#000000',
    height: '25px',
    fontWeight: '400',
    fontSize: '19px'
  };

  const TITLE = {
    margin: '7px 0 5px 0',
    lineBreak: 'auto'
  };

  const MARGINS = margins(iconSize);
  const DESCRIPT_STYLE = isNil(descriptionStyle) ? DESCRIPTION : descriptionStyle;

  return (
    <div id={id + '_heading'} style={HEADING}>
      {imgSrc !== undefined &&
        <img
          id={id + '_icon'}
          src={imgSrc}
          alt={title}
          style={ICON}
        />
      }
      <div style={MARGINS}>
        <h2 id={id + '_title'} className={`${color}-color`} style={TITLE}>
          {title}
        </h2>
        <span id={id + '_description'} style={DESCRIPT_STYLE}>
          {description}
        </span>
      </div>
    </div>
  );
};

export default PageHeading;
