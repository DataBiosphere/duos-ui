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
import LibraryCardFormModal from 'src/components/modals/LibraryCardFormModal';
import { LibraryCard } from 'src/libs/ajax/LibraryCard';
import ConfirmationModal from 'src/components/modals/ConfirmationModal';
import {Delete} from '@mui/icons-material';
import TableIconButton from 'src/components/TableIconButton';

// Types definitions
interface LibraryCardData {
  id?: number;
  userName?: string;
  userEmail: string;
  userId?: number;
  createDate?: string | Date;
  institution?: {
    name: string;
  };
}

interface Institution {
  id: number;
  name: string;
}

interface UserData {
  userId: number;
  displayName: string;
  email: string;
  libraryCards?: LibraryCardData[];
}

interface LibraryCardTableProps {
  libraryCards?: LibraryCardData[];
  users?: UserData[];
  institutions?: Institution[];
}

interface TableCell {
  data: any;
  style: React.CSSProperties;
  id?: number;
  label: string;
  isComponent?: boolean;
}

interface ColumnHeader {
  label: string;
  cellStyle: React.CSSProperties;
}

interface DeleteRecordButtonProps {
  card: LibraryCardData;
  setShowConfirmation: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentCard: React.Dispatch<React.SetStateAction<LibraryCardData>>;
}

// Styles specific to the LibraryCard table
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

// Following cell functions format data for processing within the SimpleTable component
const emailCell = (email: string | undefined, id?: number): TableCell => {
  return {
    data: email || '- -',
    style: { width: styles.cellWidths.email },
    id,
    label: 'email',
  };
};

const userNameCell = (userName: string | undefined, id?: number): TableCell => {
  return {
    data: userName || '- -',
    style: { width: styles.cellWidths.researcher },
    id,
    label: 'username',
  };
};

const createDateCell = (createDate: string | Date | undefined, id?: number): TableCell => {
  return {
    data: !isNil(createDate) ? dayjs(createDate).format('YYYY-MM-DD') : '- -',
    id,
    style: { width: styles.cellWidths.createDate },
    label: 'create-date',
  };
};

// Update function name and return if requirements change
const createActionsCell = (
    card: LibraryCardData,
    setCurrentCard: React.Dispatch<React.SetStateAction<LibraryCardData>>,
    setShowConfirmation: React.Dispatch<React.SetStateAction<boolean>>
): TableCell => {
  const deleteButton = <DeleteRecordButton card={card} setShowConfirmation={setShowConfirmation} setCurrentCard={setCurrentCard} />;
  return {
    id: card.id,
    style: { width: styles.cellWidths.buttons },
    label: 'action-buttons',
    isComponent: true,
    data: <div style={{display: 'flex', justifyContent: 'left'}} key={`action-cell-${card.id}`}>{deleteButton}</div>
  };
};

// Sub-component of filter function used in search bar, needed for useEffect hooks to re-filter cards on size changes
const lcFilterFunction = getSearchFilterFunctions().libraryCard;

// Column row metadata for SimpleTable
const columnHeaderFormat: Record<string, ColumnHeader> = {
  email: {label: 'Email', cellStyle: {width: styles.cellWidths.email}},
  researcher: {label: 'Researcher', cellStyle: {width: styles.cellWidths.researcher}},
  institution: {label: 'Institution', cellStyle: {width: styles.cellWidths.institution}},
  eraCommonsId: {label: 'era Commons ID', cellStyle: {width: styles.cellWidths.eraCommonsId}},
  createDate: {label: 'Create Date', cellStyle: {width: styles.cellWidths.createDate}},
  actions: {label: 'Actions', cellStyle: {width: styles.cellWidths.actions}}
};

// Delete function used within actions component
const deleteOnClick = (
    currentCard: LibraryCardData,
    libraryCards: LibraryCardData[],
    setLibraryCards: React.Dispatch<React.SetStateAction<LibraryCardData[]>>,
    setShowConfirmation: React.Dispatch<React.SetStateAction<boolean>>
): void => {
  try {
    const id = currentCard.id;
    if (id) {
      LibraryCard.deleteLibraryCard(id);
      const libraryCardsCopy = cloneDeep(libraryCards);
      const targetIndex = findIndex((card: LibraryCardData) => card.id === id)(libraryCardsCopy);
      libraryCardsCopy.splice(targetIndex, 1);
      setLibraryCards(libraryCardsCopy);
      setShowConfirmation(false);
    }
  } catch(error: any) {
    Notifications.showError({text: error.response?.data?.message ?? 'Error: Failed to delete library card'});
  }
};

// Delete button component contained as child component of actions cell
const DeleteRecordButton: React.FC<DeleteRecordButtonProps> = (props) => {
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
const showModalOnClick = (
    card: LibraryCardData,
    setShowModal: React.Dispatch<React.SetStateAction<boolean>>,
    setCurrentCard: React.Dispatch<React.SetStateAction<LibraryCardData>>
): void => {
  setCurrentCard(cloneDeep(card));
  setShowModal(true);
};

const LibraryCardTable: React.FC<LibraryCardTableProps> = (props) => {
  const [libraryCards, setLibraryCards] = useState<LibraryCardData[]>(props.libraryCards || []);
  const [tableSize, setTableSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageCount, setPageCount] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filteredCards, setFilteredCards] = useState<LibraryCardData[]>([]);
  const [visibleCards, setVisibleCards] = useState<LibraryCardData[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [users, setUsers] = useState<UserData[]>(props.users || []);
  const [currentCard, setCurrentCard] = useState<LibraryCardData>({} as LibraryCardData);
  const searchRef = useRef<HTMLInputElement>(null);

  const columnHeaderData: ColumnHeader[] = [
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

  // Hook to execute on initialization and card creation/deletion, applies filter on updated collection list
  useEffect(() => {
    if (searchRef.current) {
      const searchTerms = searchRef.current.value;
      let filteredList = libraryCards;
      if (!isEmpty(searchTerms)) {
        filteredList = lcFilterFunction(searchRef, libraryCards);
      }
      setFilteredCards(filteredList);
    }
  }, [props.libraryCards, libraryCards]);

  // Hook that executes on prop load (initialization hook)
  useEffect(() => {
    setLibraryCards(props.libraryCards || []);
    setUsers(props.users || []);
    if (
        !isNil(props.libraryCards) &&
        !isNil(props.users) &&
        !isNil(props.institutions)
    ) {
      setIsLoading(false);
    }
  }, [props.libraryCards, props.institutions, props.users]);

  // Formats institution data to be used by SimpleTable component
  const processLCData = (cards: LibraryCardData[] = []): TableCell[][] => {
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

  // onClick function for page change (either by prev/next or manual input)
  const goToPage = (value: number): void => {
    if (value >= 1 && value <= pageCount) {
      setCurrentPage(value);
    }
  };

  // Table size change hook
  const changeTableSize = (value: number | string): void => {
    const numValue = typeof value === 'string' ? parseInt(value) : value;
    if (numValue > 0 && !isNaN(numValue)) {
      setTableSize(numValue);
    }
  };

  // Pre-computed PaginationBar component passed into SimpleTable as a prop
  const paginationBar = <PaginationBar
      pageCount={pageCount}
      currentPage={currentPage}
      tableSize={tableSize}
      goToPage={goToPage}
      changeTableSize={changeTableSize}
  />;

  // onClick function, used to create new card on modal based on form data
  const addLibraryCard = async (card: LibraryCardData): Promise<void> => {
    try {
      // Check if card already exists, show error if it does
      const alreadyExists = findIndex(
          (element: LibraryCardData) => isEqual(element.userEmail)(card.userEmail),
          libraryCards
      );
      if (alreadyExists > -1) {
        Notifications.showError({ text: 'Library Card already exists' });
      } else {
        // Execute library card update with payload, get the updated card, and
        // add (with sort afterwards) library card to libraryCards (reference list)
        const newCard = await LibraryCard.createLibraryCard(card);
        const updatedList = cloneDeep(libraryCards);
        updatedList.push(newCard);
        updatedList.sort((a: LibraryCardData, b: LibraryCardData) => {
          const dateA = new Date(a.createDate || '');
          const dateB = new Date(b.createDate || '');
          return dateB.getTime() - dateA.getTime();
        });
        setLibraryCards(updatedList);
        setShowModal(false);
      }
    } catch (error: any) {
      setShowModal(false);
      Notifications.showError({
        text: error.response?.data?.message ?? 'Error: Failed to create new library card',
      });
    }
  };

  // Search function for SearchBar component
  const handleSearchChange = useCallback(
      (searchTerms: string) =>
          searchOnFilteredList(
              searchTerms,
              libraryCards,
              lcFilterFunction,
              setFilteredCards
          ),
      [libraryCards]
  );

  // Template for render
  return (
      <div style={Styles.PAGE}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div className='left-header-section' style={Styles.LEFT_HEADER_SECTION}>
            <div style={Styles.ICON_CONTAINER}>
              <img id='lock-icon' src={lockIcon} style={Styles.HEADER_IMG} alt="Lock icon" />
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
                              {} as LibraryCardData,
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
};

export default LibraryCardTable;
