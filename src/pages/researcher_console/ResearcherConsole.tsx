import React, { useCallback, useEffect, useState } from 'react'
import { cloneDeep, findIndex } from 'src/utils/NodashUtil'
import { Styles } from 'src/libs/theme'
import { DAR } from 'src/libs/ajax/DAR'
import { Collections } from 'src/libs/ajax/Collections'
import { DarCollectionTable } from 'src/components/dar_collection_table/DarCollectionTable'
import { getSearchFilterFunctions, Notifications, searchOnFilteredList, USER_ROLES } from 'src/libs/utils'
import { consoleTypes } from 'src/utils/DarCollectionUtils'
import { useResponsiveDarCollectionColumns } from 'src/hooks/useResponsiveDarCollectionColumns'
import SearchBar from 'src/components/SearchBar'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { DarCollectionSummary } from 'src/types/model'

const filterFn = getSearchFilterFunctions().darCollections

export default function ResearcherConsole() {
  usePageTitle('Data Acccess Requests')
  const [isLoading, setIsLoading] = useState(true)
  const [researcherCollections, setResearcherCollections] = useState<DarCollectionSummary[]>([])
  const [filteredList, setFilteredList] = useState<DarCollectionSummary[]>([])
  const [searchText, setSearchText] = useState('')

  const responsiveColumns = useResponsiveDarCollectionColumns(consoleTypes.RESEARCHER)

  const handleSearchChange = useCallback((terms: string) => setSearchText(terms), [])

  useEffect(() => {
    searchOnFilteredList(searchText, researcherCollections, filterFn, setFilteredList)
  }, [searchText, researcherCollections])

  useEffect(() => {
    const init = async () => {
      try {
        const collections = await Collections.getCollectionSummariesByRoleName(USER_ROLES.researcher)
        setResearcherCollections(collections)
        setFilteredList(collections)
        setIsLoading(false)
      }
      catch {
        Notifications.showError({ text: 'Error: Failed to load Data Access Requests' })
        setIsLoading(false)
      }
    }
    void init()
  }, [])

  const fetchAndUpdateCollection = async (darCollectionId: number) => {
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
  }

  const cancelCollection = async (darCollection: DarCollectionSummary) => {
    try {
      const { darCollectionId, darCode } = darCollection
      await Collections.cancelCollection(darCollectionId, USER_ROLES.researcher)
      await fetchAndUpdateCollection(darCollectionId)
      Notifications.showSuccess({ text: `Deleted Data Access Request ${darCode}` })
    }
    catch {
      Notifications.showError({ text: 'Error: Cannot cancel target Data Access Request' })
    }
  }

  const reviseCollection = async (darCollection: DarCollectionSummary) => {
    try {
      const { darCollectionId, darCode } = darCollection
      await Collections.reviseCollection(darCollectionId)
      await fetchAndUpdateCollection(darCollectionId)
      Notifications.showSuccess({ text: `Revising Data Access Request ${darCode}` })
    }
    catch {
      Notifications.showError({ text: 'Error: Cannot revise target Data Access Request' })
    }
  }

  const deleteDraftById = async ({ referenceId }: { referenceId: string }): Promise<number> => {
    const collectionsClone = cloneDeep(researcherCollections)
    await DAR.deleteDar(referenceId)
    const targetIndex = findIndex(collectionsClone, (draft) => {
      return draft.referenceIds[0] === referenceId
    })
    collectionsClone.splice(targetIndex, 1)
    setResearcherCollections(collectionsClone)
    return targetIndex
  }

  const deleteDraft = async ({ referenceIds, darCode }: Pick<DarCollectionSummary, 'referenceIds' | 'darCode'>) => {
    try {
      const targetIndex = await deleteDraftById({ referenceId: referenceIds[0] })
      if (targetIndex === -1) {
        Notifications.showError({ text: 'Error processing delete request' })
      }
      else {
        Notifications.showSuccess({ text: `Deleted Data Access Request Draft ${darCode}` })
      }
    }
    catch {
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
      </div>
      <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION }}>
        <SearchBar handleSearchChange={handleSearchChange} />
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
