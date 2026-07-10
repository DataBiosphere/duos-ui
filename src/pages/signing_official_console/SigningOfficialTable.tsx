import React, { useCallback, useEffect, useState } from 'react'
import { Switch } from '@mui/material'
import { Styles, Theme } from 'src/libs/theme'
import { cloneDeep, findIndex, isNil } from 'src/utils/NodashUtil'
import SimpleTable from 'src/components/SimpleTable'
import PaginationBar from 'src/components/PaginationBar'
import SearchBar from 'src/components/SearchBar'
import { getSearchFilterFunctions, Notifications, recalculateVisibleTable, searchOnFilteredList } from 'src/libs/utils'
import ConfirmationModal from 'src/components/modals/ConfirmationModal'
import { LibraryCard } from 'src/libs/ajax/LibraryCard'
import { confirmModalType } from 'src/libs/libraryCardUtils'
import { LibraryCardAgreementTermsDownload } from 'src/components/LibraryCardAgreementTermsDownload'
import { processLibraryCards } from 'src/utils/LibraryCardUtils'
import { extractError } from 'src/utils/ErrorUtils'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { DuosUser, DuosUserWithInstitutionId, LibraryCard as LibraryCardModel } from 'src/types/model'

type TableRowId = number | string

interface LibraryCardRequest {
  userEmail: string
  userId: number
  userName: string
}

interface SelectedLibraryCard extends LibraryCardRequest {
  id?: number
  institutionId?: number
}

interface SigningOfficialTableProps {
  readonly signingOfficial: DuosUserWithInstitutionId
  readonly isLoading: boolean
  readonly researchers: DuosUser[]
}

interface ShowConfirmationModalParams {
  card: SelectedLibraryCard
  message: React.ReactNode
  title: string
  confirmType: string
}

interface LibraryCardCellProps {
  researcher: DuosUser
  showConfirmationModal: (params: ShowConfirmationModalParams) => void
}

interface TableCell {
  data: React.ReactNode
  id: TableRowId
  style: React.CSSProperties
  label: string
  isComponent: boolean
}

// Styles specific to this table
const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.45rem',
    fontWeight: 400,
    color: 'rgb(53, 64, 82)',
    display: 'flex',
    padding: '1rem 2%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  columnStyle: { ...Styles.TABLE.HEADER_ROW, justifyContent: 'space-between' },
  cellWidths: {
    email: '25%',
    name: '20%',
    libraryCard: '25%',
  },
}

// column header format for table
const columnHeaderFormat = {
  email: { label: 'Email', cellStyle: { width: styles.cellWidths.email } },
  name: { label: 'Researcher', cellStyle: { width: styles.cellWidths.name } },
  libraryCard: { label: 'Status', cellStyle: { width: styles.cellWidths.libraryCard } },
  // activeDARs: {label: 'Active DARs', cellStyle: {width: styles.cellWidths.activeDARs}}
}

const researcherFilterFunction = getSearchFilterFunctions().signingOfficialResearchers

const LibraryCardCell = ({
  researcher,
  showConfirmationModal,
}: LibraryCardCellProps): TableCell => {
  const id = researcher.userId
  const card = researcher.libraryCard
  const isActive = !isNil(card)

  const handleToggle = (): void => {
    if (isActive) {
      showConfirmationModal({
        card: card,
        message: 'Are you sure you want to deactivate this researcher?',
        title: 'Deactivate Researcher',
        confirmType: confirmModalType.delete,
      })
    }
    else {
      showConfirmationModal({
        card: {
          userId: researcher.userId,
          userEmail: researcher.email,
          userName: researcher.displayName,
        },
        message: (
          <div>
            <LibraryCardAgreementTermsDownload />
            {'By clicking \'Confirm\' you agree to the terms of the agreements above for this user. Are you sure you want to activate this researcher?'}
          </div>
        ),
        title: 'Activate Researcher',
        confirmType: confirmModalType.issue,
      })
    }
  }

  return {
    isComponent: true,
    id,
    style: {},
    label: 'lc-status',
    data: (
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        key={`lc-status-cell-${id}`}
      >
        <Switch
          checked={isActive}
          onChange={handleToggle}
          size="small"
          sx={{
            '& .MuiSwitch-switchBase.Mui-checked': { color: Theme.palette.success },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: Theme.palette.success },
          }}
        />
        <span
          style={{
            color: isActive ? Theme.palette.success : 'rgb(128, 128, 128)',
            fontWeight: 600,
            fontSize: '1.45rem',
            fontFamily: 'Montserrat',
          }}
        >
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    ),
  }
}

const emailCell = (email: string, id: TableRowId): TableCell => {
  return {
    data: email,
    id,
    style: {},
    label: 'user-email',
    isComponent: false,
  }
}

const displayNameCell = (displayName: string, id: TableRowId): TableCell => {
  return {
    data: displayName,
    id,
    style: {},
    label: 'display-name',
    isComponent: false,
  }
}

export default function SigningOfficialTable(props: SigningOfficialTableProps): React.JSX.Element {
  const [researchers, setResearchers] = useState<DuosUser[]>(props.researchers)
  const [tableSize, setTableSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageCount, setPageCount] = useState<number>(1)
  const [filteredResearchers, setFilteredResearchers] = useState<DuosUser[]>([])
  const [visibleResearchers, setVisibleResearchers] = useState<DuosUser[]>([])
  const [selectedCard, setSelectedCard] = useState<SelectedLibraryCard | null>(null)
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false)
  const [searchText, setSearchText] = useState<string>('')
  const [confirmationModalMsg, setConfirmationModalMsg] = useState<React.ReactNode>('')
  const [confirmationTitle, setConfirmationTitle] = useState<string>('')
  const [confirmType, setConfirmType] = useState<string>(confirmModalType.delete)
  const { signingOfficial, isLoading } = props

  // Search function for SearchBar component, function defined in utils
  const handleSearchChange = useCallback((searchTerms: string) => {
    setSearchText(searchTerms)
    searchOnFilteredList(
      searchTerms,
      researchers,
      researcherFilterFunction,
      setFilteredResearchers,
    )
  }, [researchers])

  const showConfirmationModal = ({ card, message, title, confirmType }: ShowConfirmationModalParams): void => {
    setSelectedCard(card)
    setShowConfirmation(true)
    setConfirmationModalMsg(message)
    setConfirmationTitle(title)
    setConfirmType(confirmType)
  }

  // init hook, need to make ajax calls here
  useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        setResearchers(props.researchers)
      }
      catch {
        Notifications.showError({ text: 'Failed to initialize researcher table' })
      }
    }
    void init()
  }, [props.researchers])

  useEffect(() => {
    searchOnFilteredList(
      searchText,
      researchers,
      researcherFilterFunction,
      setFilteredResearchers,
    )
  }, [researchers, searchText])

  useEffect(() => {
    recalculateVisibleTable({
      tableSize, pageCount,
      filteredList: filteredResearchers,
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleResearchers,
    }).catch(() => {
      Notifications.showError({ text: 'Failed to update researcher table' })
    })
  }, [tableSize, pageCount, filteredResearchers, currentPage])

  const goToPage = useCallback((value: number) => {
    if (value >= 1 && value <= pageCount) {
      setCurrentPage(value)
    }
  }, [pageCount])

  const changeTableSize = useCallback((value: number) => {
    if (value > 0 && !Number.isNaN(value)) {
      setTableSize(value)
    }
  }, [])

  const paginationBar = (
    <PaginationBar
      pageCount={pageCount}
      currentPage={currentPage}
      tableSize={tableSize}
      goToPage={goToPage}
      changeTableSize={changeTableSize}
    />
  )

  const processResearcherRowData = (researchers: DuosUser[]): TableCell[][] => {
    return researchers.map((researcher) => {
      const { displayName } = researcher
      const email = researcher.email
      const id = researcher.userId
      return [
        displayNameCell(displayName, id),
        emailCell(email, id),
        LibraryCardCell({
          researcher,
          showConfirmationModal,
        }),
        // activeDarCountCell(count, id)
      ]
    })
  }

  const columnHeaderData = [
    columnHeaderFormat.name,
    columnHeaderFormat.email,
    columnHeaderFormat.libraryCard,
    // columnHeaderFormat.activeDARs -> add this back in when back-end supports this
  ]

  const issueLibraryCards = async (
    cards: LibraryCardRequest[],
    researchers: DuosUser[],
    newUser?: DuosUser | false,
  ): Promise<void> => {
    const { successfulCards, failedCards } = await processLibraryCards(cards as LibraryCardModel[])

    if (successfulCards.length > 0) {
      const listCopy = cloneDeep(researchers)
      successfulCards.forEach((newCard) => {
        const { userEmail, userName, userId } = newCard
        const targetIndex = findIndex(listCopy, researcher => newCard.userId === researcher.userId)
        if (targetIndex !== -1) { // this means the library card was issued to an existing user, so we just need to update their library card info
          listCopy[targetIndex].libraryCard = newCard
          return
        }

        listCopy.unshift({
          email: newUser ? newUser.email : userEmail,
          displayName: newUser ? newUser.displayName : userName,
          userId: newUser ? newUser.userId : userId,
          libraryCard: newCard,
          roles: newUser ? newUser.roles : [],
          createDate: newUser ? newUser.createDate : new Date(),
          emailPreference: newUser ? newUser.emailPreference : true,
          isAdmin: newUser ? newUser.isAdmin : false,
          isAlumni: newUser ? newUser.isAlumni : false,
          isChairPerson: newUser ? newUser.isChairPerson : false,
          isDataSubmitter: newUser ? newUser.isDataSubmitter : false,
          isMember: newUser ? newUser.isMember : false,
          isResearcher: newUser ? newUser.isResearcher : true,
          isSigningOfficial: newUser ? newUser.isSigningOfficial : false,
        })
      })
      setResearchers(listCopy)
    }

    setShowConfirmation(false)

    const successNotificationText = `Issued ${successfulCards.length} library card${successfulCards.length > 1 ? 's' : ''}`

    if (successfulCards.length > 0 && failedCards.length > 0) {
      Notifications.showWarning({
        text: `${successNotificationText}, but encountered errors issuing library cards to ${failedCards.map(fc => fc.card.userEmail).join(', ')}`,
      })
      return
    }

    if (successfulCards.length > 0) {
      Notifications.showSuccess({ text: successNotificationText })
      return
    }

    if (failedCards.length > 0) {
      Notifications.showError({ text: `Error issuing library card${failedCards.length > 1 ? 's' : ''}.` })
    }
  }

  const deactivateLibraryCard = async (selectedCard: SelectedLibraryCard, researchers: DuosUser[]): Promise<void> => {
    const { id, userName, userEmail, userId } = selectedCard
    const listCopy = cloneDeep(researchers)
    const messageName = userName ?? userEmail
    try {
      if (id === undefined) {
        Notifications.showError({ text: `Error deleting library card issued to ${messageName}: Missing library card id` })
        return
      }
      await LibraryCard.deleteLibraryCard(id)
      const targetIndex = findIndex(researchers, (researcher) => {
        const card = researcher.libraryCard
        return !isNil(card) && id === card.id
      })
      if (targetIndex === -1) {
        Notifications.showError({ text: `Error deleting library card issued to ${messageName}: Library card not found` })
        return
      }
      if (isNil(userId) || researchers[targetIndex].institutionId !== signingOfficial.institutionId) {
        listCopy.splice(targetIndex, 1)
      }
      else {
        listCopy[targetIndex].libraryCard = undefined
      }
      setResearchers(listCopy)
      setShowConfirmation(false)
      Notifications.showSuccess({ text: `Removed library card issued to ${messageName}` })
    }
    catch (error) {
      const errorMessage = extractError(error)
      Notifications.showError({ text: `Error deleting library card issued to ${messageName}: ${errorMessage}` })
    }
  }

  return (
    <div style={{ ...Styles.PAGE }}>
      <div style={{ marginLeft: '-7.5%' }}>
        <div>
          <TableHeaderSection
            title="Researcher Status"
            description={(
              <>
                <div>Use the table below to change the active status of your institution&apos;s researchers.</div>
                <div>Deactivating a researcher will disable them from submitting access requests, and suspend their access to any data approved by a DAC in DUOS.</div>
              </>
            )}
          />
        </div>
        <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION }}>
          <SearchBar handleSearchChange={handleSearchChange} />
        </div>
      </div>

      <SimpleTable
        isLoading={isLoading}
        rowData={processResearcherRowData(visibleResearchers)}
        columnHeaders={columnHeaderData}
        styles={styles}
        tableSize={tableSize}
        paginationBar={paginationBar}
      />
      {selectedCard !== null && (
        <ConfirmationModal
          showConfirmation={showConfirmation}
          closeConfirmation={() => setShowConfirmation(false)}
          title={confirmationTitle}
          // The issue modal requires a larger view than normal
          styleOverride={confirmType === confirmModalType.issue ? { minWidth: '725px', minHeight: '475px' } : {}}
          message={<div>{confirmationModalMsg}</div>}
          header={`${selectedCard.userName ?? selectedCard.userEmail} - `}
          onConfirm={() =>
            confirmType === confirmModalType.delete
              ? deactivateLibraryCard(selectedCard, researchers)
              : issueLibraryCards([selectedCard], researchers)}
        />
      )}
    </div>
  )
}
