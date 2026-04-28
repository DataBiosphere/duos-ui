import React from 'react'
import { DAA } from 'src/libs/ajax/DAA'
import { DAAObject } from 'src/types/model'

interface DAAsProps {
  readonly issuedOn: string
  readonly issuedBy: string
  readonly daas: DAAObject[]
}

export default function DAAs(props: DAAsProps) {
  const {
    issuedOn,
    issuedBy,
    daas,
  } = props

  const DAADownload = (id: number, fileName: string) => {
    return (
      <div className="flex flex-row" style={{ justifyContent: 'flex-start', marginBottom: '30px' }}>
        <div>
          <button
            type="button"
            onClick={() => DAA.getDaaFileById(id, fileName)}
            className="button button-white"
            style={{ marginRight: '2rem', display: 'flex', alignItems: 'center' }}
          >
            <span style={{ paddingRight: '1rem' }} className="glyphicon glyphicon-download"></span>
            {' '}
            {fileName}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <p style={{ margin: '0px 0px 0px 10px' }}>Issued by</p>
          <p style={{ margin: '0px 0px 0px 10px' }}>
            {issuedBy}
            ,
            {' '}
            {new Date(issuedOn).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    )
  }

  const daaDivs = daas.map((daa: DAAObject) => {
    const id = daa.daaId
    const fileName = daa.file.fileName.split('.')[0]
    return (
      <div key={id}>
        {DAADownload(id, fileName)}
      </div>
    )
  })

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {daaDivs}
      </div>
    </div>
  )
}
