import React, { useCallback, useEffect, useState } from 'react'
import { Info } from '@mui/icons-material'
import { Styles, Theme } from 'src/libs/theme'
import { chain, cloneDeep, findIndex, isNil } from 'src/utils/NodashUtil'
import SimpleTable from 'src/components/SimpleTable'
import SimpleButton from 'src/components/SimpleButton'
import PaginationBar from 'src/components/PaginationBar'
import SearchBar from 'src/components/SearchBar'
import { getSearchFilterFunctions, Notifications, recalculateVisibleTable, searchOnFilteredList } from 'src/libs/utils'
import LibraryCardFormModal from 'src/components/modals/LibraryCardFormModal'
import ConfirmationModal from 'src/components/modals/ConfirmationModal'
import { LibraryCard } from 'src/libs/ajax/LibraryCard'
import { confirmModalType } from 'src/libs/libraryCardUtils'
import { LibraryCardAgreementTermsDownload } from 'src/components/LibraryCardAgreementTermsDownload'
import BroadLibraryCardAgreementLink from 'src/assets/Library_Card_Agreement_2023_ApplicationVersion.pdf'
import NihLibraryCardAgreementLink from 'src/assets/NIHLibraryCardAgreement06252025.pdf'
import { NIHDataUseCertificationAgreement } from 'src/components/external_docs/NIHDataUseCertificationAgreement'
import { processLibraryCards } from 'src/utils/LibraryCardUtils'
import { extractError } from 'src/utils/ErrorUtils'
import TableHeaderSection from 'src/components/TableHeaderSection'
import AddObjectButton from 'src/components/AddObjectButton'
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined'
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

interface LibraryCardButtonProps {
  card: SelectedLibraryCard
  showConfirmationModal: (params: ShowConfirmationModalParams) => void
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
    role: '20%',
  },
}

// column header format for table
const columnHeaderFormat = {
  email: { label: 'Email', cellStyle: { width: styles.cellWidths.email } },
  name: { label: 'Name', cellStyle: { width: styles.cellWidths.name } },
  libraryCard: { label: 'Library Card', cellStyle: { width: styles.cellWidths.libraryCard } },
  role: { label: 'Role', cellStyle: { width: styles.cellWidths.libraryCard } },
  // activeDARs: {label: 'Active DARs', cellStyle: {width: styles.cellWidths.activeDARs}}
}

const DeactivateLibraryCardButton = (props: LibraryCardButtonProps): React.JSX.Element => {
  const { card, showConfirmationModal } = props
  const message = 'Are you sure you want to deactivate this library card?'
  const title = 'Deactivate Library Card'
  return (
    <SimpleButton
      keyProp={`deactivate-card-${card.id}`}
      label="Deactivate"
      baseColor={Theme.palette.error}
      hoverStyle={{
        backgroundColor: 'rgb(194, 38,11)',
        color: 'white',
      }}
      additionalStyle={{
        padding: '2.25% 5%',
        fontSize: '1.45rem',
        fontWeight: 600,
        fontFamily: 'Montserrat',
      }}
      onClick={() => showConfirmationModal({ card, message, title, confirmType: confirmModalType.delete })}
    />
  )
}

const IssueLibraryCardButton = (props: LibraryCardButtonProps): React.JSX.Element => {
  // SO should be able to add library cards to users that are not yet in the system, so userEmail needs to be a possible value to send back
  // username can be confirmed on back-end -> if userId exists pull data from db, otherwise only save email
  const { card, showConfirmationModal } = props
  const message = (
    <div>
      {/* LCA Terms Download */}
      <LibraryCardAgreementTermsDownload />
      {'By clicking \'Confirm\' you agree to the terms of the agreements above for this user. Are you sure you want to issue this library card?'}
    </div>
  )
  const title = 'Issue Library Card'
  return (
    <SimpleButton
      keyProp={`issue-card-${card.userEmail}`}
      label="Issue"
      baseColor={Theme.palette.secondary}
      additionalStyle={{
        width: '30%',
        padding: '2.25% 5%',
        fontSize: '1.45rem',
        fontWeight: 600,
        fontFamily: 'Montserrat',
      }}
      onClick={() => showConfirmationModal({ card, message, title, confirmType: confirmModalType.issue })}
    />
  )
}

const researcherFilterFunction = getSearchFilterFunctions().signingOfficialResearchers

const LibraryCardCell = ({
  researcher,
  showConfirmationModal,
}: LibraryCardCellProps): TableCell => {
  const id = researcher.userId
  const card = researcher.libraryCard
  const button = isNil(card)
    ? IssueLibraryCardButton({
        card: {
          userId: researcher.userId,
          userEmail: researcher.email,
          userName: researcher.displayName,
        },
        showConfirmationModal,
      })
    : DeactivateLibraryCardButton({
        card: card,
        showConfirmationModal,
      })

  return {
    isComponent: true,
    id,
    style: {},
    label: 'lc-button',
    data: (
      <div
        style={{
          display: 'flex',
          justifyContent: 'left',
        }}
        key={`lc-action-cell-${id}`}
      >
        {button}
      </div>
    ),
  }
}

const roleCell = (roles: DuosUser['roles'], id: TableRowId): TableCell => {
  const roleString = chain(roles.map(role => role.name))
    .sortBy()
    .sortedUniq()
    .join(', ')
    .value()

  return {
    data: roleString.length > 0 ? roleString : '- -',
    id,
    style: {},
    label: 'user-role',
    isComponent: false,
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

const onlyResearchersWithoutCardFilter = (researcher: DuosUser): boolean => {
  return isNil(researcher.libraryCard)
}

export default function SigningOfficialTable(props: SigningOfficialTableProps): React.JSX.Element {
  const [researchers, setResearchers] = useState<DuosUser[]>(props.researchers)
  const [tableSize, setTableSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageCount, setPageCount] = useState<number>(1)
  const [filteredResearchers, setFilteredResearchers] = useState<DuosUser[]>([])
  const [visibleResearchers, setVisibleResearchers] = useState<DuosUser[]>([])
  const [selectedCard, setSelectedCard] = useState<SelectedLibraryCard | null>(null)
  const [showModal, setShowModal] = useState<boolean>(false)
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
      const { displayName, /* count = 0, */ roles } = researcher
      const email = researcher.email
      const id = researcher.userId
      return [
        displayNameCell(displayName, id),
        emailCell(email, id),
        LibraryCardCell({
          researcher,
          showConfirmationModal,
        }),
        roleCell(roles, id),
        // activeDarCountCell(count, id)
      ]
    })
  }

  const columnHeaderData = [
    columnHeaderFormat.name,
    columnHeaderFormat.email,
    columnHeaderFormat.libraryCard,
    columnHeaderFormat.role,
    // columnHeaderFormat.activeDARs -> add this back in when back-end supports this
  ]

  const showModalOnClick = (): void => {
    setSelectedCard({
      userEmail: signingOfficial.email,
      userId: signingOfficial.userId,
      userName: signingOfficial.displayName,
      institutionId: signingOfficial.institutionId,
    })
    setShowModal(true)
  }

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
    setShowModal(false)

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <TableHeaderSection
              title="Pre-authorize my Institution's Researchers with Library Cards"
              description="Use the table below to add or remove Library Cards so DUOS-registered researchers can submit DARs."
            />
            <a
              rel="noopener noreferrer"
              href="https://duos.blog/preauthorize_researchers_librarycards"
              target="_blank"
              id="so-console-info-link"
            >
              <Info fontSize="medium" />
            </a>
          </div>
          <div style={{ ...Styles.MEDIUM_DESCRIPTION, fontSize: '16px', marginTop: '1rem', marginLeft: '1.75em', textAlign: 'justify', width: '70%' }}>
            <p>
              Issuing Library Card privileges is done in accordance with the
              {' '}
              <a target="_blank" rel="noreferrer" href={BroadLibraryCardAgreementLink}>Broad Library Card Agreement</a>
              ,
              {' '}
              <a target="_blank" rel="noreferrer" href={NihLibraryCardAgreementLink}>NIH Library Card Agreement</a>
              , and
              {' '}
              <NIHDataUseCertificationAgreement className={undefined} showDownloadIcon={undefined} />
              {' '}
              and attests that researchers are a permanent employee of your institution at a level equivalent to, at a minimum, a tenure-track professor or senior researcher. This does
              {' '}
              <span style={{ fontWeight: 600 }}>not</span>
              {' '}
              include lab technicians or trainees, e.g., post-docs or graduate students. You also attest this Researcher will have oversight responsibility for others named on their DARs who will be granted access to the data.
            </p>
            <p>
              Note: NIH DACs are not currently using DUOS to review Data Access Requests (DARs). Signing Officials agree to review Library Cards for their institutions annually, and add/remove Library Cards as necessary.
            </p>
          </div>
        </div>
        <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION }}>
          <SearchBar handleSearchChange={handleSearchChange} />
          <AddObjectButton
            id="btn_addUser"
            label="ADD LIBRARY CARD"
            onClick={showModalOnClick}
            icon={<AddCircleOutlineOutlinedIcon />}
            className="button button-blue"
          />
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
      <LibraryCardFormModal
        showModal={showModal}
        createOnClick={(cards, newUser) => issueLibraryCards(cards, researchers, newUser)}
        closeModal={() => setShowModal(false)}
        users={researchers.filter(onlyResearchersWithoutCardFilter)}
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
