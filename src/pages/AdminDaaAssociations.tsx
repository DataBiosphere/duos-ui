import React from 'react'

import { DaaAssociationsPage } from 'src/pages/signing_official_console/DAAAssignment'
import { USER_ROLES } from 'src/libs/utils'

const DESCRIPTION = 'Read-only view of DAA pre-authorization status for researchers across all '
  + 'institutions. Pre-authorization is granted and revoked by each institution\'s Signing '
  + 'Official.'

/**
 * Admin Console → DAA Associations.
 *
 * The SO Console page scoped to researchers at every institution and rendered
 * read-only: admins observe pre-authorization status here, while granting and
 * revoking remain a Signing Official responsibility.
 */
export const AdminDaaAssociations = function AdminDaaAssociations(): React.JSX.Element {
  return (
    <DaaAssociationsPage
      title="DAA Associations"
      description={DESCRIPTION}
      scope={USER_ROLES.admin}
      readOnly
    />
  )
}

export default AdminDaaAssociations
