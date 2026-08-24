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
import { Draft } from 'src/libs/ajax/Draft'
import AsyncSpinnerButton from 'src/components/AsyncSpinnerButton'
import { Spinner } from 'src/components/Spinner'
import { ConsentGroup2 } from 'src/pages/data_submission/consent_group/consentGroupUtils'
import { ResponseError } from 'src/types/model'
import { isEmpty } from 'src/utils/NodashUtil'

export type FileProperty = {
  key: string
  value: File
}

export type DataSubmissionFormV2Props = {
  onSaveRoute?: string
}

export const ALTERNATIVE_DATA_SHARING_PLAN_FILE = 'alternativeDataSharingPlanFile'

/** A draft id is not a study id: a draft has never been submitted, so it creates rather than updates. */
export type FormMode = 'create' | 'edit' | 'draft'

const resolveFormMode = (draftUuid?: string, studyId?: string): FormMode => {
  if (draftUuid) {
    return 'draft'
  }
  return studyId ? 'edit' : 'create'
}

/**
 * Only a 400 carrying Consent's own explanation is a rejection the submitter can act on in the form.
 * One with no readable body — a malformed multipart, a proxy — carries the generic help-desk line
 * instead, which is not a violation list and still needs the reload.
 */
const isValidationRejection = (error: unknown): boolean => {
  const response = (error as ResponseError)?.response
  return response?.status === 400 && !isEmpty(response.data?.message?.trim())
}

/** A rejection reaches us either as a thrown Error or as the raw response it was built from. */
const errorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message
  return (error as ResponseError)?.response?.data?.message ?? String(error)
}

/** Consent joins Data Use consistency violations with newlines, so each needs its own line here. */
const renderViolations = (prefix: string, error: unknown): React.ReactElement => {
  const message = errorMessage(error)
  return (
    <>
      {prefix}
      <br />
      {message.split('\n').map((line, index) => (
        <Fragment key={`${index}-${line}`}>{line}<br /></Fragment>
      ))}
    </>
  )
}

/**
 * A copy: a failed save leaves the form standing, so the live study must keep its attachments. Only
 * the consent group files need stripping; the rest of the payload is built from named fields.
 */
const withoutAttachments = (study: Study): Study => ({
  ...study,
  assets: study.assets && {
    ...study.assets,
    consentGroups: study.assets.consentGroups?.map(
      ({ addedNIHInstitutionalCertificationFile: _file, ...consentGroup }) => consentGroup,
    ),
  },
})

export const DataSubmissionFormV2 = (props: DataSubmissionFormV2Props) => {
  const { onSaveRoute } = props
  const { studyId, draftUuid } = useParams()
  const formMode: FormMode = resolveFormMode(draftUuid, studyId)
  const [isEditing, setIsEditing] = useState(false)
  const [study, setStudy] = useState({ data: {} } as Study)
  const [loadingError, setLoadingError] = useState(false)
  const [loadedDraftUuid, setLoadedDraftUuid] = useState<string>()
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

  // A draft stays a draft until the study is created from it, so isEditing remains false.
  const onLoadDraft = (draftUuid: string) => {
    loadStudyDatasetDraft(draftUuid).then((study) => {
      setStudy(study)
      setLoadingError(false)
    }).catch(onLoadFailure).finally(() => setLoadedDraftUuid(draftUuid))
  }

  useEffect(() => {
    if (formMode === 'draft' && draftUuid) {
      onLoadDraft(draftUuid)
      return
    }
    onLoadFormData(studyId)
  }, [studyId, draftUuid, formMode, setStudy, setIsEditing])

  const buildMultiPartFormData = (study: Study) => {
    const multiPartFormData = new FormData()
    if (study.alternativeDataSharingPlanFile) {
      multiPartFormData.append('alternativeDataSharingPlan', study.alternativeDataSharingPlanFile, study.alternativeDataSharingPlanFile.name)
    }

    study.assets?.consentGroups?.forEach((consentGroup, idx) => {
      if (consentGroup?.addedNIHInstitutionalCertificationFile) {
        const fieldKey = `consentGroups[${idx}].nihInstitutionalCertificationFile`
        multiPartFormData.append(fieldKey, consentGroup.addedNIHInstitutionalCertificationFile, consentGroup.addedNIHInstitutionalCertificationFile.name)
      }
    })
    multiPartFormData.append('dataset', JSON.stringify(studyToDatasetSchemaSubmission(withoutAttachments(study))))
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
    // Nothing persisted, so reloading would discard the user's edits along with the violations.
    if (isValidationRejection(error)) {
      Notifications.showError({ text: renderViolations('Study update failed:', error) })
      return
    }
    Notifications.showError({ text: `Study update failed: ${errorMessage(error)}.  Reloading original study.` })
    onLoadFormData(studyId)
  }

  /**
   * Best effort, and only once the study exists: a study that was created is not a failure because
   * the draft it came from outlived it, so a failure here is reported on its own and not retried.
   */
  const removeSourceDraft = async () => {
    if (formMode !== 'draft' || !draftUuid) {
      return
    }
    try {
      await Draft.deleteDraft(draftUuid)
    }
    catch (_error) {
      Notifications.showError({
        text: 'Your study was created, but the draft it came from could not be removed. It may still appear in your drafts.',
      })
    }
  }

  const onSubmitStudy = async () => {
    await DataSet.registerDataset(buildMultiPartFormData(study))
    Notifications.showNotification({ text: 'Study created successfully', type: 'success' })
    await removeSourceDraft()
    if (onSaveRoute) {
      navigate(onSaveRoute)
      return
    }
    navigate('/datalibrary')
  }

  const onError = (error: unknown) => {
    if (isValidationRejection(error)) {
      Notifications.showError({ text: renderViolations('Study creation failed:', error) })
      return
    }
    Notifications.showError({ text: `Study creation failed: ${errorMessage(error)}` })
  }

  // Submitting before the draft arrives would register an empty study and then delete the draft.
  if (formMode === 'draft' && loadedDraftUuid !== draftUuid) {
    return (
      <div style={Styles.PAGE}>
        <Spinner />
      </div>
    )
  }

  // Nothing to edit, so nothing to submit or delete: the form is not offered at all.
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
          type="button"
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
