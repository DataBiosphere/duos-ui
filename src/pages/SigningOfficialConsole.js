import {useState, useEffect, useCallback} from "react";
import {Notifications} from "../libs/utils";
import {div, a, h, img} from "react-hyperscript-helpers";
import {Styles} from "../libs/theme";
import SigningOfficialTable from "../components/signing_official_table/SigningOfficialTable";
import DarTableSkeletonLoader from "../components/TableSkeletonLoader";
import {tableHeaderTemplate, tableRowLoadingTemplate} from "../components/dar_table/DarTable";
import DarTable from "../components/dar_table/DarTable";
import lockIcon from "../images/lock-icon.png";
import SearchBar from "../components/SearchBar";
import {darSearchHandler, processElectionStatus, getElectionDate, updateLists as updateListsInit} from "../libs/utils";
import {User, DAR} from "../libs/ajax";
import {consoleTypes} from "../components/dar_table/DarTableActions";
import { USER_ROLES } from "../libs/utils";

export default function SigningOfficialConsole(props) {
  const [signingOfficial, setSiginingOfficial] = useState({});
  const [researchers, setResearchers] = useState([]);
  const [unregisteredResearchers, setUnregisteredResearchers] = useState();
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
        const soUser = await User.getMe();
        const soPromises = await Promise.all([
          User.list(USER_ROLES.signingOfficial),
          User.getUnassignedUsers(),
          DAR.getDataAccessManageV2()
        ]);
        const researcherList = soPromises[0];
        const unregisteredResearchers = soPromises[1];
        const darList = soPromises[2];
        setUnregisteredResearchers(unregisteredResearchers);
        setResearchers(researcherList);
        setSiginingOfficial(soUser);
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
      div({ isRendered: !isLoading, style: {display: "flex"}}, [
        div({style: {...Styles.HEADER_CONTAINER, paddingTop: "3rem", paddingBottom: "2rem"}}, [
          div({style: Styles.TITLE}, ["Welcome " +signingOfficial.displayName+ "!"]),
          div({style: Object.assign({}, Styles.MEDIUM_DESCRIPTION, {fontSize: '18px'})}, [
            "Your researchers and their submitted Data Access requests are below. ",
            a({
              rel: "noopener noreferrer",
              href: 'https://broad-duos.zendesk.com/hc/en-us/articles/360060402751-Signing-Official-User-Guide',
              target: '_blank',
              id: 'so-console-info-link'},
            ['Click Here for more information'])
          ])
        ])
      ]),
      div({style: {borderTop: '1px solid #BABEC1', height: 0}}, []),
      //researcher table goes here
      h(SigningOfficialTable, {researchers, signingOfficial, unregisteredResearchers, isLoading}, []),
      div({style: {display: 'flex', justifyContent: "space-between"}}, [
        div({className: "left-header-section", style: Styles.LEFT_HEADER_SECTION}, [
          div({style: Styles.ICON_CONTAINER}, [
            img({
              id: 'lock-icon',
              src: lockIcon,
              style: Styles.HEADER_IMG
            })
          ]),
          div({style: Styles.HEADER_CONTAINER}, [
            div({style: {...Styles.SUB_HEADER, marginTop: '0'}}, ["Data Access Requests"]),
            div({style: Object.assign({}, Styles.MEDIUM_DESCRIPTION, {fontSize: '16px'})}, [
              "My Institution's DARs: Records from all current and closed data access requests.",
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