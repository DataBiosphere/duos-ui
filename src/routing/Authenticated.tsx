import React, { useEffect, useState } from 'react'
import { Notifications } from 'src/libs/utils'
import { Storage } from 'src/libs/storage'
import { Navigate, Outlet } from 'react-router-dom'

const Authenticated = () => {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
    : <Navigate to="/" />
}

export default Authenticated
