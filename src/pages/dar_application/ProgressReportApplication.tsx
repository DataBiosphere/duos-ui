import React, { useState, useEffect } from 'react';
import {DataAccessRequest, Dataset} from 'src/types/model';
import {FormState, FormStateKey} from 'src/pages/progress_reports/ProgressReportFormState';
import SummarySection from 'src/pages/progress_reports/SummarySection';
import SelectableDatasets from 'src/pages/dar_application/SelectableDatasets';
import CollaboratorChanges from 'src/pages/progress_reports/CollaboratorChanges';
import DataManagementIncident from 'src/pages/progress_reports/DataManagementIncident';
import DarCloseout from 'src/pages/progress_reports/DarCloseout';
import SubmitProgressReport from 'src/pages/progress_reports/SubmitProgressReport';
import {Navigation} from "src/libs/utils";
import {Storage} from "src/libs/storage";
import {History, LocationState} from 'history';

type ProgressReportApplicationProps = {
    dar: DataAccessRequest, // corresponds either to the parent DAR for a new application or an existing readonly progress report
    datasets: Dataset[],
    history: History<LocationState>,
    readOnlyMode: boolean,

};

export const ProgressReportApplication = ({ dar, datasets, history, readOnlyMode = true }: ProgressReportApplicationProps) => {
    const initialState = {
        ...dar,
        // additional state for summary section
        ...(dar?.intellectualPropertySummary && {
            intellectualPropertyYesNo: !!dar.intellectualPropertySummary
        }),
        ...(dar?.publications && {
            publicationsYesNo: (dar.publications.length > 0)
        }),
        ...(dar?.presentations && {
            presentationsYesNo: (dar.presentations.length > 0)
        }),
        // additional state for dmi section
        ...(dar?.dataManagementIncident?.incidents && {
            dmiYesNo: (dar.dataManagementIncident.incidents.length > 0)
        }),
        // additional state for closeout section
        ...(dar?.closeOutSupplement && {
            closeoutYesNo: !!dar.closeOutSupplement
        }),
    };

    const [formState, setFormState] = useState<FormState>(initialState);
    const [dataUseTranslations, setDataUseTranslations] = useState<string[]>([]);
    const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>(datasets);
    const [formValidation, setFormValidation] = useState<FormValidationState>(
        {darErrors:
                {gsoAcknowledgement: {}, pubAcknowledgement: {}, dsAcknowledgement: {}}});

    const onFormChange = (newState: Partial<FormState>) => {
        setFormState(prevState => ({
            ...prevState,
            ...newState
        }));
    };

    // required because the datasets state changes during component mount
    useEffect(() => {
        onFormChange({ datasetIds: datasets.map((ds) => ds.datasetId) });
        setSelectedDatasets(datasets);
        translateDataUseRestrictionsFromDataUseArray(datasets.map((ds) => ds.dataUse)).then((translations) => {
            setDataUseTranslations(translations);
        });
    }, [datasets]);

    useEffect(() => {
        const selectedIds = selectedDatasets.map((ds => ds.datasetId));
        translateDataUseRestrictionsFromDataUseArray(selectedDatasets.map((ds) => ds.dataUse)).then((translations) => {
            setDataUseTranslations(translations);
        });
        onFormChange({ datasetIds: selectedIds });
    }, [selectedDatasets]);

    const validateForm = () => {
        const validation = validatePRFormData(
            formState,
            selectedDatasets,
            dataUseTranslations
        );
        setFormValidation(validation);
        return validation;
    }

    const formValidationChange = useCallback(({ key, validation }) => {
        setFormValidation((formValidation) => {
            return {
                ...formValidation,
                darErrors: {
                    ...formValidation.darErrors,
                    [key]: validation
                }
            };
        });
    }, []);

    return (
        <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
            <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
                <SummarySection readOnly={readOnlyMode} formState={formState} onFormChange={onFormChange}/>
            </div>
            <div data-cy='remove-datasets'>
                <div className='progress-report-step-card'>
                    <h2>Step 2: Dataset(s) in this DAR</h2>
                    <p style={{marginBottom: '1rem'}}>Currently selected datasets:</p>
                    <SelectableDatasets
                        disabled={readOnlyMode}
                        datasets={datasets}
                        setSelectedDatasets={setSelectedDatasets}
                    />
                </div>
            </div>
            <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
                <DataUseAcknowledgements
                    title={'3.1 Data Use Acknowledgements'}
                    datasets={selectedDatasets}
                    dataUseTranslations={dataUseTranslations}
                    formData={formState}
                    readOnlyMode={readOnlyMode}
                    onChange={(dua) => {
                        onFormChange({[dua.key]: dua.value})
                    }}
                    onValidationChange={formValidationChange}
                    validation={formValidation.darErrors}
                />
            </div>
            <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
                <CollaboratorChanges readOnly={readOnlyMode} formState={formState} onFormChange={onFormChange}/>
            </div>
            <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
                <DataManagementIncident readOnly={readOnlyMode} formState={formState} onFormChange={onFormChange}/>
            </div>
            <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
                <DarCloseout readOnly={readOnlyMode} formState={formState} onFormChange={onFormChange}/>
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
                    validateForm={validateForm}
                />
            </div>}
        </div>
    )
};
