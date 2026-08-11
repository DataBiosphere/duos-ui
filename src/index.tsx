import React from 'react'
import { createRoot } from 'react-dom/client'
import 'src/index.css'
import 'src/styles/bootstrap_replacement.css'
import App from 'src/App'
import { Auth } from 'src/libs/auth/auth'
import { BrowserRouter } from 'react-router'

const load = async () => {
  // Purges legacy oidc-client-ts localStorage keys once the environment has
  // cut over to the BFF. The OAuth flow itself is server-side now: /auth/login
  // redirects the whole page to B2C, and /auth/callback (a server route)
  // establishes the session before redirecting back into the app.
  await Auth.initialize()
  const container = document.getElementById('root')
  const root = createRoot(container!)
  root.render(<BrowserRouter><App /></BrowserRouter>)
}

await load()
