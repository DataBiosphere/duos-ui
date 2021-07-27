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
  searchOnFilteredList,
  goToPage,
  changeTableSize
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
    activeDARs: '10%'
  },
};

//column header format for table
const columnHeaderFormat = {
  email: {label: 'Email', cellStyle: {width: styles.cellWidths.email}},
  name: {label: 'Name', cellStyle: {width: styles.cellWidths.name}},
  libraryCard: {label: 'Library Card', cellStyle: {width: styles.cellWidths.libraryCard}},
  role: {label: 'Role', cellStyle: {width: styles.cellWidths.libraryCard}},
  activeDARs: {label: 'Active DARs', cellStyle: {width: styles.cellWidths.activeDARs}}
};


//NOTE: confirmation modal needs to have a card (or the data needed to generate a card) ready
//For deletion it's a matter of pulling the card
//For issuing a new card, it's a matter of creating a new card on the modal
const showConfirmationModal = (setShowConfirmation, card, setSelectedCard) => {
  setSelectedCard(card);
  setShowConfirmation(true);
};

const DeactivateLibraryCardButton = (props) => {
  const {setShowConfirmation, card, setSelectedCard} = props;
  return button({
    role: 'button',
    style: {}, //figure this out},
    onClick: () => showConfirmationModal(setShowConfirmation, card, setSelectedCard)
  }, ['Deactivate']);
};

const IssueLibraryCardButton = (props) => {
  //SO should be able to add library cards to users that are not yet in the system, so userEmail needs to be a possible value to send back
  //username can be confirmed on back-end -> if userId exists pull data from db, otherwise only save email
  //institution id should be determined from the logged in SO account on the back-end
  const {setShowConfirmation, card, setSelectedCard} = props;
  return button({
    role: 'button',
    style: {},
    onClick: () => showConfirmationModal(setShowConfirmation, card, setSelectedCard)
  }, ['Issue']);
};

const researcherFilterFunction = getSearchFilterFunctions().signingOfficialResearchers;

const LibraryCardCell = (props) => {
  const {setShowConfirmation, card, setSelectedCard} = props;
  const {userId} = card;

  const button = !isNil(card) ? DeactivateLibraryCardButton({
    setShowConfirmation,
    card,
    setSelectedCard
  }) : IssueLibraryCardButton({
    showConfirmationModal,
    setSelectedCard,
    card: isEmpty(card) ? {} : card
  });

  return {
    isComponent: true,
    id: userId,
    style: {},//figure it out,
    label: 'lc-button',
    data: div({
      style: {
        display: 'flex',
        justifyContent: 'left'
      },
      key: `lc-action-cell-${userId}`
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

const activeDarCountCell = (count, id) => {
  return {
    data: count || 0,
    id,
    style: {},
    label: 'active-dar-count'
  };
};

export default function SigningOfficialTable(props) {
  const [researchers, setResearchers] = useState([]);
  const [tableSize, setTableSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [filteredResearchers, setFilteredResearchers] = useState([]);
  const [visibleResearchers, setVisibleResearchers] = useState([]);
  const [signingOfficial, setSigningOfficial] = useState({});
  const [newCard, setNewCard] = useState({});
  const [selectedCard, setSelectedCard] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const searchRef = useRef('');
  const [isLoading, setIsLoading] = useState(true);

  //NOTE: for now mock out ajax calls so I can develop the console.
  //The back-end code needs to be updated in a separate PR

  useEffect(() => {
    searchOnFilteredList(
      searchRef.current.value, researchers,
      researcherFilterFunction, setFilteredResearchers
    );
  }, [props.researchers, researchers]);

  useEffect(() => {
    setIsLoading(true);
    recalculateVisibleTable(
      tableSize, pageCount, filteredResearchers, currentPage,
      setPageCount, setCurrentPage, setVisibleResearchers
    );
    setIsLoading(false);
  }, [tableSize, pageCount, filteredResearchers, currentPage]);

  const paginationBar = h(PaginationBar, {
    pageCount,
    currentPage,
    tableSize,
    goToPage,
    changeTableSize
  });

  const processResearcherRowData = (researchers = []) => {
    return researchers.map(researcher => {
      const {id, email, displayName, count = 0, roles, libraryCards} = researcher;
      return [
        emailCell(email, id),
        displayNameCell(displayName, id),
        h(LibraryCardCell, {
          setShowConfirmation,
          card: isEmpty(libraryCards) ? {} : libraryCards[0],
          setSelectedCard
        }),
        roleCell(roles, id),
        activeDarCountCell(count, id)
      ];
    });
  };

  const columnHeaderData = [
    columnHeaderFormat.name,
    columnHeaderFormat.email,
    columnHeaderFormat.libraryCard,
    columnHeaderFormat.role,
    columnHeaderFormat.activeDARs
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

  //rewrite this, modal is sending back the card, work with that instead
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

      const targetIndex = findIndex((researcher) => card.userId === researcher.userId)(listCopy);
      //library cards array should only have one card MAX, SO should not be able to see LCs from other institutions
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

  const deactivateLibraryCard = useCallback(async ({id, displayName, email, dacUserId}) => {
    const listCopy = cloneDeep(researchers);
    try {
      await LibraryCard.deleteLibraryCard(id);
      const targetIndex = findIndex((researcher) => dacUserId === researcher.dacUserId)(researchers);
      listCopy[targetIndex].libraryCards = [];
      setResearchers(listCopy);
      Notifications.showSuccess({text: `Removed library card issued to ${displayName}`});
    } catch(error) {
      Notifications.showError({text: `Error deleting library card issued to ${displayName}`});
    }
  }, [researchers]);

  return (
    h(Fragment, {}, [
      div({style: {display: 'flex', justifyContent: 'space-between'}}, [
        div(
          {className: 'left-header-section', style: Styles.LEFT_HEADER_SECTION},
          [
            div({style: Styles.ICON_CONTAINER}, [
              img({
                id: 'lock-icon',
                src: lockIcon,
                style: Styles.HEADER_IMG
              }),
            ]),
            div({ style: Styles.HEADER_CONTAINER}, [
              div({ style: Styles.TITLE}, ['Manage Researchers']),
              div(
                {style: Object.assign({}, Styles.MEDIUM_DESCRIPTION, {fontSize: '18px'})},
                ["Manage your institution's researchers"]
              )
            ])
          ]
        ),
        h(SearchBar, {handleSearchChange, searchRef}),
      ]),
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
      //NOTE: need to update LibraryCardFormModal
      //SO cannot pick an institution outside of their own, need to lock the selection in place
      h(LibraryCardFormModal, {
        showModal,
        createOnClick: issueLibraryCard,
        closeModal: () => setShowModal(false)
      }),
      h(ConfirmationModal, {
        showConfirmation,
        closeConfirmation: () => setShowConfirmation(false),
        title: 'Deactivate Library Card?',
        message: 'Are you sure you want to deactivate this library card?',
        header: `${selectedCard.userName || selectedCard.userEmail} - ${!isNil(selectedCard.institution) ? selectedCard.institution.name : ''}`,
        onConfirm: () => deactivateLibraryCard(selectedCard)
      })
    ])
  );
}