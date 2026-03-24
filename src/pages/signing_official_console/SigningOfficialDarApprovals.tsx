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

interface CollectionSummary {
  darCollectionId: string
  [key: string]: unknown
}

export default function SigningOfficialDarApprovals(): React.JSX.Element {
  usePageTitle('My DAR Approvals')
  const [collectionList, setCollectionList] = useState<CollectionSummary[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const responsiveColumns = useResponsiveDarCollectionColumns(consoleTypes.SIGNING_OFFICIAL)

  useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        setIsLoading(true)
        const collectionList = (await Collections.getCollectionSummariesByRoleName(USER_ROLES.signingOfficial))
          .filter((collection: DarCollectionSummary) =>
            collection.requiresSOApproval || collection.actions.includes('Review_Progress_Report'))
        setCollectionList(collectionList)
        setIsLoading(false)
      }
      catch (_error) {
        Notifications.showError({ text: 'Error: Unable to retrieve current user from server' })
        setIsLoading(false)
      }
    }
    init()
  }, [])

  const updateCollections = useCallback((updatedCollection: CollectionSummary) => {
    setCollectionList((prevList) => {
      const index = prevList.findIndex(c => c.darCollectionId === updatedCollection.darCollectionId)
      if (index === -1) return prevList
      if (updatedCollection.requiresSOApproval === false) {
        return prevList.filter((_, i) => i !== index)
      }
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
          title="My Institution's Data Access Approvals"
          description="Your Institution's Data Access Approvals: Records from all current data access approvals"
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
