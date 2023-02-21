import moment from 'moment';
import { useState, useEffect, useRef, useCallback } from 'react';
import { div, h, img } from 'react-hyperscript-helpers';
import ReactTooltip from 'react-tooltip';
import { Notifications, searchOnFilteredList, calcTablePageCount, calcVisibleWindow, getSearchFilterFunctions} from '../../libs/utils';
import {isEmpty, isNaN, cloneDeep, findIndex, isEqual, find, isNil, omit } from 'lodash/fp';
import { Styles, Theme } from '../../libs/theme';
import PaginationBar from '../PaginationBar';
import SearchBar from '../SearchBar';
import SimpleTable from '../SimpleTable';
import lockIcon from '../../images/lock-icon.png';
import LibraryCardFormModal from '../modals/LibraryCardFormModal';
import { LibraryCard } from '../../libs/ajax';
import ConfirmationModal from '../modals/ConfirmationModal';
import {Delete, Update} from '@mui/icons-material';
import TableIconButton from '../TableIconButton';
import SimpleButton from '../SimpleButton';

//Styles specific to the LibraryCard table
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
    researcher: '15%',
    email: '20%',
    institution: '27%',
    eraCommonsId: '15%',
    createDate: '12%',
    actions: '5%'
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

const userNameCell = (userName, id) => {
  return {
    data: userName || '- -',
    style: { width: styles.cellWidths.researcher },
    id,
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
const createActionsCell = (card, setCurrentCard, setShowConfirmation, setShowModal, setModalType) => {
  const deleteButton = h(DeleteRecordButton, {card, setShowConfirmation, setCurrentCard});
  const updateButton = h(UpdateRecordButton, {card, setShowModal, setCurrentCard, setModalType});
  return {
    id: card.id,
    style: { width: styles.cellWidths.buttons },
    label: 'action-buttons',
    isComponent: true,
    data: div({style: {display: 'flex', justifyContent: 'left'}, key: `action-cell-${card.id}`}, [updateButton, deleteButton])
  };
};

//sub-component of filter function used in search bar, needed for useEffect hooks to re-filter cards on size changes
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

//delete function used within actions component
const deleteOnClick = (currentCard, libraryCards, setLibraryCards, setShowConfirmation) => {
  try {
    const id = currentCard.id;
    LibraryCard.deleteLibraryCard(id);
    const libraryCardsCopy = cloneDeep(libraryCards);
    const targetIndex = findIndex((card) =>  card.id === id)(libraryCardsCopy);
    libraryCardsCopy.splice(targetIndex, 1);
    setLibraryCards(libraryCardsCopy);
    setShowConfirmation(false);
  } catch(error) {
    Notifications.showError('Error: Failed to delete library card');
  }
};

//delete button component contained as child component of actions cell
const DeleteRecordButton = (props) => {
  const { card, setShowConfirmation, setCurrentCard } = props;
  const onClick = () => {
    setCurrentCard(card);
    setShowConfirmation(true);
  };
  return h(TableIconButton, {
    keyProp: `show-delete-modal-${card.id}`,
    dataTip: 'Delete Library Card',
    isRendered: true,
    onClick,
    icon: Delete,
    style: Object.assign({}, Styles.TABLE.TABLE_ICON_BUTTON),
    hoverStyle: Object.assign({}, Styles.TABLE.TABLE_BUTTON_ICON_HOVER)
  });
};

//onClick function to show target card via modal
const showModalOnClick = (card, type, setModalType, setShowModal, setCurrentCard) => {
  setCurrentCard(cloneDeep(card));
  setModalType(type);
  setShowModal(true);
};

//update button stored as child component of actions cell
const UpdateRecordButton = (props) => {
  const { card, setShowModal, setCurrentCard, setModalType} = props;
  const onClick = () => showModalOnClick(card, 'update', setModalType, setShowModal, setCurrentCard);

  return h(TableIconButton, {
    keyProp: `show-update-form-${card.id}`,
    dataTip: 'Update Library Card',
    isRendered: true,
    onClick,
    icon: Update,
    style: Object.assign({}, Styles.TABLE.TABLE_ICON_BUTTON),
    hoverStyle: Object.assign({}, Styles.TABLE.TABLE_BUTTON_ICON_HOVER)
  });
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
  const [currentCard, setCurrentCard] = useState({});
  const [modalType, setModalType] = useState();
  const searchRef = useRef('');

  //add signingOfficial when feature is implemented
  const columnHeaderData = [
    columnHeaderFormat.researcher,
    columnHeaderFormat.email,
    columnHeaderFormat.institution,
    columnHeaderFormat.eraCommonsId,
    columnHeaderFormat.createDate,
    columnHeaderFormat.actions,
  ];

  //hook to recalculate visible table records when listed dependencies update
  //NOTE: function moved to util, update implementation here
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

  //hook to execute on initialization and card creation/deletion, applies filter on updated collection list
  useEffect(() => {
    const searchTerms = searchRef.current.value;
    let filteredList = libraryCards;
    if (!isEmpty(searchTerms)) {
      filteredList = lcFilterFunction(searchRef, libraryCards);
    }
    setFilteredCards(filteredList);
  }, [props.libraryCards, libraryCards]);

  //hook that executes on prop load (initialization hook)
  useEffect(() => {
    setLibraryCards(props.libraryCards);
    setInstitutions(props.institutions);
    setUsers(props.users);
    if (
      !isNil(props.libraryCards) &&
      !isNil(props.users) &&
      !isNil(props.institutions)
    ) {
      setIsLoading(false);
    }
  }, [props.libraryCards, props.institutions, props.users]);

  //formats institution data to be used by SearchSelect component within modal
  const processLCData = (cards = []) => {
    return cards.map((card) => {
      return [
        userNameCell(card.userName, card.id),
        emailCell(card.userEmail, card.id),
        !isEmpty(card.institution)
          ? institutionCell(card.institution.name, card.id)
          : institutionCell('- -', card.id),
        eraCommonsCell(card.eraCommonsId, card.id),
        createDateCell(card.createDate, card.id),
        createActionsCell(
          card,
          setCurrentCard,
          setShowConfirmation,
          setShowModal,
          setModalType
        ),
      ];
    });
  };

  //onClick function for page change (either by prev/next or manual input)
  const goToPage = (value) => {
    if (value >= 1 && value <= pageCount) {
      setCurrentPage(value);
    }
  };

  //table size change hook
  const changeTableSize = (value) => {
    if (value > 0 && !isNaN(parseInt(value))) {
      setTableSize(value);
    }
  };

  //pre-computed PaginationBar component passed into SimpleTable as a prop
  const paginationBar = h(PaginationBar, {
    pageCount,
    currentPage,
    tableSize,
    goToPage,
    changeTableSize,
  });

  //update function when element in array is updated via modal
  const updateListFn = async (payload) => {
    try {
      const id = payload.id;
      const parsedPayload = omit(['createDate', 'updateDate', 'institution'])(
        payload
      );
      const updatedCard = await LibraryCard.updateLibraryCard(parsedPayload);
      const institution = find(
        (institution) => institution.id === payload.institutionId
      )(institutions);
      updatedCard.institution = institution;
      let filteredCopy = cloneDeep(filteredCards);
      let libraryCopy = cloneDeep(libraryCards);
      let filteredIndex = findIndex((card) => card.id === id)(filteredCards);
      let originalIndex = findIndex((card) => card.id === id)(libraryCopy);
      filteredCopy[filteredIndex] = updatedCard;
      libraryCopy[originalIndex] = updatedCard;
      setFilteredCards(filteredCopy);
      setLibraryCards(libraryCopy);
      setShowModal(false);
      Notifications.showSuccess({
        text: `${
          updatedCard.userName || updatedCard.userEmail
        }'s library card successfully updated`,
      });
    } catch (error) {
      setShowModal(false);
      Notifications.showError({ text: 'Error: Failed to update library card' });
    }
  };

  //onClick function, used to create new card on modal based on form data
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

  //Search function for SearchBar component
  const handleSearchChange = useCallback(
    (searchTerms) =>
      searchOnFilteredList(
        searchTerms,
        libraryCards,
        lcFilterFunction,
        setFilteredCards
      ),
    [libraryCards]
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
      h(SimpleButton, {
        onClick: () =>
          showModalOnClick(
            {},
            'add',
            setModalType,
            setShowModal,
            setCurrentCard
          ),
        baseColor: Theme.palette.secondary,
        label: 'Add Library Card',
      }),
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
      lcaContent: '',
    }),
    h(ConfirmationModal, {
      showConfirmation,
      closeConfirmation: () => setShowConfirmation(false),
      title: 'Delete Library Card?',
      message: 'Are you sure you want to delete this library card?',
      header: `${currentCard.userName || currentCard.userEmail} - ${
        !isNil(currentCard.institution) ? currentCard.institution.name : ''
      }`,
      onConfirm: () =>
        deleteOnClick(
          currentCard,
          libraryCards,
          setLibraryCards,
          setShowConfirmation
        ),
    }),
    h(ReactTooltip, {
      place: 'left',
      effect: 'solid',
      multiline: true,
      className: 'tooltip-wrapper',
    }),
  ]);
}
