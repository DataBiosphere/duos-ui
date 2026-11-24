import React from 'react'
import { createRoot } from 'react-dom/client'
import 'src/index.css'
import 'src/styles/bootstrap_replacement.css'
import App from 'src/App'
import { AUTH_UNAVAILABLE_MESSAGE, Auth, onLegacyAuthRecovered } from 'src/libs/auth/auth'
import { Config } from 'src/libs/config'
import { OidcBroker } from 'src/libs/auth/oidcBroker'
import { BrowserRouter } from 'react-router'
import ScrollToTopOnNavigate from 'src/components/ScrollToTopOnNavigate'
import { ToastNotifications } from 'src/libs/ToastNotifications'

const load = async () => {
  // Consent being down must not leave a blank page; the setup retries in the background.
  const authReady = await Auth.initialize().then(() => true, (error: unknown) => {
    console.error('Sign-in setup failed', error)
    return false
  })
  // The following handles the OIDC post-authentication flow.
  // 1. User clicks Sign In button
  // 2. OidcBroker instantiates a popup,
  // 3. User completes the auth dance and is redirected to this path
  // 4. Application (this component) detects that path and instructs the OidcBroker to close the popup
  // 5. After popup close, user is directed to the original url. This works for the cases we support:
  //   5a. Logging in from the home page
  //   5b. Logging in from a link, i.e. `<origin>/dataLibrary`
  //   5c. Logging in from a link with a `redirectTo` query param, i.e. `<origin>?redirectTo=/dataLibrary`
  // Legacy-only: under the BFF, initialize() never starts the OidcBroker, so
  // a stale bookmark to this path must not crash the app on getUserManager().
  if (globalThis.location.pathname.startsWith('/redirect-from-oauth') && !(await Config.isBffEnabled())) {
    const finishSignIn = () => OidcBroker.getUserManager().signinPopupCallback(globalThis.location.href)
    if (!authReady) {
      // The app must not render inside the popup; it finishes sign-in once a retry succeeds.
      onLegacyAuthRecovered(() => void finishSignIn())
      return
    }
    await finishSignIn()
  }
  const container = document.getElementById('root')
  const root = createRoot(container!)
  root.render(<BrowserRouter><ScrollToTopOnNavigate /><App /></BrowserRouter>)
  if (!authReady) {
    ToastNotifications.showError({
      text: AUTH_UNAVAILABLE_MESSAGE,
      timeout: null,
      dismissWhen: new Promise<void>(resolve => onLegacyAuthRecovered(resolve)),
    })
  }
}

await load()
