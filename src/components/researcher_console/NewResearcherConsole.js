import { useState, useEffect, useRef } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { cloneDeep, map } from 'lodash/fp';
import TabControl from '../TabControl';
import { Styles } from '../../libs/theme';
import { Collections } from '../../libs/ajax';
import DarCollectionTable from '../common/DarCollectionTable';
import { Notifications, searchOnFilteredList, getSearchFilterFunctions } from '../../libs/utils';
import SearchBar from '../SearchBar';

export default function NewResearcherConsole() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('DAR Collections');
  const [researcherCollections, setResearcherCollections] = useState([]);
  const [filteredResearcherCollections, setFilteredResearcherCollections] = useState([]);
  const searchRef = useRef('');
  const tabNames = {
    darCollections:'DAR Collections',
    darDrafts: 'DAR Drafts'
  };

  const filterFn = getSearchFilterFunctions().darCollections;
  const handleSearchChange = () => searchOnFilteredList(searchRef.current.value, researcherCollections, filterFn, setFilteredResearcherCollections);

  const cancelCollection = async (collectionId) => {
    try {
      const cancelledCollection = await Collections.cancelCollection(collectionId);
      const targetIndex = researcherCollections.findIndex((collection) => {
        collection.id === collectionId;
      });
      if (targetIndex < 0) {
        throw new Error("Error: Could not find target collection");
      }
      const clonedCollections = cloneDeep(researcherCollections);
      clonedCollections[targetIndex] = cancelledCollection;
      setResearcherCollections(cancelledCollection);
    } catch (error) {
      Notifications.showError({
        text: 'Error: Cannot cancel target election'
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      const fetchedCollections = await Collections.getCollectionsForResearcher();
      setResearcherCollections(fetchedCollections);
      setFilteredResearcherCollections(fetchedCollections);
      setIsLoading(false);
    };
    try {
      init();
    } catch(error) {
      Notifications.showError({text: 'Failed to fetch DAR Collections'});
    }
  }, []);

  return (
    div({ style: Styles.PAGE }, [
      div({ className: 'researcher-console-header', style: { display: 'flex', justifyContent: 'space-between' }}, [
        div({ className: 'tab-control', style: Styles.LEFT_HEADER_SECTION }, [
          h(TabControl, { labels: map(label => label)(tabNames), selectedTab, setSelectedTab })
        ]),
        h(SearchBar, { handleSearchChange, searchRef })
      ]),
      div({ className: 'table-container'}, [
        DarCollectionTable({
          isRendered: tabNames.darCollections,
          collections: filteredResearcherCollections,
          isLoading,
          cancelCollection,
        })
      ])
    ])
  );
}