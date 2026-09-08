import React from 'react'
import { DownloadLink } from 'src/components/DownloadLink'
import { DAA } from 'src/libs/ajax/DAA'
import { DAAObject, DacObject } from 'src/types/model'
import './UserProfile.css'

interface DAAsProps {
  readonly issuedOn: string
  readonly issuedBy: string
  readonly daas: DAAObject[]
}

const dacDisplayName = (dac: DacObject): string => dac.name || dac.dacName || ''

export default function DAAs(props: DAAsProps) {
  const { issuedOn, issuedBy, daas } = props

  const formattedDate = new Date(issuedOn).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="user-profile-table-wrapper">
      <table className="user-profile-table">
        <thead>
          <tr>
            <th>Agreement</th>
            <th>Issued by</th>
            <th>DACs using this DAA</th>
          </tr>
        </thead>
        <tbody>
          {daas.map((daa: DAAObject) => {
            const fileName = daa.file.fileName.split('.')[0]
            const dacNames = (daa.dacs ?? []).map(dacDisplayName).filter(Boolean)
            return (
              <tr key={daa.daaId}>
                <td>
                  <DownloadLink
                    label={fileName}
                    onDownload={() => DAA.getDaaFileById(daa.daaId, fileName)}
                  />
                </td>
                <td>
                  <div>{issuedBy}</div>
                  <div>{formattedDate}</div>
                </td>
                <td>
                  {dacNames.length > 0 ? dacNames.join(', ') : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
