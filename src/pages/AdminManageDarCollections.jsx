import React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import SearchBar from '../components/SearchBar'
import { Collections } from '../libs/ajax/Collections'
import { Notifications, searchOnFilteredList, getSearchFilterFunctions, USER_ROLES } from '../libs/utils'
import { Styles } from '../libs/theme'
import lockIcon from '../images/lock-icon.png'
import { DarCollectionTable } from '../components/dar_collection_table/DarCollectionTable'
import {
  cancelCollectionFn,
  consoleTypes,
  DarCollectionTableColumnOptions,
  openCollectionFn,
  updateCollectionFn,
} from '../utils/DarCollectionUtils'

export default function AdminManageDarCollections() {
  const [collections, setCollections] = useState([])
  const [filteredList, setFilteredList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const searchRef = useRef('')
  const filterFn = getSearchFilterFunctions().darCollections

  // Define base columns array for admin console
  const baseColumns = [
    DarCollectionTableColumnOptions.DAR_CODE,
    DarCollectionTableColumnOptions.DAC,
    DarCollectionTableColumnOptions.NAME,
    DarCollectionTableColumnOptions.SUBMISSION_DATE,
    DarCollectionTableColumnOptions.RESEARCHER,
    DarCollectionTableColumnOptions.INSTITUTION,
    DarCollectionTableColumnOptions.DATASET_COUNT,
    DarCollectionTableColumnOptions.EXPIRES_AT,
    DarCollectionTableColumnOptions.STATUS,
    DarCollectionTableColumnOptions.ACTIONS,
  ]

  // Define responsive columns based on window width
  const getResponsiveColumns = (width) => {
    let columns = [...baseColumns]

    // Hide dataset count column if viewport width < 1450px
    if (width < 1450) {
      columns = columns.filter(column => column !== DarCollectionTableColumnOptions.DATASET_COUNT)
    }

    // Hide submission date column if viewport width < 1250px
    if (width < 1250) {
      columns = columns.filter(column => column !== DarCollectionTableColumnOptions.SUBMISSION_DATE)
    }

    return columns
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
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '112%', marginLeft: '-6%', padding: '0 2.5%' }}>
        <div className="left-header-section" style={Styles.LEFT_HEADER_SECTION}>
          <div style={Styles.ICON_CONTAINER}>
            <img id="lock-icon" src={lockIcon} style={Styles.HEADER_IMG} />
          </div>
          <div style={Styles.HEADER_CONTAINER}>
            <div style={{ fontFamily: 'Montserrat', fontWeight: 600, fontSize: '2.8rem' }}>
              All Data Access Requests
            </div>
            <div style={{ fontFamily: 'Montserrat', fontSize: '1.6rem' }}>
              List of all Data Access Requests saved in DUOS
            </div>
          </div>
        </div>
        <SearchBar handleSearchChange={handleSearchChange} searchRef={searchRef} />
      </div>
      {responsiveColumns.length > 0 && (
        <DarCollectionTable
          key={`admin-dar-table-${responsiveColumns.length}-${responsiveColumns.join('-')}`}
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
