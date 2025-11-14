import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DataSet } from 'src/libs/ajax/DataSet'
import { GeneralStudyInformation } from 'src/pages/data_submission/v2/GeneralStudyInformation'
import { NihAnvilUseRelated } from 'src/pages/data_submission/v2/NihAnvilUseRelated'
import { Study } from 'src/pages/data_submission/v2/v2-models'
import { NihAdministrativeInformation } from 'src/pages/data_submission/v2/NihAdministrativeInformation'
import { NihDataManagement } from 'src/pages/data_submission/v2/NihDataManagement'
import { Styles } from 'src/libs/theme'
import lockIcon from 'src/images/lock-icon.png'
import { StudyAssetManagement } from 'src/pages/data_submission/v2/StudyAssetManagement'

export type FileProperty = {
  key: string
  value: File
}

export const ALTERNATIVE_DATA_SHARING_PLAN_FILE = 'alternativeDataSharingPlanFile'

export const DataSubmissionFormV2 = () => {
  const { studyId } = useParams()
  const [study, setStudy] = useState({} as Study)
  const [formFiles, setFormFiles] = useState({} as FileProperty)
  const [loadingError, setLoadingError] = useState(false)

  useEffect(() => {
    const onLoadFormData = (studyId: string | undefined) => {
      if (studyId) {
        DataSet.getStudyById(studyId).then(study => setStudy(study)).catch(() => {
          setStudy({} as Study)
          setLoadingError(true)
        })
      }
    }
    onLoadFormData(studyId)
  }, [studyId, setStudy])

  return (
    <>
      {loadingError && <div>Error Loading Page</div>}
      <div style={Styles.PAGE}>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '112%', marginLeft: '-6%', padding: '0 2.5%' }}>
          <div
            className="left-header-section"
            style={{ display: 'flex',
              flexDirection: 'row',
              paddingTop: '3rem' }}
          >
            <div style={Styles.ICON_CONTAINER}>
              <img id="lock-icon" alt="Lock icon" src={lockIcon} style={Styles.HEADER_IMG} />
            </div>
            <div style={{ display: 'flex',
              flexDirection: 'column' }}
            >
              <div style={Styles.TITLE}>
                Study Registration Form
                <div style={Styles.MEDIUM_DESCRIPTION}>
                  Submit new datasets to DUOS
                </div>
              </div>
            </div>
          </div>
        </div>

        <GeneralStudyInformation study={study} setStudy={setStudy} />
        <NihAnvilUseRelated study={study} setStudy={setStudy} setFiles={setFormFiles} />
        <NihAdministrativeInformation study={study} setStudy={setStudy} />
        <NihDataManagement study={study} setStudy={setStudy} files={formFiles} setFiles={setFormFiles} />
        <StudyAssetManagement study={study} setStudy={setStudy} />
      </div>
    </>
  )
}
