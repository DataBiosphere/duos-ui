import { div, h } from 'react-hyperscript-helpers';
import SelectableText from './SelectableText';

const tabTemplates = (labels, selectedTab, setSelectedTab, isLoading) => {
  return labels.map((label) =>
    !isLoading ?
      h(SelectableText, {
        label,
        key: `${label}-button`,
        fontSize: '1.8rem',
        componentType: label,
        setSelected: setSelectedTab,
        selectedType: selectedTab
      }) : 
      div({
        className: 'text-placeholder',
        style: {
          width: '15%',
          height: '1.8rem',
          marginRight: '2rem'
        }
      })
  );
};

export default function TabControl(props) {
  const {labels, selectedTab, setSelectedTab, isLoading = false} = props;
  return (
    div({
      style: {display: 'flex', backgroundColor: 'white', border: '0px'},
      className: 'tab-list',
    }, [
      tabTemplates(labels, selectedTab, setSelectedTab, isLoading)
    ])
  );
}
