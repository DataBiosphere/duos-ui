import React, { useCallback, useEffect, useState } from 'react'
import { Styles } from 'src/libs/theme'
import { Draft } from 'src/libs/ajax/Drafts'
import { NIHAndAnVILUseMUI } from './step_one/NIHAndAnVILUseMUI'
import { cloneDeep } from 'lodash/fp'
import { set } from 'lodash'
import { DataAccessCommitteeQuestions } from './step_one/DataAccessCommitteeQuestion'
import { AdvancedDataSubmissionStepTwo } from './step_two/AdvancedDataSubmissionStepTwo'
import { AdvancedFormHeading } from './AdvancedFormHeading'
import { useHistory } from 'react-router-dom'
import UsgOmbText from '../../components/UsgOmbText'
import { NHGRIFunding } from 'src/pages/data_submission_v2/step_one/NHGRIFunding'
import { AdvancedFormStage } from 'src/pages/data_submission_v2/AdvancedFormStage'
import { StudyInformation } from 'src/pages/data_submission_v2/step_two/AdvancedFormCommonStudyInformation'
import { useParams } from 'react-router'
import { DatasetDetails } from 'src/pages/data_submission_v2/step_two/AdvancedFormDatasetDetails'

export interface StepOneProps {
  formData: AdvancedFormStep1 | undefined
  onChange: ({ key, value }: {
    key: string
    value: unknown
  }) => void
}

export interface AdvancedFormStep1 {
  registeringStudyAtBroad: boolean | undefined
  registeringStudyAtNIH: boolean | undefined
  NHGRIFunding: NHGRIFunding | undefined

}

export interface AdvancedFormStep2 {
  step1: AdvancedFormStep1 | undefined
  studyInfo: StudyInformation | undefined
  datasets: DatasetDetails[]
}

export interface AdvancedFormState {
  id: string
  step1: AdvancedFormStep1
  step2: AdvancedFormStep2
}

export interface AdvancedDataSubmissionFormParams {
  id: string
}

export const AdvancedDataSubmissionForm = () => {
  const { id } = useParams<AdvancedDataSubmissionFormParams>()
  const initialFormData = { id: id } as AdvancedFormState
  const history = useHistory()
  const [failedInit, setFailedInit] = useState(false)
  const [formData, setFormData] = useState(initialFormData)
  const [draftId, setDraftId] = useState(id)
  const [nextIsReady, setNextIsReady] = useState(false)
  const [formStage, setFormStage] = useState(AdvancedFormStage.STEP_ONE)
  const stages = Object.values(AdvancedFormStage)

  const stepValidation = useCallback((value: AdvancedFormState): boolean => {
    if (formStage === AdvancedFormStage.STEP_ONE) {
      if (value?.step1?.registeringStudyAtBroad) {
        return true
      }
      return !!(value?.step1?.registeringStudyAtNIH && value?.step1?.NHGRIFunding != undefined)
    }
    return true
  }, [formStage])

  const onChange = useCallback(({ key, value }: { key: string, value: unknown }) => {
    setFormData((val) => {
      const newForm = cloneDeep(val)
      set(newForm, key, value)
      setNextIsReady(() => {
        return stepValidation(newForm)
      })
      return newForm
    })
  }, [stepValidation])

  useEffect(() => {
    const onLoadFormData = (draftId: string) => {
      Draft.getDraftById(draftId).then((draft) => {
        setFormData(draft.document)
        setNextIsReady(stepValidation(draft.document))
      })
    }

    if (draftId) {
      onLoadFormData(draftId)
    }

    setFailedInit(false)
  }, [draftId, stepValidation])

  const onClickSave = () => {
    if (draftId) {
      Draft.editDraft(draftId, formData).then((value) => {
        setFormData(value.document)
      })
    }
    else {
      Draft.postDraft(formData).then((value) => {
        if (value.id) {
          setDraftId(value.id)
          setFormData(value.data.document)
          history.push(`/data_submission_form2/${value.id}`)
        }
      })
    }
  }

  function setNavigatorState(state: AdvancedFormStage) {
    setFormStage(state)
  }

  function getNextStage(): AdvancedFormStage {
    const statePosition = stages.indexOf(formStage)
    if (statePosition < stages.length - 1) {
      return stages[statePosition + 1]
    }
    return formStage
  }

  function getPreviousStage(): AdvancedFormStage {
    const statePosition = stages.indexOf(formStage)
    if (statePosition === 0) {
      return formStage
    }
    else {
      return stages[statePosition - 1]
    }
  }

  return (
    <div>
      {!failedInit && (
        <div style={Styles.PAGE}>
          <AdvancedFormHeading />
          {(formStage === AdvancedFormStage.STEP_ONE)
            && (
              <div>
                <DataAccessCommitteeQuestions formData={formData?.step1} onChange={onChange} />
                <div style={{ marginLeft: '30px' }}><NIHAndAnVILUseMUI formData={formData?.step1} onChange={onChange} /></div>
              </div>
            )}
          {(formStage === AdvancedFormStage.STEP_TWO)
            && (
              <AdvancedDataSubmissionStepTwo formData={formData} id={draftId} onChange={onChange} />
            )}
          {(formStage != getPreviousStage())
            && (
              <button
                onClick={() => setNavigatorState(getPreviousStage())}
                className="button-complex-outlined-secondary"
                style={{ marginBottom: '10px' }}
              >{getPreviousStage()}
              </button>
            )}
          <button onClick={onClickSave} className="button-complex-secondary-minor" style={{ marginBottom: '10px' }}>Save
            as draft
          </button>
          {(formStage != getNextStage())
            && (
              <button
                disabled={!nextIsReady}
                className="button-complex-primary"
                onClick={() => setNavigatorState(getNextStage())}
                style={{ marginBottom: '10px' }}
              >{getNextStage()}
              </button>
            )}

        </div>
      )}
      {(formData?.step1?.NHGRIFunding === NHGRIFunding.NHGRI_WITHOUT_PHS_ID
        || formData?.step1?.NHGRIFunding === NHGRIFunding.NHGRI_WITH_PHS_ID)
      && <UsgOmbText />}
    </div>
  )
}
export default AdvancedDataSubmissionForm
