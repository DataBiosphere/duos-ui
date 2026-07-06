import React, { useEffect, useState } from 'react'
import { Notifications, USER_ROLES } from 'src/libs/utils'
import { Styles } from 'src/libs/theme'
import SigningOfficialTable from 'src/pages/signing_official_console/SigningOfficialTable'
import { User } from 'src/libs/ajax/User'
import { usePageTitle } from 'src/hooks/usePageTitle'
import { DuosUser, DuosUserWithInstitutionId } from 'src/types/model'

export default function SigningOfficialLibraryCards(): React.JSX.Element {
  usePageTitle('Researcher Status')
  const [signingOfficial, setSigningOfficial] = useState<DuosUserWithInstitutionId>()
  const [researchers, setResearchers] = useState<DuosUser[]>([])

  // states to be added and used for manage researcher component
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        setIsLoading(true)
        const soUser = await User.getMe() as DuosUserWithInstitutionId
        const researcherList = await User.list(USER_ROLES.signingOfficial)

        setResearchers(researcherList)
        setSigningOfficial(soUser)
        setIsLoading(false)
      }
      catch {
        Notifications.showError({ text: 'Error: Unable to retrieve current user from server' })
        setIsLoading(false)
      }
    }
    init()
  }, [])

  return (
    <div style={Styles.PAGE}>
      <div className="signing-official-tabs">
        {signingOfficial && (
          <SigningOfficialTable
            researchers={researchers}
            signingOfficial={signingOfficial}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  )
}
