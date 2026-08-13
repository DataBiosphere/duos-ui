import React, { useState, useEffect, useCallback } from 'react'
import SearchBar from 'src/components/SearchBar'
import { Collections } from 'src/libs/ajax/Collections'
import { Notifications, searchOnFilteredList, getSearchFilterFunctions, USER_ROLES } from 'src/libs/utils'
import { Styles } from 'src/libs/theme'
import { DarCollectionTable } from 'src/components/dar_collection_table/DarCollectionTable'
import { consoleTypes } from 'src/utils/DarCollectionUtils'
import { useResponsiveDarCollectionColumns } from 'src/hooks/useResponsiveDarCollectionColumns'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { DarCollectionSummary } from 'src/types/model'

export default function AdminManageDarCollections() {
  usePageTitle('Data Access Requests')
  const [collections, setCollections] = useState<DarCollectionSummary[]>([])
  const [filteredList, setFilteredList] = useState<DarCollectionSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const filterFn = getSearchFilterFunctions().darCollections
  const responsiveColumns = useResponsiveDarCollectionColumns(consoleTypes.ADMIN)

  const handleSearchChange = useCallback((searchTerms: string) => {
    searchOnFilteredList(searchTerms, collections, filterFn, setFilteredList)
  }, [collections, filterFn])

  useEffect(() => {
    const init = async () => {
      try {
        const collectionsResp = await Collections.getCollectionSummariesByRoleName(USER_ROLES.admin)
        setCollections(collectionsResp)
        setFilteredList(collectionsResp)
        setIsLoading(false)
      }
      catch {
        Notifications.showError({ text: 'Error initializing Collections table' })
      }
    }
    init()
  }, [])

  return (
    <div style={Styles.PAGE}>
      <div>
        <TableHeaderSection
          title="All Data Access Requests"
          description="List of all Data Access Requests saved in DUOS"
        />
      </div>
      <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION }}>
        <SearchBar handleSearchChange={handleSearchChange} />
      </div>
      {responsiveColumns.length > 0 && (
        <DarCollectionTable
          key="admin-dar-table"
          collections={filteredList}
          columns={responsiveColumns}
          isLoading={isLoading}
          consoleType={consoleTypes.ADMIN}
        />
      )}
    </div>
  )
}
