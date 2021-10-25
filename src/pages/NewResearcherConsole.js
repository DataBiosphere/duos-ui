import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { div, h, img } from 'react-hyperscript-helpers';
import { cloneDeep, map } from 'lodash/fp';
import TabControl from '../components/TabControl';
import { Styles } from '../libs/theme';
import { Collections, DAR } from '../libs/ajax';
import DarCollectionTable from '../components/dar_collection_table/DarCollectionTable';
import accessIcon from '../images/icon_access.png';
import { Notifications, searchOnFilteredList, getSearchFilterFunctions } from '../libs/utils';
import SearchBar from '../components/SearchBar';
import { isEmpty } from 'lodash';

export default function NewResearcherConsole(props) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('DAR Collections');
  const [researcherCollections, setResearcherCollections] = useState([]);
  const [researcherDrafts, setResearcherDrafts] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const searchRef = useRef('');

  const { history } = props;

  const tabNames = {
    darCollections: 'DAR Collections',
    darDrafts: 'DAR Drafts'
  };

  const dataStructs = useMemo(() => ({
    [tabNames.darCollections]: {
      filterFn: getSearchFilterFunctions().darCollections,
      data: researcherCollections
    },
    [tabNames.darDrafts]: {
      filterFn: getSearchFilterFunctions().darDrafts,
      data: researcherDrafts
    }
  }), [researcherCollections, researcherDrafts, tabNames.darCollections, tabNames.darDrafts]);

  const handlePromise = (promise, setValue, errorMsg, newError) => {
    if(promise.status === 'rejected') {
      errorMsg += newError;
    } else {
      setValue(promise.value);
    }
  };

  // const collectionFilterFn = getSearchFilterFunctions().darCollections;
  // const draftFilterFn = getSearchFilterFunctions().darDrafts; //NOTE: create function

  const handleSearchChange = useCallback(() => searchOnFilteredList(
    searchRef.current.value,
    dataStructs[selectedTab].data,
    dataStructs[selectedTab].filterFn,
    setFilteredList
  ), [selectedTab, dataStructs]);

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
      let errorMsg = '';
      const promiseReturns = await Promise.allSettled([
        Collections.getCollectionsForResearcher(),
        DAR.getDraftDarRequestList()
      ]);
      const [fetchedCollections, fetchedDrafts] = promiseReturns;
      handlePromise(
        fetchedCollections,
        setResearcherCollections,
        errorMsg,
        'Failed to fetch DAR Collection "\n"'
      );
      handlePromise(
        fetchedDrafts,
        setResearcherDrafts,
        errorMsg,
        'Failed to fetch DAR Drafts'
      );
      if(!isEmpty(errorMsg)) {
        Notifications.showError({text: errorMsg});
      }
      setFilteredList(fetchedCollections);
    };
    init();
  }, []);

  useEffect(() => {
    searchRef.current.value = '';
    setIsLoading(true);
    setFilteredList(dataStructs[selectedTab].data);
  }, [selectedTab, dataStructs]);

  useEffect(() => {
    if(!isEmpty(filteredList)) {
      setIsLoading(false);
    }
  }, [filteredList]);

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
        isRendered: selectedTab === tabNames.darCollections && !isLoading,
        collections: filteredList,
        isLoading,
        cancelCollection,
      }),
    ]),
  ]);
}