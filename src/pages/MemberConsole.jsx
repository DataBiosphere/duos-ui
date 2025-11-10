import React, { useCallback, useEffect, useRef, useState } from 'react'
import SearchBar from '../components/SearchBar'
import { User } from '../libs/ajax/User'
import { Collections } from '../libs/ajax/Collections'
import { getSearchFilterFunctions, Notifications, searchOnFilteredList, USER_ROLES } from '../libs/utils'
import { Styles } from '../libs/theme'
import lockIcon from '../images/lock-icon.png'
import { DarCollectionTable } from '../components/dar_collection_table/DarCollectionTable'
import { consoleTypes } from '../utils/DarCollectionUtils'
import { useResponsiveDarCollectionColumns } from '../hooks/useResponsiveDarCollectionColumns'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'

export default function MemberConsole() {
  usePageTitle('DAR Requests')
  const navigate = useNavigate()
  const [collections, setCollections] = useState([])
  const [filteredList, setFilteredList] = useState([])
  const [relevantDatasets, setRelevantDatasets] = useState()
  const [isLoading, setIsLoading] = useState(true)
  const searchRef = useRef('')
  const filterFn = getSearchFilterFunctions().darCollections

  // Get responsive columns for member console
  const responsiveColumns = useResponsiveDarCollectionColumns(consoleTypes.MEMBER)

  const handleSearchChange = useCallback(
    searchTerms =>
      searchOnFilteredList(searchTerms, collections, filterFn, setFilteredList),
    [collections, filterFn],
  )

  useEffect(() => {
    const init = async () => {
      try {
        const [collections, datasets] = await Promise.all([
          Collections.getCollectionSummariesByRoleName(USER_ROLES.member),
          User.getUserRelevantDatasets(), // still need this on this console for status cell
        ])
        setCollections(collections)
        setRelevantDatasets(datasets)
        setFilteredList(collections)
        setIsLoading(false)
      }
      catch (_error) {
        Notifications.showError({
          text: 'Error initializing Collections table',
        })
      }
    }
    init()
  }, [])

  const goToVote = useCallback(collectionId => navigate(`/dar_collection/${collectionId}`), [navigate])

  return (
    <div style={Styles.PAGE}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '112%', marginLeft: '-6%', padding: '0 2.5%' }}>
        <div className="left-header-section" style={Styles.LEFT_HEADER_SECTION}>
          <div style={Styles.ICON_CONTAINER}>
            <img id="lock-icon" src={lockIcon} style={Styles.HEADER_IMG} />
          </div>
          <div style={Styles.HEADER_CONTAINER}>
            <div style={{ fontFamily: 'Montserrat', fontWeight: 600, fontSize: '2.8rem' }}>
              My DAC&apos;s Data Access Requests
            </div>
            <div style={{ fontFamily: 'Montserrat', fontSize: '1.6rem' }}>
              Vote on Data Access Request for DAC Review
            </div>
          </div>
        </div>
        <SearchBar handleSearchChange={handleSearchChange} searchRef={searchRef} />
      </div>
      {responsiveColumns.length > 0 && (
        <DarCollectionTable
          key="member-dar-table"
          collections={filteredList}
          columns={responsiveColumns}
          isLoading={isLoading}
          relevantDatasets={relevantDatasets}
          reviseCollection={null}
          goToVote={goToVote}
          consoleType={consoleTypes.MEMBER}
        />
      )}
    </div>
  )
}
