import React, { useCallback, useEffect, useRef, useState } from 'react'
import { cloneDeep, findIndex } from 'lodash'
import { Styles } from 'src/libs/theme'
import { DAR } from 'src/libs/ajax/DAR'
import { Collections } from 'src/libs/ajax/Collections'
import {
  DarCollectionTable,
} from 'src/components/dar_collection_table/DarCollectionTable'
import { getSearchFilterFunctions, Notifications, searchOnFilteredList, USER_ROLES } from 'src/libs/utils'
import { consoleTypes } from 'src/utils/DarCollectionUtils'
import { useResponsiveDarCollectionColumns } from 'src/hooks/useResponsiveDarCollectionColumns'
import SearchBar from 'src/components/SearchBar'
import BroadLibraryCardAgreementLink from 'src/assets/Library_Card_Agreement_2023_ApplicationVersion.pdf'
import NihLibraryCardAgreementLink from 'src/assets/NIHLibraryCardAgreement06252025.pdf'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'

const filterFn = getSearchFilterFunctions().darCollections

export default function ResearcherConsole() {
  usePageTitle('DAR Requests')
  const [isLoading, setIsLoading] = useState(true)
  const [researcherCollections, setResearcherCollections] = useState()
  const [filteredList, setFilteredList] = useState()
  const searchRef = useRef('')

  // Get responsive columns for researcher console
  const responsiveColumns = useResponsiveDarCollectionColumns(consoleTypes.RESEARCHER)

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
      await Collections.cancelCollection(darCollectionId, USER_ROLES.researcher)
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
    const targetIndex = findIndex(collectionsClone, (draft) => {
      return draft.referenceIds[0] === referenceId
    })

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
      <div>
        <TableHeaderSection
          title="My Data Access Requests"
          description="Select and manage Data Access Requests and Drafts below"
        />
        <div style={{ ...Styles.MEDIUM_DESCRIPTION, fontSize: '16px', marginTop: '1rem', marginLeft: '1.75em', textAlign: 'justify' }}>
          <p>By submitting a DAR in DUOS you agree to the
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
          </p>
        </div>
      </div>
      <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION }}>
        <SearchBar handleSearchChange={handleSearchChange} searchRef={searchRef} />
      </div>
      <div className="table-container">
        <DarCollectionTable
          key="researcher-dar-table"
          collections={filteredList}
          columns={responsiveColumns}
          isLoading={isLoading}
          cancelCollection={cancelCollection}
          reviseCollection={reviseCollection}
          deleteDraft={deleteDraft}
          consoleType={consoleTypes.RESEARCHER}
        />
      </div>
    </div>
  )
}
