import React, { useState, useEffect, useCallback, useMemo } from 'react'
import SearchBar from 'src/components/SearchBar'
import { getSearchFilterFunctions, Notifications, searchOnFilteredList, USER_ROLES } from 'src/libs/utils'
import { Styles } from 'src/libs/theme'
import { Collections } from 'src/libs/ajax/Collections'
import { DarCollectionTable } from 'src/components/dar_collection_table/DarCollectionTable'
import { consoleTypes, approveCollectionFn, updateCollectionFn } from 'src/utils/DarCollectionUtils'
import { useResponsiveDarCollectionColumns } from 'src/hooks/useResponsiveDarCollectionColumns'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { DarCollectionSummary } from 'src/types/model'

export default function SigningOfficialDarRequests(): React.JSX.Element {
  usePageTitle('Data Access Requests')
  const [collections, setCollections] = useState<DarCollectionSummary[]>([])
  const [filteredList, setFilteredList] = useState<DarCollectionSummary[]>([])
  const [searchText, setSearchText] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const filterFn = useMemo(() => getSearchFilterFunctions().darCollections, [])

  // Get responsive columns for signing official console
  const responsiveColumns = useResponsiveDarCollectionColumns(consoleTypes.SIGNING_OFFICIAL)

  const handleSearchChange = useCallback((searchTerms: string) => {
    setSearchText(searchTerms)
    searchOnFilteredList(searchTerms, collections, filterFn, setFilteredList)
  }, [collections, filterFn])

  useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        setIsLoading(true)
        const collectionList = await Collections.getCollectionSummariesByRoleName(USER_ROLES.signingOfficial)
        setCollections(collectionList)
        setFilteredList(collectionList)
        setIsLoading(false)
      }
      catch {
        Notifications.showError({ text: 'Error: Unable to retrieve Data Access Requests' })
        setIsLoading(false)
      }
    }
    init()
  }, [])

  const updateCollections = useCallback(
    (updatedCollection: DarCollectionSummary) => updateCollectionFn({ collections, filterFn, searchText, setCollections, setFilteredList })(updatedCollection),
    [collections, filterFn, searchText],
  )

  const approveCollection = approveCollectionFn({
    updateCollections,
    role: USER_ROLES.signingOfficial,
  })

  return (
    <div style={Styles.PAGE}>
      <div>
        <TableHeaderSection
          title="My Institution's Data Access Requests"
          description="Your Institution's Data Access Requests: Records from all current and closed data access requests"
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
