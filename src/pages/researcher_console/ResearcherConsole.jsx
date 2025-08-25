import React, { useCallback, useEffect, useRef, useState } from 'react'
import { cloneDeep, findIndex } from 'lodash/fp'
import { Styles } from 'src/libs/theme'
import { DAR } from 'src/libs/ajax/DAR'
import { Collections } from 'src/libs/ajax/Collections'
import {
  DarCollectionTable,
} from 'src/components/dar_collection_table/DarCollectionTable'
import accessIcon from 'src/images/lock-icon.png'
import { getSearchFilterFunctions, Notifications, searchOnFilteredList, USER_ROLES } from 'src/libs/utils'
import { consoleTypes, DarCollectionTableColumnOptions } from 'src/utils/DarCollectionUtils'
import SearchBar from 'src/components/SearchBar'
import BroadLibraryCardAgreementLink from 'src/assets/Library_Card_Agreement_2023_ApplicationVersion.pdf'
import NihLibraryCardAgreementLink from 'src/assets/NIHLibraryCardAgreement06252025.pdf'

const filterFn = getSearchFilterFunctions().darCollections

export default function ResearcherConsole() {
  const [isLoading, setIsLoading] = useState(true)
  const [researcherCollections, setResearcherCollections] = useState()
  const [filteredList, setFilteredList] = useState()
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const searchRef = useRef('')

  // Define base columns array
  const baseColumns = [
    DarCollectionTableColumnOptions.DAR_CODE,
    DarCollectionTableColumnOptions.NAME,
    DarCollectionTableColumnOptions.SUBMISSION_DATE,
    DarCollectionTableColumnOptions.DATASET_COUNT,
    DarCollectionTableColumnOptions.EXPIRES_AT,
    DarCollectionTableColumnOptions.STATUS,
    DarCollectionTableColumnOptions.ACTIONS,
  ]

  // Define responsive columns based on window width
  const getResponsiveColumns = (width) => {
    // Hide dataset count column if viewport width < 1200px
    if (width < 1200) {
      return baseColumns.filter(column => column !== DarCollectionTableColumnOptions.DATASET_COUNT)
    }
    return baseColumns
  }

  // Initialize columns based on current window width
  const [responsiveColumns, setResponsiveColumns] = useState(() => getResponsiveColumns(window.innerWidth))

  // Handle window resize for responsive column hiding
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth
      setWindowWidth(newWidth)
      setResponsiveColumns(getResponsiveColumns(newWidth))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // callback function passed to search bar to perform filter
  const handleSearchChange = useCallback(() => searchOnFilteredList(
    searchRef.current.value,
    researcherCollections,
    filterFn,
    setFilteredList,
  ), [researcherCollections])

  // sequence of init events on component load
  useEffect(() => {
    const init = async () => {
      const collections = await Collections.getCollectionSummariesByRoleName(USER_ROLES.researcher)
      setResearcherCollections(collections)
      setFilteredList(collections)
      setIsLoading(false)
    }
    init()
  }, [])

  // sequence of events when data is updated (perform new filter based on search query)
  useEffect(() => {
    searchOnFilteredList(
      searchRef.current.value,
      researcherCollections,
      filterFn,
      setFilteredList,
    )
  }, [researcherCollections])

  // cancel collection function, passed to collections table to be used in buttons
  const cancelCollection = async (darCollection) => {
    try {
      const { darCollectionId, darCode } = darCollection
      await Collections.cancelCollection(darCollectionId)
      const updatedCollection = await Collections.getCollectionSummaryByRoleNameAndId({
        roleName: USER_ROLES.researcher,
        id: darCollectionId,
      })
      const targetIndex = researcherCollections.findIndex(collection =>
        collection.darCollectionId === darCollectionId)
      if (targetIndex < 0) {
        throw new Error('Error: Could not find target Data Access Request')
      }
      const clonedCollections = cloneDeep(researcherCollections)
      clonedCollections[targetIndex] = updatedCollection
      setResearcherCollections(clonedCollections)
      Notifications.showSuccess({ text: `Deleted Data Access Request ${darCode}` })
    }
    catch (_error) {
      Notifications.showError({
        text: 'Error: Cannot cancel target Data Access Request',
      })
    }
  }

  // revise collection function, passed to collections table to be used in buttons
  const reviseCollection = async (darCollection) => {
    try {
      const { darCollectionId, darCode } = darCollection
      const draftCollection = await Collections.reviseCollection(darCollectionId)
      const targetIndex = researcherCollections.findIndex(collection =>
        collection.darCollectionId === darCollectionId)
      if (targetIndex < 0) {
        throw new Error('Error: Could not find target Data Access Request')
      }
      // remove resubmitted collection from DAR Collection table
      const clonedCollections = cloneDeep(researcherCollections)
      clonedCollections[targetIndex] = draftCollection
      setResearcherCollections(clonedCollections)
      Notifications.showSuccess({ text: `Revising Data Access Request ${darCode}` })
    }
    catch (_error) {
      Notifications.showError({
        text: 'Error: Cannot revise target Data Access Request',
      })
    }
  }

  // Draft delete, by referenceIds
  const deleteDraftById = async ({ referenceId }) => {
    const collectionsClone = cloneDeep(researcherCollections)
    await DAR.deleteDar(referenceId)
    const targetIndex = findIndex((draft) => {
      return draft.referenceIds[0] === referenceId
    })(collectionsClone)

    // if deleted index, remove it from the collections array
    collectionsClone.splice(targetIndex, 1)
    setResearcherCollections(collectionsClone)

    return targetIndex
  }

  // Draft delete, passed down to draft table to be used with delete button
  const deleteDraft = async ({ referenceIds, darCode }) => {
    try {
      const targetIndex = deleteDraftById({ referenceId: referenceIds[0] })
      if (targetIndex === -1) {
        Notifications.showError({ text: 'Error processing delete request' })
      }
      else {
        Notifications.showSuccess({ text: `Deleted Data Access Request Draft ${darCode}` })
      }
    }
    catch (_error) {
      Notifications.showError({
        text: `Failed to delete Data Access Request Draft ${darCode}`,
      })
    }
  }

  return (
    <div style={Styles.PAGE}>
      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0px -3%' }}>
        <div className="left-header-section" style={Styles.LEFT_HEADER_SECTION}>
          <div style={Styles.ICON_CONTAINER}>
            <img id="access-icon" src={accessIcon} alt="Access Icon" style={Styles.HEADER_IMG} />
          </div>
          <div style={Styles.HEADER_CONTAINER}>
            <div style={Styles.TITLE}>My Data Access Requests</div>
            <div style={Object.assign({}, Styles.MEDIUM_DESCRIPTION, { fontSize: '18px' })}>
              Select and manage Data Access Requests and Drafts below
            </div>
            <div style={Object.assign({}, Styles.MEDIUM_DESCRIPTION, { fontSize: '18px' })}>
              By submitting a DAR in DUOS you agree to the
              {' '}
              <a target="_blank" rel="noreferrer" href={BroadLibraryCardAgreementLink}>
                Broad
              </a>
              {' '}
              and
              {' '}
              <a target="_blank" rel="noreferrer" href={NihLibraryCardAgreementLink}>
                NIH
              </a>
              {' '}
              Library Card Agreements.
            </div>
          </div>
        </div>
        <SearchBar handleSearchChange={handleSearchChange} searchRef={searchRef} />
      </div>
      <div className="table-container">
        {responsiveColumns.length > 0 && (
          <DarCollectionTable
            key={`dar-table-${responsiveColumns.length}-${responsiveColumns.join('-')}`}
            collections={filteredList}
            columns={responsiveColumns}
            isLoading={isLoading}
            cancelCollection={cancelCollection}
            reviseCollection={reviseCollection}
            deleteDraft={deleteDraft}
            consoleType={consoleTypes.RESEARCHER}
          />
        )}
      </div>
    </div>
  )
}
