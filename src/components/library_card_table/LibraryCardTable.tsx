import dayjs from 'dayjs';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import ReactTooltip from 'react-tooltip';
import {
  calcTablePageCount,
  calcVisibleWindow,
  getSearchFilterFunctions,
  Notifications,
  searchOnFilteredList
} from 'src/libs/utils';
import {cloneDeep, findIndex, isEmpty, isEqual, isNaN, isNil} from 'lodash/fp';
import {Styles} from 'src/libs/theme';
import PaginationBar from 'src/components/PaginationBar';
import SearchBar from 'src/components/SearchBar';
import SimpleTable from 'src/components/SimpleTable';
import lockIcon from 'src/images/lock-icon.png';
import LibraryCardFormModal from 'src/components/modals/LibraryCardFormModal';
import {LibraryCard as LibraryCardAPI} from 'src/libs/ajax/LibraryCard';
import ConfirmationModal from 'src/components/modals/ConfirmationModal';
import {Delete} from '@mui/icons-material';
import TableIconButton from 'src/components/TableIconButton';
import {AxiosError} from 'axios';
import {ConsentError} from 'src/types/responseTypes';
import {LibraryCard} from 'src/types/model';

interface UserData {
  userId: number;
  displayName: string;
  email: string;
  libraryCard?: LibraryCard;
}

export interface LibraryCardTableProps {
  libraryCards?: LibraryCard[];
  users?: UserData[];
}

interface TableCell {
  data: string | React.JSX.Element;
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
  card: LibraryCard;
  setShowConfirmation: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentCard: React.Dispatch<React.SetStateAction<LibraryCard>>;
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
  columnStyle: {...Styles.TABLE.HEADER_ROW, justifyContent: 'space-between',},
  cellWidths: {
    researcher: '30%',
    email: '30%',
    createDate: '15%',
    actions: '15%'
  },
};

// Following cell functions format data for processing within the SimpleTable component
const emailCell = (email: string | undefined, id?: number): TableCell => {
  return {
    data: email ?? '- -',
    style: {width: styles.cellWidths.email},
    id,
    label: 'email',
  };
};

const userNameCell = (userName: string | undefined, id?: number): TableCell => {
  return {
    id,
    data: userName ?? '- -',
    style: {width: styles.cellWidths.researcher},
    label: 'username',
  };
};

const createDateCell = (createDate: string | Date | undefined, id?: number): TableCell => {
  return {
    id,
    data: !isNil(createDate) ? dayjs(createDate).format('YYYY-MM-DD') : '- -',
    style: {width: styles.cellWidths.createDate},
    label: 'create-date',
  };
};

// Update function name and return if requirements change
const createActionsCell = (
    card: LibraryCard,
    setCurrentCard: React.Dispatch<React.SetStateAction<LibraryCard>>,
    setShowConfirmation: React.Dispatch<React.SetStateAction<boolean>>
): TableCell => {
  const deleteButton = <DeleteRecordButton card={card} setShowConfirmation={setShowConfirmation}
                                           setCurrentCard={setCurrentCard}/>;
  return {
    id: card.id,
    data: <div style={{display: 'flex', justifyContent: 'left'}} key={`action-cell-${card.id}`}>{deleteButton}</div>,
    style: {width: styles.cellWidths.actions},
    label: 'action-buttons',
    isComponent: true
  };
};

// Sub-component of filter function used in search bar, needed for useEffect hooks to re-filter cards on size changes
const lcFilterFunction = getSearchFilterFunctions().libraryCard;

// Column row metadata for SimpleTable
const columnHeaderFormat: Record<string, ColumnHeader> = {
  email: {label: 'Email', cellStyle: {width: styles.cellWidths.email}},
  researcher: {label: 'Researcher', cellStyle: {width: styles.cellWidths.researcher}},
  createDate: {label: 'Create Date', cellStyle: {width: styles.cellWidths.createDate}},
  actions: {label: 'Actions', cellStyle: {width: styles.cellWidths.actions}}
};

// Delete function used within actions component
const deleteOnClick = (
    currentCard: LibraryCard,
    libraryCards: LibraryCard[],
    setLibraryCards: React.Dispatch<React.SetStateAction<LibraryCard[]>>,
    setShowConfirmation: React.Dispatch<React.SetStateAction<boolean>>
): void => {
  try {
    const id = currentCard.id;
    if (id) {
      LibraryCardAPI.deleteLibraryCard(id);
      const libraryCardsCopy = cloneDeep(libraryCards);
      const targetIndex = findIndex((card: LibraryCard) => card.id === id)(libraryCardsCopy);
      libraryCardsCopy.splice(targetIndex, 1);
      setLibraryCards(libraryCardsCopy);
      setShowConfirmation(false);
    }
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    const consentError = axiosError?.response?.data as ConsentError;
    const serverError = consentError.message ?? 'Error: Failed to delete library card';
    Notifications.showError({text: serverError});
  }
};

// Delete button component contained as child component of actions cell
const DeleteRecordButton: React.FC<DeleteRecordButtonProps> = (props) => {
  const {card, setShowConfirmation, setCurrentCard} = props;
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
          style={({...Styles.TABLE.TABLE_ICON_BUTTON})}
          hoverStyle={({...Styles.TABLE.TABLE_BUTTON_ICON_HOVER})}
      />
  );
};

// onClick function to show target card via modal
const showModalOnClick = (
    card: LibraryCard,
    setShowModal: React.Dispatch<React.SetStateAction<boolean>>,
    setCurrentCard: React.Dispatch<React.SetStateAction<LibraryCard>>
): void => {
  setCurrentCard(cloneDeep(card));
  setShowModal(true);
};

const LibraryCardTable: React.FC<LibraryCardTableProps> = (props) => {
  const [libraryCards, setLibraryCards] = useState<LibraryCard[]>(props.libraryCards ?? []);
  const [tableSize, setTableSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageCount, setPageCount] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filteredCards, setFilteredCards] = useState<LibraryCard[]>([]);
  const [visibleCards, setVisibleCards] = useState<LibraryCard[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [users, setUsers] = useState<UserData[]>(props.users ?? []);
  const [currentCard, setCurrentCard] = useState<LibraryCard>({} as LibraryCard);
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
      } catch (error: unknown) {
        const axiosError = error as AxiosError;
        const consentError = axiosError?.response?.data as ConsentError;
        const serverError = consentError.message ?? 'Error updating Library Card table';
        Notifications.showError({text: serverError});
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
    setLibraryCards(props.libraryCards ?? []);
    setUsers(props.users ?? []);
    if (
        !isNil(props.libraryCards) &&
        !isNil(props.users)
    ) {
      setIsLoading(false);
    }
  }, [props.libraryCards, props.users]);

  // Formats institution data to be used by SimpleTable component
  const processLCData = (cards: LibraryCard[] = []): TableCell[][] => {
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
  const addLibraryCard = async (card: LibraryCard): Promise<void> => {
    try {
      // Check if card already exists, show error if it does
      const alreadyExists = findIndex(
          (element: LibraryCard) => isEqual(element.userEmail)(card.userEmail),
          libraryCards
      );
      if (alreadyExists > -1) {
        Notifications.showError({text: 'Library Card already exists'});
      } else {
        // Execute library card update with payload, get the updated card, and
        // add (with sort afterwards) library card to libraryCards (reference list)
        const newCard = await LibraryCardAPI.createLibraryCard(card);
        const updatedList = cloneDeep(libraryCards);
        updatedList.push(newCard);
        updatedList.sort((a: LibraryCard, b: LibraryCard) => {
          const dateA = new Date(a.createDate ?? '');
          const dateB = new Date(b.createDate ?? '');
          return dateB.getTime() - dateA.getTime();
        });
        setLibraryCards(updatedList);
        setShowModal(false);
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError;
      const consentError = axiosError?.response?.data as ConsentError;
      const serverError = consentError.message ?? 'Error: Failed to create new library card';
      setShowModal(false);
      Notifications.showError({text: serverError});
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
      <div data-cy={'manage-library-card-table'} style={Styles.PAGE}>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <div className='left-header-section' style={{
            display: 'flex',
            flexDirection: 'row',
            paddingTop: '3rem'
          }}>
            <div style={Styles.ICON_CONTAINER}>
              <img id='lock-icon' src={lockIcon} style={Styles.HEADER_IMG} alt="Lock icon"/>
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={Styles.TITLE}>Manage Library Cards</div>
              <div style={({...Styles.MEDIUM_DESCRIPTION, fontSize: '18px'})}>Select and manage Library
                Cards
              </div>
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
                  <button
                      data-cy={'add-library-card-button'}
                      type={'button'}
                      id="btn_addLibraryCard"
                      className="btn-primary btn-add common-background"
                      style={{
                        marginTop: '30%',
                        display: 'flex',
                      }}
                      onClick={() =>
                          showModalOnClick(
                              {} as LibraryCard,
                              setShowModal,
                              setCurrentCard
                          )
                      }
                  >
                    <span>Add Library Card</span>
                  </button>
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
            header={`${currentCard.userName ?? currentCard.userEmail}`}
            onConfirm={() => deleteOnClick(currentCard, libraryCards, setLibraryCards, setShowConfirmation)}
        />
        <ReactTooltip place='left' effect='solid' multiline={true} className='tooltip-wrapper'/>
      </div>
  );
};

export default LibraryCardTable;
