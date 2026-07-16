import React, { useCallback, useEffect, useState } from 'react'
import ERACommons from 'src/components/era_commons/ERACommons'
import { Notifications } from 'src/libs/utils'
import { User } from 'src/libs/ajax/User'
import { DAA } from 'src/libs/ajax/DAA'
import { isNil } from 'src/utils/NodashUtil'
import DAAs from './DAAs'
import { nihAccountInstructions, nihAccountLabel } from 'src/components/era_commons/ERACommonsUtils'
import { DAAObject, DuosUser, SigningOfficialUserWithData } from 'src/types/model'
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
  useEffect(() => {
    const init = async () => {
      try {
        if (!isNil(user)) {
          const signingOfficialUsers: SigningOfficialUserWithData[] = user.institutionId
            ? await User.getSOsForInstitution(user.institutionId)
            : await User.getSOsForCurrentUser()
          if (isNil(user.libraryCard)) {
            setHasCard(false)
          }
          else {
            setHasCard(true)
            const card = user.libraryCard
            const daaIds = card.daaIds ?? []
            setIssuedOn(new Date(card.createDate).toISOString().slice(0, 10))
            const createUser = signingOfficialUsers.find((so: SigningOfficialUserWithData) => so.userId === card.createUserId)
            if (createUser) {
              setIssuedBy(createUser.displayName)
            }
            else {
              const names = signingOfficialUsers.map((so: SigningOfficialUserWithData) => so.displayName)
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
          borderBottom: '1px solid #ddd',
          paddingBottom: '8px',
        }}
      >
        Researcher Status
      </h1>
      <div style={{ marginTop: '20px' }} />
      <p style={subheadStyle}>Status</p>
      <p style={{
        fontFamily: 'Montserrat',
        fontSize: '16px',
        fontWeight: 600,
        color: hasCard ? '#00928A' : 'rgb(128, 128, 128)',
      }}
      >
        {hasCard ? 'Active' : 'Inactive'}
      </p>
      {!hasCard && (
        <p style={{ marginTop: '10px' }}>
          You must be an Active researcher to submit a data access request in DUOS. Please contact your Institutional Signing Official to change your status in DUOS.
        </p>
      )}
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

      <ERACommons
        destination="profile"
        onNihStatusUpdate={nihStatusUpdate}
        header={false}
      />
      <div style={{ marginTop: '20px' }} />
      <p style={subheadStyle}>Your Pre-Authorized Data Access Agreements</p>
      <p>
        Pre-authorization data access agreements (DAAs) allows your Signing Official to approve you once to submit
        data access requests (DARs) to a data access committee (DAC) at will.
      </p>
      <div style={{ marginTop: '15px' }} />
      {hasCard
        ? (
            <DAAs
              issuedOn={issuedOn}
              issuedBy={issuedBy}
              daas={daaObjects}
            />
          )
        : null}
    </div>
  )
}

export default ResearcherStatus
