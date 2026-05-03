import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { styles } from '../../utils/DarCollectionUtils'

export default function DarCollectionAdminReviewLink(props) {
  const { darCollectionId, darCode } = props
  const location = useLocation()
  return (
    <NavLink
      style={{
        fontSize: styles.fontSize.darCode,
        fontFamily: styles.baseStyle.fontFamily,
        fontWeight: 600,
      }}
      to={`/admin_review_collection/${darCollectionId}`}
      state={{ selectedMenuTab: location.state?.selectedMenuTab }}
      id={`/collection-review-${darCollectionId}`}
    >
      {darCode}
    </NavLink>
  )
}
