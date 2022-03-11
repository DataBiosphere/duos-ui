import {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import SearchBar from '../components/SearchBar';
import { Collections } from '../libs/ajax';
import { Notifications, searchOnFilteredList, getSearchFilterFunctions } from '../libs/utils';
import { findIndex, cloneDeep } from 'lodash/fp';

export default function AdminManageDarCollections(props) {
  const [collections, setCollections] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [tableSize, setTableSize] = useState(10);
  const [descendantOrder, setDescendantOrder] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const searchTerms = useRef('');
  const [cancelModalEnabled, setCancelModalEnabled] = useState(false);
  const filterFn = getSearchFilterFunctions().darCollections;

  const handleSearchChange = useCallback(() => searchOnFilteredList(
    searchTerms.current.value,
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
      const updatedFilteredList = filterFn(searchTerms.current.value, collectionsCopy);
      setCollections(collectionsCopy);
      setFilteredList(updatedFilteredList);
    }
  };

  const showCancelModal = () => {
    setCancelModalEnabled(true);
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
}