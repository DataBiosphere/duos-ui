import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useUserIsLogged } from 'src/hooks/useSession'

const Authenticated = () => {
  const location = useLocation()
  const isLogged = useUserIsLogged()

  // Session probe still in flight — render nothing rather than bouncing a
  // signed-in user to the sign-in page before the answer arrives.
  if (isLogged === undefined) {
    return null
  }

  // The query string goes along, so a search handed off from a public page (`/datalibrary?query=…`)
  // survives sign-in. Encoded, or a destination with its own '&' would split into sibling params.
  return isLogged
    ? <Outlet />
    : <Navigate to={location.pathname ? `/?redirectTo=${encodeURIComponent(location.pathname + location.search)}` : '/'} />
}

export default Authenticated
