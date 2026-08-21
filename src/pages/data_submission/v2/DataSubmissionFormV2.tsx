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
import AsyncSpinnerButton from 'src/components/AsyncSpinnerButton'
import { ConsentGroup2 } from 'src/pages/data_submission/consent_group/consentGroupUtils'
import { ResponseError } from 'src/types/model'

export type FileProperty = {
  key: string
  value: File
}

export type DataSubmissionFormV2Props = {
  onSaveRoute?: string
}

export const ALTERNATIVE_DATA_SHARING_PLAN_FILE = 'alternativeDataSharingPlanFile'

const isValidationRejection = (error: unknown): boolean =>
  (error as ResponseError)?.response?.status === 400

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
  const { studyId } = useParams()
  const [isEditing, setIsEditing] = useState(false)
  const [study, setStudy] = useState({ data: {} } as Study)
  const [loadingError, setLoadingError] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  const navigate = useNavigate()

  const onLoadFormData = (studyId: string | undefined) => {
    if (studyId) {
      DataSet.getStudyById(studyId).then((study) => {
        const consentGroupAssets: ConsentGroup2[] = buildConsentGroupsFromStudy(study)
        const studyAssets = getStudyPropertyValueByKey(study, 'assets') as object || {}
        study.assets = { ...studyAssets, consentGroups: consentGroupAssets }
        setStudy(study)
        setIsEditing(true)
      }).catch(() => {
        setStudy({ data: {} } as Study)
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
    if (isValidationRejection(error)) {
      Notifications.showError({ text: renderViolations('Study creation failed:', error) })
      return
    }
    Notifications.showError({ text: `Study creation failed: ${errorMessage(error)}` })
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
