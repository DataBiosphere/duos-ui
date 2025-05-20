import React, { useState, useEffect } from 'react';
import {DataAccessRequest, Dataset} from 'src/types/model';
import { FormState} from 'src/pages/progress_reports/ProgressReportFormState';
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
    dar?: DataAccessRequest, // Dar will be empty if this is an application
    parentDar?: DataAccessRequest, // Dar will be empty if this is view only
    datasets: Dataset[],
    history: History<LocationState>,
    readOnlyMode: boolean,

};

export const ProgressReportApplication = ({ dar, parentDar, datasets, history, readOnlyMode = true }: ProgressReportApplicationProps) => {
    const [formState, setFormState] = useState<FormState>({});

    const onFormChange = (newState: Partial<FormState>) => {
        setFormState(prevState => ({
            ...prevState,
            ...newState
        }));
    };

    /* required because the datasets state changes during component mount */
    useEffect(() => {
        onFormChange({ datasetIds: datasets.map((ds) => ds.datasetId) });
    }, [datasets]);

    return (
        <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
            <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
                <SummarySection readOnly={readOnlyMode} formState={formState} onFormChange={onFormChange} />
            </div>
            <div data-cy='remove-datasets'>
                <div className='progress-report-step-card'>
                    <h2>Step 2: Dataset(s) in this DAR</h2>
                    <p style={{ marginBottom: '1rem' }}>Currently selected datasets:</p>
                    <SelectableDatasets
                        disabled={readOnlyMode}
                        datasets={datasets}
                        setSelectedDatasets={(selectedDatasets: Dataset[]) => {
                            onFormChange({ datasetIds: selectedDatasets.map((ds) => ds.datasetId) });
                        }}
                    />
                </div>
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
            <br/><br/>
            {!readOnlyMode && parentDar && <div>
                <SubmitProgressReport
                    formState={formState}
                    parentReferenceId={parentDar.referenceId}
                    onSuccess={() => {
                        Navigation.console(Storage.getCurrentUser(), history);
                    }}
                    onCancel={() => {
                        Navigation.console(Storage.getCurrentUser(), history);
                    }}
                />
            </div>}
        </div >
    )
};
