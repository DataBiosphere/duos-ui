import {useState} from "react";
import {useEffect} from "react";
import {Notifications} from "../libs/utils";
import {div, a, h} from "react-hyperscript-helpers";
import {Theme, Styles} from "../libs/theme";
import DarTableSkeletonLoader from "../components/TableSkeletonLoader";
import {tableHeaderTemplate} from "../components/dar_table/DarTable";
import {tableRowLoadingTemplate} from "../components/dar_table/DarTable";
import {User} from "../libs/ajax";
import {img} from "react-hyperscript-helpers";
import lockIcon from "../images/lock-icon.png";
import userIcon from "../images/icon_manage_users.png";
import SearchBar from "../components/SearchBar";
import {darSearchHandler} from "../libs/utils";
import {userSearchHandler} from "../libs/utils";
import {assign} from "lodash/fp";
import {span} from "react-hyperscript-helpers";

export default function SigningOfficialConsole(props) {
  const [signingOfficial, setSiginingOfficial] = useState();
  //to be used for the manage dar component
  const [darList, setDarList] = useState();
  const [filteredDarList, setFilteredDarList] = useState();
  const [currentDarPage, setCurrentDarPage] = useState();
  //to be used for manage researcher component
  const [userList, setUserList] = useState();
  const [filteredUserList, setFilteredUserList] = useState();
  const [currentUserPage, setCurrentUserPage] = useState();
  const [isLoading, setIsLoading] = useState(true);

  //could benefit in moving this to utils or a shared component so it can be used for the adminManageUsers page
  const widerColumnStyle = assign(Styles.TABLE.DATASET_CELL, {margin: '1rem 2%'});
  const regWidthColumnStyle = assign(Styles.TABLE.SUBMISSION_DATE_CELL, {margin: '1rem 2%'});
  const userTableHeaderTemplate = [
    div({style: widerColumnStyle, className: 'cell-sort'}, [
      "Name",
      span({ className: 'glyphicon sort-icon glyphicon-sort' })
    ]),
    div({style: widerColumnStyle, className: 'cell-sort'}, [
      "Email",
      span({ className: 'glyphicon sort-icon glyphicon-sort' })
    ]),
    div({style: widerColumnStyle, className: 'cell-sort'}, [
      "Library Card",
      span({ className: 'glyphicon sort-icon glyphicon-sort' })
    ]),
    div({style: regWidthColumnStyle, className: 'cell-sort'}, [
      "Role",
      span({ className: 'glyphicon sort-icon glyphicon-sort' })
    ]),
    div({style: regWidthColumnStyle, className: 'cell-sort'}, [
      "Active DARs",
      span({ className: 'glyphicon sort-icon glyphicon-sort' })
    ])
  ];

  const userTableRowLoadingTemplate = [
    div({style: widerColumnStyle, className: 'text-placeholder'}),
    div({style: widerColumnStyle, className: 'text-placeholder'}),
    div({style: widerColumnStyle, className: 'text-placeholder'}),
    div({style: regWidthColumnStyle, className: 'text-placeholder'}),
    div({style: regWidthColumnStyle, className: 'text-placeholder'})
  ];

  useEffect(() => {
    const init = async() => {
      try {
        setIsLoading(true);
        const soUser = await User.getMe();
        setSiginingOfficial(soUser.displayName);
        setIsLoading(false);
      } catch(error) {
        Notifications.showError({text: 'Error: Unable to retrieve current user from server'});
        //setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleSearchChangeDars = darSearchHandler(darList, setFilteredDarList, setCurrentDarPage);
  const handleSearchChangeUsers = userSearchHandler(userList, setFilteredUserList, setCurrentUserPage);

  return (
    div({style: Styles.PAGE}, [
      div({ isRendered: !isLoading, style: {display: "flex"}}, [
        div({style: {...Styles.HEADER_CONTAINER, paddingTop: "3rem", paddingBottom: "2rem"}}, [
          div({style: Styles.TITLE}, ["Welcome " +signingOfficial+ "!"]),
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
      div({style: {display: 'flex',justifyContent: "space-between"}}, [
        div({ style: Styles.LEFT_HEADER_SECTION}, [
          div({style: Styles.ICON_CONTAINER}, [
            img({
              id: 'user-icon',
              src: userIcon,
              style: Styles.HEADER_IMG
            })
          ]),
          div({style: Styles.HEADER_CONTAINER}, [
            div({style: {...Styles.SUB_HEADER, marginTop: '0'}}, ["Researchers"]),
            div({style: Object.assign({}, Styles.MEDIUM_DESCRIPTION, {fontSize: '16px'})}, [
              "My Institution's Researchers. Issue or Remove Researcher privileges below.",
            ])
          ])
        ]),
        h(SearchBar, {handleSearchChange: handleSearchChangeUsers}),
        a({
          id: 'btn_addUser',
          className: "btn-primary btn-add common-background",
          style: {marginTop: '4.75rem'}
          //onClick: this.addUser
        }, ["Add Researcher(s)"]),
      ]),
      //researcher table goes here
      h(DarTableSkeletonLoader, {isRendered: isLoading, tableHeaderTemplate: userTableHeaderTemplate, tableRowLoadingTemplate: userTableRowLoadingTemplate}),

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