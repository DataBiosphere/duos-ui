import React, { useCallback, useMemo, useState } from 'react'
import { Switch } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import { Styles, Theme } from 'src/libs/theme'
import { cloneDeep, findIndex, isNil } from 'src/utils/NodashUtil'
import SimpleTable from 'src/components/SimpleTable'
import PaginationBar from 'src/components/PaginationBar'
import SearchBar from 'src/components/SearchBar'
import { calcTablePageCount, calcVisibleWindow, getSearchFilterFunctions, hasDataSubmitterRole, Notifications, ROLES } from 'src/libs/utils'
import ConfirmationModal from 'src/components/modals/ConfirmationModal'
import { LibraryCard } from 'src/libs/ajax/LibraryCard'
import { User } from 'src/libs/ajax/User'
import { LibraryCardAgreementTermsDownload } from 'src/components/LibraryCardAgreementTermsDownload'
import { processLibraryCards } from 'src/utils/LibraryCardUtils'
import { extractError } from 'src/utils/ErrorUtils'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { DuosUser, DuosUserWithInstitutionId, LibraryCard as LibraryCardModel } from 'src/types/model'
import ScrollableMarkdownContainer, { MarkdownLoadState } from 'src/components/ScrollableMarkdownContainer'

const DpaMarkdown = new URL('../../assets/DPA.md', import.meta.url).href

const statusNoticeStyle: React.CSSProperties = {
  display: 'flex',
  gap: '1rem',
  flex: 1,
  padding: '1.5rem',
  border: `1px solid ${Theme.palette.background.secondary}`,
  borderRadius: '1.2rem',
  backgroundColor: Theme.palette.background.secondary,
  color: Theme.palette.primary,
  lineHeight: 1.45,
}

const noticeIconSx = { color: Theme.palette.secondary, fontSize: '2.8rem', flex: '0 0 auto', marginTop: '0.1rem' }
const noticeGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '1.5rem',
  margin: '1.5rem 0 0 2rem',
}

// Hoisted so each row does not allocate a new sx/style object, which MUI would re-serialise per render.
const statusSwitchSx = {
  '& .MuiSwitch-switchBase.Mui-checked': { color: Theme.palette.success },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: Theme.palette.success },
}
const statusCellStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem' }
const statusLabelBase: React.CSSProperties = { fontWeight: 600, fontSize: '1.45rem', fontFamily: 'Montserrat' }
const activeStatusLabelStyle: React.CSSProperties = { ...statusLabelBase, color: Theme.palette.success }
const inactiveStatusLabelStyle: React.CSSProperties = { ...statusLabelBase, color: Theme.legacy.color }

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

/** Edited list plus the provided list it was derived from, so staleness is impossible by construction. */
interface ResearcherEdits {
  source: DuosUser[]
  researchers: DuosUser[]
}

type ConfirmationAction = 'issue-library-card' | 'deactivate-library-card' | 'issue-data-submitter' | 'remove-data-submitter'

interface ShowConfirmationModalParams {
  card: SelectedLibraryCard
  action: ConfirmationAction
}

// Title and body are derived from the action at render time rather than parked in state as JSX.
const confirmationTitles: Record<ConfirmationAction, string> = {
  'issue-library-card': 'Activate Researcher',
  'deactivate-library-card': 'Deactivate Researcher',
  'issue-data-submitter': 'Issue Data Submitter',
  'remove-data-submitter': 'Remove Data Submitter',
}

// The agreement bodies need more room than a plain confirmation prompt.
const isAgreementAction = (action: ConfirmationAction): boolean =>
  action === 'issue-library-card' || action === 'issue-data-submitter'

interface ConfirmationMessageProps {
  action: ConfirmationAction
  onAgreementLoadStateChange: (state: MarkdownLoadState) => void
}

const ConfirmationMessage = ({ action, onAgreementLoadStateChange }: Readonly<ConfirmationMessageProps>): React.JSX.Element => {
  switch (action) {
    case 'issue-library-card':
      return (
        <div>
          <LibraryCardAgreementTermsDownload />
          {'By clicking \'Confirm\' you agree to the terms of the agreements above for this user. Are you sure you want to activate this researcher?'}
        </div>
      )
    case 'deactivate-library-card':
      return <div>Are you sure you want to deactivate this researcher?</div>
    case 'issue-data-submitter':
      return (
        <div>
          <ScrollableMarkdownContainer markdown={DpaMarkdown} onLoadStateChange={onAgreementLoadStateChange} />
          Are you sure you want to make this person a Data Submitter?
        </div>
      )
    default:
      return <div>Are you sure you want to remove this Data Submitter?</div>
  }
}

interface LibraryCardCellProps {
  researcher: DuosUser
  showConfirmationModal: (params: ShowConfirmationModalParams) => void
}

type DataSubmitterCellProps = LibraryCardCellProps

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
    libraryCard: '20%',
    dataSubmitter: '20%',
  },
}

// column header format for table
const columnHeaderFormat = {
  email: { label: 'Email', cellStyle: { width: styles.cellWidths.email } },
  name: { label: 'Researcher', cellStyle: { width: styles.cellWidths.name } },
  libraryCard: { label: 'Access Status', cellStyle: { width: styles.cellWidths.libraryCard } },
  dataSubmitter: { label: 'Submitter Status', cellStyle: { width: styles.cellWidths.dataSubmitter } },
  // activeDARs: {label: 'Active DARs', cellStyle: {width: styles.cellWidths.activeDARs}}
}

const researcherFilterFunction = getSearchFilterFunctions().signingOfficialResearchers

const researcherName = (researcher: DuosUser): string => researcher.displayName ?? researcher.email

/**
 * The Submitter toggle reads `roles`, so the change is applied locally rather than relying on the
 * response to carry it — these endpoints may answer with an empty body.
 */
const applyDataSubmitterRole = (
  researchers: DuosUser[],
  userId: number,
  shouldIssue: boolean,
  updatedUser?: DuosUser,
): DuosUser[] =>
  researchers.map((researcher) => {
    if (researcher.userId !== userId) {
      return researcher
    }
    const existingRoles = researcher.roles ?? []
    const roles = shouldIssue
      ? [...existingRoles, { roleId: ROLES.dataSubmitter.roleId, name: ROLES.dataSubmitter.name, userId }]
      : existingRoles.filter(role => role.roleId !== ROLES.dataSubmitter.roleId)
    return { ...researcher, ...updatedUser, roles }
  })

const LibraryCardCell = ({
  researcher,
  showConfirmationModal,
}: LibraryCardCellProps): TableCell => {
  const id = researcher.userId
  const card = researcher.libraryCard
  const isActive = !isNil(card)

  const handleToggle = (): void => {
    if (isActive) {
      showConfirmationModal({ card, action: 'deactivate-library-card' })
    }
    else {
      showConfirmationModal({
        card: {
          userId: researcher.userId,
          userEmail: researcher.email,
          userName: researcher.displayName,
        },
        action: 'issue-library-card',
      })
    }
  }

  return {
    isComponent: true,
    id,
    style: {},
    label: 'lc-status',
    data: (
      <div style={statusCellStyle} key={`lc-status-cell-${id}`}>
        <Switch
          // Named per row so screen reader users can tell the rows apart.
          slotProps={{ input: { 'aria-label': `Access Status for ${researcherName(researcher)}` } }}
          checked={isActive}
          onChange={handleToggle}
          size="small"
          sx={statusSwitchSx}
        />
        <span style={isActive ? activeStatusLabelStyle : inactiveStatusLabelStyle}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
    ),
  }
}

const DataSubmitterCell = ({ researcher, showConfirmationModal }: DataSubmitterCellProps): TableCell => {
  const id = researcher.userId
  const isActive = hasDataSubmitterRole(researcher)

  return {
    isComponent: true,
    id,
    style: {},
    label: 'data-submitter-status',
    data: (
      <div style={statusCellStyle} key={`data-submitter-status-cell-${id}`}>
        <Switch
          // Named per row so screen reader users can tell the rows apart.
          slotProps={{ input: { 'aria-label': `Submitter Status for ${researcherName(researcher)}` } }}
          checked={isActive}
          onChange={() => showConfirmationModal({
            card: { userId: researcher.userId, userEmail: researcher.email, userName: researcher.displayName },
            action: isActive ? 'remove-data-submitter' : 'issue-data-submitter',
          })}
          size="small"
          sx={statusSwitchSx}
        />
        <span style={isActive ? activeStatusLabelStyle : inactiveStatusLabelStyle}>
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

const columnHeaderData = [
  columnHeaderFormat.name,
  columnHeaderFormat.email,
  columnHeaderFormat.libraryCard,
  columnHeaderFormat.dataSubmitter,
  // columnHeaderFormat.activeDARs -> add this back in when back-end supports this
]

const processResearcherRowData = (
  researchers: DuosUser[],
  showConfirmationModal: (params: ShowConfirmationModalParams) => void,
): TableCell[][] => {
  return researchers.map((researcher) => {
    const { displayName } = researcher
    const email = researcher.email
    const id = researcher.userId
    return [
      displayNameCell(displayName, id),
      emailCell(email, id),
      LibraryCardCell({ researcher, showConfirmationModal }),
      DataSubmitterCell({ researcher, showConfirmationModal }),
      // activeDarCountCell(count, id)
    ]
  })
}

export default function SigningOfficialTable(props: SigningOfficialTableProps): React.JSX.Element {
  // Local edits carry the provided list they were made against, so an edit is ignored once the prop
  // changes rather than having to be reset. That keeps the two from drifting out of sync.
  const [edits, setEdits] = useState<ResearcherEdits | null>(null)
  const currentEdits = edits?.source === props.researchers ? edits : null
  const researchers = currentEdits?.researchers ?? props.researchers
  const setResearchers = (next: DuosUser[]): void =>
    setEdits({ source: props.researchers, researchers: next })
  const updateResearchers = (update: (current: DuosUser[]) => DuosUser[]): void =>
    setEdits(previous => ({
      source: props.researchers,
      researchers: update(previous?.source === props.researchers ? previous.researchers : props.researchers),
    }))

  const [tableSize, setTableSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [selectedCard, setSelectedCard] = useState<SelectedLibraryCard | null>(null)
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false)
  const [searchText, setSearchText] = useState<string>('')
  const [confirmationAction, setConfirmationAction] = useState<ConfirmationAction>('deactivate-library-card')
  // The Data Submitter agreement is the attestation itself, so confirming before it renders would
  // record agreement to terms the Signing Official never saw.
  const [agreementLoadState, setAgreementLoadState] = useState<MarkdownLoadState>('loading')
  const { signingOfficial, isLoading } = props

  // Search function for SearchBar component, function defined in utils
  const handleSearchChange = useCallback((searchTerms: string) => {
    setSearchText(searchTerms)
    setCurrentPage(1)
  }, [])

  // Stable so the memoised row data below is not rebuilt on every render.
  const showConfirmationModal = useCallback(({ card, action }: ShowConfirmationModalParams): void => {
    setSelectedCard(card)
    setShowConfirmation(true)
    setConfirmationAction(action)
    // Each open re-reports its own load state, so start from scratch.
    setAgreementLoadState('loading')
  }, [])

  // Filtering and paging are derived, so a keystroke costs one render rather than a cascade of effects.
  const filteredResearchers = useMemo(() => {
    const terms = searchText.split(' ').filter(term => term.length > 0)
    return terms.reduce((list, term) => researcherFilterFunction(term, list), researchers)
  }, [researchers, searchText])

  const pageCount = useMemo(() => calcTablePageCount(tableSize, filteredResearchers), [tableSize, filteredResearchers])
  // Clamped during render rather than corrected by an effect that also depends on what it sets.
  const visiblePage = Math.min(currentPage, pageCount)
  const visibleResearchers = useMemo(
    () => calcVisibleWindow(visiblePage, tableSize, filteredResearchers),
    [visiblePage, tableSize, filteredResearchers],
  )

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
      currentPage={visiblePage}
      tableSize={tableSize}
      goToPage={goToPage}
      changeTableSize={changeTableSize}
    />
  )

  // Memoised so a re-render that changes neither the visible rows nor the handler reuses the cells.
  const rowData = useMemo(
    () => processResearcherRowData(visibleResearchers, showConfirmationModal),
    [visibleResearchers, showConfirmationModal],
  )

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

  const updateDataSubmitter = async (selectedCard: SelectedLibraryCard, shouldIssue: boolean): Promise<void> => {
    const { userId, userName, userEmail } = selectedCard
    const messageName = userName ?? userEmail
    try {
      const updatedUser = shouldIssue
        ? await User.addRoleToUser(userId, ROLES.dataSubmitter.roleId)
        : await User.deleteRoleFromUser(userId, ROLES.dataSubmitter.roleId)
      updateResearchers(current => applyDataSubmitterRole(current, userId, shouldIssue, updatedUser))
      setShowConfirmation(false)
      Notifications.showSuccess({ text: `${shouldIssue ? 'Issued' : 'Removed'} ${messageName} ${shouldIssue ? 'as' : 'as a'} Data Submitter` })
    }
    catch (error) {
      Notifications.showError({ text: `Error ${shouldIssue ? 'issuing' : 'removing'} ${messageName} as a Data Submitter: ${extractError(error)}` })
    }
  }

  const handleConfirm = (card: SelectedLibraryCard): Promise<void> => {
    switch (confirmationAction) {
      case 'issue-library-card':
        return issueLibraryCards([card], researchers)
      case 'deactivate-library-card':
        return deactivateLibraryCard(card, researchers)
      default:
        return updateDataSubmitter(card, confirmationAction === 'issue-data-submitter')
    }
  }

  return (
    <div style={{ ...Styles.PAGE }}>
      <div style={{ marginLeft: '-7.5%' }}>
        <div>
          <TableHeaderSection
            title="Researcher Status"
            description="Use the table below to change the active status of your institution's researchers."
          />
          <div style={noticeGridStyle}>
            <div style={statusNoticeStyle}>
              <InfoOutlinedIcon aria-hidden="true" sx={noticeIconSx} />
              <div>
                Deactivating a researcher&apos;s <b>Access Status</b> will disable them from submitting access requests, and suspend their access to any data approved by a DAC in DUOS.<br />
                Researchers who log into DUOS with a valid institutional email will automatically be Active for <b>Access Status</b>, since subsequent requests will require Signing Official involvement.
              </div>
            </div>
            <div style={statusNoticeStyle}>
              <InfoOutlinedIcon aria-hidden="true" sx={noticeIconSx} />
              <div>
                By issuing <b>Submitter Status</b>, you are authorizing researchers from your institution to register and share data in DUOS. Data registered in DUOS can be either <b>Open Access</b> or <b>Controlled Access</b>.<br /><br />
                Controlled access data registered in DUOS can be managed by a DAC within DUOS or by an external system that the dataset information in DUOS links to. To register controlled access data with a DAC in DUOS, the data submitter may need to provide the receiving DAC with documentation and/or agreements. These agreements can be submitted during the DUOS registration process or handled externally through direct communication with the DAC. DUOS is not responsible for the content, review, offer, or acceptance of such agreements.
              </div>
            </div>
          </div>
        </div>
        <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION }}>
          <SearchBar handleSearchChange={handleSearchChange} />
        </div>
      </div>

      <SimpleTable
        isLoading={isLoading}
        rowData={rowData}
        columnHeaders={columnHeaderData}
        styles={styles}
        tableSize={tableSize}
        paginationBar={paginationBar}
      />
      {selectedCard !== null && (
        <ConfirmationModal
          showConfirmation={showConfirmation}
          closeConfirmation={() => setShowConfirmation(false)}
          title={confirmationTitles[confirmationAction]}
          // The agreement modals require a larger view than a plain confirmation prompt
          styleOverride={isAgreementAction(confirmationAction) ? { minWidth: '725px', minHeight: '475px' } : {}}
          message={<ConfirmationMessage action={confirmationAction} onAgreementLoadStateChange={setAgreementLoadState} />}
          header={`${selectedCard.userName ?? selectedCard.userEmail} - `}
          confirmDisabled={confirmationAction === 'issue-data-submitter' && agreementLoadState !== 'loaded'}
          onConfirm={() => handleConfirm(selectedCard)}
        />
      )}
    </div>
  )
}
