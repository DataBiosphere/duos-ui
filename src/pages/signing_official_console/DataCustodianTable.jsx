import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Styles, Theme } from 'src/libs/theme'
import { chain, cloneDeep, findIndex, isNil } from 'lodash'
import SimpleTable from 'src/components/SimpleTable'
import SimpleButton from 'src/components/SimpleButton'
import PaginationBar from 'src/components/PaginationBar'
import SearchBar from 'src/components/SearchBar'
import {
  Notifications,
  tableSearchHandler,
  recalculateVisibleTable,
  getSearchFilterFunctions,
  searchOnFilteredList,
  hasDataSubmitterRole,
} from 'src/libs/utils'
import { User } from 'src/libs/ajax/User'
import ConfirmationModal from 'src/components/modals/ConfirmationModal'
import ScrollableMarkdownContainer from 'src/components/ScrollableMarkdownContainer'
import DpaMarkdown from 'src/assets/DPA.md'
import { confirmModalType } from 'src/libs/libraryCardUtils'
import TableHeaderSection from 'src/components/TableHeaderSection'
import PropTypes from 'prop-types'

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
  columnStyle: Object.assign({}, Styles.TABLE.HEADER_ROW, {
    justifyContent: 'space-between',
  }),
  cellWidths: {
    email: '25%',
    name: '20%',
    libraryCard: '25%',
    institution: '20%',
    // activeDARs: '10%'
  },
}

// column header format for table
const columnHeaderFormat = {
  email: { label: 'Email', cellStyle: { width: styles.cellWidths.email } },
  name: { label: 'Name', cellStyle: { width: styles.cellWidths.name } },
  role: { label: 'Role', cellStyle: { width: styles.cellWidths.libraryCard } },
  institution: { label: 'Submitter Status', cellStyle: { width: styles.cellWidths.institution } },
}

const RemoveDataCustodianButton = (props) => {
  const { researcher = {}, showConfirmationModal } = props
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

const IssueDataCustodianButton = (props) => {
  const { researcher, showConfirmationModal } = props
  const message = 'Are you sure you want to make this person a Data Submitter?'
  const title = 'Issue Data Submitter'
  return (
    <SimpleButton
      key={`issue-card-${researcher.userEmail}`}
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
}) => {
  const id = researcher.userId || researcher.email
  const button = hasDataSubmitterRole(researcher)
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

const roleCell = (roles, id) => {
  const roleString = chain(roles)
    .map(role => role.name)
    .sortBy(name => name)
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

const emailCell = (email, id) => {
  return {
    data: email || '- -',
    id,
    style: {},
    label: 'user-email',
  }
}

const displayNameCell = (displayName, id) => {
  return {
    data: displayName || 'Invite sent, pending registration',
    id,
    style: {},
    label: 'display-name',
  }
}

export default function DataCustodianTable(props) {
  const [researchers, setResearchers] = useState(props.researchers || [])
  const [tableSize, setTableSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [filteredResearchers, setFilteredResearchers] = useState([])
  const [visibleResearchers, setVisibleResearchers] = useState([])
  const [selectedResearcher, setSelectedResearcher] = useState({})
  const [showConfirmation, setShowConfirmation] = useState(false)
  const searchRef = useRef('')
  const [confirmationModalMsg, setConfirmationModalMsg] = useState('')
  const [confirmationTitle, setConfirmationTitle] = useState('')
  const [confirmType, setConfirmType] = useState(confirmModalType.delete)
  const { signingOfficial, isLoading } = props

  const handleSearchChange = tableSearchHandler(
    researchers,
    setFilteredResearchers,
    setCurrentPage,
    'signingOfficialResearchers',
  )

  const showConfirmationModal = ({
    researcher,
    message,
    title,
    confirmType,
  }) => {
    setSelectedResearcher(researcher)
    setShowConfirmation(true)
    setConfirmationModalMsg(message)
    setConfirmationTitle(title)
    setConfirmType(confirmType)
  }

  // init hook, need to make ajax calls here
  useEffect(() => {
    const init = async () => {
      try {
        setResearchers(props.researchers)
      }
      catch (_error) {
        Notifications.showError({
          text: 'Failed to initialize researcher table',
        })
      }
    }
    init()
  }, [props.researchers])

  useEffect(() => {
    searchOnFilteredList(
      searchRef.current.value,
      researchers,
      researcherFilterFunction,
      setFilteredResearchers,
    )
  }, [researchers])

  useEffect(() => {
    recalculateVisibleTable({
      tableSize,
      pageCount,
      filteredList: filteredResearchers,
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleResearchers,
    })
  }, [tableSize, pageCount, filteredResearchers, currentPage])

  const goToPage = useCallback(
    (value) => {
      if (value >= 1 && value <= pageCount) {
        setCurrentPage(value)
      }
    },
    [pageCount],
  )

  const changeTableSize = useCallback((value) => {
    if (value > 0 && !Number.isNaN(parseInt(value))) {
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

  const processResearcherRowData = (researchers = []) => {
    return researchers.map((researcher) => {
      const { displayName, email, id, roles } = researcher
      return [
        displayNameCell(displayName, id),
        emailCell(email, id),
        SubmitterCell({
          researcher,
          showConfirmationModal,
          institutionId: signingOfficial.institutionId,
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

  const issueCustodian = async (selectedResearcher, researchers) => {
    let messageName
    const { userId, displayName } = selectedResearcher
    try {
      const updatedResearcher = await User.addRoleToUser(userId, 8)
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
        messageName = displayName
      }

      setResearchers(listCopy)
      setShowConfirmation(false)
      Notifications.showSuccess({
        text: `Issued ${messageName} as Data Submitter`,
      })
    }
    catch (_error) {
      Notifications.showError({
        text: `Error issuing ${messageName} as Data Submitter`,
      })
    }
  }

  const removeDataCustodian = async (selectedResearcher, researchers) => {
    const { displayName, email, userId } = selectedResearcher
    const updatedResearcher = await User.deleteRoleFromUser(userId, 8)
    const searchableKey = !isNil(userId) ? 'userId' : 'email'
    const listCopy = cloneDeep(researchers)
    const messageName = displayName || email
    try {
      const targetIndex = findIndex(listCopy, (researcher) => {
        return !isNil(researcher) && selectedResearcher[searchableKey] === researcher[searchableKey]
      })
      if (
        isNil(userId)
        || researchers[targetIndex].institutionId !== signingOfficial.institutionId
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
    catch (_error) {
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
            handleSearchChange={handleSearchChange}
            searchRef={searchRef}
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
          selectedResearcher.displayName || selectedResearcher.email
        } - ${
          !isNil(selectedResearcher.institution)
            ? selectedResearcher.institution.name
            : ''
        }`}
        onConfirm={() =>
          confirmType === confirmModalType.issue
            ? issueCustodian(selectedResearcher, researchers)
            : removeDataCustodian(selectedResearcher, researchers)}
      />
    </div>
  )
}

DataCustodianTable.propTypes = {
  signingOfficial: PropTypes.shape({
    institutionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
  isLoading: PropTypes.bool,
  researchers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      userId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      displayName: PropTypes.string,
      email: PropTypes.string,
      roles: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string,
        }),
      ),
      institution: PropTypes.shape({
        name: PropTypes.string,
      }),
    }),
  ),
}

// Default props
DataCustodianTable.defaultProps = {
  isLoading: false,
  researchers: [],
}
