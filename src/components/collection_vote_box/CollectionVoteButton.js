import {useEffect, useState} from "react";
import {button} from "react-hyperscript-helpers";

const styles = {
  baseStyle: {
    height: '45px',
    width: '94px',
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

  const updateStyle = (backgroundColor, labelColor, clickable, disabled) => {
    const additionalStyle = {
      backgroundColor,
      color: labelColor, //make this a hex or rgba value
      border: clickable ? '0px' : '1px solid',
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
