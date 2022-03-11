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
  },
  defaultBackgroundColor: '#FFFFFF',
  defaultLabelColor: '#333F52',
  selectedLabelColor: '#FFFFFF'
};

export default function CollectionVoteButton(props) {
  const [style, setStyle] = useState({});
  const { currentVote, onClick, label, disabled, baseColor, keyProp, isSelected } = props;

  const updateStyle = (backgroundColor, labelColor, clickable, disabled) => {
    const additionalStyle = {
      backgroundColor,
      color: labelColor,
      border: clickable ? '0px' : '1px solid',
      cursor: (clickable && !disabled) ? 'pointer' : 'default',
      opacity: disabled ? '0.5' : '1'
    };

    const newStyle = Object.assign({}, styles.baseStyle, additionalStyle);
    setStyle(newStyle);
  };

  useEffect(() => {
    updateStyle(styles.defaultBackgroundColor, styles.defaultLabelColor, false, disabled);
  }, [baseColor, disabled]);

  return button({
    style,
    key: keyProp || `${label}-button`,
    onClick: () => !disabled && onClick(),
    onMouseEnter: () =>
      !disabled && updateStyle(baseColor, styles.selectedLabelColor, true, disabled),
    onMouseLeave: () =>
      !disabled && updateStyle(styles.defaultBackgroundColor, styles.defaultLabelColor, false, disabled),
  }, [label]);
}
