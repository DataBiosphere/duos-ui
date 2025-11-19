import React, { useState, useEffect } from 'react'
import { Notifications } from 'src/libs/utils'
import { Styles } from 'src/libs/theme'
import { Collections } from 'src/libs/ajax/Collections'
import { USER_ROLES } from 'src/libs/utils'
import { DarCollectionTable } from 'src/components/dar_collection_table/DarCollectionTable'
import { consoleTypes } from 'src/utils/DarCollectionUtils'
import { useResponsiveDarCollectionColumns } from 'src/hooks/useResponsiveDarCollectionColumns'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'

export default function SigningOfficialDarRequests() {
  usePageTitle('DAR Requests')
  const [collectionList, setCollectionList] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Get responsive columns for signing official console
  const responsiveColumns = useResponsiveDarCollectionColumns(consoleTypes.SIGNING_OFFICIAL)

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true)
        const collectionList = await Collections.getCollectionSummariesByRoleName(USER_ROLES.signingOfficial)
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

  return (
    <div style={Styles.PAGE}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
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
            consoleType={consoleTypes.SIGNING_OFFICIAL}
          />
        )}
      </div>
    </div>
  )
}
