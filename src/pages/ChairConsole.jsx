import React, { useCallback, useEffect, useRef, useState } from 'react'
import SearchBar from 'src/components/SearchBar'
import { User } from 'src/libs/ajax/User'
import { Collections } from 'src/libs/ajax/Collections'
import { getSearchFilterFunctions, Notifications, searchOnFilteredList, USER_ROLES } from 'src/libs/utils'
import { Styles } from 'src/libs/theme'
import { DarCollectionTable } from 'src/components/dar_collection_table/DarCollectionTable'
import { cancelCollectionFn, consoleTypes, openCollectionFn, updateCollectionFn } from 'src/utils/DarCollectionUtils'
import { useResponsiveDarCollectionColumns } from 'src/hooks/useResponsiveDarCollectionColumns'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'

export default function ChairConsole() {
  usePageTitle('DAR Requests')
  const navigate = useNavigate()
  const [collections, setCollections] = useState([])
  const [filteredList, setFilteredList] = useState([])
  const [relevantDatasets, setRelevantDatasets] = useState()
  const [isLoading, setIsLoading] = useState(true)
  const searchRef = useRef('')
  const filterFn = getSearchFilterFunctions().darCollections

  // Get responsive columns for chair console
  const responsiveColumns = useResponsiveDarCollectionColumns(consoleTypes.CHAIR)

  const handleSearchChange = useCallback(searchTerms => searchOnFilteredList(
    searchTerms,
    collections,
    filterFn,
    setFilteredList,
  ), [collections, filterFn])

  useEffect(() => {
    const init = async () => {
      try {
        const [collections, datasets] = await Promise.all([
          Collections.getCollectionSummariesByRoleName(USER_ROLES.chairperson),
          User.getUserRelevantDatasets(),
        ])
        setCollections(collections)
        setRelevantDatasets(datasets)
        setFilteredList(collections)
        setIsLoading(false)
      }
      catch (_error) {
        Notifications.showError({ text: 'Error initializing Collections table' })
      }
    }
    init()
  }, [])

  const updateCollections = useCallback(
    updatedCollection => updateCollectionFn({ collections, filterFn, searchRef, setCollections, setFilteredList })(updatedCollection),
    [collections, filterFn, setCollections, setFilteredList],
  )
  const cancelCollection = useCallback(
    params => cancelCollectionFn({ updateCollections, role: USER_ROLES.chairperson })(params),
    [updateCollections],
  )
  const openCollection = useCallback(
    params => openCollectionFn({ updateCollections, role: USER_ROLES.chairperson })(params),
    [updateCollections],
  )
  const goToVote = useCallback(collectionId => navigate(`/dar_collection/${collectionId}`), [navigate])

  return (
    <div style={Styles.PAGE}>
      <div>
        <TableHeaderSection
          title="My DAC's Data Access Requests"
          description="Select and manage Data Access Request for DAC Review"
        />
      </div>
      <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION }}>
        <SearchBar handleSearchChange={handleSearchChange} searchRef={searchRef} />
      </div>
      {responsiveColumns.length > 0 && (
        <DarCollectionTable
          key="chair-dar-table"
          collections={filteredList}
          columns={responsiveColumns}
          isLoading={isLoading}
          relevantDatasets={relevantDatasets}
          cancelCollection={cancelCollection}
          reviseCollection={null}
          openCollection={openCollection}
          goToVote={goToVote}
          consoleType={consoleTypes.CHAIR}
        />
      )}
    </div>
  )
}
