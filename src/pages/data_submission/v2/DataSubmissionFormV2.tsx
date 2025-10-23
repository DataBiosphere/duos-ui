import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { DataSet } from 'src/libs/ajax/DataSet'
import { cloneDeep } from 'lodash/fp'
import { set } from 'lodash'
import { GeneralStudyInformation, Study } from 'src/pages/data_submission/v2/GeneralStudyInformation'

export interface DataSubmissionFormV2Params {
  studyId?: string
}

export const DataSubmissionFormV2 = () => {
  const { studyId } = useParams<DataSubmissionFormV2Params>()
  const [formData, setFormData] = useState({} as Study)
  const [loadingError, setLoadingError] = useState(false)

  const onChange = useCallback(({ key, value }: { key: string, value: unknown }) => {
    setFormData((val) => {
      const newForm = cloneDeep(val)
      set(newForm, key, value)
      return newForm
    })
  }, [])

  useEffect(() => {
    const onLoadFormData = (studyId: string | undefined) => {
      if (studyId) {
        DataSet.getStudyById(studyId).then(study => setFormData(study)).catch(() => {
          setFormData({} as Study)
          setLoadingError(true)
        })
      }
    }
    onLoadFormData(studyId)
  }, [studyId, setFormData])

  return (
    <>
      {loadingError && <div>Error Loading Page</div>}
      <GeneralStudyInformation formData={formData} onChange={onChange} />
    </>
  )
}
