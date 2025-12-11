import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DataSet } from 'src/libs/ajax/DataSet'
import { GeneralStudyInformation } from 'src/pages/data_submission/v2/GeneralStudyInformation'
import { NihAnvilUseRelated } from 'src/pages/data_submission/v2/NihAnvilUseRelated'
import { Study } from 'src/pages/data_submission/v2/v2-models'
import { NihAdministrativeInformation } from 'src/pages/data_submission/v2/NihAdministrativeInformation'
import { NihDataManagement } from 'src/pages/data_submission/v2/NihDataManagement'
import { Styles } from 'src/libs/theme'
import { StudyAssetManagement } from 'src/pages/data_submission/v2/StudyAssetManagement'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { Notifications } from 'src/libs/utils'
import { studyToDatasetSchemaSubmission, buildConsentGroupsFromStudy } from 'src/pages/data_submission/v2/v2-common-functions'
import AsyncSpinnerButton from 'src/components/AsyncSpinnerButton'
import { ConsentGroup2 } from 'src/pages/data_submission/consent_group/consentGroupUtils'

export type FileProperty = {
  key: string
  value: File
}

export const ALTERNATIVE_DATA_SHARING_PLAN_FILE = 'alternativeDataSharingPlanFile'

export const DataSubmissionFormV2 = () => {
  const { studyId } = useParams()
  const [isEditing, setIsEditing] = useState(false)
  const [study, setStudy] = useState({} as Study)
  const [loadingError, setLoadingError] = useState(false)

  const navigate = useNavigate()

  const onLoadFormData = (studyId: string | undefined) => {
    if (studyId) {
      DataSet.getStudyById(studyId).then((study) => {
        const consentGroupAssets: ConsentGroup2[] = buildConsentGroupsFromStudy(study)
        study.assets = { ...study.assets, consentGroups: consentGroupAssets }
        setStudy(study)
        setIsEditing(true)
      }).catch(() => {
        setStudy({} as Study)
        setIsEditing(false)
        setLoadingError(true)
      })
    }
  }

  useEffect(() => {
    onLoadFormData(studyId)
  }, [studyId, setStudy, setIsEditing])

  const buildMultiPartFormData = (study: Study) => {
    const multiPartFormData = new FormData()
    multiPartFormData.append('dataset', JSON.stringify(studyToDatasetSchemaSubmission(structuredClone(study))))
    if (study.alternativeDataSharingPlanFile) {
      multiPartFormData.append('alternativeDataSharingPlan', study.alternativeDataSharingPlanFile, study.alternativeDataSharingPlanFile.name)
    }

    study.assets?.consentGroups?.forEach((consentGroup, idx) => {
      if (consentGroup?.nihInstitutionalCertificationFile) {
        const fieldKey = `consentGroups[${idx}].nihInstitutionalCertificationFile`
        multiPartFormData.append(fieldKey, consentGroup.nihInstitutionalCertificationFile, consentGroup.nihInstitutionalCertificationFile.name)
      }
    })
    return multiPartFormData
  }
  const onUpdateStudy = async () => {
    await DataSet.updateStudy(studyId as string, buildMultiPartFormData(study))
    Notifications.showNotification({ text: 'Study updated successfully', type: 'success' })
    navigate('/datalibrary')
  }

  const onUpdateStudyError = (error: unknown) => {
    Notifications.showError({ text: `Study update failed: ${error}.  Reloading original study.` })
    onLoadFormData(studyId)
  }

  const onSubmitStudy = async () => {
    await DataSet.registerDataset(buildMultiPartFormData(study))
    Notifications.showNotification({ text: 'Study created successfully', type: 'success' })
    navigate('/datalibrary')
  }

  const onError = (error: unknown) => {
    Notifications.showError({ text: `Study creation failed: ${error}` })
  }

  return (
    <>
      {loadingError && <div>Error Loading Page</div>}
      <div style={Styles.PAGE}>
        <div style={{ marginLeft: '-1.5%' }}>
          <TableHeaderSection
            title="Study Registration Form"
            description="Submit new datasets to DUOS"
          />
        </div>

        <GeneralStudyInformation study={study} setStudy={setStudy} />
        <NihAnvilUseRelated study={study} setStudy={setStudy} />
        <NihAdministrativeInformation study={study} setStudy={setStudy} />
        <NihDataManagement study={study} setStudy={setStudy} />
        <StudyAssetManagement study={study} setStudy={setStudy} />
        {!isEditing && (
          <AsyncSpinnerButton
            onClick={onSubmitStudy}
            onError={onError}
            className="button button-white"
            data-cy="data-submission-submit-button"
            hideOnSuccess={true}
            style={{ marginBottom: '12px' }}
          >
            Create Study
          </AsyncSpinnerButton>
        )}
        { isEditing && (
          <AsyncSpinnerButton
            onClick={onUpdateStudy}
            onError={onUpdateStudyError}
            className="button button-white"
            data-cy="data-submission-submit-button"
            hideOnSuccess={true}
            style={{ marginBottom: '12px' }}
          >
            Update Study
          </AsyncSpinnerButton>
        ) }
      </div>

    </>
  )
}
