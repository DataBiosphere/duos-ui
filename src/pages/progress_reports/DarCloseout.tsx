import React, {useEffect, useState} from 'react';
import {FormField, FormFieldTypes, FormValidators} from 'src/components/forms/forms';
import {FormState, FormStateKey, ValidFormState} from 'src/pages/progress_reports/ProgressReportFormState';
import {DarErrors, ValidationError} from 'src/pages/dar_application/FormValidationState';
import {FORM_TEXT_AREA_MAX_LENGTH} from 'src/components/forms/formConstants';
import {User} from 'src/libs/ajax/User';
import {Dataset, SimplifiedDuosUser} from 'src/types/model';

interface DarCloseoutProps {
  readonly readOnly: boolean;
  readonly allDatasets: Dataset[];
  formState: FormState;
  onFormChange: (newState: Partial<FormState>) => void;
  onValidationChange?: (validationState: { key: string, validation: ValidationError }) => void;
  validation?: DarErrors;
}

export default function DarCloseout(props: DarCloseoutProps): React.JSX.Element {
  const {readOnly, allDatasets, formState, onFormChange, onValidationChange, validation} = props;

  const [allSigningOfficials, setAllSigningOfficials] = useState<SimplifiedDuosUser[]>([]);
  const [defaultSigningOfficial, setDefaultSigningOfficial] = useState<SimplifiedDuosUser>();

  const displaySigningOfficial = (so: SimplifiedDuosUser) => {
    const {displayName, email} = so;
    const nameString = (email !== undefined && email.length > 0) ? `${displayName} (${email})` : displayName;
    return {displayText: nameString, ...so};
  }

  useEffect(() => {
    const init = async () => {
      const signingOfficials = await User.getSOsForCurrentUser();
      setAllSigningOfficials(signingOfficials);
      const closeoutSigningOfficial = signingOfficials.find(so => so.userId === formState.closeoutSigningOfficial?.userId);
      if (closeoutSigningOfficial !== undefined) {
        setDefaultSigningOfficial(closeoutSigningOfficial);
      }
    }
    init();
  }, []);

  return (
      <div data-cy='dar-closeout'>
        <div className='progress-report-step-card'>
          <h2>Step 5: DAR Closeout</h2>

          <div className='progress-report-row'>
            <FormField
                id={FormStateKey.CLOSEOUT_YES_NO}
                type={FormFieldTypes.YESNORADIOGROUP}
                title='5.1 Closeouts'
                description={<span>Are you ready to finish work on this project?</span>}
                orientation='horizontal'
                onChange={({key, value}: ValidFormState) => {
                  const newState = {[key]: value} as Partial<FormState>;
                  if (value === false) {
                    // If the user selects "No", clear out the closeout fields
                    newState[FormStateKey.CLOSEOUT_PROJECT_COMPLETED] = false;
                    newState[FormStateKey.CLOSEOUT_REQUESTOR_MOVED_INSTITUTION] = false;
                    newState[FormStateKey.CLOSEOUT_PROJECT_TRANSFERRED] = false;
                    newState[FormStateKey.CLOSEOUT_PROJECT_SUPERSEDED] = false;
                    newState[FormStateKey.CLOSEOUT_OTHER] = false;
                    newState[FormStateKey.CLOSEOUT_OTHER_TEXT] = '';
                  }
                  onFormChange(newState);
                }}
                defaultValue={formState.closeoutYesNo}
                disabled={readOnly}
                validation={validation?.closeoutYesNo}
                onValidationChange={onValidationChange}
            />
            {formState.closeoutYesNo && (
                <div data-cy='dar-closeout-details'>

                  <div style={{marginTop: '10px'}}>
                    <FormField
                        id={FormStateKey.CLOSEOUT_SIGNING_OFFICIAL}
                        type={FormFieldTypes.SELECT}
                        description='I certify that the individual listed below is my institutional Signing Official'
                        validators={[FormValidators.REQUIRED]}
                        disabled={readOnly}
                        onChange={({key, value}: ValidFormState) => {
                          onFormChange({
                            [key]: value,
                          } as Partial<FormState>);
                        }}
                        defaultValue={defaultSigningOfficial}
                        selectOptions={(allSigningOfficials?.map((so) => displaySigningOfficial(so)) ?? [''])}
                        validation={validation?.closeoutSigningOfficial}
                    />
                  </div>

                  <p>
                    A close out submission will immediately revoke access to all datasets accessed through the
                    original Data Access Request:
                    <ul>
                      {allDatasets.map((dataset) => (
                          <li key={dataset.datasetId}>{dataset.datasetIdentifier}: {dataset.name}</li>
                      ))}
                    </ul>
                  </p>
                  <p>
                    By completing this page, upon project close-out, the PI and all approved users agree to
                    destroy all copies, versions, and derivations of the dataset(s) retrieved from
                    NIH-designated controlled-access databases, on both local servers and hardware, and if cloud
                    computing was used, delete the data and cloud images from cloud computing provider storage,
                    virtual machines, databases, and random access archives, except as required by publication
                    practices, institutional policies, or law to retain them.
                  </p>
                  <p>
                    This close-out will be submitted to the Signing Official (SO) of the project for
                    approval. The SO is required to confirm the data destruction and insure retained data is
                    encrypted, properly stored, and deleted at the appropriate time to comply with data
                    security policies. If approved by the SO, the request will be sent to the Data Access
                    Committee (DAC) for final review. The project will be closed out after DAC review is
                    completed.
                  </p>

                  <div style={{marginTop: '20px'}}>
                    <h4>Reasons for Project Closeout</h4>
                    <FormField
                        id={FormStateKey.CLOSEOUT_PROJECT_COMPLETED}
                        type={FormFieldTypes.CHECKBOX}
                        toggleText='The Requestor has completed his/her project'
                        disabled={readOnly}
                        onChange={({key, value}: ValidFormState) => {
                          onFormChange({[key]: value} as Partial<FormState>);
                        }}
                        defaultValue={formState.closeoutProjectCompleted}
                        validation={validation?.closeoutProjectCompleted}
                    />
                    <FormField
                        id={FormStateKey.CLOSEOUT_REQUESTOR_MOVED_INSTITUTION}
                        type={FormFieldTypes.CHECKBOX}
                        toggleText='The Requestor has moved institutions (If the project will be continued in a new institution or by a new PI, they must go through Project Transfer)'
                        disabled={readOnly}
                        onChange={({key, value}: ValidFormState) => {
                          onFormChange({[key]: value} as Partial<FormState>);
                        }}
                        defaultValue={formState.closeoutRequestorMovedInstitution}
                        validation={validation?.closeoutRequestorMovedInstitution}
                    />
                    <FormField
                        id={FormStateKey.CLOSEOUT_PROJECT_TRANSFERRED}
                        type={FormFieldTypes.CHECKBOX}
                        toggleText='The project is being transferred to a new Requestor at the same institution'
                        disabled={readOnly}
                        onChange={({key, value}: ValidFormState) => {
                          onFormChange({[key]: value} as Partial<FormState>);
                        }}
                        defaultValue={formState.closeoutProjectTransferred}
                        validation={validation?.closeoutProjectTransferred}
                    />
                    <FormField
                        id={FormStateKey.CLOSEOUT_PROJECT_SUPERSEDED}
                        type={FormFieldTypes.CHECKBOX}
                        toggleText='The project is being superseded by a new project'
                        disabled={readOnly}
                        onChange={({key, value}: ValidFormState) => {
                          onFormChange({[key]: value} as Partial<FormState>);
                        }}
                        defaultValue={formState.closeoutProjectSuperseded}
                        validation={validation?.closeoutProjectSuperseded}
                    />
                    <FormField
                        id={FormStateKey.CLOSEOUT_OTHER}
                        type={FormFieldTypes.CHECKBOX}
                        toggleText='Other'
                        disabled={readOnly}
                        onChange={({key, value}: ValidFormState) => {
                          onFormChange({[key]: value} as Partial<FormState>);
                        }}
                        defaultValue={formState.closeoutOther}
                        validation={validation?.closeoutOther}
                    />
                    {formState.closeoutOther &&
                      <FormField
                        id={FormStateKey.CLOSEOUT_OTHER_TEXT}
                        type={FormFieldTypes.TEXTAREA}
                        placeholder={'Please provide context for "other"'}
                        defaultValue={formState.closeoutOtherText}
                        description={''}
                        rows={6}
                        maxLength={FORM_TEXT_AREA_MAX_LENGTH}
                        onChange={({key, value}: ValidFormState) => {
                          onFormChange({[key]: value} as Partial<FormState>);
                        }}
                        validation={validation?.closeoutOtherText}
                        validators={[FormValidators.REQUIRED]}
                      />
                    }
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>
  );
}
