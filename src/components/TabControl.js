import { button, h } from 'react-hyperscript-helpers';
import SelectableText from './SelectableText';

const tabTemplates = (labels, selectedTab, setSelectedTab) => {
  return labels.map((label) =>
    h(SelectableText, {
      label,
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
    button({
      style: {display: 'flex'},
      class: 'tab-list'
    }, [
      tabTemplates(labels, selectedTab, setSelectedTab)
    ])
  );
}
