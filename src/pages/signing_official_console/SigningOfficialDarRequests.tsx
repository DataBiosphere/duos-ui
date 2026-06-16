import React, { useState, useEffect, useCallback } from 'react'
import { Notifications, USER_ROLES } from 'src/libs/utils'
import { Styles } from 'src/libs/theme'
import { Collections } from 'src/libs/ajax/Collections'
import { DarCollectionTable } from 'src/components/dar_collection_table/DarCollectionTable'
import { consoleTypes, approveCollectionFn } from 'src/utils/DarCollectionUtils'
import { useResponsiveDarCollectionColumns } from 'src/hooks/useResponsiveDarCollectionColumns'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { DarCollectionSummary } from 'src/types/model'

export default function SigningOfficialDarRequests(): React.JSX.Element {
  usePageTitle('Data Access Requests')
  const [collectionList, setCollectionList] = useState<DarCollectionSummary[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Get responsive columns for signing official console
  const responsiveColumns = useResponsiveDarCollectionColumns(consoleTypes.SIGNING_OFFICIAL)

  useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        setIsLoading(true)
        const collectionList = await Collections.getCollectionSummariesByRoleName(USER_ROLES.signingOfficial)
        setCollectionList(collectionList)
        setIsLoading(false)
      }
      catch {
        Notifications.showError({ text: 'Error: Unable to retrieve Data Access Requests' })
        setIsLoading(false)
      }
    }
    init()
  }, [])

  const updateCollections = useCallback((updatedCollection: DarCollectionSummary) => {
    setCollectionList((prevList) => {
      const index = prevList.findIndex(c => c.darCollectionId === updatedCollection.darCollectionId)
      if (index === -1) return prevList

      const newList = [...prevList]
      newList[index] = updatedCollection
      return newList
    })
  }, [])

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
      <div className="signing-official-tabs">
        {responsiveColumns.length > 0 && (
          <DarCollectionTable
            key="so-dar-table"
            collections={collectionList}
            columns={responsiveColumns}
            isLoading={isLoading}
            cancelCollection={null}
            reviseCollection={null}
            approveCollection={approveCollection}
            consoleType={consoleTypes.SIGNING_OFFICIAL}
          />
        )}
      </div>
    </div>
  )
}
