import { button } from 'react-hyperscript-helpers';
import { useState, useEffect } from 'react';

export default function SimpleButton(props) {
  const { onClick, label, disabled, baseColor, additionalStyle } = props;

  const updateStyle = (backgroundColor, baseColor, additionalStyle = {}, pointerBool, disabled) => {
    const baseStyle = {
      backgroundColor,
      color: baseColor, //make this a hex or rgba value
      border: `1px ${baseColor} solid`,
      borderRadius: '5px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      padding: '5%',
      cursor: pointerBool ? 'pointer' : 'default'
    };

    const newStyle = Object.assign({}, additionalStyle, baseStyle);
    if (disabled) {
      newStyle.opacity = '0.5';
    }
    setStyle(newStyle);
  };

  const [style, setStyle] = useState({});

  useEffect(() => {
    updateStyle('white', baseColor, additionalStyle, false, disabled);
  }, [baseColor, additionalStyle, disabled]);

  const getDivAttributes = (disabled) => {
    const baseAttributes = {
      style,
      onClick: () => !disabled && onClick(),
      onMouseEnter: () =>
        !disabled && updateStyle(baseColor, 'white', additionalStyle, true, disabled),
      onMouseLeave: () =>
        !disabled && updateStyle('white', baseColor, additionalStyle, false, disabled),
    };
    return baseAttributes;
  };

  return button(getDivAttributes(disabled), [label]);
}
