import React, { useEffect, useState } from 'react'
import { User } from 'src/libs/ajax/User'
import { Notifications } from 'src/libs/utils'
import { AcknowledgementMap } from 'src/types/model'
import './UserProfile.css'
import './AcceptedAcknowledgements.css'

interface AcknowledgmentItem {
  name: string
  attestedTime: string
}

export default function AcceptedAcknowledgements() {
  const [acceptedAcknowledgements, setAcceptedAcknowledgements] = useState<AcknowledgmentItem[]>([])

  useEffect(() => {
    const init = async () => {
      const allAcknowledgements: AcknowledgmentItem[] = []
      const ToS: AcknowledgmentItem = {
        name: 'DUOS/Terra Terms of Service',
        attestedTime: '',
      }
      allAcknowledgements.push(ToS)
      try {
        const acknowledgements: AcknowledgementMap = await User.getAcknowledgements()
        for (const key in acknowledgements) {
          const currAcknowledgement = acknowledgements[key]
          const date = new Date(currAcknowledgement.lastAcknowledged)
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          const year = date.getFullYear()
          const newAcknowledgment: AcknowledgmentItem = {
            name: currAcknowledgement.ackKey,
            attestedTime: `${month}/${day}/${year}`,
          }
          allAcknowledgements.push(newAcknowledgment)
        }
        setAcceptedAcknowledgements(allAcknowledgements)
      }
      catch {
        Notifications.showError({ text: 'Error: Unable to retrieve user data from server' })
      }
    }
    init()
  }, [])

  return (
    <div>
      <h1 className="user-profile-section-heading">
        Accepted Terms & Policies
      </h1>
      <div className="accepted-acknowledgements-list">
        {
          (acceptedAcknowledgements.length === 0)
            ? (
                <div>
                  <p>No Accepted Terms & Policies Found</p>
                </div>
              )
            : (
                <table className="user-profile-table">
                  <thead>
                    <tr>
                      <th>Document Name</th>
                      <th>Attestation Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acceptedAcknowledgements.map(value => (
                      <tr key={`${value.name}-${value.attestedTime}`}>
                        <td>{value.name}</td>
                        <td>{value.attestedTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
        }
      </div>
    </div>
  )
}
