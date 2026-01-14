import React, { useEffect, useState } from 'react'
import { Notifications, USER_ROLES } from 'src/libs/utils'
import { Styles } from 'src/libs/theme'
import { User } from 'src/libs/ajax/User'
import DataCustodianTable from './DataCustodianTable'
import { extractError } from 'src/utils/ErrorUtils.ts'
import { usePageTitle } from 'src/hooks/usePageTitle'

export default function SigningOfficialConsole() {
  usePageTitle('Data Submitters')
  const [signingOfficial, setSigningOfficial] = useState({})
  const [researchers, setResearchers] = useState([])

  // states to be added
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true)
        // Need to assign to state variable on Component init for template reference
        const soUser = await User.getMe()
        const soUsers = await User.list(USER_ROLES.signingOfficial)
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
        <DataCustodianTable researchers={researchers} signingOfficial={signingOfficial} isLoading={isLoading} />
      </div>
    </div>
  )
}
