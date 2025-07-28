import React from 'react'
import { TextField } from '@mui/material'
import InfoIcon from '@mui/icons-material/Info'
import { Link } from 'react-router-dom'

interface SigningOfficialUser {
  userId: string | number
  displayName: string
  email: string
}

interface SigningOfficialsViewProps {
  signingOfficials?: SigningOfficialUser[]
}

export const SigningOfficialsList = ({ signingOfficials = [] }: SigningOfficialsViewProps) => {
  const hasSigningOfficials = signingOfficials && signingOfficials.length > 0

  return (
    <div style={{ paddingTop: 20, marginTop: 20, borderTop: '1px solid', borderColor: '#e1e1e1', width: '100%' }}>
      <div style={{ fontSize: 18, fontWeight: 600, paddingBottom: '1rem' }}>
        Signing Officials
      </div>
      <div className="italic" style={{ display: 'flex', gap: '8px', paddingBottom: '2rem', width: '50%' }}>
        <InfoIcon fontSize="large" color="info" style={{ paddingTop: '0.25rem' }} />
        <div>
          Administrators can manage Signing Officials from the
          {' '}
          <Link to="/admin_manage_users">Manage Users</Link>
          {' '}
          page by assigning or removing the &#34;Signing Official&#34; role for users associated with this institution.
        </div>
      </div>
      {!hasSigningOfficials && (
        <div style={{ marginBottom: 10 }} className="italic">
          This institution does not have any Signing Officials
        </div>
      )}
      {hasSigningOfficials && signingOfficials.map(so => (
        <div key={so.userId} style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <TextField
            label="Name"
            disabled={true}
            value={so.displayName}
            InputProps={{
              style: { fontSize: 14 },
              size: 'small',
              readOnly: true,
            }}
            InputLabelProps={{
              style: { fontSize: 14 },
            }}
            variant="outlined"
            style={{ marginRight: 10, width: 300 }}
            sx={{
              '& .MuiInputBase-input.Mui-disabled': {
                WebkitTextFillColor: '#7b7b7b',
              },
            }}
          />
          <TextField
            label="Email"
            disabled={true}
            value={so.email}
            style={{ width: 300 }}
            InputProps={{
              style: { fontSize: 14 },
              size: 'small',
              readOnly: true,
            }}
            InputLabelProps={{
              style: { fontSize: 14 },
            }}
            variant="outlined"
            sx={{
              '& .MuiInputBase-input.Mui-disabled': {
                WebkitTextFillColor: '#7b7b7b',
              },
            }}
          />
        </div>
      ))}
    </div>
  )
}
