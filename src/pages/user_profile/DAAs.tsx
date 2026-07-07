import React from 'react'
import { DAA } from 'src/libs/ajax/DAA'
import { DAAObject, DacObject } from 'src/types/model'

interface DAAsProps {
  readonly issuedOn: string
  readonly issuedBy: string
  readonly daas: DAAObject[]
}

const dacDisplayName = (dac: DacObject): string => dac.name || dac.dacName || ''

const headerStyle: React.CSSProperties = {
  fontFamily: 'Montserrat',
  fontSize: '14px',
  fontWeight: 600,
  color: '#000',
  padding: '8px 24px 8px 0',
  textAlign: 'left',
  borderBottom: '2px solid #ddd',
  whiteSpace: 'nowrap',
}

const cellStyle: React.CSSProperties = {
  fontFamily: 'Montserrat',
  fontSize: '14px',
  padding: '12px 24px 12px 0',
  verticalAlign: 'top',
  borderBottom: '1px solid #eee',
}

export default function DAAs(props: DAAsProps) {
  const { issuedOn, issuedBy, daas } = props

  const formattedDate = new Date(issuedOn).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <thead>
        <tr>
          <th style={headerStyle}>Agreement</th>
          <th style={headerStyle}>Issued by</th>
          <th style={headerStyle}>DACs using this DAA</th>
        </tr>
      </thead>
      <tbody>
        {daas.map((daa: DAAObject) => {
          const fileName = daa.file.fileName.split('.')[0]
          const dacNames = (daa.dacs ?? []).map(dacDisplayName).filter(Boolean)
          return (
            <tr key={daa.daaId}>
              <td style={cellStyle}>
                <button
                  type="button"
                  onClick={() => DAA.getDaaFileById(daa.daaId, fileName)}
                  className="button button-white"
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <span style={{ paddingRight: '1rem' }} className="glyphicon glyphicon-download" />
                  {fileName}
                </button>
              </td>
              <td style={cellStyle}>
                <div>{issuedBy}</div>
                <div>{formattedDate}</div>
              </td>
              <td style={cellStyle}>
                {dacNames.length > 0 ? dacNames.join(', ') : '—'}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
