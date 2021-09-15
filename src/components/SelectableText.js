import { useState, useEffect, useMemo } from "react";
import { div } from "react-hyperscript-helpers";

const getSelectedTabStyle = (style) => {
  const { color } = style;
  return Object.assign({}, style, {
    borderBottom: `3px solid ${color}`,
    fontWeight: 400,
  });
};

export default function SelectableText(props) {
  const { label, color, componentType, setSelected, selectedType, fontSize } = props;
  const baseStyle = useMemo(() => {
    return {
      fontSize,
      fontWeight: 400,
      borderBottom: '0px',
      marginRight: '2rem',
      color,
    };
  }, [color, fontSize]);


  const [style, setStyle] = useState(baseStyle);

  useEffect(() => {
    selectedType === componentType ? setStyle(getSelectedTabStyle(baseStyle)) : setStyle(baseStyle);
  }, [baseStyle, componentType, selectedType]);

  const addHoverEffect = () => {
    const hoverStyle = { fontWeight: 600, cursor: 'pointer' };
    const updatedStyle = Object.assign({}, style, hoverStyle);
    setStyle(updatedStyle);
  };;

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
      onClick: () => setSelected(componentType)
    }, [label])
  );
}