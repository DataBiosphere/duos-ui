import { button } from 'react-hyperscript-helpers';
import { useState, useEffect } from 'react';
import {toUpper} from 'lodash/fp';

export default function SimpleButton(props) {
  const { onClick, label, disabled, baseColor, additionalStyle, keyProp, hoverColor = 'rgb(9, 72, 183)', fontColor} = props;

  const updateStyle = (backgroundColor = '#0948B7', fontColor = 'white', additionalStyle = {}, pointerBool, disabled) => {
    const baseStyle = {
      backgroundColor,
      color: fontColor, //make this a hex or rgba value
      border: `1px ${baseColor} solid`,
      borderRadius: '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      padding: '5% 10%',
      cursor: pointerBool ? 'pointer' : 'default'
    };

    const newStyle = Object.assign({}, baseStyle, additionalStyle);
    if (disabled) {
      newStyle.opacity = '0.5';
    }
    setStyle(newStyle);
  };

  const [style, setStyle] = useState({});

  useEffect(() => {
    updateStyle(baseColor, fontColor, additionalStyle, false, disabled);
  }, [baseColor, additionalStyle, disabled, fontColor]);

  const getDivAttributes = (disabled) => {
    const baseAttributes = {
      style,
      key: keyProp || `${label}-button`,
      id: keyProp || `${label}-button`,
      onClick: () => !disabled && onClick(),
      onMouseEnter: () =>
        !disabled && updateStyle(hoverColor, fontColor, additionalStyle, true, disabled),
      onMouseLeave: () =>
        !disabled && updateStyle(baseColor, fontColor, additionalStyle, false, disabled),
    };
    return baseAttributes;
  };

  return button(getDivAttributes(disabled), [toUpper(label)]);
}
