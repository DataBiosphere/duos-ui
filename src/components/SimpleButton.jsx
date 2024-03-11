import React from 'react';
import { useState, useEffect } from 'react';

const updateStyle = ({backgroundColor, fontColor, additionalStyle = {}, pointerBool, disabled, setStyle}) => {
  const baseStyle = {
    color: fontColor, //make this a hex or rgba value
    backgroundColor,
    border: `1px ${backgroundColor} solid`,
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    padding: '5% 10%',
    cursor: pointerBool ? 'pointer' : 'default',
    textTransform: 'uppercase'
  };
  const newStyle = Object.assign({}, baseStyle, additionalStyle);
  if (disabled) {
    newStyle.opacity = '0.5';
  }
  setStyle(newStyle);
};

export default function SimpleButton(props) {
  const { onClick, label, disabled, baseColor, additionalStyle, keyProp, hoverStyle = {}} = props;
  const backgroundColor = props.backgroundColor || baseColor || 'rgb(0, 96, 159)';
  const fontColor = props.fontColor || 'white';
  const [style, setStyle] = useState({});

  useEffect(() => {
    updateStyle({backgroundColor, fontColor, additionalStyle, pointerBool: false, disabled, setStyle});
  }, [baseColor, additionalStyle, disabled, fontColor, backgroundColor]);

  const getDivAttributes = (disabled) => {
    const baseAttributes = {
      style,
      key: keyProp || `${label}-button`,
      id: keyProp || `${label}-button`,
      onClick: () => !disabled && onClick(),
      onMouseEnter: () =>
        !disabled && updateStyle({backgroundColor: hoverStyle.backgroundColor || backgroundColor, fontColor: hoverStyle.color || fontColor, additionalStyle, pointerBool: true, disabled, setStyle}),
      onMouseLeave: () =>
        !disabled && updateStyle({backgroundColor, fontColor, baseColor, additionalStyle, pointerBool: false, disabled, setStyle}),
    };
    return baseAttributes;
  };

  return (
    <button {...getDivAttributes(disabled)}>
      {label}
    </button>
  );
}
