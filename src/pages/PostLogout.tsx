import React, { useEffect } from 'react'
import { Redirect } from 'src/libs/auth/auth'
import { takePostLogoutTarget } from 'src/libs/auth/postLogout'
import { Spinner } from 'src/components/Spinner'

/**
 * The one fixed `post_logout_redirect_uri` registered with Azure B2C
 * (BFF Phase 5, story 5-E).
 *
 * B2C requires that URI to match a registered value exactly, so the local
 * destination cannot ride in it. Auth.signOut stored the destination before
 * the logout POST; this page reads it, DELETES it, validates it again, and
 * replaces the current history entry with it — defaulting to '/' when the
 * value is missing or is not a same-origin path.
 *
 * The page performs NO state-changing request: a state-changing GET here would
 * reintroduce the CSRF exposure the BFF closed.
 */
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
