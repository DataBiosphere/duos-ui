import React, { useState, useEffect } from 'react';
import {DataAccessRequest, Dataset, Presentation} from 'src/types/model';
import {ExpectedPresentation, ExpectedPublication, FormState} from 'src/pages/progress_reports/ProgressReportFormState';
import SummarySection from 'src/pages/progress_reports/SummarySection';
import SelectableDatasets from 'src/pages/dar_application/SelectableDatasets';
import CollaboratorChanges from 'src/pages/progress_reports/CollaboratorChanges';
import DataManagementIncident from 'src/pages/progress_reports/DataManagementIncident';
import DarCloseout from 'src/pages/progress_reports/DarCloseout';
import SubmitProgressReport from 'src/pages/progress_reports/SubmitProgressReport';
import {Publication} from "src/components/publications_list/Publication";

type ProgressReportApplicationProps = {
    dar?: DataAccessRequest, // Dar will be empty if this is an application
    parentDar?: DataAccessRequest, // Dar will be empty if this is view only
    datasets: Dataset[],
    readOnlyMode?: boolean
};

export const ProgressReportApplication = ({ dar, parentDar, datasets, readOnlyMode = true }: ProgressReportApplicationProps) => {
    const [formState, setFormState] = useState<FormState>({});

    const onFormChange = (newState: Partial<FormState>) => {
        setFormState(prevState => ({
            ...prevState,
            ...newState
        }));
    };

    function getItem<T, K extends keyof T>(obj: {[P in keyof T]?: T[P]}, key: K): T[K] | undefined {
        return obj[key];
    }

    const getPublicationList = (formState: FormState): ExpectedPublication[] => {
        const publications: Publication[] = getItem(formState, 'publications') ?? [];
        return publications.map((pub: Publication) => ({
            "title": pub.title,
            "pubmedId": pub.pubmed_id,
            "date": pub.date,
            "authors": pub.authors,
            "bibliographicCitation": pub.bibliographic_citation,
            "datasetCitation": pub.dataset_citation,
            "citation": pub.did_cite
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
            {!readOnlyMode && parentDar && <div>
                <SubmitProgressReport
                    progressReport={{
                        "progressReportSummary": getItem(formState, 'progressReportSummary'),
                        // TODO - this is required in the backend right now, but shouldn't be
                        "intellectualPropertySummary": getItem(formState, 'intellectualPropertySummary'),
                        "datasetIds": getItem(formState, 'datasetIds'),
                        "publication": getItem(formState, 'publicationsYesNo'), // this should be a boolean
                        "publications": getPublicationList(formState),
                        "presentations": getItem(formState, 'presentations') ?? []
                    }}

                    parentReferenceId={parentDar.referenceId}
                    onSuccess={() => {
                    }}
                    onCancel={() => {
                    }}
                />
            </div>}
        </div >
    )
};
