import { div, h } from 'react-hyperscript-helpers';
import { useMemo } from 'react';
import SelectableText from './SelectableText';

const defaultTabContainerStyle = {
  display: 'flex',
  backgroundColor: 'white',
  border: '0px',
};

const tabTemplates = ({labels, selectedTab, setSelectedTab, isLoading, styleOverride = {}}) => {
  return labels.map((label) =>
    !isLoading ?
      h(SelectableText, {
        label,
        key: `${label}-button`,
        fontSize: '1.8rem',
        componentType: label,
        setSelected: setSelectedTab,
        selectedType: selectedTab,
        styleOverride
      }) :
      div({
        className: 'text-placeholder',
        key: `${label}-placeholder`,
        style: {
          width: '15%',
          height: '1.8rem',
          marginRight: '2rem'
        }
      })
  );
};

export default function TabControl(props) {
  //style override will need to include three styles
  //  1) Style on select
  //  2) Style for unselected
  //  3) Style for hover (if you don't want to change styles on hover just simply inherit )
  const { labels, selectedTab, setSelectedTab, isLoading = false, styleOverride = {} } = props;

  const tabContainerStyle = useMemo(() => {
    const containerOverride = styleOverride.tabContainer;
    return containerOverride || defaultTabContainerStyle;
  }, [styleOverride.tabContainer]);

  return (
    div({
      style: tabContainerStyle,
      className: 'tab-list',
    }, [
      tabTemplates({labels, selectedTab, setSelectedTab, isLoading, styleOverride})
    ])
  );
}
