import React from 'react'
import { useState, useEffect } from 'react'

import { Notifications } from '../libs/utils'
import { Styles } from '../libs/theme'
import DatasetUpdate from '../components/data_update/DatasetUpdate'
import { DataSet } from '../libs/ajax/DataSet'
import { useParams } from 'react-router-dom'
import TableHeaderSection from 'src/components/TableHeaderSection'

export const DatasetUpdateForm = () => {
  const params = useParams()
  const { datasetId } = params

  const [failedInit, setFailedInit] = useState(true)
  const [dataset, setDataset] = useState({})

  useEffect(() => {
    const init = async () => {
      try {
        setDataset(await DataSet.getDataSetsByDatasetId(datasetId))
        setFailedInit(false)
      }
      catch (_error) {
        Notifications.showError({ text: 'Failed to load dataset' })
      }
    }
    init()
  }, [datasetId])

  return !failedInit && (
    <div style={Styles.PAGE}>
      <div>
        <TableHeaderSection
          title="Dataset Update Form"
          description="This is an easy way to update a dataset in DUOS!"
        />
      </div>

      <form style={{ margin: 'auto', maxWidth: 800 }}>
        <DatasetUpdate dataset={dataset} />
      </form>
    </div>
  )
}

export default DatasetUpdateForm
