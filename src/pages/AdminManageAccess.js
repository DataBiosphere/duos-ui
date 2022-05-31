import { useState, useEffect, useCallback } from 'react';
import { div, h, img } from 'react-hyperscript-helpers';
import { DAR } from '../libs/ajax';
import SearchBar from '../components/SearchBar';
import { Notifications, getElectionDate, processElectionStatus, darSearchHandler } from '../libs/utils';
import { Styles} from '../libs/theme';
import DarTable from '../components/dar_table/DarTable';
import lockIcon from '../images/lock-icon.png';
import { updateLists as updateListsInit } from '../libs/utils';
import { tableHeaderTemplate, tableRowLoadingTemplate } from '../components/dar_table/DarTable';
import DarTableSkeletonLoader from '../components/TableSkeletonLoader';
import { consoleTypes } from '../components/dar_table/DarTableActions';

export default function AdminManageAccess(props) {
  const [electionList, setElectionList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [tableSize, setTableSize] = useState(10);
  const [descendantOrder, setDescendantOrder] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

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
      }
    };
    init();
  }, []);

  const getUpdateLists = useCallback(() => {
    return updateListsInit(filteredList, setFilteredList, electionList, setElectionList, currentPage, tableSize);
  }, [filteredList, electionList, currentPage, tableSize]);

  //NOTE: may need to change criteria of search due to additional search attributes
  //NOTE: for now I'm using the ChairConsole variant to test the funciton implementation
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
            div({style: Styles.TITLE}, ['Manage Data Access Request']),
            div({style: Object.assign({}, Styles.MEDIUM_DESCRIPTION, {fontSize: '18px'})}, ['Select and manage Data Access Requests for DAC review'])
          ]),
        ]),
        h(SearchBar, {handleSearchChange, currentPage})
      ]),
      h(DarTable, {
        getUpdateLists,
        filteredList,
        setFilteredList,
        descendantOrder,
        setDescendantOrder,
        history: props.history,
        processElectionStatus,
        getElectionDate,
        consoleType: consoleTypes.MANAGE_ACCESS,
        currentPage,
        setCurrentPage,
        tableSize,
        setTableSize,
        isRendered: !isLoading
      }),
      h(DarTableSkeletonLoader, {
        isRendered: isLoading,
        tableHeaderTemplate: tableHeaderTemplate(consoleTypes.MANAGE_ACCESS),
        tableRowLoadingTemplate: tableRowLoadingTemplate(consoleTypes.MANAGE_ACCESS)
      })
    ])
  );
}
