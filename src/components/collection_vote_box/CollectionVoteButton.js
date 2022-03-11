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
  const [additionalStyle, setAdditionalStyle] = useState({});
  const { onClick, label, disabled, isSelected, baseColor } = props;

  useEffect(() => {
    isSelected ? selectedButtonStyle() : defaultButtonStyle();
  }, [isSelected]);

  const defaultButtonStyle = () => {
    updateStyle(styles.defaultBackgroundColor, styles.defaultLabelColor, false, disabled);
  };

  const selectedButtonStyle = () => {
    updateStyle(baseColor, styles.selectedLabelColor, true, disabled);
  };

  const updateStyle = (backgroundColor, labelColor, showSelectedStyle, disabled) => {
    setAdditionalStyle({
      backgroundColor,
      color: labelColor,
      border: showSelectedStyle ? '0px' : '1px solid',
      cursor: (showSelectedStyle && !disabled) ? 'pointer' : 'default',
      opacity: disabled ? '0.5' : '1'
    });
  };

  return button({
    style: Object.assign({}, styles.baseStyle, additionalStyle),
    onClick: () => !disabled && onClick(),
    onMouseEnter: () => !disabled && selectedButtonStyle(),
    onMouseLeave: () => !disabled && !isSelected && defaultButtonStyle(),
  }, [label]);
}
