import React, { useCallback, useEffect, useState } from 'react'
import { Auth, reportUnconfirmedSignOut } from 'src/libs/auth/auth'
import { TosService } from 'src/libs/TosService'
import SimpleButton from 'src/components/SimpleButton'
import { Theme } from 'src/libs/theme'
import { useNavigate } from 'react-router'

export default function TermsOfServiceAcceptance() {
  const navigate = useNavigate()
  const [tosText, setTosText] = useState<React.ReactElement | null>(null)

  useEffect(() => {
    const init = async () => {
      const text = await TosService.getFormattedText()
      setTosText(text)
    }
    init()
  }, [])

  const acceptToS = useCallback(async () => {
    await TosService.acceptTos()

    // if there is a redirectTo, we should go to that. otherwise, just go to the appropriate
    // data library.
    const queryParams = new URLSearchParams(globalThis.location.search)
    const redirect = queryParams.get('redirectTo') ?? '/datalibrary'

    navigate(redirect)
  }, [navigate])

  const signOut = async () => {
    const result = await Auth.signOut('/')
    if (result.status === 'unconfirmed') {
      reportUnconfirmedSignOut()
    }
  }

  return (
    <div style={TosService.getBackgroundStyle()}>
      <div style={TosService.getContainerStyle()} className="markdown-body">
        <h1 style={{ marginLeft: '25px' }}>DUOS Terms of Service</h1>
        <div style={TosService.getScrollableStyle()}>{tosText}</div>
        <div style={{ marginTop: '.5rem', display: 'flex', alignItems: 'center', justifyContent: 'right' }}>
          <SimpleButton
            keyProp="tos-reject"
            label="Reject Terms of Service"
            onClick={signOut}
            baseColor="darkgray"
            hoverStyle={{
              backgroundColor: '#d13b07',
              color: 'white',
            }}
            additionalStyle={{
              textTransform: 'none',
              padding: '5px 10px',
              fontSize: '1.45rem',
            }}
          />
          <SimpleButton
            keyProp="tos-accept"
            label="Accept Terms of Service"
            onClick={acceptToS}
            baseColor={Theme.palette.secondary}
            additionalStyle={{
              textTransform: 'none',
              marginLeft: '1rem',
              padding: '5px 10px',
              fontSize: '1.45rem',
            }}
          />
        </div>
      </div>
    </div>
  )
}
