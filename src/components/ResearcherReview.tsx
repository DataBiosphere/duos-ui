import React from 'react'
import { DuosUser } from 'src/types/model'
import { extractEraAuthenticationState } from 'src/components/era_commons/ERACommonsUtils'

interface ResearcherReviewProps {
  readonly user: DuosUser
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1rem',
}

const labelStyle: React.CSSProperties = {
  fontWeight: 'bolder',
}

const headerStyle: React.CSSProperties = {
  borderBottom: '2px solid gray',
}

export const ResearcherReview = (props: ResearcherReviewProps) => {
  const user = props.user
  const nihAuthState = extractEraAuthenticationState(props.user)

  return (
    <div>
      <div style={headerStyle}><h4>Researcher Information</h4></div>
      <div style={gridStyle}>
        <div style={labelStyle}>Full Name</div>
        <div data-cy="display-name">{user.displayName ?? ''}</div>

        <div style={labelStyle}>Institution Name</div>
        <div data-cy="institution-name">{user.institution?.name ?? ''}</div>

        <div style={labelStyle}>NIH Linked Account ID</div>
        <div data-cy="era-commons-id">{nihAuthState.eraCommonsId ?? ''}</div>

        <div style={labelStyle}>NIH Authentication State</div>
        <div data-cy="nih-valid">{nihAuthState.nihValid ? 'Authorized' : 'Not Authorized'}</div>

        <div style={labelStyle}>NIH Authentication Expiration</div>
        <div data-cy="nih-expiration">{nihAuthState.expirationCount > 0 ? `${nihAuthState.expirationCount} days remaining` : 'Expired'}</div>
      </div>
    </div>
  )
}
