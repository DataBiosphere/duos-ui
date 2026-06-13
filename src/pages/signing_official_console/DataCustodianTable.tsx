import React, { useState, useEffect, useCallback } from 'react'
import { Styles, Theme } from 'src/libs/theme'
import { chain, cloneDeep, findIndex, isNil } from 'src/utils/NodashUtil'
import SimpleTable from 'src/components/SimpleTable'
import SimpleButton from 'src/components/SimpleButton'
import PaginationBar from 'src/components/PaginationBar'
import SearchBar from 'src/components/SearchBar'
import {
  Notifications,
  recalculateVisibleTable,
  getSearchFilterFunctions,
  searchOnFilteredList,
  hasDataSubmitterRole,
} from 'src/libs/utils'
import { User } from 'src/libs/ajax/User'
import ConfirmationModal from 'src/components/modals/ConfirmationModal'
import ScrollableMarkdownContainer from 'src/components/ScrollableMarkdownContainer'
import { confirmModalType } from 'src/libs/libraryCardUtils'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { DuosUser, UserRole } from 'src/types/model'

const DpaMarkdown = new URL('../../assets/DPA.md', import.meta.url).href

type TableRowId = number | string

type DataCustodianUser = Omit<Partial<DuosUser>, 'roles'> & {
  id?: TableRowId
  userId?: number
  displayName?: string
  email: string
  roles: Array<Partial<UserRole> & { name: string }>
  institutionId?: number
}

interface DataCustodianTableProps {
  readonly signingOfficial: DuosUser & { institutionId: number }
  readonly isLoading?: boolean
  readonly researchers?: DataCustodianUser[]
}

interface ShowConfirmationModalParams {
  researcher: DataCustodianUser
  message: string
  title: string
  confirmType: string
}

interface ButtonProps {
  researcher: DataCustodianUser
  showConfirmationModal: (params: ShowConfirmationModalParams) => void
}

interface TableCell {
  data: React.ReactNode
  id?: TableRowId
  style?: React.CSSProperties
  label: string
  isComponent?: boolean
}

// Styles specific to this table
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
    email: '25%',
    name: '20%',
    libraryCard: '25%',
    institution: '20%',
  },
}

// column header format for table
const columnHeaderFormat = {
  email: { label: 'Email', cellStyle: { width: styles.cellWidths.email } },
  name: { label: 'Name', cellStyle: { width: styles.cellWidths.name } },
  role: { label: 'Role', cellStyle: { width: styles.cellWidths.libraryCard } },
  institution: { label: 'Submitter Status', cellStyle: { width: styles.cellWidths.institution } },
}

const RemoveDataCustodianButton = (props: ButtonProps): React.JSX.Element => {
  const { researcher, showConfirmationModal } = props
  const message = 'Are you sure you want to remove this Data Submitter?'
  const title = 'Remove Data Submitter'
  return (
    <SimpleButton
      key={`remove-custodian-${researcher.id}`}
      label="Remove"
      baseColor={Theme.palette.error}
      additionalStyle={{
        width: '30%',
        padding: '2%',
        fontSize: '1.45rem',
      }}
      onClick={() =>
        showConfirmationModal({
          researcher,
          message,
          title,
          confirmType: confirmModalType.delete,
        })}
    />
  )
}

const IssueDataCustodianButton = (props: ButtonProps): React.JSX.Element => {
  const { researcher, showConfirmationModal } = props
  const message = 'Are you sure you want to make this person a Data Submitter?'
  const title = 'Issue Data Submitter'
  return (
    <SimpleButton
      key={`issue-card-${researcher.email}`}
      label="Issue"
      baseColor={Theme.palette.secondary}
      additionalStyle={{
        width: '30%',
        padding: '2%',
        fontSize: '1.45rem',
      }}
      onClick={() =>
        showConfirmationModal({
          researcher,
          message,
          title,
          confirmType: confirmModalType.issue,
        })}
    />
  )
}

const researcherFilterFunction = getSearchFilterFunctions().signingOfficialResearchers

const SubmitterCell = ({
  researcher,
  showConfirmationModal,
}: ButtonProps): TableCell => {
  const id = researcher.userId || researcher.email
  const button = hasDataSubmitterRole(researcher as DuosUser)
    ? RemoveDataCustodianButton({
        researcher,
        showConfirmationModal,
      })
    : IssueDataCustodianButton({
        researcher,
        showConfirmationModal,
      })
  return {
    isComponent: true,
    id,
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

const roleCell = (roles: DataCustodianUser['roles'], id: TableRowId | undefined): TableCell => {
  const roleString = chain(roles.map(role => role.name))
    .sortBy()
    .sortedUniq()
    .join(', ')
    .value()

  return {
    data: roleString || '- -',
    id,
    style: {},
    label: 'user-role',
  }
}

const emailCell = (email: string | undefined, id: TableRowId | undefined): TableCell => {
  return {
    data: email || '- -',
    id,
    style: {},
    label: 'user-email',
  }
}

const displayNameCell = (displayName: string | undefined, id: TableRowId | undefined): TableCell => {
  return {
    data: displayName || 'Invite sent, pending registration',
    id,
    style: {},
    label: 'display-name',
  }
}

export default function DataCustodianTable(props: DataCustodianTableProps): React.JSX.Element {
  const [researchers, setResearchers] = useState<DataCustodianUser[]>(props.researchers || [])
  const [tableSize, setTableSize] = useState<number>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageCount, setPageCount] = useState<number>(1)
  const [filteredResearchers, setFilteredResearchers] = useState<DataCustodianUser[]>([])
  const [visibleResearchers, setVisibleResearchers] = useState<DataCustodianUser[]>([])
  const [selectedResearcher, setSelectedResearcher] = useState<DataCustodianUser | undefined>()
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false)
  const [searchText, setSearchText] = useState<string>('')
  const [confirmationModalMsg, setConfirmationModalMsg] = useState<string>('')
  const [confirmationTitle, setConfirmationTitle] = useState<string>('')
  const [confirmType, setConfirmType] = useState<string>(confirmModalType.delete)
  const { signingOfficial, isLoading } = props

  const onSearchChange = (value: string): void => {
    setSearchText(value)
    searchOnFilteredList(
      value,
      researchers,
      researcherFilterFunction as (term: string, list: DataCustodianUser[]) => DataCustodianUser[],
      setFilteredResearchers,
    )
    setCurrentPage(1)
  }

  const showConfirmationModal = ({
    researcher,
    message,
    title,
    confirmType,
  }: ShowConfirmationModalParams): void => {
    setSelectedResearcher(researcher)
    setShowConfirmation(true)
    setConfirmationModalMsg(message)
    setConfirmationTitle(title)
    setConfirmType(confirmType)
  }

  // init hook, need to make ajax calls here
  useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        setResearchers(props.researchers || [])
      }
      catch {
        Notifications.showError({
          text: 'Failed to initialize researcher table',
        })
      }
    }
    void init()
  }, [props.researchers])

  useEffect(() => {
    searchOnFilteredList(
      searchText,
      researchers,
      researcherFilterFunction as (term: string, list: DataCustodianUser[]) => DataCustodianUser[],
      setFilteredResearchers,
    )
  }, [researchers, searchText])

  useEffect(() => {
    recalculateVisibleTable({
      tableSize,
      pageCount,
      filteredList: filteredResearchers,
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleResearchers,
    }).catch(() => {
      Notifications.showError({
        text: 'Failed to update researcher table',
      })
    })
  }, [tableSize, pageCount, filteredResearchers, currentPage])

  const goToPage = useCallback(
    (value: number) => {
      if (value >= 1 && value <= pageCount) {
        setCurrentPage(value)
      }
    },
    [pageCount],
  )

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

  const processResearcherRowData = (researchers: DataCustodianUser[] = []): TableCell[][] => {
    return researchers.map((researcher) => {
      const { displayName, email, roles } = researcher
      const id = researcher.userId || email
      return [
        displayNameCell(displayName, id),
        emailCell(email, id),
        SubmitterCell({
          researcher,
          showConfirmationModal,
        }),
        roleCell(roles, id),
      ]
    })
  }

  const columnHeaderData = [
    columnHeaderFormat.name,
    columnHeaderFormat.email,
    columnHeaderFormat.institution,
    columnHeaderFormat.role,
  ]

  const issueCustodian = async (selectedResearcher: DataCustodianUser | undefined, researchers: DataCustodianUser[]): Promise<void> => {
    if (!selectedResearcher) {
      return
    }
    let messageName = selectedResearcher.displayName || selectedResearcher.email
    const { userId, displayName } = selectedResearcher
    try {
      const updatedResearcher = await User.addRoleToUser(userId || 0, 8)
      const listCopy = cloneDeep(researchers)
      const targetIndex = findIndex(listCopy,
        researcher => userId === researcher.userId,
      )
      if (targetIndex === -1) {
        const targetResearcher = selectedResearcher
        listCopy.unshift(targetResearcher)
        messageName = targetResearcher.email
      }
      else {
        listCopy[targetIndex] = updatedResearcher
        messageName = displayName || selectedResearcher.email
      }

      setResearchers(listCopy)
      setShowConfirmation(false)
      Notifications.showSuccess({
        text: `Issued ${messageName} as Data Submitter`,
      })
    }
    catch {
      Notifications.showError({
        text: `Error issuing ${messageName} as Data Submitter`,
      })
    }
  }

  const removeDataCustodian = async (selectedResearcher: DataCustodianUser | undefined, researchers: DataCustodianUser[]): Promise<void> => {
    if (!selectedResearcher) {
      return
    }
    const { displayName, email, userId } = selectedResearcher
    const updatedResearcher = await User.deleteRoleFromUser(userId || 0, 8)
    const searchableKey = isNil(userId) ? 'email' : 'userId'
    const listCopy = cloneDeep(researchers)
    const messageName = displayName || email
    try {
      const targetIndex = findIndex(listCopy, (researcher: DataCustodianUser) => {
        return !isNil(researcher) && selectedResearcher[searchableKey] === researcher[searchableKey]
      })
      if (
        isNil(userId)
        || researchers[targetIndex]?.institutionId !== signingOfficial.institutionId
      ) {
        listCopy.splice(targetIndex, 1)
      }
      else {
        listCopy[targetIndex] = updatedResearcher
      }
      setResearchers(listCopy)
      setShowConfirmation(false)
      Notifications.showSuccess({
        text: `Removed ${messageName} as a Data Submitter`,
      })
    }
    catch {
      Notifications.showError({
        text: `Error removing ${messageName} as a Data Submitter`,
      })
    }
  }

  const dpaContent = ScrollableMarkdownContainer({ markdown: DpaMarkdown })

  return (
    <div style={Styles.PAGE}>
      <div style={{ marginLeft: '-7.5%' }}>
        <div>
          <TableHeaderSection
            title="My Institution’s Data Submitters"
            description="Issue or remove Data Submitter privileges."
          />
          <div style={{ ...Styles.MEDIUM_DESCRIPTION, fontSize: '16px', marginTop: '1rem', marginLeft: '1.75em', textAlign: 'justify', width: '70%' }}>
            <p>By issuing Data Submitter permissions, you are authorizing researchers from your institution to register and share data in DUOS. Data registered in DUOS can be either <b>Open Access</b> or <b>Controlled Access</b>.</p>
            <p>Controlled access data registered in DUOS can be managed by a DAC within DUOS or by an external system that the dataset information in DUOS links to. To register controlled access data with a DAC in DUOS, the data submitter may need to provide the receiving DAC with documentation and/or agreements. These agreements can be submitted during the DUOS registration process or handled externally through direct communication with the DAC. DUOS is not responsible for the content, review, offer, or acceptance of such agreements.</p>
          </div>
        </div>
        <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION }}>
          <SearchBar
            handleSearchChange={onSearchChange}
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
      <ConfirmationModal
        showConfirmation={showConfirmation}
        closeConfirmation={() => setShowConfirmation(false)}
        title={confirmationTitle}
        styleOverride={
          confirmType === confirmModalType.issue
            ? { minWidth: '725px', minHeight: '475px' }
            : {}
        }
        message={
          confirmType === confirmModalType.issue
            ? (
                <div>
                  {dpaContent}
                  {confirmationModalMsg}
                </div>
              )
            : (
                confirmationModalMsg
              )
        }
        header={`${
          selectedResearcher?.displayName || selectedResearcher?.email || ''
        } - ${
          isNil(selectedResearcher?.institution)
            ? ''
            : selectedResearcher.institution.name
        }`}
        onConfirm={() =>
          confirmType === confirmModalType.issue
            ? issueCustodian(selectedResearcher, researchers)
            : removeDataCustodian(selectedResearcher, researchers)}
      />
    </div>
  )
}
