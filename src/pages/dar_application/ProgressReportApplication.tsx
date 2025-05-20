import React, {useEffect, useState} from 'react';
import {DataAccessRequest, Dataset, DuosUser} from 'src/types/model';
import {Location} from 'history';
import {FormState} from 'src/pages/progress_reports/ProgressReportFormState';
import SummarySection from 'src/pages/progress_reports/SummarySection';
import SelectableDatasets from 'src/pages/dar_application/SelectableDatasets';
import CollaboratorChanges from 'src/pages/progress_reports/CollaboratorChanges';
import DataManagementIncident from 'src/pages/progress_reports/DataManagementIncident';
import DarCloseout from 'src/pages/progress_reports/DarCloseout';
import SubmitProgressReport from 'src/pages/progress_reports/SubmitProgressReport';

type ProgressReportApplicationProps = {
    dar: DataAccessRequest, // corresponds either to the parent DAR for a new application or an existing readonly progress report
    datasets: Dataset[],
    readOnlyMode?: boolean
  readonly location?: Location
  readonly researcher: DuosUser
};

export default function ProgressReportApplication ({ dar, datasets, readOnlyMode = true, location, researcher }: ProgressReportApplicationProps) {
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
    }

    const [formState, setFormState] = useState<FormState>(initialState);
    const eRACommonsDestination = 'progress_report_application/' + dar?.collectionId;

    const onFormChange = (newState: Partial<FormState>) => {
        setFormState(prevState => ({
            ...prevState,
            ...newState
        }));
    };

    // required because the datasets state changes during component mount
    useEffect(() => {
        onFormChange({ datasetIds: datasets.map((ds) => ds.datasetId) });
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
                />
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
            {!readOnlyMode && <div>
                <SubmitProgressReport
                    progressReport={dar}
                    parentReferenceId={dar.referenceId}
                    onSuccess={() => {
                    }}
                    onCancel={() => {
                    }}
                />
            </div>}
        </div >
    )
};
