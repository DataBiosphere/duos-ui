import { useState, useEffect, useMemo } from "react";
import { div } from "react-hyperscript-helpers";

const getSelectedTabStyle = (style, primaryColor, borderBottomWidth) => {
  return Object.assign({}, style, {
    borderBottomWidth,
    fontWeight: style.fontWeight,
    color: primaryColor || '#000'
  });
};

export default function SelectableText(props) {
  const { label, setSelected, selectedType, styleOverride = {}} = props;
  const {
    fontSize = '1.8rem',
    fontWeight = 400,
    borderBottomStyle = 'solid',
    borderBottomColor = 'green',
    borderBottomWidth = '3px',
    marginRight = '2rem',
    primaryColor = '#000',
    secondaryColor = '#837f7f',
  } = styleOverride;

  const baseStyle = useMemo(() => {
    return {
      fontSize,
      fontWeight,
      borderBottomStyle,
      borderBottomColor,
      borderBottomWidth: '0px',
      marginRight: marginRight,
      color: secondaryColor,
    };
  }, [fontSize, fontWeight, borderBottomStyle, borderBottomColor, marginRight, secondaryColor]);

  const [style, setStyle] = useState(baseStyle);

  useEffect(() => {
    selectedType === label ? setStyle(getSelectedTabStyle(baseStyle, primaryColor, borderBottomWidth)) : setStyle(baseStyle);
  }, [baseStyle, label, selectedType, primaryColor, borderBottomWidth]);

  const addHoverEffect = () => {
    const hoverStyle = { fontWeight: 600, cursor: 'pointer' };
    const updatedStyle = Object.assign({}, style, hoverStyle);
    setStyle(updatedStyle);
  };

  const removeHoverEffect = () => {
    const standardStyle = { fontWeight: 400, cursor: 'default' };
    const updatedStyle = Object.assign({}, style, standardStyle);
    setStyle(updatedStyle);
  };

  return(
    div({
      style,
      onMouseEnter: addHoverEffect,
      onMouseLeave: removeHoverEffect,
      onClick: () => setSelected(label)
    }, [label])
  );
}