import { useState, useEffect, useRef } from 'react';
import { div, h, img } from 'react-hyperscript-helpers';
import { cloneDeep, map } from 'lodash/fp';
import TabControl from '../TabControl';
import { Styles } from '../../libs/theme';
import { Collections } from '../../libs/ajax';
import DarCollectionTable from '../common/DarCollectionTable';
import accessIcon from '../../images/icon_access.png';
import { Notifications, searchOnFilteredList, getSearchFilterFunctions } from '../../libs/utils';
import SearchBar from '../SearchBar';

export default function NewResearcherConsole() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('DAR Collections');
  const [researcherCollections, setResearcherCollections] = useState([]);
  const [filteredResearcherCollections, setFilteredResearcherCollections] = useState([]);
  const searchRef = useRef('');
  const tabNames = {
    darCollections: 'DAR Collections',
    darDrafts: 'DAR Drafts'
  };

  const filterFn = getSearchFilterFunctions().darCollections;
  const handleSearchChange = () => searchOnFilteredList(searchRef.current.value, researcherCollections, filterFn, setFilteredResearcherCollections);

  const cancelCollection = async (darCollectionId) => {
    try {
      const canceledCollection = await Collections.cancelCollection(darCollectionId);
      const targetIndex = researcherCollections.findIndex((collection) =>
        collection.darCollectionId === darCollectionId);
      if (targetIndex < 0) {
        throw new Error("Error: Could not find target collection");
      }
      const clonedCollections = cloneDeep(researcherCollections);
      clonedCollections[targetIndex] = canceledCollection;
      setResearcherCollections(clonedCollections);
    } catch (error) {
      Notifications.showError({
        text: 'Error: Cannot cancel target collection'
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

  useEffect(() => {
    searchOnFilteredList(
      searchRef.current.value,
      researcherCollections,
      filterFn,
      setFilteredResearcherCollections
    );
  }, [researcherCollections, filterFn]);

  return div({ style: Styles.PAGE }, [
    div({ style: { display: 'flex', justifyContent: 'space-between' } }, [
      div({ className: 'left-header-section', style: Styles.LEFT_HEADER_SECTION }, [
        div({ style: Styles.ICON_CONTAINER }, [
          img({
            id: 'access-icon',
            src: accessIcon,
            style: Styles.HEADER_IMG,
          }),
        ]),
        div({ style: Styles.HEADER_CONTAINER }, [
          div({ style: Styles.TITLE }, ['Researcher Console']),
          div(
            {
              style: Object.assign({}, Styles.MEDIUM_DESCRIPTION, {
                fontSize: '18px',
              }),
            },
            [`Select and manage ${selectedTab} below`]
          ),
        ]),
      ]),
    ]),
    div({
      className: 'researcher-console-table-header',
      style: { display: 'flex', justifyContent: 'space-between' },
    },[
      div({ className: 'tab-control', style: Styles.LEFT_HEADER_SECTION }, [
        h(TabControl, {
          labels: map((label) => label)(tabNames),
          selectedTab,
          setSelectedTab,
        }),
      ]),
      h(SearchBar, { handleSearchChange, searchRef })
    ]),
    div({ className: 'table-container' }, [
      h(DarCollectionTable, {
        isRendered: selectedTab === tabNames.darCollections,
        collections: filteredResearcherCollections,
        isLoading,
        cancelCollection,
      }),
    ]),
  ]);
}