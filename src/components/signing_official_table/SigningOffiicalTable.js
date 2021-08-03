import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { Styles, Theme } from "../../libs/theme";
import { h, div, button } from "react-hyperscript-helpers";
import { cloneDeep, findIndex, join, map, sortedUniq, sortBy, isEmpty, isNil, flow } from "lodash/fp";
import SimpleTable from "../SimpleTable";
import SimpleButton from "../SimpleButton";
import PaginationBar from "../PaginationBar";
import {
  Notifications,
  tableSearchHandler,
  recalculateVisibleTable,
  getSearchFilterFunctions,
  searchOnFilteredList
} from "../../libs/utils";
import LibraryCardFormModal from "../modals/LibraryCardFormModal";
import ConfirmationModal from "../modals/ConfirmationModal";
import { LibraryCard } from "../../libs/ajax";

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

const DeactivateLibraryCardButton = (props) => {
  const {card = {}, showConfirmationModal} = props;
  const message = 'Are you sure you want to deactivate this library card?';
  const title = 'Deactivate Library Card';
  return h(SimpleButton, {
    keyProp: `deactivate-card-${card.id}`,
    label: 'Deactivate',
    baseColor: Theme.palette.error,
    additionalStyle: {
      width: '30%',
      padding: '2%',
      fontSize: '1.45rem'
    },
    onClick: () => showConfirmationModal({card, message, title, confirmType: 'delete'})
  });
};

const IssueLibraryCardButton = (props) => {
  //SO should be able to add library cards to users that are not yet in the system, so userEmail needs to be a possible value to send back
  //username can be confirmed on back-end -> if userId exists pull data from db, otherwise only save email
  //institution id should be determined from the logged in SO account on the back-end
  const {card, showConfirmationModal} = props;
  const message = 'Are you sure you want to issue this library card?';
  const title = 'Issue Library Card';
  return h(SimpleButton, {
    keyProp: `issue-card-${card.userEmail}`,
    label: 'Issue',
    baseColor: Theme.palette.secondary,
    additionalStyle: {
      width: '30%',
      padding: '2%',
      fontSize: '1.45rem',
    },
    onClick: () => showConfirmationModal({ card, message, title, confirmType: 'issue' }),
  });
};

const researcherFilterFunction = getSearchFilterFunctions().signingOfficialResearchers;

const LibraryCardCell = ({
  researcher,
  showConfirmationModal,
  institutionId
}) => {
  const id = researcher.dacUserId || researcher.email;
  const card = !isEmpty(researcher.libraryCards)
    ? researcher.libraryCards[0]
    : null;
  const button = !isNil(card)
    ? DeactivateLibraryCardButton({
      card,
      showConfirmationModal,
    })
    : IssueLibraryCardButton({
      card: {
        userId: researcher.dacUserId,
        userEmail: researcher.email,
        institutionId: institutionId
      },
      showConfirmationModal
    });

  return {
    isComponent: true,
    id,
    style: {}, //need to figure out a base style
    label: 'lc-button',
    data: div(
      {
        style: {
          display: 'flex',
          justifyContent: 'left',
        },
        key: `lc-action-cell-${id}`,
      },
      [button]
    ),
  };
};

const roleCell = (roles, id) => {

  const roleString = flow(
    map((role) => role.name),
    sortBy((name) => name),
    sortedUniq,
    join(', ')
  )(roles);

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

export default function SigningOfficialTable(props) {
  const [researchers, setResearchers] = useState(props.researchers || []);
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
  const [confirmType, setConfirmType] = useState('delete');

  const { signingOfficial } = props;

  const showConfirmationModal = ({card, message, title, confirmType}) => {
    setSelectedCard(card);
    setShowConfirmation(true);
    setConfirmationModalMsg(message);
    setConfirmationTitle(title);
    setConfirmType(confirmType);
  };

  //init hook, need to make ajax calls here
  useEffect(() => {
    const init = async() => {
      try{
        setIsLoading(true);
        setResearchers(props.researchers);
        setIsLoading(false);
      } catch(error) {
        Notifications.showError({text: 'Failed to initialize researcher table'});
      }
    };
    init();
  }, [props.researchers]);

  useEffect(() => {
    searchOnFilteredList(
      searchRef.current.value, researchers,
      researcherFilterFunction, setFilteredResearchers
    );
  }, [researchers]);

  useEffect(() => {
    setIsLoading(true);
    recalculateVisibleTable({
      tableSize, pageCount,
      filteredList: filteredResearchers,
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleResearchers
    });
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
      const {email, displayName, count = 0, roles} = researcher;
      const id = researcher.dacUserId;
      return [
        displayNameCell(displayName, id),
        emailCell(email, id),
        LibraryCardCell({
          researcher,
          showConfirmationModal,
          issueFn: issueLibraryCard,
          deleteFn: deactivateLibraryCard,
          institutionId: signingOfficial.institutionId
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
    setSelectedCard({institutionId: signingOfficial.institutionId});
    setShowModal(true);
  };

  //NOTE: make sure callback methods works as expected
  const issueLibraryCard = async (selectedCard, researchers) => {
    const { userId } = selectedCard;
    let { userEmail, userName } = selectedCard;
    let messageName;
    try {
      const listCopy = cloneDeep(researchers);
      //NOTE: institution_id and userName can be supplied by the back-end
      const newLibraryCard = await LibraryCard.createLibraryCard({
        userEmail,
        userId,
      });
      userName = newLibraryCard.userName;
      userEmail = newLibraryCard.userEmail;
      const targetIndex = findIndex((researcher) => userId === researcher.dacUserId)(listCopy);
      //library cards array should only have one card MAX (officials should not be able to see cards from other institutions)
      if(targetIndex === -1) { //if card is not found, push new user to end of list
        listCopy.push({userEmail, libraryCards: [newLibraryCard], roles: []});
        messageName = userEmail;
      } else {
        listCopy[targetIndex].libraryCards = [newLibraryCard];
        messageName = userName;
      }
      setResearchers(listCopy);
      setShowConfirmation(false);
      Notifications.showSuccess({text: `Issued new library card to ${messageName}`});
    } catch(error) {
      Notifications.showError({text: `Error issuing library card to ${messageName}`});
    }
  };

  //NOTE: other callback method, make sure it works as expected
  const deactivateLibraryCard = async (selectedCard, researchers) => {
    const {id, userName, userEmail, userId} = selectedCard;
    const listCopy = cloneDeep(researchers);
    const messageName = userName || userEmail;
    try {
      await LibraryCard.deleteLibraryCard(id);
      const targetIndex = findIndex((researcher) => userId === researcher.dacUserId)(researchers);
      listCopy[targetIndex].libraryCards = [];
      setResearchers(listCopy);
      setShowConfirmation(false);
      Notifications.showSuccess({text: `Removed library card issued to ${messageName}`});
    } catch(error) {
      Notifications.showError({text: `Error deleting library card issued to ${messageName}`});
    }
  };

  return h(Fragment, {}, [
    h(SimpleTable, {
      isLoading,
      rowData: processResearcherRowData(visibleResearchers),
      columnHeaders: columnHeaderData,
      styles,
      tableSize,
      paginationBar,
    }),
    div({ style: { marginLeft: '90%' } }, [
      h(SimpleButton, {
        onClick: () => showModalOnClick(),
        baseColor: Theme.palette.secondary,
        label: 'Add New Researcher',
      }),
    ]),
    h(LibraryCardFormModal, {
      showModal,
      createOnClick: issueLibraryCard,
      closeModal: () => setShowModal(false),
      card: selectedCard,
      users: props.researchers,
      institutions: [], //pass in empty array to force modal to hide institution dropdown
      modalType: 'add',
    }),
    h(ConfirmationModal, {
      showConfirmation,
      closeConfirmation: () => setShowConfirmation(false),
      title: confirmationTitle,
      message: confirmationModalMsg,
      header: `${selectedCard.userName || selectedCard.userEmail} - ${
        !isNil(selectedCard.institution) ? selectedCard.institution.name : ''
      }`,
      onConfirm: () => confirmType == 'delete' ? deactivateLibraryCard(selectedCard, researchers) : issueLibraryCard(selectedCard, researchers)
    }),
  ]);
}