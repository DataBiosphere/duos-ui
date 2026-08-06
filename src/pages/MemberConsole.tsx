import React, { useCallback, useEffect, useState } from 'react'
import SearchBar from 'src/components/SearchBar'
import { User } from 'src/libs/ajax/User'
import { Collections } from 'src/libs/ajax/Collections'
import { getSearchFilterFunctions, Notifications, searchOnFilteredList, USER_ROLES } from 'src/libs/utils'
import { Styles } from 'src/libs/theme'
import { DarCollectionTable } from 'src/components/dar_collection_table/DarCollectionTable'
import { consoleTypes } from 'src/utils/DarCollectionUtils'
import { useResponsiveDarCollectionColumns } from 'src/hooks/useResponsiveDarCollectionColumns'
import { useNavigate } from 'react-router'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { DarCollectionSummary, Dataset } from 'src/types/model'

export default function MemberConsole() {
  usePageTitle('Data Access Requests')
  const navigate = useNavigate()
  const [collections, setCollections] = useState<DarCollectionSummary[]>([])
  const [filteredList, setFilteredList] = useState<DarCollectionSummary[]>([])
  const [relevantDatasets, setRelevantDatasets] = useState<Dataset[]>()
  const [isLoading, setIsLoading] = useState(true)
  const filterFn = getSearchFilterFunctions().darCollections

  const responsiveColumns = useResponsiveDarCollectionColumns(consoleTypes.MEMBER)

  const handleSearchChange = useCallback(
    (searchTerms: string) =>
      searchOnFilteredList(searchTerms, collections, filterFn, setFilteredList),
    [collections, filterFn],
  )

  useEffect(() => {
    const init = async () => {
      try {
        const [collections, datasets] = await Promise.all([
          Collections.getCollectionSummariesByRoleName(USER_ROLES.member),
          User.getUserRelevantDatasets(),
        ])
        setCollections(collections)
        setRelevantDatasets(datasets)
        setFilteredList(collections)
        setIsLoading(false)
      }
      catch {
        Notifications.showError({
          text: 'Error initializing Collections table',
        })
      }
    }
    init()
  }, [])

  const goToVote = useCallback((collectionId: number) => navigate(`/dar_collection/${collectionId}`), [navigate])

  return (
    <div style={Styles.PAGE}>
      <div>
        <TableHeaderSection
          title="My DAC's Data Access Requests"
          description="Vote on Data Access Request for DAC Review"
        />
      </div>
      <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION }}>
        <SearchBar handleSearchChange={handleSearchChange} />
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
