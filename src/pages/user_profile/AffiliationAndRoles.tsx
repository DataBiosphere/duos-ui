import React, { useEffect, useState } from 'react'
import { Institution as InstitutionAPI } from 'src/libs/ajax/Institution'
import { User } from 'src/libs/ajax/User'
import { Notifications } from 'src/libs/utils'
import { DuosUser, InstitutionInterface, SigningOfficialUserWithData } from 'src/types/model'
import SigningOfficialRequest from './SigningOfficialRequest'
import './AffiliationAndRoles.css'
import './UserProfile.css'

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

  return (
    <div className="affiliation-and-roles">
      <h1 className="user-profile-section-heading">Affiliation & Role</h1>
      <div>
        <p className="affiliation-and-roles-subheading">My Institution</p>
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
        <p className="affiliation-and-roles-subheading">My Role(s)</p>
        <p data-cy="user-roles">{roles}</p>
        <SigningOfficialRequest user={user} />
        <p className="affiliation-and-roles-subheading">My Institution&apos;s Signing Official(s)</p>
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
              <table className="user-profile-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {signingOfficialUsers.map(so => (
                    <tr key={so.userId}>
                      <td>{so.displayName}</td>
                      <td>{so.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
      </div>
    </div>
  )
}
