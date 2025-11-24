import React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import SearchBar from 'src/components/SearchBar'
import { Collections } from 'src/libs/ajax/Collections'
import { Notifications, searchOnFilteredList, getSearchFilterFunctions, USER_ROLES } from 'src/libs/utils'
import { Styles } from 'src/libs/theme'
import { DarCollectionTable } from 'src/components/dar_collection_table/DarCollectionTable'
import {
  cancelCollectionFn,
  consoleTypes,
  openCollectionFn,
  updateCollectionFn,
} from 'src/utils/DarCollectionUtils'
import { useResponsiveDarCollectionColumns } from 'src/hooks/useResponsiveDarCollectionColumns'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'

export default function AdminManageDarCollections() {
  usePageTitle('DAR Requests')
  const [collections, setCollections] = useState([])
  const [filteredList, setFilteredList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const searchRef = useRef('')
  const filterFn = getSearchFilterFunctions().darCollections

  // Get responsive columns for admin console
  const responsiveColumns = useResponsiveDarCollectionColumns(consoleTypes.ADMIN)

  const handleSearchChange = useCallback(searchTerms => searchOnFilteredList(
    searchTerms,
    collections,
    filterFn,
    setFilteredList,
  ), [collections, filterFn])

  useEffect(() => {
    const init = async () => {
      try {
        const collectionsResp = await Collections.getCollectionSummariesByRoleName(USER_ROLES.admin)
        setCollections(collectionsResp)
        setFilteredList(collectionsResp)
        setIsLoading(false)
      }
      catch (_error) {
        Notifications.showError({ text: 'Error initializing Collections table' })
      }
    }
    init()
  }, [])

  const updateCollections = updateCollectionFn({ collections, filterFn, searchRef, setCollections, setFilteredList })
  const cancelCollection = cancelCollectionFn({ updateCollections, role: USER_ROLES.admin })
  const openCollection = openCollectionFn({ updateCollections, role: USER_ROLES.admin })

  return (
    <div style={Styles.PAGE}>
      <div>
        <TableHeaderSection
          title="All Data Access Requests"
          description="List of all Data Access Requests saved in DUOS"
        />
      </div>
      <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION }}>
        <SearchBar handleSearchChange={handleSearchChange} searchRef={searchRef} />
      </div>
      {responsiveColumns.length > 0 && (
        <DarCollectionTable
          key="admin-dar-table"
          collections={filteredList}
          columns={responsiveColumns}
          isLoading={isLoading}
          cancelCollection={cancelCollection}
          reviseCollection={null}
          openCollection={openCollection}
          consoleType={consoleTypes.ADMIN}
        />
      )}
    </div>
  )
}
