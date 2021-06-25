import moment from 'moment';
import { useState, useEffect, useRef } from 'react';
import { div, h, img } from 'react-hyperscript-helpers';
import { Notifications, tableSearchHandler, calcTablePageCount, calcVisibleWindow, getSearchFilterFunctions} from '../../libs/utils';
import {isEmpty, isNaN, cloneDeep, findIndex, isEqual, find, isNil } from 'lodash/fp';
import { Styles } from '../../libs/theme';
import PaginationBar from '../PaginationBar';
import SearchBar from '../SearchBar';
import SimpleTable from '../SimpleTable';
import lockIcon from '../../images/lock-icon.png';
import LibraryCardFormModal from '../modals/LibraryCardFormModal';
import { LibraryCard } from '../../libs/ajax';
import ConfirmationModal from '../modals/ConfirmationModal';

const styles = {
  baseStyle: {
    fontFamily: 'Arial',
    fontSize: '14px',
    fontWeight: 400,
    display: 'flex',
    padding: '1rem 2%',
    justifyContent: 'space-between',
  },
  columnStyle: Object.assign({}, Styles.TABLE.HEADER_ROW, {
    justifyContent: 'space-between',
  }),
  cellWidths: {
    researcher: '15%',
    email: '20%',
    institution: '20%',
    eraCommonsId: '15%',
    createDate: '12%',
    actions: "12%"
  },
};

//following cell functions format data for processing within the SimpleTable component
const emailCell = (email, id) => {
  return {
    data: email || '- -',
    style: { width: styles.cellWidths.email },
    id,
    label: 'email',
  };
};

const userNameCell = (userName, onClick, id) => {
  return {
    data: userName || '- -',
    style: { width: styles.cellWidths.researcher },
    id,
    onClick,
    label: 'username',
  };
};

const institutionCell = (institutionName, id) => {
  return {
    data: institutionName || '- -',
    id,
    style: { width: styles.cellWidths.institution },
    label: 'institution',
  };
};

const eraCommonsCell = (eraCommonsId, id) => {
  return {
    data: eraCommonsId || '- -',
    id,
    style: { width: styles.cellWidths.eraCommonsId },
    label: 'era-commons-id',
  };
};

const createDateCell = (createDate, id) => {
  return {
    data: !isNil(createDate) ? moment(createDate).format('YYYY-MM-DD') : '- -',
    id,
    style: { width: styles.cellWidths.createDate },
    label: 'create-date',
  };
};

//Update function name and return if requirements change
const createDeleteCell = (card, setTargetDelete, setShowConfirmation) => {
  return {
    id: card.id,
    style: { width: styles.cellWidths.buttons },
    label: 'action-buttons',
    isComponent: true,
    data: h(DeleteRecordCell, {card, setShowConfirmation, setTargetDelete})
  };
};

const lcFilterFunction = getSearchFilterFunctions().libraryCard;

//column row metadata for SimpleTable
const columnHeaderFormat = {
  email: {label: 'Email', cellStyle: {width: styles.cellWidths.email}},
  researcher: {label: 'Researcher', cellStyle: {width: styles.cellWidths.researcher}},
  institution: {label: 'Institution', cellStyle: {width: styles.cellWidths.institution}},
  eraCommonsId: {label: 'era Commons ID', cellStyle: {width: styles.cellWidths.eraCommonsId}},
  createDate: {label: 'Create Date', cellStyle: {width: styles.cellWidths.createDate}},
  actions: {label: 'Actions', cellStyle: {width: styles.cellWidths.actions}}
};

const deleteOnClick = (targetDelete, libraryCards, setLibraryCards, setShowConfirmation) => {
  try {
    const id = targetDelete.id;
    LibraryCard.deleteLibraryCard(id);
    const libraryCardsCopy = cloneDeep(libraryCards);
    const targetIndex = findIndex((card) =>  card.id === id)(libraryCardsCopy);
    libraryCardsCopy.splice(targetIndex, 1);
    setLibraryCards(libraryCardsCopy);
    setShowConfirmation(false);
  } catch(error) {
    Notifications.showError("Error: Failed to delete library card");
  }
};

const DeleteRecordCell = (props) => {
  const { card, setShowConfirmation, setTargetDelete} = props;
  return div({onClick: () => {
    setTargetDelete(card);
    setShowConfirmation(true);
  }}, ["Delete"]);
};

export default function LibraryCardTable(props) {
  const [libraryCards, setLibraryCards] = useState(props.libraryCards || []);
  const [tableSize, setTableSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredCards, setFilteredCards] = useState([]);
  const [visibleCards, setVisibleCards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [institutions, setInstitutions] = useState(props.institutions || []);
  const [users, setUsers] = useState(props.users || []);
  const [currentCard, setCurrentCard] = useState();
  const [modalType, setModalType] = useState();
  const [targetDelete, setTargetDelete] = useState({});
  const searchRef = useRef('');

  //add signingOfficial when feature is implemented
  const columnHeaderData = [
    columnHeaderFormat.researcher,
    columnHeaderFormat.email,
    columnHeaderFormat.institution,
    columnHeaderFormat.eraCommonsId,
    columnHeaderFormat.createDate,
    columnHeaderFormat.actions
  ];

  useEffect(() => {
    const init = async () => {
      try {
        setPageCount(calcTablePageCount(tableSize, filteredCards));
        if (currentPage > pageCount) {
          setCurrentPage(pageCount);
        }
        const visibleList = calcVisibleWindow(
          currentPage,
          tableSize,
          filteredCards
        );
        setVisibleCards(visibleList);
      } catch (error) {
        Notifications.showError({ text: 'Error updating Library Card table' });
      }
    };
    init();
  }, [filteredCards, tableSize, currentPage, pageCount]);

  useEffect(() => {
    const searchTerms = searchRef.current.value;
    let filteredList = !isEmpty(libraryCards) ? libraryCards : props.libraryCards;
    if (!isEmpty(searchTerms)) {
      filteredList = lcFilterFunction(searchRef, libraryCards);
    }
    setFilteredCards(filteredList);
  }, [props.libraryCards, libraryCards]);

  useEffect(() => {
    setLibraryCards(props.libraryCards);
    setInstitutions(props.institutions);
    setUsers(props.users);
    if(
      !isEmpty(props.libraryCards)
      && !isEmpty(props.users)
      && !isEmpty(props.institutions)
    ) {
      setIsLoading(false);
    }
  }, [props.libraryCards, props.institutions, props.users]);

  const processLCData = (cards = []) => {
    return cards.map((card) => {
      return [
        userNameCell(
          card.userName,
          () => showModalOnClick(card, 'update'),
          card.id
        ),
        emailCell(card.userEmail, card.id),
        !isEmpty(card.institution)
          ? institutionCell(card.institution.name, card.id)
          : institutionCell('- -', card.id),
        eraCommonsCell(card.eraCommonsId, card.id),
        createDateCell(card.createDate, card.id),
        createDeleteCell(card, setTargetDelete, setShowConfirmation)
      ];
    });
  };

  const goToPage = (value) => {
    if (value >= 1 && value <= pageCount) {
      setCurrentPage(value);
    }
  };

  const changeTableSize = (value) => {
    if (value > 0 && !isNaN(parseInt(value))) {
      setTableSize(value);
    }
  };

  const paginationBar = h(PaginationBar, {
    pageCount,
    currentPage,
    tableSize,
    goToPage,
    changeTableSize,
  });

  //update function when element in array is updated via modal
  const updateListFn = (payload) => {
    try {
      const id = payload.id;
      const institution = find(
        (institution) => institution.id === payload.institutionId
      )(institutions);
      payload.institution = institution;
      let filteredCopy = cloneDeep(filteredCards);
      let libraryCopy = cloneDeep(libraryCards);
      let filteredIndex = findIndex((card) => card.id === id)(filteredCards);
      let originalIndex = findIndex((card) => card.id === id)(libraryCopy);
      filteredCopy[filteredIndex] = payload;
      libraryCopy[originalIndex] = payload;
      setFilteredCards(filteredCopy);
      setLibraryCards(libraryCopy);
      setShowModal(false);
      Notifications.showSuccess({
        text: `${payload.userName}'s library card successfully updated`,
      });
    } catch (error) {
      setShowModal(false);
      Notifications.showError({ text: 'Error: Failed to update library card' });
    }
  };

  const addLibraryCard = async (card) => {
    try {
      //check if card combination already exits, show error if it does
      const alreadyExists = findIndex(
        (element) =>
          (isEqual(element.institutionId)(card.institutionId) &&
            element.userId === card.userId) ||
          isEqual(element.userEmail)(card.userEmail)
      );
      const newCard = await LibraryCard.createLibraryCard(card);
      if (alreadyExists > -1) {
        Notifications.showError({ text: 'Library Card already exists' });
        //otherwise execute library card update with payload, get the updated card, and
        //add(with sort afterwards) library card to libraryCards (reference list)
      } else {
        const institution = find(
          (institution) => institution.id === newCard.institutionId
        )(institutions);
        newCard.institution = institution;
        const updatedList = cloneDeep(libraryCards);
        updatedList.push(newCard);
        updatedList.sort((a, b) => {
          const dateA = new Date(a.createDate);
          const dateB = new Date(b.createDate);
          return dateB - dateA;
        });
        setLibraryCards(updatedList);
        setShowModal(false);
      }
    } catch (error) {
      setShowModal(false);
      Notifications.showError({
        text: 'Error: Failed to create new library card',
      });
    }
  };

  //onClick function to show target card via modal
  const showModalOnClick = (card, type) => {
    setCurrentCard(cloneDeep(card));
    setModalType(type);
    setShowModal(true);
  };

  //Search function for SearchBar component
  const handleSearchChange = tableSearchHandler(
    libraryCards,
    setFilteredCards,
    setCurrentPage,
    'libraryCard'
  );

  //template for render
  return div({ style: Styles.PAGE }, [
    div({ style: { display: 'flex', justifyContent: 'space-between' } }, [
      div(
        { className: 'left-header-section', style: Styles.LEFT_HEADER_SECTION },
        [
          div({ style: Styles.ICON_CONTAINER }, [
            img({
              id: 'lock-icon',
              src: lockIcon,
              style: Styles.HEADER_IMG,
            }),
          ]),
          div({ style: Styles.HEADER_CONTAINER }, [
            div({ style: Styles.TITLE }, ['Manage Library Cards']),
            div(
              {
                style: Object.assign({}, Styles.MEDIUM_DESCRIPTION, {
                  fontSize: '18px',
                }),
              },
              ['Select and manage Library Cards']
            ),
          ]),
        ]
      ),
      h(SearchBar, { handleSearchChange, searchRef }),
    ]),
    h(SimpleTable, {
      isLoading,
      rowData: processLCData(visibleCards),
      columnHeaders: columnHeaderData,
      styles,
      tableSize,
      paginationBar,
    }),
    div({ style: { marginLeft: '90%' } }, [
      div(
        {
          onClick: () => showModalOnClick({}, 'add'),
        },
        ['Add Library Card']
      ),
    ]),
    h(LibraryCardFormModal, {
      showModal,
      updateOnClick: updateListFn,
      createOnClick: addLibraryCard,
      closeModal: () => setShowModal(false),
      institutions,
      users,
      card: currentCard,
      modalType,
    }),
    h(ConfirmationModal, {
      showConfirmation,
      closeConfirmation: () => setShowConfirmation(false),
      title: 'Delete Library Card?',
      message: 'Are you sure you want to delete this library card?',
      header: `${targetDelete.userName || targetDelete.userEmail} - ${!isNil(targetDelete.institution) ? targetDelete.institution.name : ''}`,
      onConfirm: () => deleteOnClick(targetDelete, libraryCards, setLibraryCards, setShowConfirmation)
    })
  ]);
}
