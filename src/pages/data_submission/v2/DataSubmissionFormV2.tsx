import React, { Fragment, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { SupportRequestModal } from 'src/components/modals/SupportRequestModal'
import { DataSet } from 'src/libs/ajax/DataSet'
import { GeneralStudyInformation } from 'src/pages/data_submission/v2/GeneralStudyInformation'
import { NihAnvilUseRelated } from 'src/pages/data_submission/v2/NihAnvilUseRelated'
import { AlternativeDataSharingPlan, DatasetRegistrationSchemaV1, PiInstitution, Study } from 'src/pages/data_submission/v2/v2-models'
import { NihAdministrativeInformation } from 'src/pages/data_submission/v2/NihAdministrativeInformation'
import { NihDataManagement } from 'src/pages/data_submission/v2/NihDataManagement'
import { Styles } from 'src/libs/theme'
import { StudyAssetManagement } from 'src/pages/data_submission/v2/StudyAssetManagement'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { Notifications } from 'src/libs/utils'
import { ErrorReporter } from 'src/libs/ErrorReporter'
import { studyToDatasetSchemaSubmission, buildConsentGroupsFromDatasets, getStudyPropertyValueByKey, submissionErrors } from 'src/pages/data_submission/v2/v2-common-functions'
import { loadStudyDatasetDraft } from 'src/pages/data_submission/v2/studyDatasetDraft'
import { Draft } from 'src/libs/ajax/Draft'
import AsyncSpinnerButton from 'src/components/AsyncSpinnerButton'
import { Spinner } from 'src/components/Spinner'
import { ConsentGroup2 } from 'src/pages/data_submission/consent_group/consentGroupUtils'
import { ResponseError } from 'src/types/model'
import { isEmpty } from 'src/utils/NodashUtil'
import 'src/pages/data_submission/v2/DataSubmissionFormV2.css'

export type FileProperty = {
  key: string
  value: File
}

export type DataSubmissionFormV2Props = {
  onSaveRoute?: string
}

export const ALTERNATIVE_DATA_SHARING_PLAN_FILE = 'alternativeDataSharingPlanFile'

// The form has no fields for these, but the update replaces every study property, so they are sent back as loaded.
type UneditedRegistrationFields = Pick<DatasetRegistrationSchemaV1,
  'externalIdentifier' | 'externalIdentifierType' | 'alternativeDataSharingPlanAccessManagement'
  | 'alternativeDataSharingPlanFileName'>

const pickUneditedFields = (registration: DatasetRegistrationSchemaV1): UneditedRegistrationFields => ({
  externalIdentifier: registration.externalIdentifier,
  externalIdentifierType: registration.externalIdentifierType,
  alternativeDataSharingPlanAccessManagement: registration.alternativeDataSharingPlanAccessManagement,
  alternativeDataSharingPlanFileName: registration.alternativeDataSharingPlanFileName,
})

/**
 * What the page is for and how it finishes, per mode. Nothing is saved as the user types, so each
 * says which button submits; edit also says what it can't change, which otherwise only shows up as
 * disabled fields.
 */
const FORM_TITLE: Record<FormMode, string> = {
  create: 'Register a Study and Data Assets',
  edit: 'Edit Study Registration',
  draft: 'Review Study Draft',
}

/** What a study can hold, named as the Data Assets and Related Resources sections name them. */
const DATA_ASSETS = 'datasets, models, and workspaces'
const RELATED_RESOURCES = 'publications, presentations, clinical trials, intellectual property, and funding'

const FORM_HELP_TEXT: Record<FormMode, string> = {
  create: `Register a study along with its data assets (${DATA_ASSETS}) and related resources (${RELATED_RESOURCES}). `
    + 'Researchers can then find your study in DUOS and request access to its datasets. '
    + 'Fields marked * are required. Nothing is saved until you select Create Study at the bottom of the page.',
  edit: `Update this study's information, its data assets (${DATA_ASSETS}), and its related resources (${RELATED_RESOURCES}). `
    + 'The data use terms and Data Access Committee of an existing dataset can\'t be changed here. '
    + 'Changes are saved when you select Update Study at the bottom of the page.',
  draft: 'This draft was filled in from your study template. Review each section, complete anything missing '
    + `(fields marked * are required), and add any other data assets (${DATA_ASSETS}) or related resources (${RELATED_RESOURCES}). `
    + 'Then select Create Study at the bottom of the page.',
}

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

/** Found in the form before anything is sent, so nothing needs reloading and the edits stay. */
class IncompleteSubmissionError extends Error {}

/** Throws rather than returns: the submit buttons hide themselves once their action resolves. */
const assertSubmittable = (study: Study) => {
  const errors = submissionErrors(study)
  if (errors.length) {
    throw new IncompleteSubmissionError(errors.join('\n'))
  }
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
  const [showThroughBioRequest, setShowThroughBioRequest] = useState(false)
  const [uneditedFields, setUneditedFields] = useState<UneditedRegistrationFields>({})

  const navigate = useNavigate()

  const onLoadFailure = () => {
    setUneditedFields({})
    setStudy({ data: {} } as Study)
    setIsEditing(false)
    setLoadingError(true)
  }

  const onLoadFormData = (studyId: string | undefined) => {
    if (studyId) {
      // The study payload lists only its dataset ids, and its asset lists are spread across properties;
      // the datasets and the assembled assets come from their own reads.
      Promise.all([
        DataSet.getStudyById(studyId),
        DataSet.getStudyDatasets(studyId),
        DataSet.getStudyRegistration(studyId),
      ]).then(([study, datasets, registration]) => {
        const consentGroupAssets: ConsentGroup2[] = buildConsentGroupsFromDatasets(datasets)
        study.assets = { ...registration.assets, consentGroups: consentGroupAssets }
        // A PI institution set by patch lives on the study, not in the property the form reads.
        if (registration.piInstitution) {
          study.properties = [
            ...(study.properties ?? []).filter(prop => prop.key !== PiInstitution.key),
            new PiInstitution(registration.piInstitution),
          ]
        }
        setUneditedFields(pickUneditedFields(registration))
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
    const hasSharingPlan = getStudyPropertyValueByKey(study, AlternativeDataSharingPlan.key) === true
    const kept: UneditedRegistrationFields = isEditing
      ? {
          ...uneditedFields,
          alternativeDataSharingPlanFileName: hasSharingPlan
            ? study.alternativeDataSharingPlanFile?.name ?? uneditedFields.alternativeDataSharingPlanFileName
            : undefined,
          alternativeDataSharingPlanAccessManagement: hasSharingPlan
            ? uneditedFields.alternativeDataSharingPlanAccessManagement
            : undefined,
        }
      : {}
    const submission = { ...kept, ...studyToDatasetSchemaSubmission(withoutAttachments(study)) }
    multiPartFormData.append('dataset', JSON.stringify(submission))
    return multiPartFormData
  }
  const onUpdateStudy = async () => {
    assertSubmittable(study)
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
    if (error instanceof IncompleteSubmissionError || isValidationRejection(error)) {
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
    catch (error) {
      // The toast is transient; a rising rate here is the only signal drafts are accumulating.
      ErrorReporter.report(`study dataset draft cleanup failed for ${draftUuid}: ${errorMessage(error)}`)
      Notifications.showError({
        text: 'Your study was created, but the draft it came from could not be removed. It may still appear in your drafts.',
      })
    }
  }

  const onSubmitStudy = async () => {
    assertSubmittable(study)
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
    if (error instanceof IncompleteSubmissionError || isValidationRejection(error)) {
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
      <div style={Styles.PAGE} className="data-submission-form">
        {/* The form's own header, on its column and type scale, rather than the shared table header. */}
        <header className="dsf-page-header">
          <h1 data-cy="table-header-title">{FORM_TITLE[formMode]}</h1>
          <p className="dsf-page-header-description" data-cy="table-header-description">{FORM_HELP_TEXT[formMode]}</p>
        </header>

        <GeneralStudyInformation study={study} setStudy={setStudy} onRequestThroughBioProfile={() => setShowThroughBioRequest(true)} />
        <StudyAssetManagement study={study} setStudy={setStudy} isEditingExistingStudy={isEditing} onOpenContactUs={() => setShowContactModal(true)} />
        {/* Last, just above submit: most studies answer No, and a Yes opens the NIH sections below it. */}
        <NihAnvilUseRelated study={study} setStudy={setStudy} />
        <NihAdministrativeInformation study={study} setStudy={setStudy} />
        <NihDataManagement study={study} setStudy={setStudy} />
        <SupportRequestModal showModal={showContactModal} onCloseRequest={() => setShowContactModal(false)} />
        <SupportRequestModal
          showModal={showThroughBioRequest}
          onCloseRequest={() => setShowThroughBioRequest(false)}
          initialSubject="Request a Through.bio profile"
          initialDescription={`Please create a Through.bio profile for the study${study.name ? ` "${study.name}"` : ''}. Its publications are listed under Related Resources on the study registration.`}
        />
        <div className="dsf-actions">
          {!isEditing && (
            <AsyncSpinnerButton
              onClick={onSubmitStudy}
              onError={onError}
              className="button button-white"
              data-cy="data-submission-submit-button"
              hideOnSuccess={true}
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
            >
              Update Study
            </AsyncSpinnerButton>
          ) }
        </div>
      </div>

    </>
  )
}
