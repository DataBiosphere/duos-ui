import dayjs from 'dayjs'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import {
  calcTablePageCount,
  calcVisibleWindow,
  getSearchFilterFunctions,
  Notifications,
  searchOnFilteredList,
} from 'src/libs/utils'
import { cloneDeep, findIndex, isEmpty, isNaN, isNil } from 'lodash/fp'
import { Styles } from 'src/libs/theme'
import PaginationBar from 'src/components/PaginationBar'
import SearchBar from 'src/components/SearchBar'
import SimpleTable from 'src/components/SimpleTable'
import lockIcon from 'src/images/lock-icon.png'
import { LibraryCard as LibraryCardAPI } from 'src/libs/ajax/LibraryCard'
import ConfirmationModal from 'src/components/modals/ConfirmationModal'
import { Delete } from '@mui/icons-material'
import TableIconButton from 'src/components/TableIconButton'
import { AxiosError } from 'axios'
import { ConsentError, LibraryCard } from 'src/types/model'

export interface LibraryCardTableProps {
  libraryCards?: LibraryCard[]
}

interface TableCell {
  data: string | React.JSX.Element
  style: React.CSSProperties
  id?: number
  label: string
  isComponent?: boolean
}

interface ColumnHeader {
  label: string
  cellStyle: React.CSSProperties
}

interface DeleteRecordButtonProps {
  card: LibraryCard
  setShowConfirmation: React.Dispatch<React.SetStateAction<boolean>>
  setCurrentCard: React.Dispatch<React.SetStateAction<LibraryCard>>
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
    alignItems: 'center',
  },
  columnStyle: { ...Styles.TABLE.HEADER_ROW, justifyContent: 'space-between' },
  cellWidths: {
    researcher: '30%',
    email: '30%',
    createDate: '15%',
    actions: '15%',
  },
}

// Following cell functions format data for processing within the SimpleTable component
const emailCell = (email: string | undefined, id?: number): TableCell => {
  return {
    data: email ?? '- -',
    style: { width: styles.cellWidths.email },
    id,
    label: 'email',
  }
}

const userNameCell = (userName: string | undefined, id?: number): TableCell => {
  return {
    id,
    data: userName ?? '- -',
    style: { width: styles.cellWidths.researcher },
    label: 'username',
  }
}

const createDateCell = (createDate: string | Date | undefined, id?: number): TableCell => {
  return {
    id,
    data: !isNil(createDate) ? dayjs(createDate).format('YYYY-MM-DD') : '- -',
    style: { width: styles.cellWidths.createDate },
    label: 'create-date',
  }
}

// Update function name and return if requirements change
const createActionsCell = (
  card: LibraryCard,
  setCurrentCard: React.Dispatch<React.SetStateAction<LibraryCard>>,
  setShowConfirmation: React.Dispatch<React.SetStateAction<boolean>>,
): TableCell => {
  const deleteButton = (
    <DeleteRecordButton
      card={card}
      setShowConfirmation={setShowConfirmation}
      setCurrentCard={setCurrentCard}
    />
  )
  return {
    id: card.id,
    data: <div style={{ display: 'flex', justifyContent: 'left' }} key={`action-cell-${card.id}`}>{deleteButton}</div>,
    style: { width: styles.cellWidths.actions },
    label: 'action-buttons',
    isComponent: true,
  }
}

// Sub-component of filter function used in search bar, needed for useEffect hooks to re-filter cards on size changes
const lcFilterFunction = getSearchFilterFunctions().libraryCard

// Column row metadata for SimpleTable
const columnHeaderFormat: Record<string, ColumnHeader> = {
  email: { label: 'Email', cellStyle: { width: styles.cellWidths.email } },
  researcher: { label: 'Researcher', cellStyle: { width: styles.cellWidths.researcher } },
  createDate: { label: 'Create Date', cellStyle: { width: styles.cellWidths.createDate } },
  actions: { label: 'Actions', cellStyle: { width: styles.cellWidths.actions } },
}

// Delete function used within actions component
const deleteOnClick = (
  currentCard: LibraryCard,
  libraryCards: LibraryCard[],
  setLibraryCards: React.Dispatch<React.SetStateAction<LibraryCard[]>>,
  setShowConfirmation: React.Dispatch<React.SetStateAction<boolean>>,
): void => {
  try {
    const id = currentCard.id
    if (id) {
      LibraryCardAPI.deleteLibraryCard(id)
      const libraryCardsCopy = cloneDeep(libraryCards)
      const targetIndex = findIndex((card: LibraryCard) => card.id === id)(libraryCardsCopy)
      libraryCardsCopy.splice(targetIndex, 1)
      setLibraryCards(libraryCardsCopy)
      setShowConfirmation(false)
    }
  }
  catch (error: unknown) {
    const axiosError = error as AxiosError
    const consentError = axiosError?.response?.data as ConsentError
    const serverError = consentError.message ?? 'Error: Failed to delete library card'
    Notifications.showError({ text: serverError })
  }
}

// Delete button component contained as child component of actions cell
const DeleteRecordButton: React.FC<DeleteRecordButtonProps> = (props) => {
  const { card, setShowConfirmation, setCurrentCard } = props
  const onClick = () => {
    setCurrentCard(card)
    setShowConfirmation(true)
  }
  return (
    <TableIconButton
      keyProp={`show-delete-modal-${card.id}`}
      dataTip="Delete Library Card"
      isRendered={true}
      onClick={onClick}
      icon={Delete}
      style={({ ...Styles.TABLE.TABLE_ICON_BUTTON })}
      hoverStyle={({ ...Styles.TABLE.TABLE_BUTTON_ICON_HOVER })}
    />
  )
}

const LibraryCardTable: React.FC<LibraryCardTableProps> = (props) => {
  const [libraryCards, setLibraryCards] = useState<LibraryCard[]>(props.libraryCards ?? [])
  const [tableSize, setTableSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageCount, setPageCount] = useState<number>(1)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [filteredCards, setFilteredCards] = useState<LibraryCard[]>([])
  const [visibleCards, setVisibleCards] = useState<LibraryCard[]>([])
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false)
  const [currentCard, setCurrentCard] = useState<LibraryCard>({} as LibraryCard)
  const searchRef = useRef<HTMLInputElement>(null)

  const columnHeaderData: ColumnHeader[] = [
    columnHeaderFormat.researcher,
    columnHeaderFormat.email,
    columnHeaderFormat.createDate,
    columnHeaderFormat.actions,
  ]

  useEffect(() => {
    const init = async () => {
      try {
        setPageCount(calcTablePageCount(tableSize, filteredCards))
        if (currentPage > pageCount) {
          setCurrentPage(pageCount)
        }
        const visibleList = calcVisibleWindow(
          currentPage,
          tableSize,
          filteredCards,
        )
        setVisibleCards(visibleList)
      }
      catch (error: unknown) {
        const axiosError = error as AxiosError
        const consentError = axiosError?.response?.data as ConsentError
        const serverError = consentError.message ?? 'Error updating Library Card table'
        Notifications.showError({ text: serverError })
      }
    }
    init()
  }, [filteredCards, tableSize, currentPage, pageCount])

  // Hook to execute on initialization and card creation/deletion, applies filter on updated collection list
  useEffect(() => {
    if (searchRef.current) {
      const searchTerms = searchRef.current.value
      let filteredList = libraryCards
      if (!isEmpty(searchTerms)) {
        filteredList = lcFilterFunction(searchRef, libraryCards)
      }
      setFilteredCards(filteredList)
    }
  }, [props.libraryCards, libraryCards])

  // Hook that executes on prop load (initialization hook)
  useEffect(() => {
    setLibraryCards(props.libraryCards ?? [])
    if (!isNil(props.libraryCards)) {
      setIsLoading(false)
    }
  }, [props.libraryCards])

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
          setShowConfirmation,
        ),
      ]
    })
  }

  // onClick function for page change (either by prev/next or manual input)
  const goToPage = (value: number): void => {
    if (value >= 1 && value <= pageCount) {
      setCurrentPage(value)
    }
  }

  // Table size change hook
  const changeTableSize = (value: number | string): void => {
    const numValue = typeof value === 'string' ? parseInt(value) : value
    if (numValue > 0 && !isNaN(numValue)) {
      setTableSize(numValue)
    }
  }

  // Pre-computed PaginationBar component passed into SimpleTable as a prop
  const paginationBar = (
    <PaginationBar
      pageCount={pageCount}
      currentPage={currentPage}
      tableSize={tableSize}
      goToPage={goToPage}
      changeTableSize={changeTableSize}
    />
  )

  // Search function for SearchBar component
  const handleSearchChange = useCallback(
    (searchTerms: string) =>
      searchOnFilteredList(
        searchTerms,
        libraryCards,
        lcFilterFunction,
        setFilteredCards,
      ),
    [libraryCards],
  )

  // Template for render
  return (
    <div data-cy="manage-library-card-table" style={Styles.PAGE}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div
          className="left-header-section"
          style={{
            display: 'flex',
            flexDirection: 'row',
            paddingTop: '3rem',
          }}
        >
          <div style={Styles.ICON_CONTAINER}>
            <img id="lock-icon" src={lockIcon} style={Styles.HEADER_IMG} alt="Lock icon" />
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
          }}
          >
            <div style={Styles.TITLE}>Manage Library Cards</div>
            <div style={({ ...Styles.MEDIUM_DESCRIPTION, fontSize: '18px' })}>
              Select and manage Library
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
      <ConfirmationModal
        showConfirmation={showConfirmation}
        closeConfirmation={() => setShowConfirmation(false)}
        title="Delete Library Card?"
        message="Are you sure you want to delete this library card?"
        header={`${currentCard.userName ?? currentCard.userEmail}`}
        onConfirm={() => deleteOnClick(currentCard, libraryCards, setLibraryCards, setShowConfirmation)}
      />
      <ReactTooltip place="left" effect="solid" multiline={true} className="tooltip-wrapper" />
    </div>
  )
}

export default LibraryCardTable
