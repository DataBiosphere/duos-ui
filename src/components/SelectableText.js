import { useState, useEffect, useMemo } from "react";
import { div } from "react-hyperscript-helpers";

const defaultUnselectedStyle = {
  fontSize: '1.8rem',
  fontWeight: 400,
  marginRight: '2rem',
  color: '#837f7f',
};

const defaultSelectedStyle = {
  fontSize: '1.8rem',
  fontWeight: 400,
  borderBottomWidth: '3px',
  borderBottomStyle: 'solid',
  borderBottomColor: 'green',
  marginRight: '2rem',
  color: '#837f7f',
};

const defaultHoverStyle = {fontWeight: 600, cursor: 'pointer'};

export default function SelectableText({label, setSelected, selectedType, styleOverride = {}}) {

  const {baseStyle, tabSelected, tabUnselected, tabHover} = styleOverride;
  const [style, setStyle] = useState(utilizedUnselectedStyle);


  const utilizedUnselectedStyle = useMemo(() => {
    return Object.assign({}, tabUnselected || defaultUnselectedStyle, baseStyle);
  }, [tabUnselected, baseStyle]);
  const utilizedHoverStyle = useMemo(() => {
    return Object.assign({}, style, tabHover || defaultHoverStyle, baseStyle);
  }, [tabHover, baseStyle, style]);
  const utilizedSelectedStyle = useMemo(() => {
    return Object.assign({}, tabSelected || defaultSelectedStyle, baseStyle);
  }, [tabSelected, baseStyle]);

  useEffect(() => {
    setStyle(
      selectedType === label ? utilizedSelectedStyle : utilizedUnselectedStyle
    );
  }, [label, selectedType, utilizedSelectedStyle, utilizedUnselectedStyle]);


  const addHoverEffect = () => {
    setStyle(utilizedHoverStyle);
  };
  const removeHoverEffect = () => {
    setStyle(selectedType === label ? utilizedSelectedStyle : utilizedUnselectedStyle);
  };


  return(
    div({
      style,
      onMouseEnter: addHoverEffect,
      onMouseLeave: removeHoverEffect,
      onClick: () => setSelected(label),
      className: `tab-selection-${label}`
    }, [label])
  );
}