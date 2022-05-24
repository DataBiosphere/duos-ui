import {useCallback, useEffect, useState} from "react";
import {button} from "react-hyperscript-helpers";
import {votingColors} from "../../pages/dar_collection_review/MultiDatasetVotingTab";

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
  defaultLabelColor: '#333F52',
};

export default function CollectionVoteButton(props) {
  const [additionalStyle, setAdditionalStyle] = useState({});
  const { onClick, label, disabled, isSelected, baseColor, datacy } = props;

  const defaultButtonStyle = useCallback(() => {
    updateStyle(votingColors.default, styles.defaultLabelColor, false, disabled);
  }, [disabled]);

  const selectedButtonStyle = useCallback(() => {
    updateStyle(baseColor, votingColors.default, true, disabled);
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
    datacy,
    style: Object.assign({}, styles.baseStyle, additionalStyle),
    onClick: () => !disabled && onClick(),
    onMouseEnter: () => !disabled && selectedButtonStyle(),
    onMouseLeave: () => !disabled && !isSelected && defaultButtonStyle(),
  }, [label]);
}
