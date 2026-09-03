import React, { useEffect } from 'react'
import { Redirect } from 'src/libs/auth/auth'
import { takePostLogoutTarget } from 'src/libs/auth/postLogout'
import { Spinner } from 'src/components/Spinner'

export default function PostLogout() {
  useEffect(() => {
    Redirect.replace(takePostLogoutTarget())
  }, [])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '10rem' }}>
      <Spinner />
    </div>
  )
}
