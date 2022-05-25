import { useState, useEffect, useCallback } from 'react';
import { div, h, img } from 'react-hyperscript-helpers';
import { DAR } from '../libs/ajax';
import SearchBar from '../components/SearchBar';
import { Notifications, getElectionDate, processElectionStatus, darSearchHandler } from '../libs/utils';
import { Styles } from '../libs/theme';
import DarTable from '../components/dar_table/DarTable';
import DarTableSkeletonLoader from '../components/TableSkeletonLoader';
import lockIcon from '../images/lock-icon.png';
import { updateLists as updateListsInit } from '../libs/utils';
import { tableHeaderTemplate, tableRowLoadingTemplate } from '../components/dar_table/DarTable';
import { consoleTypes } from '../components/dar_table/DarTableActions';

export default function ChairConsole(props) {
  const [electionList, setElectionList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [tableSize, setTableSize] = useState(10);
  const [descendantOrder, setDescendantOrder] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async() => {
      try {
        setIsLoading(true);
        const pendingList = await DAR.getDataAccessManageV2();
        setElectionList(pendingList);
        setFilteredList(pendingList);
        setIsLoading(false);
      } catch(error) {
        Notifications.showError({text: 'Error: Unable to retrieve data requests from server'});
        setIsLoading(false);
      }
    };
    init();
  }, []);

  //useCallback used here to maintain reference to single function
  //arguments are passed in by target record, function processing is identical regardless of arguments
  //therefore instead of initializing n(upper bound) anonymous functions, it's better to just reference the one function
  //callback array will update the function definition on dependency change
  const getUpdateLists = useCallback(() => {
    return updateListsInit(filteredList, setFilteredList, electionList, setElectionList, currentPage, tableSize);
  }, [filteredList, electionList, currentPage, tableSize]);

  //search function, general strategy is to define search in parent and send to search bar component for onChange execution
  //Dar util function will pass in parent state variables into function scope and return a new function that accepts child component arguments
  const handleSearchChange = darSearchHandler(electionList, setFilteredList, setCurrentPage);

  return (
    div({style: Styles.PAGE}, [
      div({ style: {display: 'flex', justifyContent: 'space-between'}}, [
        div({className: 'left-header-section', style: Styles.LEFT_HEADER_SECTION}, [
          div({style: Styles.ICON_CONTAINER}, [
            img({
              id: 'lock-icon',
              src: lockIcon,
              style: Styles.HEADER_IMG
            })
          ]),
          div({style: Styles.HEADER_CONTAINER}, [
            div({style: Styles.TITLE}, ['DAC Chair Console']),
            div({style: Object.assign({}, Styles.MEDIUM_DESCRIPTION, {fontSize: '18px'})}, ['Select and manage Data Access Requests for DAC review'])
          ]),
        ]),
        h(SearchBar, {handleSearchChange})
      ]),
      h(DarTable, {isRendered: !isLoading, getUpdateLists, filteredList, setFilteredList, descendantOrder, setDescendantOrder, history: props.history, processElectionStatus, getElectionDate, consoleType: consoleTypes.CHAIR, currentPage, setCurrentPage, tableSize, setTableSize}),
      h(DarTableSkeletonLoader, {
        isRendered: isLoading,
        tableHeaderTemplate: tableHeaderTemplate(consoleTypes.CHAIR),
        tableRowLoadingTemplate: tableRowLoadingTemplate(consoleTypes.CHAIR)
      })
    ])
  );
}
