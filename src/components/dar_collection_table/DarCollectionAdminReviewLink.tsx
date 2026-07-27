import React from 'react'
import { NavLink } from 'react-router'
import { styles } from 'src/utils/DarCollectionUtils'

interface DarCollectionAdminReviewLinkProps {
  darCollectionId: number
  darCode: string
}

export default function DarCollectionAdminReviewLink({ darCollectionId, darCode }: Readonly<DarCollectionAdminReviewLinkProps>) {
  return (
    <NavLink
      style={{
        fontSize: styles.fontSize.darCode,
        fontFamily: styles.baseStyle.fontFamily,
        fontWeight: 600,
      }}
      to={`/admin_review_collection/${darCollectionId}`}
      id={`/collection-review-${darCollectionId}`}
    >
      {darCode}
    </NavLink>
  )
}
