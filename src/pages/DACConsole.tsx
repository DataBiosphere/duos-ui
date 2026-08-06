import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import SearchBar from 'src/components/SearchBar'
import { Storage } from 'src/libs/storage'
import { User } from 'src/libs/ajax/User'
import { Collections } from 'src/libs/ajax/Collections'
import { getSearchFilterFunctions, Notifications, searchOnFilteredList, USER_ROLES } from 'src/libs/utils'
import { Styles } from 'src/libs/theme'
import { DarCollectionTable } from 'src/components/dar_collection_table/DarCollectionTable'
import { cancelCollectionFn, consoleTypes, openCollectionFn, updateCollectionFn } from 'src/utils/DarCollectionUtils'
import { useResponsiveDarCollectionColumns } from 'src/hooks/useResponsiveDarCollectionColumns'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { DarCollectionSummary, Dataset } from 'src/types/model'

export default function DACConsole() {
  usePageTitle('Data Access Requests')
  const navigate = useNavigate()
  const user = Storage.getCurrentUser()
  // A user who is both a Chair and a Member gets the superset of capabilities (cancel/revise).
  const isChair = user.isChairPerson
  const role = isChair ? USER_ROLES.chairperson : USER_ROLES.member
  const consoleType = isChair ? consoleTypes.CHAIR : consoleTypes.MEMBER

  const [collections, setCollections] = useState<DarCollectionSummary[]>([])
  const [filteredList, setFilteredList] = useState<DarCollectionSummary[]>([])
  const [relevantDatasets, setRelevantDatasets] = useState<Dataset[] | undefined>()
  const [isLoading, setIsLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const filterFn = getSearchFilterFunctions().darCollections

  const responsiveColumns = useResponsiveDarCollectionColumns(consoleType)

  const handleSearchChange = useCallback((searchTerms: string) => {
    setSearchText(searchTerms)
    searchOnFilteredList(searchTerms, collections, filterFn, setFilteredList)
  }, [collections, filterFn])

  useEffect(() => {
    const init = async () => {
      try {
        const [cols, datasets] = await Promise.all([
          Collections.getCollectionSummariesByRoleName(role),
          User.getUserRelevantDatasets(),
        ])
        setCollections(cols)
        setRelevantDatasets(datasets)
        setFilteredList(cols)
        setIsLoading(false)
      }
      catch {
        Notifications.showError({ text: 'Error initializing Collections table' })
      }
    }
    init()
  }, [role])

  const updateCollections = useCallback(
    (updatedCollection: DarCollectionSummary) => updateCollectionFn({ collections, filterFn, searchText, setCollections, setFilteredList })(updatedCollection),
    [collections, filterFn, searchText, setCollections, setFilteredList],
  )
  const cancelCollection = useCallback(
    (params: { darCode: string, darCollectionId: number }) => cancelCollectionFn({ updateCollections, role })(params),
    [updateCollections, role],
  )
  const openCollection = useCallback(
    (params: { darCode: string, darCollectionId: number }) => openCollectionFn({ updateCollections, role })(params),
    [updateCollections, role],
  )
  const goToVote = useCallback((collectionId: number) => navigate(`/dar_collection/${collectionId}`), [navigate])

  const description = useMemo(
    () => (isChair ? 'Select and manage Data Access Requests for DAC Review' : 'Vote on Data Access Request for DAC Review'),
    [isChair],
  )

  return (
    <div style={Styles.PAGE}>
      <div>
        <TableHeaderSection
          title="My DAC's Data Access Requests"
          description={description}
        />
      </div>
      <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION }}>
        <SearchBar handleSearchChange={handleSearchChange} />
      </div>
      {responsiveColumns.length > 0 && (
        <DarCollectionTable
          key="dac-console-dar-table"
          collections={filteredList}
          columns={responsiveColumns}
          isLoading={isLoading}
          relevantDatasets={relevantDatasets}
          cancelCollection={isChair ? cancelCollection : undefined}
          reviseCollection={null}
          openCollection={isChair ? openCollection : undefined}
          goToVote={goToVote}
          consoleType={consoleType}
        />
      )}
    </div>
  )
}
