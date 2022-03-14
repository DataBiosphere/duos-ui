import {useState, useEffect, useRef, useCallback } from 'react';
import SearchBar from '../components/SearchBar';
import { Collections } from '../libs/ajax';
import { Notifications, searchOnFilteredList, getSearchFilterFunctions } from '../libs/utils';
import { findIndex, cloneDeep } from 'lodash/fp';
import { Styles } from '../libs/theme';
import {h, div, img} from 'react-hyperscript-helpers';
import lockIcon from '../images/lock-icon.png';
import { DarCollectionTable, DarCollectionTableColumnOptions } from '../components/dar_collection_table/DarCollectionTable';

export default function AdminManageDarCollections() {
  const [collections, setCollections] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchRef = useRef('');
  const filterFn = getSearchFilterFunctions().darCollections;

  const handleSearchChange = useCallback((searchTerms) => searchOnFilteredList(
    searchTerms,
    collections,
    filterFn,
    setFilteredList
  ), [collections, filterFn]);

  useEffect(() => {
    const init = async() => {
      try {
        const collectionsResp = await Collections.getCollectionsByRoleName("Admin");
        setCollections(collectionsResp);
        setFilteredList(collectionsResp);
        setIsLoading(false);
      } catch(error) {
        Notifications.showError({text: 'Error initializing Collections table'});
      }
    };
    init();
  }, []);

  const updateCollections = (updatedCollection) => {
    const targetIndex = findIndex((collection) => {
      collection.darCollectionId = updatedCollection.darCollectionId;
    })(collections);
    if(targetIndex < 0) {
      Notifications.showError({text: 'Error: Could not find target collection'});
    } else {
      const collectionsCopy = cloneDeep(collections);
      collectionsCopy[targetIndex] = updatedCollection;
      const updatedFilteredList = filterFn(searchRef.current.value, collectionsCopy);
      setCollections(collectionsCopy);
      setFilteredList(updatedFilteredList);
    }
  };

  const cancelCollection = async(collectionId) => {
    try {
      const canceledCollection = await Collections.cancelCollection(collectionId);
      updateCollections(canceledCollection);
    } catch(error) {
      Notifications.showError({text: 'Error canceling target collection'});
    }
  };

  const openCollection = async(collectionId) => {
    try {
      const openCollection = await Collections.openCollection(collectionId);
      updateCollections(openCollection);
    } catch(error) {
      Notifications.showError({text: 'Error opening target collection'});
    }
  };

  //NOTE: check to see if the template is formatted correctly
  return div({ style: Styles.PAGE }, [
    div({ style: { display: 'flex', justifyContent: 'space-between' } }, [
      div(
        { className: 'left-header-section', style: Styles.LEFT_HEADER_SECTION },
        [
          div({ style: Styles.ICON_CONTAINER }, [
            img({
              id: 'lock-icon',
              src: lockIcon,
              style: Styles.HEADER_IMG,
            }),
          ]),
          div({ style: Styles.HEADER_CONTAINER }, [
            div({ style: { ...Styles.TITLE} }, [
              'Data Access Request Collections',
            ]),
            div(
              {
                style: Object.assign({}, Styles.MEDIUM_DESCRIPTION, {
                  fontSize: '16px',
                }),
              },
              ['List of all DAR Collections saved in DUOS']
            ),
          ]),
        ]
      ),
      h(SearchBar, { handleSearchChange, searchRef }),
    ]),
    //NOTE: check to see if this works
    h(DarCollectionTable, {
      collections: filteredList,
      columns: [
        DarCollectionTableColumnOptions.DAR_CODE,
        DarCollectionTableColumnOptions.NAME,
        DarCollectionTableColumnOptions.SUBMISSION_DATE,
        DarCollectionTableColumnOptions.PI,
        DarCollectionTableColumnOptions.INSTITUTION,
        DarCollectionTableColumnOptions.DATASET_COUNT,
        DarCollectionTableColumnOptions.STATUS,
        DarCollectionTableColumnOptions.ACTIONS
      ],
      isLoading,
      cancelCollection,
      resubmitCollection: null,
      openCollection,
      consoleType: 'admin'
    }),
  ]);
}