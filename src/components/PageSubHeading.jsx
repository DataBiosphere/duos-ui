import React from 'react';

export const PageSubHeading = (props) => {
  const { id, imgSrc, title, description, color, iconSize } = props;
  const margins = (iconSize) => {
    const MEDIUM = {
      marginLeft: '45px'
    };
    const LARGE = {
      marginLeft: '55px'
    };
    const NONE = {
      marginLeft: '0'
    };

    if (iconSize === 'none') {
      return NONE;
    }
    if (iconSize === 'large') {
      return LARGE;
    } else {
      return MEDIUM;
    }
  };

  const HEADING = {
    width: '100%',
    margin: '20px 0 10px 0',
    position: 'relative'
  };

  const DESCRIPTION = {
    color: '#000000',
    fontSize: '16px',
    fontWeight: '400'
  };

  const ICON = {
    position: 'absolute',
    top: '0',
    left: '0',
    height: '40px'
  };

  const TITLE = {
    margin: '10px 0 5px 0',
    lineBreak: 'auto',
    padding: '5px 10px 0 0',
    fontSize: '22px',
    fontWeight: '500',
  };

  const MARGINS = margins(iconSize);

  return (
    <div style={HEADING}>
      {
        imgSrc && <img id={id + '_icon'} src={imgSrc} alt={title} style={ICON} />
      }
      <div style={MARGINS}>
        <h2 id={id + '_title'} className={color + '-color'} style={TITLE} >
          {title}
        </h2>
        <span id={id + '_description'} style={DESCRIPTION}>
          {description}
        </span>
      </div>
    </div>
  );
};
