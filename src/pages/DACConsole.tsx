import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import SearchBar from 'src/components/SearchBar'
import { Storage } from 'src/libs/storage'
import { Collections } from 'src/libs/ajax/Collections'
import { getSearchFilterFunctions, Notifications, searchOnFilteredList, USER_ROLES } from 'src/libs/utils'
import { Styles } from 'src/libs/theme'
import { DarCollectionTable } from 'src/components/dar_collection_table/DarCollectionTable'
import { cancelCollectionFn, consoleTypes, openCollectionFn, updateCollectionFn } from 'src/utils/DarCollectionUtils'
import { useResponsiveDarCollectionColumns } from 'src/hooks/useResponsiveDarCollectionColumns'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { DarCollectionSummary } from 'src/types/model'

const mergeCollectionSummaries = (
  summariesByRole: DarCollectionSummary[][],
): DarCollectionSummary[] => {
  const summaries = new Map<number, DarCollectionSummary>()
  summariesByRole.flat().forEach((summary) => {
    const existing = summaries.get(summary.darCollectionId)
    if (existing === undefined) {
      summaries.set(summary.darCollectionId, summary)
      return
    }

    const datasetIds = [...new Set([...existing.datasetIds, ...summary.datasetIds])]
    summaries.set(summary.darCollectionId, {
      ...existing,
      // Actions are authorized by each role-scoped response. A member-only collection has no
      // chair summary to merge, so it cannot inherit chair actions just because the user is also
      // a chair elsewhere.
      actions: [...new Set([...existing.actions, ...summary.actions])],
      dacNames: [...new Set([...existing.dacNames, ...summary.dacNames])],
      datasetIds,
      datasetCount: datasetIds.length,
      referenceIds: [...new Set([...existing.referenceIds, ...summary.referenceIds])],
    })
  })
  return [...summaries.values()]
}

export default function DACConsole() {
  usePageTitle('Data Access Requests')
  const navigate = useNavigate()
  const user = Storage.getCurrentUser()
  // A user who is both a Chair and a Member gets the superset of capabilities (cancel/revise).
  const isChair = user.isChairPerson
  const role = isChair ? USER_ROLES.chairperson : USER_ROLES.member
  const roles = useMemo(
    () => [
      ...(user.isChairPerson ? [USER_ROLES.chairperson] : []),
      ...(user.isMember ? [USER_ROLES.member] : []),
    ],
    [user.isChairPerson, user.isMember],
  )
  const consoleType = isChair ? consoleTypes.CHAIR : consoleTypes.MEMBER

  const [collections, setCollections] = useState<DarCollectionSummary[]>([])
  const [filteredList, setFilteredList] = useState<DarCollectionSummary[]>([])
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
        const summariesByRole = await Promise.all(roles.map(collectionRole =>
          Collections.getCollectionSummariesByRoleName(collectionRole),
        ))
        const cols = mergeCollectionSummaries(summariesByRole)
        setCollections(cols)
        setFilteredList(cols)
        setIsLoading(false)
      }
      catch {
        Notifications.showError({ text: 'Error initializing Collections table' })
      }
    }
    init()
  }, [roles])

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
