import { useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import TabControl from '../TabControl';
import { Styles } from '../../libs/theme';
import { Collections } from '../../libs/ajax';
import DarCollectionTable from '../common/DARCollectionTable';

export default function NewResearcherConsole() {
  const [selectedTab, setSelectedTab] = useState('DAR Collections');
  const tabNames = ['DAR Collections, DAR Drafts'];
  return (
    div({style: Styles.PAGE}, [
      h(TabControl, {labels: tabNames, setTab: setSelectedTab}),
      //NOTE: need to add additional flexbox formatting here to space out tab control with the search bar
      //also need to define ref here as well as pass ref value down to table
      h(DarCollectionTable, {isRendered: selectedTab, fetchCollections: Collections.getCollectionsForResearcher})
    ])
  );
}