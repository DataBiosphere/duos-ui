import React, { useCallback, useEffect } from 'react'
import { AdvancedFormDatasetDetails, DatasetDetails } from './AdvancedFormDatasetDetails'
import { cloneDeep } from 'lodash/fp'
import { AdvancedFormStep2 } from 'src/pages/data_submission_v2/AdvancedDataSubmissionForm'

export interface AdvancedFormDatasetInformationProps {
  id: string
  step2: AdvancedFormStep2
  onChange: ({ key, value }: {
    key: string
    value: unknown
  }) => void
}

export const AdvancedFormDatasetInformation = (props: AdvancedFormDatasetInformationProps) => {
  const { step2, id, onChange } = props
  function datasetOnChange(key: number, dataset: unknown) {
    const item = `step2.datasets[${key}]`
    onChange({ key: item, value: dataset })
  }

  const addDataset = useCallback(() => {
    if (step2?.datasets === undefined) {
      onChange({ key: 'step2.datasets', value: [{ id: globalThis.crypto.randomUUID() }] })
    }
    else {
      const datasets = step2.datasets
      datasets.push({ id: globalThis.crypto.randomUUID() } as DatasetDetails)
      onChange({ key: 'step2.datasets', value: datasets })
    }
  }, [step2?.datasets, onChange])

  const deleteDataset = useCallback((idx: number) => {
    step2.datasets.splice(idx, 1)
    onChange({ key: 'step2.datasets', value: cloneDeep(step2.datasets) as never })
  }, [step2, onChange])

  useEffect(() => {
    if (step2?.datasets === undefined) {
      addDataset()
    }
  }, [addDataset, step2])

  return (
    <>
      <h4>Register Datasets</h4>
      <div>Create different consent groups or versions of datasets which you would like to store, share, and grant access to distinctly</div>
      {step2?.datasets?.map((dataset: DatasetDetails, index: number) => { return <AdvancedFormDatasetDetails key={dataset.id} idx={index} dataset={dataset} draftId={id} onChange={datasetOnChange} onDelete={deleteDataset} /> })}
      <button
        className="button-complex-outlined-secondary"
        style={{ marginBottom: '10px' }}
        onClick={addDataset}
      >Add {step2?.datasets && step2?.datasets.length > 0 ? 'another' : 'a' } dataset
        <span
          className="button-icon button-icon-circle-plus-outline"
          style={{ marginLeft: '8px' }}
        />
      </button>
    </>
  )
}

export default AdvancedFormDatasetInformation
