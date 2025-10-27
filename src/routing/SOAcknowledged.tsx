import React, { useEffect, useState } from 'react'
import { hasSOAcceptedDAAs } from 'src/libs/acknowledgements'
import { Notifications } from 'src/libs/utils'
import { extractError } from 'src/utils/ErrorUtils'
import { Outlet } from 'react-router-dom'
import SigningOfficialDaaAgreementWrapper from 'src/components/SigningOfficialDaaAgreementWrapper'

const SOAcknowledged = () => {
  const [hasAccepted, setHasAccepted] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSOAcknowledgment = async () => {
      try {
        setIsLoading(true)
        // Check if SO has accepted the required DAA acknowledgments
        const accepted = await hasSOAcceptedDAAs()
        setHasAccepted(accepted)
        setIsLoading(false)
      }
      catch (error) {
        const message = extractError(error)
        Notifications.showError({
          text: 'Error: Unable to verify Signing Official acknowledgments: ' + message,
        })
        setHasAccepted(false)
        setIsLoading(false)
      }
    }
    checkSOAcknowledgment()
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return hasAccepted
    ? <Outlet />
    : <SigningOfficialDaaAgreementWrapper isDataSubmitterTab={false} />
}

export default SOAcknowledged
