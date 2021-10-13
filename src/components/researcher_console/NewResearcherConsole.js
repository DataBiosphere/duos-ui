import { useState } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import TabControl from '../TabControl';
import { Styles } from '../../libs/theme';
import { Collections } from '../../libs/ajax';
import DARCollectionTable from '../common/DARCollectionTable';

export default function NewResearcherConsole() {
  const [selectedTab, setSelectedTab] = useState('DAR Collections');
  const tabNames = ['DAR Collections, DAR Drafts'];
  return (
    div({style: Styles.PAGE}, [
      h(TabControl, {labels: tabNames, setTab: setSelectedTab}),
      h(DARCollectionTable, {isRendered: selectedTab, fetchCollections: Collections.getCollectionsForResearcher})
    ])
  );
}