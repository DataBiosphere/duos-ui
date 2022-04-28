import { button } from 'react-hyperscript-helpers';
import { useState, useEffect } from 'react';

const updateStyle = ({backgroundColor = '#0948B7', fontColor = 'white', additionalStyle = {}, pointerBool, disabled, baseColor, setStyle}) => {
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
    cursor: pointerBool ? 'pointer' : 'default',
    textTransform: 'upper'
  };

  const newStyle = Object.assign({}, baseStyle, additionalStyle);
  if (disabled) {
    newStyle.opacity = '0.5';
  }
  setStyle(newStyle);
};

export default function SimpleButton(props) {
  const { onClick, label, disabled, baseColor, additionalStyle, keyProp, hoverColor = 'rgb(9, 72, 183)', fontColor} = props;
  const backgroundColor = props.backgroundColor || baseColor;
  const [style, setStyle] = useState({});

  useEffect(() => {
    updateStyle({backgroundColor, baseColor, fontColor, additionalStyle, pointerBool: false, disabled, setStyle});
  }, [baseColor, additionalStyle, disabled, fontColor, backgroundColor]);

  const getDivAttributes = (disabled) => {
    const baseAttributes = {
      style,
      key: keyProp || `${label}-button`,
      id: keyProp || `${label}-button`,
      onClick: () => !disabled && onClick(),
      onMouseEnter: () =>
        !disabled && updateStyle({backgroundColor: hoverColor, fontColor, baseColor: hoverColor, additionalStyle, pointerBool: true, disabled, setStyle}),
      onMouseLeave: () =>
        !disabled && updateStyle({backgroundColor, fontColor, baseColor, additionalStyle, pointerBool: false, disabled, setStyle}),
    };
    return baseAttributes;
  };

  return button(getDivAttributes(disabled), [label]);
}
