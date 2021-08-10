import {useState} from "react";
import {useEffect} from "react";
import {Notifications} from "../libs/utils";
import {div, a, h} from "react-hyperscript-helpers";
import {Styles} from "../libs/theme";
import SigningOfficialTable from "../components/signing_official_table/SigningOffiicalTable";
import DarTableSkeletonLoader from "../components/TableSkeletonLoader";
import {tableHeaderTemplate} from "../components/dar_table/DarTable";
import {tableRowLoadingTemplate} from "../components/dar_table/DarTable";
import {User} from "../libs/ajax";
import {img} from "react-hyperscript-helpers";
import lockIcon from "../images/lock-icon.png";
import SearchBar from "../components/SearchBar";
import {darSearchHandler} from "../libs/utils";
import { USER_ROLES } from "../libs/utils";

export default function SigningOfficialConsole() {
  const [signingOfficial, setSiginingOfficial] = useState({});
  const [researchers, setResearchers] = useState([]);
  //states to be added and used for the manage dar component
  const [darList,] = useState();
  const [setFilteredDarList] = useState();
  const [setCurrentDarPage] = useState();
  const [unregisteredResearchers, setUnregisteredResearchers] = useState();
  //states to be added and used for manage researcher component
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async() => {
      try {
        setIsLoading(true);
        const soUser = await User.getMe();
        const researcherList = await User.list(USER_ROLES.signingOfficial);
        const unregisteredResearchers = await User.getUnassignedUsers();
        setUnregisteredResearchers(unregisteredResearchers);
        setResearchers(researcherList);
        setSiginingOfficial(soUser);
        setIsLoading(false);
      } catch(error) {
        Notifications.showError({text: 'Error: Unable to retrieve current user from server'});
        setIsLoading(false);
      }
    };
    init();
  }, []);

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
      h(SigningOfficialTable, {researchers, signingOfficial, unregisteredResearchers}, []),
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
      //dar table goes here
      h(DarTableSkeletonLoader, {isRendered: isLoading, tableHeaderTemplate, tableRowLoadingTemplate})
    ])
  );
}