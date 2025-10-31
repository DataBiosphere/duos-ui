import React, { useCallback, useEffect, useState } from 'react'
import { DataSet } from 'src/libs/ajax/DataSet'
import { cloneDeep, set } from 'lodash/fp'
import { GeneralStudyInformation } from 'src/pages/data_submission/v2/GeneralStudyInformation'
import { NihAnvilUseRelated } from 'src/pages/data_submission/v2/NihAnvilUseRelated'
import { Study } from 'src/pages/data_submission/v2/v2-models'
import { MasterChangeHandler } from 'src/pages/data_submission/v2/v2-common-functions'
import { useParams } from 'react-router-dom'

export const DataSubmissionFormV2 = () => {
  const { studyId } = useParams()
  const [formData, setFormData] = useState({} as Study)
  const [loadingError, setLoadingError] = useState(false)

  const onChange: MasterChangeHandler = useCallback(({ key, value, isValid }: { key: string, value: unknown, isValid: boolean }) => {
    if (isValid) {
      setFormData((val: Study) => {
        const newForm = cloneDeep(val)
        return set(key, value, newForm)
      })
    }
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
      <NihAnvilUseRelated formData={formData} onChange={onChange} />
    </>
  )
}
