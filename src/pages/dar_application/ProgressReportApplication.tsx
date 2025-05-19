import React, {useCallback, useEffect, useState} from 'react';
import { DataAccessRequest, Dataset } from 'src/types/model';
import SelectableDatasets from 'src/pages/dar_application/SelectableDatasets';
import SubmitProgressReport from 'src/pages/progress_reports/SubmitProgressReport';
import CollaboratorChanges from 'src/pages/progress_reports/CollaboratorChanges';
import DataManagementIncident from 'src/pages/progress_reports/DataManagementIncident';
import DarCloseout from 'src/pages/progress_reports/DarCloseout';
import { FormState } from 'src/pages/progress_reports/ProgressReportFormState';
import {DataUseAcknowledgements} from "src/pages/dar_application/DataUseAcknowlegements";
import {translateDataUseRestrictionsFromDataUseArray} from "src/libs/dataUseTranslation";
import {getNewFormValidation, validatePRFormData} from "src/utils/darFormUtils";

type ProgressReportApplicationProps = {
    dar?: DataAccessRequest, // Dar will be empty if this is an application
    parentDar?: DataAccessRequest, // Dar will be empty if this is view only
    datasets: Dataset[],
    readOnlyMode: boolean
};

export const ProgressReportApplication = ({ dar, parentDar, datasets, readOnlyMode = true }: ProgressReportApplicationProps) => {
    const [formState, setFormState] = useState<FormState>({});
    const [dataUseTranslations, setDataUseTranslations] = useState<string[]>([]);
    const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>(datasets);
    const [formValidation, setFormValidation] = useState<any>(
        {darErrors:
                    {gsoAcknowledgement: {}, pubAcknowledgement: {}, dsAcknowledgement: {}}});
    const onFormChange = (newState: Partial<FormState>) => {
        setFormState(prevState => ({
            ...prevState,
            ...newState
        }));
    };

    /* required because the datasets state changes during component mount */
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
            getNewFormValidation(formValidation, 'darErrors', key, validation);
        });
    }, []);

    return (
        <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
            {!readOnlyMode && <h3>Submit a progress report</h3>}
            {/*TODO we'll want each of these to be components that accept a 'readOnly' flag*/}
            <div>
                <h4>Progress Report Summary</h4>
                {dar?.progressReportSummary ?? "PLACEHOLDER Progress Report Summary"}
            </div>
            <div>
                <h4>Intellectual Property Summary</h4>
                {dar?.intellectualPropertySummary ?? "PLACEHOLDER Intellectual Property Summary"}
            </div>
            <div data-cy='remove-datasets'>
                <div className='progress-report-step-card'>
                    <h2>Step 3: Dataset(s) in this DAR</h2>
                    <p style={{ marginBottom: '1rem' }}>Currently selected datasets:</p>
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
                        onFormChange({[dua.key]: dua.value})}}
                    onValidationChange={formValidationChange}
                    validation={formValidation.darErrors}
                />
            </div>
            <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
                <CollaboratorChanges readOnly={readOnlyMode} formState={formState} onFormChange={onFormChange} />
            </div>
            <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
                <DataManagementIncident readOnly={readOnlyMode} formState={formState} onFormChange={onFormChange} />
            </div>
            <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
                <DarCloseout readOnly={readOnlyMode} formState={formState} onFormChange={onFormChange} />
            </div>
            {!readOnlyMode && parentDar && <div>
                <SubmitProgressReport
                    progressReport={dar}
                    parentReferenceId={parentDar.referenceId}
                    onSuccess={() => {
                    }}
                    onCancel={() => {
                    }}
                    validateForm={validateForm}
                />
            </div>}
        </div >
    )
};
