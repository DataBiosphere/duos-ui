import React from 'react'
import { DAA } from 'src/libs/ajax/DAA'
import { DAAObject, Dataset } from 'src/types/model'

export interface RequiredDAAsProps {
  datasets: Dataset[]
  daas: DAAObject[]
  agreementText?: string
}

type DAARow = {
  daaId: number
  fileName: string
  dacNames: string[]
  datasetNames: string[]
}

export default function RequiredDAAs({ datasets, daas, agreementText }: Readonly<RequiredDAAsProps>) {
  const rowMap = new Map<number, DAARow>()

  datasets.forEach((dataset) => {
    if (!dataset.dacId) return
    const daa = daas.find(d => d.dacs?.some(dac => dac.dacId === dataset.dacId))
    if (!daa) return
    const fileName = daa.file?.fileName?.split('.')[0]
    if (!fileName) return

    if (!rowMap.has(daa.daaId)) {
      const dacNames = (daa.dacs ?? [])
        .filter(dac => datasets.some(ds => ds.dacId === dac.dacId))
        .map(dac => dac.dacName || dac.name || '')
        .filter(Boolean)
      rowMap.set(daa.daaId, { daaId: daa.daaId, fileName, dacNames, datasetNames: [] })
    }

    const row = rowMap.get(daa.daaId)!
    const datasetName = dataset.name || dataset.datasetIdentifier
    if (datasetName && !row.datasetNames.includes(datasetName)) {
      row.datasetNames.push(datasetName)
    }
  })

  const rows = Array.from(rowMap.values())

  if (rows.length === 0) {
    return <div></div>
  }

  return (
    <div>
      <h4>{agreementText}</h4>
      <div className="dataset-daa-relationship-card">
        <table className="table">
          <thead>
            <tr>
              <th>Data Access Agreement</th>
              <th>Data Access Committee</th>
              <th>Datasets</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.daaId}>
                <td>
                  <button
                    type="button"
                    className="button-link"
                    onClick={() => DAA.getDaaFileById(row.daaId, row.fileName)}
                  >
                    {row.fileName}
                  </button>
                  {' '}
                  <span className="glyphicon glyphicon-download"></span>
                </td>
                <td>{row.dacNames.join(', ')}</td>
                <td>{row.datasetNames.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
