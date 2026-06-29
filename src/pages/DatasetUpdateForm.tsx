import React, { useState, useEffect } from 'react'
import { Notifications } from 'src/libs/utils'
import { Styles } from 'src/libs/theme'
import DatasetUpdate from 'src/components/data_update/DatasetUpdate'
import { DataSet } from 'src/libs/ajax/DataSet'
import { useParams } from 'react-router-dom'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { Dataset } from 'src/types/model'

export const DatasetUpdateForm = (): React.JSX.Element | false => {
  const { datasetId } = useParams<{ datasetId: string }>()

  const [failedInit, setFailedInit] = useState(true)
  const [dataset, setDataset] = useState<Dataset | null>(null)

  useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        setDataset(await DataSet.getDataSetsByDatasetId(Number(datasetId)))
        setFailedInit(false)
      }
      catch {
        Notifications.showError({ text: 'Failed to load dataset' })
      }
    }
    void init()
  }, [datasetId])

  return !failedInit && dataset !== null && (
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
