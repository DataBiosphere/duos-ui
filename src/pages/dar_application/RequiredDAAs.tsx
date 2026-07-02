import React from 'react'
import { DAA } from 'src/libs/ajax/DAA'
import { DAAObject, Dataset } from 'src/types/model'

export interface RequiredDAAsProps {
  datasets: Dataset[]
  daas: DAAObject[]
  agreementText?: string
}

export default function RequiredDAAs({ datasets, daas, agreementText }: Readonly<RequiredDAAsProps>) {
  const fileNames = new Set<string>()
  const daaDivs = datasets.map((dataset, index) => {
    const datasetDacId = dataset.dacId
    if (!datasetDacId) {
      return <div key={dataset.datasetId + '-' + index}></div>
    }
    const daa = daas.find(daa => daa.dacs?.some(d => d.dacId === datasetDacId))
    if (!daa) {
      return <div key={dataset.datasetId + '-' + index}></div>
    }
    const id = daa.daaId
    const fileName = daa.file.fileName.split('.')[0]
    if (fileNames.has(fileName)) {
      return <div key={'file-name-' + dataset.datasetId}></div>
    }
    fileNames.add(fileName)
    return (
      <div key={'download-daa-' + index}>
        <div className="flex flex-row" style={{ justifyContent: 'flex-start' }}>
          <div>
            <button
              type="button"
              rel="noreferrer"
              onClick={() => DAA.getDaaFileById(id, fileName)}
              className="button button-white"
              style={{ marginRight: '2rem' }}
            >
              <span className="glyphicon glyphicon-download"></span>
              {' '}
              {fileName}
            </button>
          </div>
        </div>
      </div>
    )
  })
  if (fileNames.size === 0) {
    return (
      <div></div>
    )
  }
  else {
    return (
      <div>
        <h3>{agreementText}</h3>
        <div className="flex flex-row" style={{ justifyContent: 'flex-start' }}>
          {daaDivs}
        </div>
      </div>
    )
  }
}
