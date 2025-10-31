import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { DataSet } from 'src/libs/ajax/DataSet'
import { cloneDeep, set } from 'lodash'
import { GeneralStudyInformation } from 'src/pages/data_submission/v2/GeneralStudyInformation'
import { NihAnvilUseRelated } from 'src/pages/data_submission/v2/NihAnvilUseRelated'
import { Study } from 'src/pages/data_submission/v2/v2-models'
import { MasterChangeHandler } from 'src/pages/data_submission/v2/v2-common-functions'
import { NihAdministrativeInformation } from 'src/pages/data_submission/v2/NihAdministrativeInformation'
import { NihDataManagement } from 'src/pages/data_submission/v2/NihDataManagement'
import { Styles } from 'src/libs/theme'
import lockIcon from 'src/images/lock-icon.png'

export interface DataSubmissionFormV2Params {
  studyId?: string
}

export const DataSubmissionFormV2 = () => {
  const { studyId } = useParams()
  const [formData, setFormData] = useState({} as Study)
  const [formFiles, setFormFiles] = useState()
  const [loadingError, setLoadingError] = useState(false)

  const onChange: MasterChangeHandler = useCallback(({ key, value, isValid }: { key: string, value: unknown, isValid: boolean }) => {
    if (isValid) {
      setFormData((val: Study) => {
        const newForm = cloneDeep(val)
        return set(newForm, key, value)
      })
    }
  }, [])

  const onFileChange = useCallback(({ key, value }: { key: string, value: unknown }) => {
    setFormFiles((val: unknown) => {
      const newFiles = cloneDeep(val)
      set(newFiles, key, value)
      return newFiles
    })
  }, [setFormFiles])

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
      <div style={Styles.PAGE}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '112%', marginLeft: '-6%', padding: '0 2.5%' }}>
          <div className="left-header-section" style={Styles.LEFT_HEADER_SECTION}>
            <div style={Styles.ICON_CONTAINER}>
              <img id="lock-icon" src={lockIcon} style={Styles.HEADER_IMG} />
            </div>
            <div style={Styles.HEADER_CONTAINER}>
              <div style={Styles.TITLE}>
                Study Registration Form
                <div style={Styles.MEDIUM_DESCRIPTION}>
                  Submit new datasets to DUOS
                </div>
              </div>
            </div>
          </div>
        </div>

        <GeneralStudyInformation formData={formData} onChange={onChange} />
        <NihAnvilUseRelated formData={formData} onChange={onChange} />
        <NihAdministrativeInformation formData={formData} onChange={onChange} />
        <NihDataManagement formData={formData} onChange={onChange} formFiles={formFiles} onFileChange={onFileChange} />
      </div>
    </>
  )
}
