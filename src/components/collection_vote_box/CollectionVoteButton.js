import {useEffect, useState} from "react";
import {button} from "react-hyperscript-helpers";

export default function CollectionVoteButton(props) {
  const { currentVote, onClick, label, disabled, baseColor, keyProp, isSelected } = props;

  const updateStyle = (backgroundColor, baseColor, clickable, disabled) => {
    const baseStyle = {
      backgroundColor,
      color: baseColor, //make this a hex or rgba value
      border: `1px solid`,
      borderRadius: '5px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px',
      padding: '5%',
      cursor: (clickable && !disabled) ? 'pointer' : 'default'
    };

    const newStyle = Object.assign({}, baseStyle);
    if (disabled) {
      newStyle.opacity = '0.5';
    }
    setStyle(newStyle);
  };

  const [style, setStyle] = useState({});

  useEffect(() => {
    updateStyle('white', baseColor, false, disabled);
  }, [baseColor, disabled]);


  return button({
    style,
    key: keyProp || `${label}-button`,
    onClick: () => !disabled && onClick(),
    onMouseEnter: () =>
      !disabled && updateStyle(baseColor, 'white', true, disabled),
    onMouseLeave: () =>
      !disabled && updateStyle('white', baseColor, false, disabled),
  }, [label]);
}
