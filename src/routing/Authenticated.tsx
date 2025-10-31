import React from 'react'
import { Storage } from 'src/libs/storage'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

const Authenticated = () => {
  const location = useLocation()

  return Storage.userIsLogged()
    ? <Outlet />
    : <Navigate to={location.pathname ? `/?redirectTo=${location.pathname}` : '/'} />
}

export default Authenticated
