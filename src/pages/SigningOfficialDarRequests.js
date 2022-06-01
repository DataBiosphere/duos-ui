import {useState, useEffect, useCallback} from 'react';
import {Notifications} from '../libs/utils';
import {div, h, img} from 'react-hyperscript-helpers';
import {Styles} from '../libs/theme';
import DarTableSkeletonLoader from '../components/TableSkeletonLoader';
import {tableHeaderTemplate, tableRowLoadingTemplate} from '../components/dar_table/DarTable';
import DarTable from '../components/dar_table/DarTable';
import lockIcon from '../images/lock-icon.png';
import SearchBar from '../components/SearchBar';
import {darSearchHandler, processElectionStatus, getElectionDate, updateLists as updateListsInit} from '../libs/utils';
import {DAR} from '../libs/ajax';
import {consoleTypes} from '../components/dar_table/DarTableActions';
import { USER_ROLES } from '../libs/utils';


export default function SigningOfficialDarRequests(props) {
  //states to be added and used for the manage dar component
  const [darList, setDarList] = useState();
  const [filteredDarList, setFilteredDarList] = useState();
  const [currentDarPage, setCurrentDarPage] = useState(1);
  const [darPageSize, setDarPageSize] = useState(10);
  const [descendantOrderDars, setDescendantOrderDars] = useState(false);

  //states to be added and used for manage researcher component
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async() => {
      try {
        setIsLoading(true);
        const darList = await DAR.getDataAccessManageV2(USER_ROLES.signingOfficial);
        setDarList(darList);
        setFilteredDarList(darList);
        setIsLoading(false);
      } catch(error) {
        Notifications.showError({text: 'Error: Unable to retrieve current user from server'});
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const getUpdateDarLists = useCallback(() => {
    return updateListsInit(filteredDarList, setFilteredDarList, darList, setDarList, currentDarPage, darPageSize);
  }, [filteredDarList, darList, currentDarPage, darPageSize]);


  const handleSearchChangeDars = darSearchHandler(darList, setFilteredDarList, setCurrentDarPage);

  return (
    div({style: Styles.PAGE}, [
      div({style: {display: 'flex', justifyContent: 'space-between'}}, [
        div({className: 'left-header-section', style: Styles.LEFT_HEADER_SECTION}, [
          div({style: Styles.ICON_CONTAINER}, [
            img({
              id: 'lock-icon',
              src: lockIcon,
              style: Styles.HEADER_IMG
            })
          ]),
          div({style: Styles.HEADER_CONTAINER}, [
            div({style: {...Styles.SUB_HEADER, marginTop: '0'}}, ['Data Access Requests']),
            div({style: Object.assign({}, Styles.MEDIUM_DESCRIPTION, {fontSize: '16px'})}, [
              'Your Institution\'s DARs: Records from all current and closed data access requests.',
            ]),
          ])
        ]),
        h(SearchBar, {handleSearchChange: handleSearchChangeDars}),
      ]),
      h(DarTable, {
        getUpdateLists: getUpdateDarLists,
        filteredList: filteredDarList,
        setFilteredList: setFilteredDarList,
        descendentOrder: descendantOrderDars,
        setDescendantOrder: setDescendantOrderDars,
        history: props.history,
        processElectionStatus,
        getElectionDate,
        consoleType: consoleTypes.SIGNING_OFFICIAL,
        currentPage: currentDarPage,
        setCurrentPage: setCurrentDarPage,
        tableSize: darPageSize,
        setTableSize: setDarPageSize,
        isRendered: !isLoading
      }),
      h(DarTableSkeletonLoader, {
        isRendered: isLoading,
        tableHeaderTemplate: tableHeaderTemplate(consoleTypes.SIGNING_OFFICIAL),
        tableRowLoadingTemplate: tableRowLoadingTemplate(consoleTypes.SIGNING_OFFICIAL)
      })
    ])
  );
}