import React, {useState, useEffect} from 'react';
import {DataAccessRequest, Dataset} from 'src/types/model';
import SubmitProgressReport from '../progress_reports/SubmitProgressReport';
import SelectableDatasets from '../../pages/dar_application/SelectableDatasets';

type ProgressReportApplicationProps = {
    dar?: DataAccessRequest, // Dar will be empty if this is an application
    parentDar?: DataAccessRequest, // Dar will be empty if this is view only
    datasets: Dataset[],
    readOnlyMode?: boolean
};

interface FormStateInterface {
    datasetIds: number[];
}

export const ProgressReportApplication = ({dar, parentDar, datasets, readOnlyMode=true}: ProgressReportApplicationProps) => {
    const [formState, setFormState] = useState<FormStateInterface>({datasetIds: []});

    useEffect(() => {
        setFormState({datasetIds: datasets.map((ds) => ds.datasetId)});
    }, [datasets]);

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
                            setSelectedDatasets={(selectedDatasets) => {
                                setFormState({...formState, datasetIds: selectedDatasets.map((ds) => ds.datasetId)})}
                            }
                        />
                    </div>
                </div>
                {!readOnlyMode && parentDar && <div>
                  <SubmitProgressReport
                      progressReport={dar}
                      parentReferenceId={parentDar.referenceId}
                      onSuccess={() => {
                      }}
                      onCancel={() => {
                      }}
                  />
                </div>}
            </div>
    )
};