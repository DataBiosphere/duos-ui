import {useEffect, useState} from "react";
import {button} from "react-hyperscript-helpers";

const styles = {
  baseStyle: {
    border: `1px solid`,
    borderRadius: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    padding: '5%'
  }
};

export default function CollectionVoteButton(props) {
  const [style, setStyle] = useState({});
  const { currentVote, onClick, label, disabled, baseColor, keyProp, isSelected } = props;

  const updateStyle = (backgroundColor, baseColor, clickable, disabled) => {
    const additionalStyle = {
      backgroundColor,
      color: baseColor, //make this a hex or rgba value
      cursor: (clickable && !disabled) ? 'pointer' : 'default'
    };

    const newStyle = Object.assign({}, styles.baseStyle, additionalStyle);
    if (disabled) {
      newStyle.opacity = '0.5';
    }
    setStyle(newStyle);
  };

  useEffect(() => {
    updateStyle('white', '#333F52', false, disabled);
  }, [baseColor, disabled]);

  return button({
    style,
    key: keyProp || `${label}-button`,
    onClick: () => !disabled && onClick(),
    onMouseEnter: () =>
      !disabled && updateStyle(baseColor, 'white', true, disabled),
    onMouseLeave: () =>
      !disabled && updateStyle('white', '#333F52', false, disabled),
  }, [label]);
}
