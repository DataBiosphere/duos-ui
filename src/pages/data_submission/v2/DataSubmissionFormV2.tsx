import React, { Fragment, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { SupportRequestModal } from 'src/components/modals/SupportRequestModal'
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
import { studyToDatasetSchemaSubmission, buildConsentGroupsFromStudy, getStudyPropertyValueByKey } from 'src/pages/data_submission/v2/v2-common-functions'
import { loadStudyDatasetDraft } from 'src/pages/data_submission/v2/studyDatasetDraft'
import AsyncSpinnerButton from 'src/components/AsyncSpinnerButton'
import { ConsentGroup2 } from 'src/pages/data_submission/consent_group/consentGroupUtils'

export type FileProperty = {
  key: string
  value: File
}

export type DataSubmissionFormV2Props = {
  onSaveRoute?: string
}

export const ALTERNATIVE_DATA_SHARING_PLAN_FILE = 'alternativeDataSharingPlanFile'

/**
 * Which of the three things this form is doing. A draft id is not a study id: the draft holds a
 * document that has never been submitted, so it creates a study rather than updating one.
 */
export type FormMode = 'create' | 'edit' | 'draft'

export const DataSubmissionFormV2 = (props: DataSubmissionFormV2Props) => {
  const { onSaveRoute } = props
  const { studyId, draftId } = useParams()
  const formMode: FormMode = draftId ? 'draft' : studyId ? 'edit' : 'create'
  const [isEditing, setIsEditing] = useState(false)
  const [study, setStudy] = useState({ data: {} } as Study)
  const [loadingError, setLoadingError] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  const navigate = useNavigate()

  const onLoadFailure = () => {
    setStudy({ data: {} } as Study)
    setIsEditing(false)
    setLoadingError(true)
  }

  const onLoadFormData = (studyId: string | undefined) => {
    if (studyId) {
      DataSet.getStudyById(studyId).then((study) => {
        const consentGroupAssets: ConsentGroup2[] = buildConsentGroupsFromStudy(study)
        const studyAssets = getStudyPropertyValueByKey(study, 'assets') as object || {}
        study.assets = { ...studyAssets, consentGroups: consentGroupAssets }
        setStudy(study)
        setIsEditing(true)
      }).catch(onLoadFailure)
    }
  }

  // A draft is loaded, mapped, and then edited like any other unsubmitted study: it stays a draft
  // until the study is created from it, so isEditing remains false.
  const onLoadDraft = (draftId: string) => {
    loadStudyDatasetDraft(draftId).then((study) => {
      setStudy(study)
      setLoadingError(false)
    }).catch(onLoadFailure)
  }

  useEffect(() => {
    if (formMode === 'draft' && draftId) {
      onLoadDraft(draftId)
      return
    }
    onLoadFormData(studyId)
  }, [studyId, draftId, formMode, setStudy, setIsEditing])

  const buildMultiPartFormData = (study: Study) => {
    const multiPartFormData = new FormData()
    if (study.alternativeDataSharingPlanFile) {
      multiPartFormData.append('alternativeDataSharingPlan', study.alternativeDataSharingPlanFile, study.alternativeDataSharingPlanFile.name)
      delete study.alternativeDataSharingPlanFile
    }

    study.assets?.consentGroups?.forEach((consentGroup, idx) => {
      if (consentGroup?.addedNIHInstitutionalCertificationFile) {
        const fieldKey = `consentGroups[${idx}].nihInstitutionalCertificationFile`
        multiPartFormData.append(fieldKey, consentGroup.addedNIHInstitutionalCertificationFile, consentGroup.addedNIHInstitutionalCertificationFile.name)
        delete consentGroup.addedNIHInstitutionalCertificationFile
      }
    })
    multiPartFormData.append('dataset', JSON.stringify(studyToDatasetSchemaSubmission(structuredClone(study))))
    return multiPartFormData
  }
  const onUpdateStudy = async () => {
    await DataSet.updateStudy(studyId as string, buildMultiPartFormData(study))
    Notifications.showNotification({ text: 'Study updated successfully', type: 'success' })
    if (onSaveRoute) {
      navigate(onSaveRoute)
      return
    }
    navigate('/datalibrary')
  }

  const onUpdateStudyError = (error: unknown) => {
    Notifications.showError({ text: `Study update failed: ${error}.  Reloading original study.` })
    onLoadFormData(studyId)
  }

  const onSubmitStudy = async () => {
    await DataSet.registerDataset(buildMultiPartFormData(study))
    Notifications.showNotification({ text: 'Study created successfully', type: 'success' })
    if (onSaveRoute) {
      navigate(onSaveRoute)
      return
    }
    navigate('/datalibrary')
  }

  const onError = (error: unknown) => {
    Notifications.showError({
      text: (
        <>
          Study creation failed:<br />{String(error).split('\n').map(line => (
            <Fragment key={line}>{line}<br /></Fragment>
          ))}
        </>
      ),
    })
  }

  // A draft that could not be loaded has nothing to edit, so the form is not offered at all: there
  // is no document to submit and none to delete.
  if (formMode === 'draft' && loadingError) {
    return (
      <div style={Styles.PAGE}>
        <div style={{ marginLeft: '-1.5%' }}>
          <TableHeaderSection
            title="Draft could not be loaded"
            description="This draft may have been removed, or it may belong to a different kind of submission. Nothing has been changed."
          />
        </div>
        <button
          className="button button-white"
          data-cy="draft-load-error-back"
          onClick={() => navigate('/dataset_submissions')}
        >
          Back to My Data Submissions
        </button>
      </div>
    )
  }

  return (
    <>
      {loadingError && <div>Error Loading Page</div>}
      <div style={Styles.PAGE}>
        <div style={{ marginLeft: '-1.5%' }}>
          <TableHeaderSection
            title={formMode === 'draft' ? 'Study Registration Draft' : 'Study Registration Form'}
            description={formMode === 'draft'
              ? 'Review the values from your template, edit anything that needs it, then create the study.'
              : 'Submit new datasets to DUOS'}
          />
        </div>

        <GeneralStudyInformation study={study} setStudy={setStudy} />
        <NihAnvilUseRelated study={study} setStudy={setStudy} />
        <NihAdministrativeInformation study={study} setStudy={setStudy} />
        <NihDataManagement study={study} setStudy={setStudy} />
        <StudyAssetManagement study={study} setStudy={setStudy} isEditingExistingStudy={isEditing} onOpenContactUs={() => setShowContactModal(true)} />
        <SupportRequestModal showModal={showContactModal} onCloseRequest={() => setShowContactModal(false)} />
        {!isEditing && (
          <AsyncSpinnerButton
            onClick={onSubmitStudy}
            onError={onError}
            className="button button-white"
            data-cy="data-submission-submit-button"
            hideOnSuccess={true}
            style={{ marginTop: '1rem', marginBottom: '12px' }}
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
