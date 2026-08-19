import React, { useState, useEffect, useCallback, useMemo } from 'react'
import SearchBar from 'src/components/SearchBar'
import { getSearchFilterFunctions, Notifications, searchOnFilteredList, USER_ROLES } from 'src/libs/utils'
import { Styles } from 'src/libs/theme'
import { Collections } from 'src/libs/ajax/Collections'
import { DarCollectionTable } from 'src/components/dar_collection_table/DarCollectionTable'
import { consoleTypes, approveCollectionFn } from 'src/utils/DarCollectionUtils'
import { useResponsiveDarCollectionColumns } from 'src/hooks/useResponsiveDarCollectionColumns'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { DarCollectionSummary } from 'src/types/model'

export default function SigningOfficialDarApprovals(): React.JSX.Element {
  usePageTitle('My DAR Approvals')
  const [collections, setCollections] = useState<DarCollectionSummary[]>([])
  const [filteredList, setFilteredList] = useState<DarCollectionSummary[]>([])
  const [searchText, setSearchText] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const filterFn = useMemo(() => getSearchFilterFunctions().darCollections, [])

  const responsiveColumns = useResponsiveDarCollectionColumns(consoleTypes.SIGNING_OFFICIAL)

  const handleSearchChange = useCallback((searchTerms: string) => {
    setSearchText(searchTerms)
    searchOnFilteredList(searchTerms, collections, filterFn, setFilteredList)
  }, [collections, filterFn])

  useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        setIsLoading(true)
        const collectionList = (await Collections.getCollectionSummariesByRoleName(USER_ROLES.signingOfficial))
          .filter((collection: DarCollectionSummary) =>
            collection.requiresSOApproval || collection.actions.includes('Review_Progress_Report'))
        setCollections(collectionList)
        setFilteredList(collectionList)
        setIsLoading(false)
      }
      catch {
        Notifications.showError({ text: 'Error: Unable to retrieve current user from server' })
        setIsLoading(false)
      }
    }
    init()
  }, [])

  const updateCollections = useCallback((updatedCollection: DarCollectionSummary) => {
    setCollections((prevList) => {
      const index = prevList.findIndex(c => c.darCollectionId === updatedCollection.darCollectionId)
      if (index === -1) return prevList
      const newList = updatedCollection.requiresSOApproval
        ? [...prevList.slice(0, index), updatedCollection, ...prevList.slice(index + 1)]
        : prevList.filter((_, i) => i !== index)
      searchOnFilteredList(searchText, newList, filterFn, setFilteredList)
      return newList
    })
  }, [searchText, filterFn])

  const approveCollection = approveCollectionFn({
    updateCollections,
    role: USER_ROLES.signingOfficial,
  })

  return (
    <div style={Styles.PAGE}>
      <div>
        <TableHeaderSection
          title="My Institution's Data Access Approvals"
          description="Review all approved Data Access Requests (DARs) submitted by researchers at your institution. When required, your approval must happen before a DAR can proceed to Data Access Committee (DAC) review — you can approve those requests directly from this page."
        />
      </div>
      <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION }}>
        <SearchBar handleSearchChange={handleSearchChange} />
      </div>
      {responsiveColumns.length > 0 && (
        <DarCollectionTable
          key="so-dar-table"
          collections={filteredList}
          columns={responsiveColumns}
          isLoading={isLoading}
          cancelCollection={null}
          reviseCollection={null}
          approveCollection={approveCollection}
          consoleType={consoleTypes.SIGNING_OFFICIAL}
        />
      )}
    </div>
  )
}
