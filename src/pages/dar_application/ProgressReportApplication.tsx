import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { CombinedDataAccessRequest, Dataset, DataUse, DuosUser, SimplifiedDuosUser } from 'src/types/model'
import {
  CLOSEOUT_KEYS,
  DMI_INCIDENT_KEYS,
  FormState,
  ValidFormState,
} from 'src/pages/progress_reports/ProgressReportFormState'
import SummarySection from 'src/pages/progress_reports/SummarySection'
import SelectableDatasets from 'src/pages/dar_application/SelectableDatasets'
import CollaboratorChanges from 'src/pages/progress_reports/CollaboratorChanges'
import DataManagementIncident from 'src/pages/progress_reports/DataManagementIncident'
import DarCloseout from 'src/pages/progress_reports/DarCloseout'
import { CloseoutReview } from 'src/pages/progress_reports/CloseoutReview'
import SubmitProgressReport from 'src/pages/progress_reports/SubmitProgressReport'
import IrbDocumentUpload from 'src/pages/progress_reports/IrbDocumentUpload'
import { Navigation } from 'src/libs/utils'
import { Storage } from 'src/libs/storage'
import { DataUseAcknowledgements } from 'src/pages/dar_application/DataUseAcknowlegements'
import { translateDataUseRestrictionsFromDataUseArray } from 'src/libs/dataUseTranslation'
import {
  needsIrbApprovalDocument,
  validatePRFormData,
  validationFailed,
} from 'src/utils/darFormUtils'
import { FormValidationState } from 'src/pages/dar_application/FormValidationState'
import { getApprovedElectionDatasetIds } from 'src/utils/DarUtils'
import { useNavigate } from 'react-router-dom'
import { isEqual } from 'lodash'
type ProgressReportApplicationProps = {
  readonly dar: CombinedDataAccessRequest // corresponds either to the parent DAR for a new application or an existing readonly progress report
  readonly datasets: Dataset[]
  readonly readOnlyMode: boolean
  readonly researcher: DuosUser
  readonly countriesOfOperation: string[]
}

export const ProgressReportApplication = ({ dar, datasets, readOnlyMode = true, researcher, countriesOfOperation }: ProgressReportApplicationProps) => {
  const navigate = useNavigate()
  const initialState: FormState = {
    ...dar,
    intellectualProperties: (dar.intellectualProperties || []),
    publications: (dar.publications || []),
    presentations: (dar.presentations || []),
    dmiCombination: false,
    dmiIdentification: false,
    dmiSharing: false,
    dmiSecurity: false,
    dmiAcknowledgement: false,
    dmiPublication: false,
    dmiFalsification: false,
    dmiOther: false,
    closeoutProjectCompleted: false,
    closeoutRequestorMovedInstitution: false,
    closeoutProjectTransferred: false,
    closeoutProjectSuperseded: false,
    closeoutOther: false,

    // additional state for summary section
    ...(readOnlyMode
      ? {
          // In read-only mode, check "No" when undefined
          intellectualPropertiesYesNo: ((dar.intellectualProperties?.length ?? 0) > 0),
          publicationsYesNo: ((dar.publications?.length ?? 0) > 0),
          presentationsYesNo: ((dar.presentations?.length ?? 0) > 0),
        }
      : {
          // When not in read-only mode, don't check anything when undefined
          ...(dar?.intellectualProperties && {
            intellectualPropertiesYesNo: (dar.intellectualProperties.length > 0),
          }),
          ...(dar?.publications && {
            publicationsYesNo: (dar.publications.length > 0),
          }),
          ...(dar?.presentations && {
            presentationsYesNo: (dar.presentations.length > 0),
          }),
        }
    ),

    // additional state for datasets section populated by useEffect
    datasets: [],
    datasetIds: [],
    selectedDatasets: [],

    // additional state for dmi section
    ...(dar?.dmi?.incidents && {
      dmiYesNo: (dar.dmi.incidents.length > 0),
      dmiDescription: dar.dmi.description,
      // populate DMI incident multiselect based on whether the option appears in list of incidents
      ...DMI_INCIDENT_KEYS.reduce((acc, key) => {
        if (dar.dmi?.incidents.includes(key)) {
          acc[key] = dar.dmi?.incidents.includes(key)
        }
        return acc
      }, {} as Record<string, boolean>),
    }),

    // Set undefined to "No" only in read-only mode
    ...(readOnlyMode && {
      dmiYesNo: ((dar.dmi?.incidents?.length ?? 0) > 0),
    }),

    // additional state for closeout section
    ...(dar?.closeoutSupplement && {
      closeoutYesNo: (dar.closeoutSupplement.reasons.length > 0),
      closeoutSigningOfficial: { userId: dar.closeoutSupplement.signingOfficialId } as SimplifiedDuosUser,
      closeoutOtherText: dar.closeoutSupplement.otherText,
      ...CLOSEOUT_KEYS.reduce((acc, key) => {
        if (dar.closeoutSupplement?.reasons.includes(key)) {
          acc[key] = dar.closeoutSupplement?.reasons.includes(key)
        }
        return acc
      }, {} as Record<string, boolean>),
    }),

    // Set undefined to "No" only in read-only mode
    ...(readOnlyMode && {
      closeoutYesNo: ((dar.closeoutSupplement?.reasons.length ?? 0) > 0),
    }),
  } as FormState

  const isMounted = useRef(false)

  const [formState, setFormState] = useState<FormState>(initialState)
  const [showValidation, setShowValidation] = useState<boolean>(false)
  const [formValidation, setFormValidation] = useState<FormValidationState>({ darErrors: {} })
  const [nihValid, setNihValid] = useState<boolean>(true)
  const [dataUseTranslations, setDataUseTranslations] = useState<DataUse[]>([])
  const [uploadedIrbDocument, setUploadedIrbDocument] = useState<File | null>(null)

  const eRACommonsDestination = 'progress_report_application/' + dar.collectionId

  const isFormEmpty = () => {
    // Run validation without showing errors
    const validation = validatePRFormData(
      nihValid,
      formState,
      formState.selectedDatasets,
      dataUseTranslations,
    )

    // If there are validation errors, it means user hasn't filled required fields
    return validationFailed(validation)
  }

  const getValidation = useCallback((newState: FormState) => {
    if (!readOnlyMode && showValidation) {
      return validatePRFormData(
        nihValid,
        newState,
        newState.selectedDatasets,
        dataUseTranslations,
      )
    }
    return { darErrors: {} }
  }, [readOnlyMode, showValidation, nihValid, dataUseTranslations])

  const onFormChange = useCallback((newState: Partial<FormState>, isUserInteraction: boolean = true) => {
    setFormState((prevState) => {
      const setState = { ...prevState, ...newState }
      // Only enable validation on user interaction, not on mount/initialization
      if (isUserInteraction && isMounted.current && !showValidation) {
        setShowValidation(true)
      }
      setFormValidation(getValidation(setState))
      return setState
    })
  }, [showValidation, getValidation])

  const onSelectedDatasetChange = useCallback((newDatasets: Dataset[]) => {
    const newDatasetIds = newDatasets.map(ds => ds.datasetId)
    translateDataUseRestrictionsFromDataUseArray(newDatasets.map(ds => ds.dataUse)).then((translations) => {
      setDataUseTranslations(translations)
    })
    onFormChange({ selectedDatasets: newDatasets, datasetIds: newDatasetIds })
  }, [onFormChange])

  const onIrbDocumentChange = (document: File | null, expiration: string) => {
    setUploadedIrbDocument(document)
    onFormChange({
      irbProtocolExpiration: expiration,
      ...(document && { irbDocumentName: document.name }),
    })
  }

  // Check if the DAR is a closeout review
  // TODO: modify this logic for DAC chair when backend supports it
  const isCloseoutReview = () => {
    const user = Storage.getCurrentUser()
    const isSameUserId = user.userId === dar.closeoutSupplement?.signingOfficialId
    const isCloseoutApproved = dar.closeoutSigningOfficialApprovedDate !== undefined
    return readOnlyMode
      && (
        (user.isSigningOfficial && isSameUserId && !isCloseoutApproved)
        || (user.isChairPerson && isCloseoutApproved)
      )
  }

  const approvedDatasets = useMemo(() => {
    if (readOnlyMode) {
      return datasets.filter(dataset => dar.datasetIds.includes(dataset.datasetId))
    }
    else {
      const approvedDatasetIds = dar.elections ? getApprovedElectionDatasetIds(Object.values(dar.elections)) : []
      return datasets.filter(dataset => approvedDatasetIds.includes(dataset.datasetId))
        .filter(ds => ds.dacApproval)
    }
  }, [datasets, readOnlyMode, dar.datasetIds, dar.elections])

  const datasetIdsMatch = (a: Dataset[], b: Dataset[]) =>
    isEqual(
      a.map(ds => ds.datasetId).sort((a, b) => (a - b)),
      b.map(ds => ds.datasetId).sort((a, b) => (a - b)),
    )

  // required because the datasets state changes during component mount
  useEffect(() => {
    if (!datasetIdsMatch(approvedDatasets, formState.selectedDatasets)) {
      onFormChange({ datasets: approvedDatasets }, false) // Mark as non-user interaction
      onSelectedDatasetChange(approvedDatasets)
    }
    isMounted.current = true // Mark as mounted after initial setup
  }, [approvedDatasets, onFormChange, onSelectedDatasetChange, formState.selectedDatasets])

  return (
    <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
      <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
        <SummarySection
          readOnly={readOnlyMode}
          formState={formState}
          onFormChange={onFormChange}
          eRACommonsDestination={eRACommonsDestination}
          researcher={researcher}
          validation={showValidation ? formValidation.darErrors : {}}
          nihValid={nihValid}
          onNihStatusUpdate={setNihValid}
        />
      </div>
      <div data-cy="remove-datasets">
        <div className="progress-report-step-card">
          <h2>Step 2: Dataset(s) in this DAR</h2>
          <p style={{ marginBottom: '1rem' }}>Currently selected datasets:</p>
          <SelectableDatasets
            disabled={readOnlyMode}
            datasets={formState.datasets}
            setSelectedDatasets={onSelectedDatasetChange}
          />
        </div>
      </div>
      <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
        <DataUseAcknowledgements
          title="2.1 Data Use Acknowledgements"
          datasets={formState.selectedDatasets}
          dataUseTranslations={dataUseTranslations}
          formData={formState}
          readOnlyMode={readOnlyMode}
          onChange={(params: ValidFormState) => {
            if (params) {
              onFormChange({ [params.key]: params.value })
            }
          }}
          validation={formValidation.darErrors}
        />
      </div>
      <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
        <CollaboratorChanges
          readOnly={readOnlyMode}
          formState={formState}
          onFormChange={onFormChange}
          countriesOfOperation={countriesOfOperation}
        />
      </div>
      {needsIrbApprovalDocument(formState.datasets)
        && (
          <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
            <IrbDocumentUpload
              readOnly={readOnlyMode}
              formState={formState}
              validation={formValidation.darErrors || {}}
              uploadedIrbDocument={uploadedIrbDocument}
              onIrbDocumentChange={onIrbDocumentChange}
              referenceId={dar.referenceId}
            />
          </div>
        )}
      <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
        <DataManagementIncident
          readOnly={readOnlyMode}
          formState={formState}
          onFormChange={onFormChange}
          validation={formValidation.darErrors}
        />
      </div>
      <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
        <DarCloseout
          readOnly={readOnlyMode}
          datasets={datasets}
          formState={formState}
          onFormChange={onFormChange}
          validation={formValidation.darErrors}
        />
      </div>
      {isCloseoutReview() && (
        <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
          <CloseoutReview
            dar={dar}
            onReturn={() => {
              Navigation.console(Storage.getCurrentUser(), navigate)
            }}
          />
        </div>
      )}
      <br />
      <br />
      {!readOnlyMode && (
        <div>
          <SubmitProgressReport
            formState={formState}
            parentReferenceId={dar.referenceId}
            onSuccess={() => {
              Navigation.console(Storage.getCurrentUser(), navigate)
            }}
            onCancel={() => {
              Navigation.console(Storage.getCurrentUser(), navigate)
            }}
            disabled={isFormEmpty()}
            uploadedIrbDocument={uploadedIrbDocument}
            parentDar={dar}
          />
        </div>
      )}
    </div>
  )
}
