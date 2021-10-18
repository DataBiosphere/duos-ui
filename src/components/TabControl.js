import { div, h } from 'react-hyperscript-helpers';
import SelectableText from './SelectableText';

const tabTemplates = (labels, selectedTab, setSelectedTab) => {
  return labels.map((label) =>
    h(SelectableText, {
      label,
      key: `${label}-button`,
      fontSize: '1.8rem',
      componentType: label,
      setSelected: setSelectedTab,
      selectedType: selectedTab
    })
  );
};

export default function TabControl(props) {
  const {labels, selectedTab, setSelectedTab} = props;
  return (
    div({
      style: {display: 'flex', backgroundColor: 'white', border: '0px'},
      className: 'tab-list'
    }, [
      tabTemplates(labels, selectedTab, setSelectedTab)
    ])
  );
}
