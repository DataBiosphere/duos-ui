import React, { useEffect, useState } from 'react'
import { Auth, reportUnconfirmedSignOut } from 'src/libs/auth/auth'
import { TosService } from 'src/libs/TosService'
import SimpleButton from 'src/components/SimpleButton'
import { useUserIsLogged } from 'src/hooks/useSession'

export default function TermsOfService() {
  const [tosText, setTosText] = useState<React.ReactElement | null>(null)
  const isLogged = useUserIsLogged() ?? false

  useEffect(() => {
    const init = async () => {
      const text = await TosService.getFormattedText()
      setTosText(text)
    }
    init()
  }, [])

  const rejectAndSignOut = async () => {
    // update Sam that ToS was rejected
    await TosService.rejectTos()

    const result = await Auth.signOut('/')
    if (result.status === 'unconfirmed') {
      reportUnconfirmedSignOut()
    }
  }

  return (
    <div style={TosService.getBackgroundStyle()}>
      <div style={TosService.getContainerStyle()}>
        <h1 style={{ color: '#00609f', marginLeft: '25px' }}>DUOS Terms of Service</h1>
        <div style={TosService.getScrollableStyle()} className="markdown-body">
          {tosText}
        </div>
        {isLogged && (
          <div style={{ display: 'flex', justifyContent: 'right', paddingRight: '5rem' }}>
            <SimpleButton
              keyProp="tos-accept"
              label="Reject Terms of Service"
              onClick={rejectAndSignOut}
              baseColor="#d13b07"
              hoverStyle={{
                backgroundColor: '#b83206',
                color: 'white',
              }}
              additionalStyle={{
                textTransform: 'none',
                padding: '5px 10px',
                fontSize: '1.45rem',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
