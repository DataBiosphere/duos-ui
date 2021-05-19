import { useState, useEffect, useCallback } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { LibraryCard } from '../libs/ajax';
import SearchBar from '../components/SearchBar';
import { Notifications } from '../libs/utils';
import { Styles } from '../libs/theme';
import { updateLists as updateListsInit } from '../libs/utils';
import lockIcon from '../images/lock-icon.png';

export default function AdminManageLC() {
  //NOTE: assume user details are attached to LC req
  const [libraryCards, setLibraryCards] = useState();
  const [tableSize, setTableSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredCards, setFilteredList] = useState();

  useEffect(() => {
    const init = async() => {
      setIsLoading(true);
      try{
        const cards = await LibraryCard.getAllLibraryCards();
        setLibraryCards(cards);
        setFilteredList(cards);
        setIsLoading(false);
      } catch(error) {
        Notifications.showError({text: 'Error: unable to retrieve library cards from server'});
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const getUpdateLists = useCallback(() => {
    return updateListsInit(filteredCards, setFilteredList, libraryCards, setLibraryCards, currentPage, tableSize);
  }, [filteredCards, libraryCards, currentPage, tableSize]);

  const handleSearchChange = 
}