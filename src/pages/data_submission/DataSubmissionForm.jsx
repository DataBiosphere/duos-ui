import React, { useCallback, useEffect, useState } from 'react'
import { validateForm } from './RegistrationValidation'
import { cloneDeep, isNil } from 'lodash/fp'
import { set } from 'lodash'
import { Institution } from 'src/libs/ajax/Institution'
import { Study } from 'src/libs/ajax/Study'
import { DataSet } from 'src/libs/ajax/DataSet'
import { Notifications } from 'src/libs/utils'
import { Styles } from 'src/libs/theme'
import DataAccessGovernance from 'src/pages/data_submission/DataAccessGovernance'
import DataSubmissionStudyInformation from 'src/pages/data_submission/ds_study_information'
import NIHAdministrativeInformation from 'src/pages/data_submission/NIHAdministrativeInformation'
import NIHDataManagement from 'src/pages/data_submission/NIHDataManagement'
import NihAnvilUse from 'src/pages/data_submission/NihAnvilUse'
import { uniqueValidator } from 'src/components/forms/formValidation'
import { AsyncSpinnerButton } from 'src/components/AsyncSpinnerButton.js'
import { useNavigate } from 'react-router-dom'
import TableHeaderSection from 'src/components/TableHeaderSection'

export const DataSubmissionForm = () => {
  const navigate = useNavigate()

  const [registrationSchema, setRegistrationSchema] = useState({})
  const [institutions, setInstitutions] = useState([])
  const [studyNames, setStudyNames] = useState([])
  const [datasetNames, setDatasetNames] = useState([])
  const [failedInit, setFailedInit] = useState(false)

  const [allConsentGroupsSaved, setAllConsentGroupsSaved] = useState(false)
  const studyEditMode = false

  useEffect(() => {
    const getRegistrationSchema = async () => {
      const schema = await DataSet.getRegistrationSchema()
      setRegistrationSchema(schema)
    }

    const getAllInstitutions = async () => {
      const institutions = await Institution.list()
      setInstitutions(institutions)
    }

    const getAllStudyNames = async () => {
      const studyNames = await Study.getStudyNames()
      setStudyNames(studyNames)
    }

    const getAllDatasetNames = async () => {
      const datasetNames = await DataSet.getDatasetNames()
      setDatasetNames(datasetNames)
    }

    const init = async () => {
      try {
        await getRegistrationSchema()
        await getAllInstitutions()
        await getAllStudyNames()
        await getAllDatasetNames()
      }
      catch (_error) {
        setFailedInit(true)
        Notifications.showError({
          text: 'Error: Unable to initialize data from server',
        })
      }
    }

    init()
  }, [])

  const [formFiles, setFormFiles] = useState({})
  const [formData, setFormData] = useState({})

  const [formValidation, setFormValidation] = useState({})

  const formatForRegistration = (formData) => {
    for (const key of Object.keys(formData)) {
      if (isNil(formData[key])) {
        formData[key] = undefined
      }
    }

    formData.consentGroups.forEach((cg) => {
      for (const key of Object.keys(cg)) {
        if (isNil(cg[key])) {
          cg[key] = undefined
        }
      }
    })
  }

  // compute multipart/form-data object, includes registration information and all files
  const createMultiPartFormData = (registration) => {
    const multiPartFormData = new FormData()
    multiPartFormData.append('dataset', JSON.stringify(registration))
    for (const field of Object.keys(formFiles)) {
      if (!isNil(formFiles[field])) {
        const files = formFiles[field]
        if (Array.isArray(files)) {
          files.forEach((file, idx) => {
            const [[duosFileType, duosFileObj]] = Object.entries(file)
            if (duosFileObj !== null) {
              // Consent has code to look for the string as formatted below
              const fieldKey = `${field}[${idx}].${duosFileType}`
              multiPartFormData.append(fieldKey, duosFileObj, duosFileObj.fileName)
            }
          })
        }
        else {
          const file = formFiles[field]
          if ('alternativeDataSharingPlanFile' === field) {
            // Consent has code to look for the string as formatted below
            multiPartFormData.append('alternativeDataSharingPlan', file, file.fileName)
          }
          else {
            multiPartFormData.append(field, file, file.fileName)
          }
        }
      }
    }

    return multiPartFormData
  }

  const submit = async () => {
    if (!allConsentGroupsSaved) {
      throw new Error('Please save all consent groups and try again.')
    }

    const registration = cloneDeep(formData)
    formatForRegistration(registration)

    // check against json schema validator to see if there are uncaught validation issues
    const [valid0, validation] = validateForm(registrationSchema, registration)
    let valid = valid0

    // check secondary validation for non-schema validation issues
    if (!uniqueValidator.isValid(registration.studyName, studyNames)) {
      validation.studyName = {
        failed: ['unique'],
        valid: false,
      }
      valid = false
    }

    if (formData.alternativeDataSharingPlan === true) {
      if (isNil(formFiles.alternativeDataSharingPlanFile)) {
        validation.alternativeDataSharingPlanFile = {
          valid: false,
          failed: ['required'],
        }
        valid = false
      }
    }

    setFormValidation(validation)

    if (!valid) {
      throw new Error('There are errors in your form. Please fix and try again.')
    }

    // no validation issues, matches json schema: continue to submission
    const multiPartFormData = createMultiPartFormData(registration)

    await DataSet.registerDataset(multiPartFormData)
    navigate('/datalibrary')
    Notifications.showSuccess({ text: 'Submitted successfully!' })
  }

  const onError = (error) => {
    const message = error?.response?.data?.message || error.message || 'Submission failed'
    Notifications.showError({ text: 'Could not submit: ' + message })
  }

  const onChange = useCallback(({ key, value }) => {
    setFormData((val) => {
      const newForm = cloneDeep(val)
      set(newForm, key, value)
      return newForm
    })
  }, [setFormData])

  const onFileChange = useCallback(({ key, value }) => {
    setFormFiles((val) => {
      const newFiles = cloneDeep(val)
      set(newFiles, key, value)
      return newFiles
    })
  }, [setFormFiles])

  const onValidationChange = ({ key, validation }) => {
    setFormValidation((val) => {
      const newValidation = cloneDeep(val)
      set(newValidation, key, validation)
      return newValidation
    })
  }

  return (
    <div>
      {!failedInit && (
        <div style={Styles.PAGE}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '112%', marginLeft: '-6%', padding: '0 2.5%' }}>
            <TableHeaderSection
              title="Study Registration Form"
              description="Submit new datasets to DUOS"
            />
          </div>

          <form style={{ margin: 'auto', maxWidth: 800 }}>

            <DataSubmissionStudyInformation onChange={onChange} validation={formValidation} onValidationChange={onValidationChange} studyEditMode={studyEditMode} />
            <NihAnvilUse onChange={onChange} formData={formData} validation={formValidation} onValidationChange={onValidationChange} studyEditMode={studyEditMode} />
            <NIHAdministrativeInformation formData={formData} onChange={onChange} institutions={institutions} validation={formValidation} onValidationChange={onValidationChange} studyEditMode={studyEditMode} />
            <NIHDataManagement formData={formData} onChange={onChange} onFileChange={onFileChange} validation={formValidation} onValidationChange={onValidationChange} studyEditMode={studyEditMode} />
            <DataAccessGovernance onChange={onChange} onFileChange={onFileChange} validation={formValidation} onValidationChange={onValidationChange} setAllConsentGroupsSaved={setAllConsentGroupsSaved} studyEditMode={studyEditMode} datasetNames={datasetNames} />

            <div className="flex flex-row" style={{ justifyContent: 'flex-end', marginBottom: '2rem' }}>
              <AsyncSpinnerButton
                onClick={submit}
                onError={onError}
                className="button button-white"
                data-cy="data-submission-submit-button"
                hideOnSuccess={false}
              >
                Submit
              </AsyncSpinnerButton>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default DataSubmissionForm
