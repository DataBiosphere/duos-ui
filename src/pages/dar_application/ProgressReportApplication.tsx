import React, {useState, useEffect} from 'react';
import {DataAccessRequest, Dataset, DuosUser, SimplifiedDuosUser} from 'src/types/model';
import {History, Location} from 'history';
import {CLOSEOUT_KEYS, DMI_INCIDENT_KEYS, FormState} from 'src/pages/progress_reports/ProgressReportFormState';
import SummarySection from 'src/pages/progress_reports/SummarySection';
import SelectableDatasets from 'src/pages/dar_application/SelectableDatasets';
import CollaboratorChanges from 'src/pages/progress_reports/CollaboratorChanges';
import DataManagementIncident from 'src/pages/progress_reports/DataManagementIncident';
import DarCloseout from 'src/pages/progress_reports/DarCloseout';
import SubmitProgressReport from 'src/pages/progress_reports/SubmitProgressReport';
import {Navigation} from 'src/libs/utils';
import {Storage} from 'src/libs/storage';
import {DataUseAcknowledgements} from 'src/pages/dar_application/DataUseAcknowlegements';
import {translateDataUseRestrictionsFromDataUseArray} from 'src/libs/dataUseTranslation';
import {validatePRFormData, validationFailed} from 'src/utils/darFormUtils';
import {FormValidationState} from 'src/pages/dar_application/FormValidationState';
import { getApprovedElectionDatasetIds } from 'src/utils/DarUtils';

type ProgressReportApplicationProps = {
  readonly dar: DataAccessRequest; // corresponds either to the parent DAR for a new application or an existing readonly progress report
  readonly datasets: Dataset[];
  readonly readOnlyMode: boolean;
  readonly history: History;
  readonly location?: Location;
  readonly researcher: DuosUser;
};

export const ProgressReportApplication = ({ dar, datasets, readOnlyMode = true, history, location, researcher }: ProgressReportApplicationProps) => {
    const initialState = {
        ...dar,
        dmiCombination:false,
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
        publications: [],
        presentations: [],
        // additional state for summary section
        intellectualPropertyYesNo: !!dar.intellectualPropertySummary,
        publicationsYesNo: (dar.publications?.length > 0),
        presentationsYesNo: (dar.presentations?.length > 0),
        // additional state for datasets section populated by useEffect
        datasets: [],
        datasetIds: [],
        selectedDatasets: [],
        // additional state for dmi section
        dmiYesNo: (dar.dmi?.incidents?.length > 0),
        dmiDescription: dar.dmi?.description,
        // populate DMI incident multiselect based on whether the option appears in list of incidents
        ...DMI_INCIDENT_KEYS.reduce((acc, key) => {
            acc[key] = dar.dmi?.incidents?.includes(key);
            return acc;
        }, {} as Record<string, boolean>),
        // additional state for closeout section
        closeoutYesNo: (dar.closeoutSupplement?.reasons.length > 0),
        ...(dar?.closeoutSupplement && {
            closeoutSigningOfficial: { userId: dar.closeoutSupplement.signingOfficialId } as SimplifiedDuosUser,
            closeoutOtherText: dar.closeoutSupplement.otherText,
            ...CLOSEOUT_KEYS.reduce((acc, key) => {
                acc[key] = dar.closeoutSupplement.reasons.includes(key);
                return acc;
            },{} as Record<string, boolean>)
        }),
    } as FormState;

    const [formState, setFormState] = useState<FormState>(initialState);
    const [formValidation, setFormValidation] = useState<FormValidationState>({darErrors:{}});
    const [nihValid, setNihValid] = useState<boolean>(true);
    const [dataUseTranslations, setDataUseTranslations] = useState<string[]>([]);

    const eRACommonsDestination = 'progress_report_application/' + dar.collectionId;

    const getValidation = (newState: FormState) => {
        if (!readOnlyMode) {
            return validatePRFormData(
                nihValid,
                newState,
                formState.selectedDatasets,
                dataUseTranslations
            );
        }
        return {darErrors: {}}
    }

    const onFormChange = (newState: Partial<FormState>) => {
        const setState = {...formState, ...newState};
        setFormState(prevState => ({
            ...prevState,
            ...newState
        }));
        setFormValidation(getValidation(setState))
    };

    const onSelectedDatasetChange = (newDatasets: Dataset[]) => {
        const newDatasetIds = newDatasets.map((ds) => ds.datasetId);
        translateDataUseRestrictionsFromDataUseArray(newDatasets.map((ds) => ds.dataUse)).then((translations) => {
            setDataUseTranslations(translations);
        });
        onFormChange({ selectedDatasets: newDatasets, datasetIds: newDatasetIds });
    }

    // required because the datasets state changes during component mount
    useEffect(() => {
        const approvedDatasetIds = dar.elections ? getApprovedElectionDatasetIds(Object.values(dar.elections)) : [];
        const approvedDatasets = datasets.filter((ds) => ds.dacApproval && approvedDatasetIds.includes(ds.datasetId));
        onFormChange({ datasets: approvedDatasets });
        onSelectedDatasetChange(approvedDatasets);
    }, [datasets]);

    return (
        <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
            <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
                <SummarySection
                    readOnly={readOnlyMode}
                    formState={formState}
                    onFormChange={onFormChange}
                    eRACommonsDestination={eRACommonsDestination}
                    researcher={researcher}
                    location={location}
                    validation={formValidation.darErrors}
                    nihValid={nihValid}
                    onNihStatusUpdate={setNihValid}
                />
            </div>
            <div data-cy='remove-datasets'>
                <div className='progress-report-step-card'>
                    <h2>Step 2: Dataset(s) in this DAR</h2>
                    <p style={{marginBottom: '1rem'}}>Currently selected datasets:</p>
                    <SelectableDatasets
                        disabled={readOnlyMode}
                        datasets={formState.datasets}
                        setSelectedDatasets={onSelectedDatasetChange}
                    />
                </div>
            </div>
            <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
                <DataUseAcknowledgements
                    title={'2.1 Data Use Acknowledgements'}
                    datasets={formState.selectedDatasets}
                    dataUseTranslations={dataUseTranslations}
                    formData={formState}
                    readOnlyMode={readOnlyMode}
                    onChange={({key, value}) => {
                        onFormChange({[key]: value})
                    }}
                    validation={formValidation.darErrors}
                />
            </div>
            <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
                <CollaboratorChanges readOnly={readOnlyMode} formState={formState} onFormChange={onFormChange}/>
            </div>
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
                    formState={formState}
                    onFormChange={onFormChange}
                    validation={formValidation.darErrors}
                />
            </div>
            <br/><br/>
            {!readOnlyMode && <div>
                <SubmitProgressReport
                    formState={formState}
                    parentReferenceId={dar.referenceId}
                    onSuccess={() => {
                        Navigation.console(Storage.getCurrentUser(), history);
                    }}
                    onCancel={() => {
                        Navigation.console(Storage.getCurrentUser(), history);
                    }}
                    disabled={validationFailed(formValidation)}
                />
            </div>}
        </div>
    )
};
