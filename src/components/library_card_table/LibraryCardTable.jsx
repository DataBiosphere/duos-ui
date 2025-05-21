import dayjs from 'dayjs';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactTooltip from 'react-tooltip';
import { Notifications, searchOnFilteredList, calcTablePageCount, calcVisibleWindow, getSearchFilterFunctions} from 'src/libs/utils';
import { isEmpty, isNaN, cloneDeep, findIndex, isEqual, isNil } from 'lodash/fp';
import { Styles } from 'src/libs/theme';
import PaginationBar from 'src/components/PaginationBar';
import SearchBar from 'src/components/SearchBar';
import SimpleTable from 'src/components/SimpleTable';
import lockIcon from 'src/images/lock-icon.png';
import LibraryCardFormModal from 'src/components/modals/LibraryCardFormModal.js';
import { LibraryCard } from 'src/libs/ajax/LibraryCard';
import ConfirmationModal from 'src/components/modals/ConfirmationModal';
import {Delete} from '@mui/icons-material';
import TableIconButton from 'src/components/TableIconButton';

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

const createDateCell = (createDate, id) => {
  return {
    data: !isNil(createDate) ? dayjs(createDate).format('YYYY-MM-DD') : '- -',
    id,
    style: { width: styles.cellWidths.createDate },
    label: 'create-date',
  };
};

//Update function name and return if requirements change
const createActionsCell = (card, setCurrentCard, setShowConfirmation) => {
  const deleteButton = <DeleteRecordButton card={card} setShowConfirmation={setShowConfirmation} setCurrentCard={setCurrentCard} />;
  return {
    id: card.id,
    style: { width: styles.cellWidths.buttons },
    label: 'action-buttons',
    isComponent: true,
    data: <div style={{display: 'flex', justifyContent: 'left'}} key={`action-cell-${card.id}`}>{deleteButton}</div>
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
    Notifications.showError({text: error.response.data.message ?? 'Error: Failed to delete library card'});
  }
};

//delete button component contained as child component of actions cell
const DeleteRecordButton = (props) => {
  const { card, setShowConfirmation, setCurrentCard } = props;
  const onClick = () => {
    setCurrentCard(card);
    setShowConfirmation(true);
  };
  return (
    <TableIconButton
      keyProp={`show-delete-modal-${card.id}`}
      dataTip='Delete Library Card'
      isRendered={true}
      onClick={onClick}
      icon={Delete}
      style={Object.assign({}, Styles.TABLE.TABLE_ICON_BUTTON)}
      hoverStyle={Object.assign({}, Styles.TABLE.TABLE_BUTTON_ICON_HOVER)}
    />
  );
};

// onClick function to show target card via modal
const showModalOnClick = (card, setShowModal, setCurrentCard) => {
  setCurrentCard(cloneDeep(card));
  setShowModal(true);
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
  const [users, setUsers] = useState(props.users || []);
  const [currentCard, setCurrentCard] = useState({});
  const searchRef = useRef('');

  const columnHeaderData = [
    columnHeaderFormat.researcher,
    columnHeaderFormat.email,
    columnHeaderFormat.createDate,
    columnHeaderFormat.actions,
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
      } catch (_error) {
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
        createDateCell(card.createDate, card.id),
        createActionsCell(
          card,
          setCurrentCard,
          setShowConfirmation
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
  const paginationBar = <PaginationBar pageCount={pageCount} currentPage={currentPage} tableSize={tableSize} goToPage={goToPage} changeTableSize={changeTableSize} />;

  //onClick function, used to create new card on modal based on form data
  const addLibraryCard = async (card) => {
    try {
      //check if card already exits, show error if it does
      const alreadyExists  = findIndex(
        (element) => isEqual(element.userEmail)(card.userEmail), libraryCards
      );
      if (alreadyExists > -1) {
        Notifications.showError({ text: 'Library Card already exists' });
        //otherwise execute library card update with payload, get the updated card, and
        //add(with sort afterwards) library card to libraryCards (reference list)
      } else {
        const newCard = await LibraryCard.createLibraryCard(card);
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
        text: error.response.data.message ?? 'Error: Failed to create new library card',
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
  return (
    <div style={Styles.PAGE}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className='left-header-section' style={Styles.LEFT_HEADER_SECTION}>
          <div style={Styles.ICON_CONTAINER}>
            <img id='lock-icon' src={lockIcon} style={Styles.HEADER_IMG} />
          </div>
          <div style={Styles.HEADER_CONTAINER}>
            <div style={Styles.TITLE}>Manage Library Cards</div>
            <div style={Object.assign({}, Styles.MEDIUM_DESCRIPTION, {fontSize: '18px'})}>Select and manage Library Cards</div>
          </div>
        </div>
        <SearchBar
          handleSearchChange={handleSearchChange}
          searchRef={searchRef}
          style={{
            width: '100%',
            margin: '0 3% 0 0',
          }}
          button={
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-end',
                justifyContent: 'center',
                width: '300px'
              }}
            >
              <a
                id="btn_addLibraryCard"
                className="btn-primary btn-add common-background"
                style={{
                  marginTop: '30%',
                  display: 'flex',
                }}
                onClick={() =>
                  showModalOnClick(
                    {},
                    setShowModal,
                    setCurrentCard
                  )
                }
              >
                <span>Add Library Card</span>
              </a>
            </div>
          }
        />
      </div>
      <SimpleTable
        isLoading={isLoading}
        rowData={processLCData(visibleCards)}
        columnHeaders={columnHeaderData}
        styles={styles}
        tableSize={tableSize}
        paginationBar={paginationBar}
      />
      <LibraryCardFormModal
        showModal={showModal}
        createOnClick={addLibraryCard}
        closeModal={() => setShowModal(false)}
        users={users}
        card={currentCard}
      />
      <ConfirmationModal
        showConfirmation={showConfirmation}
        closeConfirmation={() => setShowConfirmation(false)}
        title='Delete Library Card?'
        message='Are you sure you want to delete this library card?'
        header={`${currentCard.userName || currentCard.userEmail} - ${!isNil(currentCard.institution) ? currentCard.institution.name : ''}`}
        onConfirm={() => deleteOnClick(currentCard, libraryCards, setLibraryCards, setShowConfirmation)}
      />
      <ReactTooltip place='left' effect='solid' multiline={true} className='tooltip-wrapper' />
    </div>
  );
}
