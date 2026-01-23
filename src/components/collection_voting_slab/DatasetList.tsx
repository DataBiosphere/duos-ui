import { DacTerm, Dataset, DuosUser } from 'src/types/model'
import React from 'react'
import { isNil } from 'lodash'
import { Storage } from 'src/libs/storage'
import { Link } from 'react-router-dom'

type DatasetListProps = {
  readonly visibleDatasets: Dataset[]
  readonly isLoading: boolean
  readonly dacs?: DacTerm[]
}

export default function DatasetList(props: DatasetListProps) {
  const { visibleDatasets, isLoading, dacs } = props
  const datasetId = (dataset: Dataset) => isNil(dataset.datasetIdentifier) ? '- -' : dataset.datasetIdentifier
  const datasetName = (dataset: Dataset) => isNil(dataset.name) ? '- -' : dataset.name
  const user: DuosUser = Storage.getCurrentUser()
  const userIsChair: boolean = user.isChairPerson

  const datasetRows = visibleDatasets.map((dataset: Dataset) => {
    const dac = dacs?.find(dacItem => dacItem.dacId === dataset.dacId)
    const dacLink = userIsChair
      ? (
          <Link to={`/manage_edit_dac/${dac?.dacId}`}>
            {dac?.dacName}
          </Link>
        )
      : dac?.dacName
    const datasetLink = (
      <Link to={`/dataset/DUOS-D${dataset.datasetId}`}>
        {datasetId(dataset)}
      </Link>
    )
    return (
      <tr key={dataset.datasetId}>
        <td>{datasetLink}</td>
        <td>{datasetName(dataset)}</td>
        <td>{dacLink}</td>
      </tr>
    )
  })

  return isLoading
    ? (
        <div
          className="text-placeholder"
          style={{
            height: '30px',
            width: '60%',
          }}
        />
      )
    : (
        <div data-cy="dataset-list">
          <table style={{ width: '-webkit-fill-available' }}>
            <thead>
              <tr>
                <th>Dataset Identifier</th>
                <th>Dataset Name</th>
                <th>DAC</th>
              </tr>
            </thead>
            <tbody>
              {datasetRows}
            </tbody>
          </table>
        </div>
      )
}
