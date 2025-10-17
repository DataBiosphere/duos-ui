import React, { useCallback, useEffect, useState } from 'react'
import ERACommons from 'src/components/era_commons/ERACommons'
import { Notifications } from 'src/libs/utils'
import { User } from 'src/libs/ajax/User'
import { DAA } from 'src/libs/ajax/DAA'
import { isNil } from 'lodash'
import LibraryCard from 'src/pages/user_profile/LibraryCard'
import DAAs from './DAAs'
import { DAAUtils } from 'src/utils/DAAUtils'
import { nihAccountInstructions, nihAccountLabel } from 'src/components/era_commons/ERACommonsUtils'
import { DAAObject, DuosUser, SimplifiedDuosUser } from 'src/types/model'
import { extractError } from 'src/utils/ErrorUtils'

export interface ResearcherStatusProps {
  user: DuosUser
}

const ResearcherStatus: React.FC<ResearcherStatusProps> = (props) => {
  const { user } = props
  const [issuedOn, setIssuedOn] = useState<string>('')
  const [issuedBy, setIssuedBy] = useState<string>('')
  const [hasCard, setHasCard] = useState<boolean>(true)
  const [daaObjects, setDaaObjects] = useState<DAAObject[]>([])
  const nihStatusUpdate = useCallback(() => {
  }, [])
  const accountLabel = nihAccountLabel()
  const accountLink = nihAccountInstructions()
  const [signingOfficialUsers, setSigningOfficialUsers] = useState<SimplifiedDuosUser[]>([])

  useEffect(() => {
    const init = async () => {
      try {
        if (!isNil(user)) {
          const signingOfficialUsers = await User.getSOsForCurrentUser()
          setSigningOfficialUsers(signingOfficialUsers)
          if (isNil(user.libraryCard)) {
            setHasCard(false)
          }
          else {
            setHasCard(true)
            const card = user.libraryCard
            const daaIds = card.daaIds ?? []
            setIssuedOn(new Date(card.createDate).toISOString().slice(0, 10))
            const createUser = signingOfficialUsers.find((so: SimplifiedDuosUser) => so.userId === card.createUserId)
            if (createUser) {
              setIssuedBy(createUser.displayName)
            }
            else {
              const names = signingOfficialUsers.map((so: SimplifiedDuosUser) => so.displayName)
              setIssuedBy(names.join(', '))
            }

            const daaPromises = daaIds.map((id: number) => DAA.getDaaById(id))
            const daaObjects = await Promise.all(daaPromises)
            setDaaObjects(daaObjects)
          }
        }
      }
      catch (error: unknown) {
        Notifications.showError({ text: 'Error: Unable to retrieve user data from server: ' + extractError(error) })
      }
    }
    init()
  }, [user])

  const cardComponent = () => {
    return DAAUtils.isEnabled()
      ? (
          <DAAs
            issuedOn={issuedOn}
            issuedBy={issuedBy}
            daas={daaObjects}
          />
        )
      : (
          <LibraryCard
            issuedOn={issuedOn}
            issuedBy={issuedBy}
          />
        )
  }

  const subheadStyle = {
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
        }}
      >
        Researcher Status
      </h1>
      <div style={{ marginTop: '20px' }} />
      <p style={subheadStyle}>
        {accountLabel}
        {' '}
        Account
      </p>
      <p>
        A{' '}
        <a href={accountLink}>
          {accountLabel} Account
        </a>
        {' '}is required to submit a Data Access Request (DAR).
      </p>

      {ERACommons({
        destination: 'profile',
        onNihStatusUpdate: nihStatusUpdate,
        header: false,
      })}
      <div style={{ marginTop: '20px' }} />
      <p style={subheadStyle}>Library Card issued to you</p>
      {signingOfficialUsers.length === 0
        ? (
            <p>
              No Signing Official found for your institution. Please refer to <a href="https://duos.blog/2025/08/06/how-to-get-a-library-card-from-your-signing-official/" target="_blank" rel="noreferrer">this help article</a> for instructions on how to get a Library Card.
            </p>
          )
        : (
            <>
              <p>Signing Official(s):</p>
              <ul>
                {signingOfficialUsers.map(so => (
                  <li key={so.userId}>{so.displayName} - {so.email}</li>
                ))}
              </ul>
            </>
          )}
      <p>
        A Library Card is a Signing Official’s pre-authorization of a researcher to submit Data Access Requests (DARs)
        in DUOS. A valid Library Card is required to initiate a DAR.
      </p>
      <div style={{ marginTop: '15px' }} />
      {hasCard
        ? cardComponent()
        : (
            <div>
              <p>No Library Card Found</p>
              <p style={{
                marginTop: '10px',
                marginBottom: '50px',
              }}
              >
                You must have a Library Card to submit a data access request. To obtain one, your Institutional
                Signing Official must register in DUOS, request and receive Signing Official permissions, and issue
                you a Library Card.
              </p>
            </div>
          )}
    </div>
  )
}

export default ResearcherStatus
