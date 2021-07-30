import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { Styles, Theme } from "../../libs/theme";
import { h, div, button, img } from "react-hyperscript-helpers";
import lockIcon from '../../images/lock-icon.png';
import { cloneDeep, findIndex, concat } from "lodash/fp";
import SimpleTable from "../SimpleTable";
import SimpleButton from "../SimpleButton";
import PaginationBar from "../PaginationBar";
import SearchBar from "../SearchBar";
import {
  Notifications,
  USER_ROLES,
  tableSearchHandler,
  recalculateVisibleTable,
  getSearchFilterFunctions,
  searchOnFilteredList
} from "../../libs/utils";
import LibraryCardFormModal from "../modals/LibraryCardFormModal";
import ConfirmationModal from "../modals/ConfirmationModal";
import { User, LibraryCard } from "../../libs/ajax";
import { isEmpty, isNil } from "lodash";

//Styles specific to this table
const styles = {
  baseStyle: {
    fontFamily: 'Arial',
    fontSize: '14px',
    fontWeight: 400,
    display: 'flex',
    padding: '1rem 2%',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  columnStyle: Object.assign({}, Styles.TABLE.HEADER_ROW, {
    justifyContent: 'space-between',
  }),
  cellWidths: {
    email: '25%',
    name: '20%',
    libraryCard: '25%',
    role: '20%',
    // activeDARs: '10%'
  },
};

//column header format for table
const columnHeaderFormat = {
  email: {label: 'Email', cellStyle: {width: styles.cellWidths.email}},
  name: {label: 'Name', cellStyle: {width: styles.cellWidths.name}},
  libraryCard: {label: 'Library Card', cellStyle: {width: styles.cellWidths.libraryCard}},
  role: {label: 'Role', cellStyle: {width: styles.cellWidths.libraryCard}},
  // activeDARs: {label: 'Active DARs', cellStyle: {width: styles.cellWidths.activeDARs}}
};

const showConfirmationModal = (setShowConfirmation, card, setSelectedCard, setConfirmationModalMsg, message, setConfirmationTitle, title) => {
  setSelectedCard(card);
  setShowConfirmation(true);
  setConfirmationModalMsg(message);
  setConfirmationTitle(title);
};

const DeactivateLibraryCardButton = (props) => {
  const {setShowConfirmation, card = {}, setSelectedCard, setConfirmationModalMsg, setConfirmationTitle} = props;
  const message = 'Are you sure you want to deactivate this library card?';
  const title = 'Deactivate Library Card';
  return button({
    key: `deactivate-card-${card.id}`,
    role: 'button',
    style: {}, //figure this out},
    onClick: () => showConfirmationModal(
      setShowConfirmation,
      card, setSelectedCard,
      setConfirmationModalMsg, message,
      setConfirmationTitle, title)
  }, ['Deactivate']);
};

const IssueLibraryCardButton = (props) => {
  //SO should be able to add library cards to users that are not yet in the system, so userEmail needs to be a possible value to send back
  //username can be confirmed on back-end -> if userId exists pull data from db, otherwise only save email
  //institution id should be determined from the logged in SO account on the back-end
  const {setShowConfirmation, card, setSelectedCard, setConfirmationModalMsg, setConfirmationTitle} = props;
  const message = 'Are you sure you want to issue this library card?';
  const title = 'Issue Library Card';
  return button({
    role: 'button',
    style: {},
    onClick: () => showConfirmationModal(
      setShowConfirmation,
      card, setSelectedCard,
      setConfirmationModalMsg, message,
      setConfirmationTitle, title
    )
  }, ['Issue']);
};

const researcherFilterFunction = getSearchFilterFunctions().signingOfficialResearchers;

const LibraryCardCell = (props) => {
  const {setShowConfirmation, card, setSelectedCard, researcher, setConfirmationModalMsg, setConfirmationTitle = {}} = props;
  const id = researcher.dacUserId || researcher.email;

  const button = !isNil(card) ? DeactivateLibraryCardButton({
    setShowConfirmation,
    card,
    setSelectedCard,
    setConfirmationModalMsg,
    setConfirmationTitle
  }) : IssueLibraryCardButton({
    showConfirmationModal,
    setConfirmationModalMsg,
    setConfirmationTitle,
    setSelectedCard,
    card: {
      userId: researcher.dacUserId,
      userEmail: researcher.email
    }
  });

  return {
    isComponent: true,
    id,
    style: {}, //need to figure out a base style
    label: 'lc-button',
    data: div({
      style: {
        display: 'flex',
        justifyContent: 'left'
      },
      key: `lc-action-cell-${id}`
    }, [button])
  };
};

const roleCell = (roles, id) => {
  const roleNames = roles.map(role => role.name);
  const roleString = concat(roleNames);
  return {
    data: roleString || '- -',
    id,
    style: {},
    label: 'user-role'
  };
};

const emailCell = (email, id) => {
  return {
    data: email || '- -',
    id,
    style: {},
    label: 'user-email'
  };
};

const displayNameCell = (displayName, id) => {
  return {
    data: displayName || '- -',
    id,
    style: {},
    label: 'display-name'
  };
};

// const activeDarCountCell = (count, id) => {
//   return {
//     data: count || 0,
//     id,
//     style: {},
//     label: 'active-dar-count'
//   };
// };

export default function SigningOfficialTable() {
  const [researchers, setResearchers] = useState([]);
  const [tableSize, setTableSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [filteredResearchers, setFilteredResearchers] = useState([]);
  const [visibleResearchers, setVisibleResearchers] = useState([]);
  // const [signingOfficial, setSigningOfficial] = useState({});
  const [selectedCard, setSelectedCard] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const searchRef = useRef('');
  const [isLoading, setIsLoading] = useState(true);
  const [confirmationModalMsg, setConfirmationModalMsg] = useState('');
  const [confirmationTitle, setConfirmationTitle] = useState('');

  //init hook, need to make ajax calls here
  useEffect(() => {
    const init = async() => {
      try{
        setIsLoading(true);
        const researchers = await User.list(USER_ROLES.signingOfficial);
        setResearchers(researchers);
        setIsLoading(false);
      } catch(error) {
        Notifications.showError({text: 'Failed to initialize researcher table'});
      }
    };
    init();
  }, []);

  useEffect(() => {
    searchOnFilteredList(
      searchRef.current.value, researchers,
      researcherFilterFunction, setFilteredResearchers
    );
  }, [researchers]);

  useEffect(() => {
    setIsLoading(true);
    recalculateVisibleTable(
      tableSize, pageCount, filteredResearchers, currentPage,
      setPageCount, setCurrentPage, setVisibleResearchers
    );
    setIsLoading(false);
  }, [tableSize, pageCount, filteredResearchers, currentPage]);

  const goToPage = useCallback((value) => {
    if (value >= 1 && value <= pageCount) {
      setCurrentPage(value);
    }
  }, [pageCount]);

  const changeTableSize = useCallback((value) => {
    if (value > 0 && !isNaN(parseInt(value))) {
      setTableSize(value);
    }
  }, []);

  const paginationBar = h(PaginationBar, {
    pageCount,
    currentPage,
    tableSize,
    goToPage,
    changeTableSize
  });

  const processResearcherRowData = (researchers = []) => {
    return researchers.map(researcher => {
      const {email, displayName, count = 0, roles, libraryCards} = researcher;
      const id = researcher.dacUserId;
      return [
        emailCell(email, id),
        displayNameCell(displayName, id),
        h(LibraryCardCell, {
          setShowConfirmation,
          card: !isEmpty(libraryCards) ? libraryCards[0] : null,
          researcher,
          setSelectedCard,
          setConfirmationModalMsg,
          setConfirmationTitle
        }),
        roleCell(roles, id),
        // activeDarCountCell(count, id)
      ];
    });
  };

  const columnHeaderData = [
    columnHeaderFormat.name,
    columnHeaderFormat.email,
    columnHeaderFormat.libraryCard,
    columnHeaderFormat.role,
    // columnHeaderFormat.activeDARs -> add this back in when back-end supports this
  ];

  //Search function for SearchBar component, function defined in utils
  const handleSearchChange = tableSearchHandler(
    researchers,
    setFilteredResearchers,
    setCurrentPage,
    'signingOfficialResearchers'
  );

  const showModalOnClick = () => {
    setShowModal(true);
  };

  //NOTE: make sure callback methods works as expected
  const issueLibraryCard = useCallback(async (card) => {
    const { userId } = card;
    let { email, displayName } = card;
    let messageName;
    try {
      const listCopy = cloneDeep(researchers);
      //NOTE: institution_id and userName can be supplied by the back-end
      const newLibraryCard = await LibraryCard.createLibraryCard({
        userEmail: email,
        userId
      });
      displayName = newLibraryCard.displayName;
      email = newLibraryCard.email;

      const targetIndex = findIndex((researcher) => card.userId === researcher.dacUserId)(listCopy);
      //library cards array should only have one card MAX (officials should not be able to see cards from other institutions)
      if(targetIndex === -1) { //if card is not found, push new card to end of list
        listCopy.push({email, libraryCards: [newLibraryCard]});
        messageName = email;
      } else {
        listCopy[targetIndex].libraryCards = [newLibraryCard];
        messageName = displayName;
      }
      setResearchers(listCopy);
      Notifications.showSuccess({text: `Issued new library card to ${messageName}`});
    } catch(error) {
      Notifications.showError({text: `Error issuing library card to ${messageName}`});
    }
  }, [researchers]);

  //NOTE: other callback method, make sure it works as expected
  const deactivateLibraryCard = useCallback(async ({id, displayName, email, dacUserId}) => {
    const listCopy = cloneDeep(researchers);
    const messageName = displayName || email;
    try {
      await LibraryCard.deleteLibraryCard(id);
      const targetIndex = findIndex((researcher) => dacUserId === researcher.dacUserId)(researchers);
      listCopy[targetIndex].libraryCards = [];
      setResearchers(listCopy);
      Notifications.showSuccess({text: `Removed library card issued to ${messageName}`});
    } catch(error) {
      Notifications.showError({text: `Error deleting library card issued to ${messageName}`});
    }
  }, [researchers]);

  return (
    h(Fragment, {}, [
      h(SimpleTable, {
        isLoading,
        rowData: processResearcherRowData(visibleResearchers),
        columnHeaders: columnHeaderData,
        styles,
        tableSize,
        paginationBar
      }),
      div({ style: {marginLeft: '90%'}}, [
        h(SimpleButton, {
          onClick: () => showModalOnClick(),
          baseColor: Theme.palette.secondary,
          label: 'Add New Researcher'
        })
      ]),
      h(LibraryCardFormModal, {
        showModal,
        createOnClick: issueLibraryCard,
        closeModal: () => setShowModal(false),
        card: selectedCard,
        institutions: [], //pass in empty array to force modal to hide institution dropdown
        modalType: 'add'
      }),
      h(ConfirmationModal, {
        showConfirmation,
        closeConfirmation: () => setShowConfirmation(false),
        title: confirmationTitle,
        message: confirmationModalMsg,
        header: `${selectedCard.userName || selectedCard.userEmail} - ${!isNil(selectedCard.institution) ? selectedCard.institution.name : ''}`,
        onConfirm: () => deactivateLibraryCard(selectedCard)
      })
    ])
  );
}