import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Institution as InstitutionAPI } from 'src/libs/ajax/Institution'
import { User } from 'src/libs/ajax/User'
import { Notifications } from 'src/libs/utils'
import { DuosUser, InstitutionInterface, SigningOfficialUserWithData } from 'src/types/model'

interface AffiliationAndRoleProps {
  readonly user: DuosUser
}

export default function AffiliationAndRole(props: AffiliationAndRoleProps) {
  const { user } = props
  const [institution, setInstitution] = useState<InstitutionInterface>()
  const [roles, setRoles] = useState<string>('')
  const [signingOfficialUsers, setSigningOfficialUsers] = useState<SigningOfficialUserWithData[]>([])

  useEffect(() => {
    const init = async () => {
      try {
        const allRoles = user?.roles?.map(role => role.name).join(', ')
        setRoles(allRoles)
        if (user?.institutionId) {
          const institution: InstitutionInterface = await InstitutionAPI.getById(user.institutionId)
          if (institution) {
            setInstitution(institution)
          }
        }
        const soUsers = await User.getSOsForCurrentUser()
        setSigningOfficialUsers(soUsers)
      }
      catch {
        Notifications.showError({ text: 'Error: Unable to retrieve user information' })
      }
    }
    init()
  }, [user])

  const soTableHeaderStyle: React.CSSProperties = {
    fontFamily: 'Montserrat',
    fontSize: '14px',
    fontWeight: 600,
    color: '#000',
    padding: '8px 24px 8px 0',
    textAlign: 'left',
    borderBottom: '2px solid #ddd',
    whiteSpace: 'nowrap',
  }

  const soTableCellStyle: React.CSSProperties = {
    fontFamily: 'Montserrat',
    fontSize: '14px',
    padding: '10px 24px 10px 0',
    borderBottom: '1px solid #eee',
    verticalAlign: 'top',
  }

  const subHeadStyle = {
    color: '#000',
    fontFamily: 'Montserrat',
    fontSize: '16px',
    fontStyle: 'normal',
    fontWeight: '600',
    lineHeight: 'normal',
  }

  return (
    <div>
      <h1
        style={{
          color: '#01549F',
          fontSize: '20px',
          fontWeight: '600',
          borderBottom: '1px solid #ddd',
          paddingBottom: '8px',
        }}
      >
        Affiliation & Role
      </h1>
      <div style={{ marginTop: '20px' }} />
      <div>
        <p style={subHeadStyle}>My Institution</p>
        <div style={{ marginTop: '15px' }} />
        {institution
          ? <div data-cy="institutional-affiliation">{institution.name}</div>
          : (
              <div data-cy="institutional-affiliation">
                Your institutional affiliation is automatically derived from your email domain.
                Please use your institutional email to be affiliated with your institution. If you are using your institutional email and have not been assigned an institution
                please use the Contact Us form and provide your email and institution.
                {' '}
              </div>
            )}
        <div style={{ marginTop: '15px' }} />
        <p style={subHeadStyle}>My Role(s)</p>
        <p data-cy="user-roles">{roles}</p>
        <Link
          to="/request_role"
          style={{ fontFamily: 'Montserrat', fontSize: '14px', color: '#00609f' }}
        >
          Request a new role
        </Link>
        <div style={{ marginTop: '15px' }} />
        <p style={subHeadStyle}>My Institution&apos;s Signing Official(s)</p>
        <div style={{ marginTop: '10px' }} />
        {signingOfficialUsers.length === 0
          ? (
              <p>
                No Signing Official found for your institution. Please refer to{' '}
                <a href="https://duos.blog/2025/08/06/how-to-get-a-library-card-from-your-signing-official/" target="_blank" rel="noreferrer">
                  this help article
                </a>{' '}
                for instructions on how to get a Library Card.
              </p>
            )
          : (
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th style={soTableHeaderStyle}>Name</th>
                    <th style={soTableHeaderStyle}>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {signingOfficialUsers.map(so => (
                    <tr key={so.userId}>
                      <td style={soTableCellStyle}>{so.displayName}</td>
                      <td style={soTableCellStyle}>{so.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
      </div>
    </div>
  )
}
