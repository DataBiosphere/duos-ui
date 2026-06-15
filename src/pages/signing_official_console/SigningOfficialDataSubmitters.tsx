import React, { useEffect, useState } from 'react'
import { Notifications, USER_ROLES } from 'src/libs/utils'
import { Styles } from 'src/libs/theme'
import { User } from 'src/libs/ajax/User'
import DataCustodianTable from 'src/pages/signing_official_console/DataCustodianTable'
import { extractError } from 'src/utils/ErrorUtils'
import { usePageTitle } from 'src/hooks/usePageTitle'
import { DuosUser, DuosUserWithInstitutionId } from 'src/types/model'

export default function SigningOfficialDataSubmitters(): React.JSX.Element {
  usePageTitle('Data Submitters')
  const [signingOfficial, setSigningOfficial] = useState<DuosUserWithInstitutionId>()
  const [researchers, setResearchers] = useState<DuosUser[]>([])

  // states to be added
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        setIsLoading(true)
        // Need to assign to state variable on Component init for template reference
        const soUser = await User.getMe() as DuosUserWithInstitutionId
        const soUsers = await User.list(USER_ROLES.signingOfficial) as DuosUserWithInstitutionId[]
        setResearchers(soUsers)
        setSigningOfficial(soUser)
        setIsLoading(false)
      }
      catch (error) {
        const message = extractError(error)
        Notifications.showError({ text: `Error: Unable to retrieve current user from server: ${message}` })
        setIsLoading(false)
      }
    }
    init()
  }, [])

  return (
    <div style={Styles.PAGE}>
      <div className="signing-official-tabs">
        {signingOfficial && (
          <DataCustodianTable
            researchers={researchers}
            signingOfficial={signingOfficial}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  )
}
