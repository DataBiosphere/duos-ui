import React, { useEffect, useState } from 'react'
import { Notifications } from 'src/libs/utils'
import { Storage } from 'src/libs/storage'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

const Authenticated = () => {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    const init = () => {
      try {
        setIsLoading(true)
        setAuthenticated(Storage.userIsLogged())
        setIsLoading(false)
      }
      catch (error) {
        console.error('Error checking authentication:', error)
        Notifications.showError({
          text: 'Error: Unable to verify authentication',
        })
        setAuthenticated(false)
        setIsLoading(false)
      }
    }
    init()
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return authenticated
    ? <Outlet />
    : <Navigate to="/" state={{ from: location }} replace />
}

export default Authenticated
