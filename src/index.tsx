import React from 'react'
import { createRoot } from 'react-dom/client'
import 'src/index.css'
import 'src/styles/bootstrap_replacement.css'
import App from 'src/App'
import { Auth } from 'src/libs/auth/auth'
import { Config } from 'src/libs/config'
import { OidcBroker } from 'src/libs/auth/oidcBroker'
import { BrowserRouter } from 'react-router'
import ScrollToTopOnNavigate from 'src/components/ScrollToTopOnNavigate'
import { ToastNotifications } from 'src/libs/ToastNotifications'

const load = async () => {
  // Consent being down must not leave a blank page; sign-in retries the setup.
  const authReady = await Auth.initialize().then(() => true, () => false)
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
  if (authReady && globalThis.location.pathname.startsWith('/redirect-from-oauth') && !(await Config.isBffEnabled())) {
    await OidcBroker.getUserManager().signinPopupCallback(globalThis.location.href)
  }
  const container = document.getElementById('root')
  const root = createRoot(container!)
  root.render(<BrowserRouter><ScrollToTopOnNavigate /><App /></BrowserRouter>)
  if (!authReady) {
    ToastNotifications.showError({
      text: 'DUOS cannot reach its server right now, so sign-in and some pages may not work. Please try again in a few minutes.',
      timeout: null,
    })
  }
}

await load()
