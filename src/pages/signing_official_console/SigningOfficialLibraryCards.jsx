import React, { useEffect, useState } from 'react'
import { Notifications, USER_ROLES } from 'src/libs/utils'
import { Styles } from 'src/libs/theme'
import SigningOfficialTable from './SigningOfficialTable'
import { User } from 'src/libs/ajax/User'
import { usePageTitle } from 'src/hooks/usePageTitle'

export default function SigningOfficialLibraryCards() {
  usePageTitle('Library Cards')
  const [signingOfficial, setSigningOfficial] = useState({})
  const [researchers, setResearchers] = useState([])

  // states to be added and used for manage researcher component
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true)
        const soUser = await User.getMe()
        const researcherList = await User.list(USER_ROLES.signingOfficial)

        setResearchers(researcherList)
        setSigningOfficial(soUser)
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
      <div className="signing-official-tabs">
        <SigningOfficialTable researchers={researchers} signingOfficial={signingOfficial} isLoading={isLoading} />
      </div>
    </div>
  )
}
