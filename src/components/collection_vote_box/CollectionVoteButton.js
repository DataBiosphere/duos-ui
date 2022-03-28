import {useCallback, useEffect, useState} from "react";
import {button} from "react-hyperscript-helpers";

const styles = {
  baseStyle: {
    height: '45px',
    width: '94px',
    borderRadius: '5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    padding: '5%'
  },
  defaultBackgroundColor: '#FFFFFF',
  defaultLabelColor: '#333F52',
  selectedLabelColor: '#FFFFFF'
};

export default function CollectionVoteButton(props) {
  const [additionalStyle, setAdditionalStyle] = useState({});
  const { onClick, label, disabled, isSelected, baseColor, dataCy } = props;

  const defaultButtonStyle = useCallback(() => {
    updateStyle(styles.defaultBackgroundColor, styles.defaultLabelColor, false, disabled);
  }, [disabled]);

  const selectedButtonStyle = useCallback(() => {
    updateStyle(baseColor, styles.selectedLabelColor, true, disabled);
  }, [baseColor, disabled]);

  useEffect(() => {
    isSelected ? selectedButtonStyle() : defaultButtonStyle();
  }, [defaultButtonStyle, isSelected, selectedButtonStyle]);

  const updateStyle = (backgroundColor, labelColor, showSelectedStyle, disabled) => {
    setAdditionalStyle({
      backgroundColor,
      color: labelColor,
      border: showSelectedStyle ? '0px' : '1px solid',
      cursor: (showSelectedStyle && !disabled) ? 'pointer' : 'default',
    });
  };

  return button({
    dataCy,
    style: Object.assign({}, styles.baseStyle, additionalStyle),
    onClick: () => !disabled && onClick(),
    onMouseEnter: () => !disabled && selectedButtonStyle(),
    onMouseLeave: () => !disabled && !isSelected && defaultButtonStyle(),
  }, [label]);
}
