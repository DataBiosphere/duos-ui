import React, { useState, useEffect } from 'react'
import { Notifications } from '../../libs/utils'
import { Styles } from '../../libs/theme'
import lockIcon from '../../images/lock-icon.png'
import { Collections } from '../../libs/ajax/Collections'
import { USER_ROLES } from '../../libs/utils'
import { DarCollectionTable } from '../../components/dar_collection_table/DarCollectionTable'
import { consoleTypes, DarCollectionTableColumnOptions } from '../../utils/DarCollectionUtils'

export default function SigningOfficialDarRequests() {
  const [collectionList, setCollectionList] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Define base columns array for signing official console
  const baseColumns = [
    DarCollectionTableColumnOptions.DAR_CODE,
    DarCollectionTableColumnOptions.NAME,
    DarCollectionTableColumnOptions.SUBMISSION_DATE,
    DarCollectionTableColumnOptions.RESEARCHER,
    DarCollectionTableColumnOptions.INSTITUTION,
    DarCollectionTableColumnOptions.EXPIRES_AT,
    DarCollectionTableColumnOptions.DATASET_COUNT,
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

    // Hide expiration date column if viewport width < 1250px
    if (width < 1250) {
      columns = columns.filter(column => column !== DarCollectionTableColumnOptions.EXPIRES_AT)
    }

    return columns
  }

  // Initialize columns based on current window width
  const [responsiveColumns, setResponsiveColumns] = useState(() => getResponsiveColumns(window.innerWidth))

  // Handle window resize for responsive column hiding
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth
      setResponsiveColumns(getResponsiveColumns(newWidth))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
        <div className="left-header-section" style={Styles.LEFT_HEADER_SECTION}>
          <div style={Styles.ICON_CONTAINER}>
            <img id="lock-icon" src={lockIcon} style={Styles.HEADER_IMG} />
          </div>
          <div style={Styles.HEADER_CONTAINER}>
            <div style={{ ...Styles.TITLE, marginTop: '0' }}>My Institution&apos;s Data Access Requests</div>
            <div style={{ ...Styles.MEDIUM_DESCRIPTION, fontSize: '18px' }}>
              Your Institution&apos;s Data Access Requests: Records from all current and closed data access requests.
            </div>
          </div>
        </div>
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
