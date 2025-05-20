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
  readonly dar?: DataAccessRequest, // Dar will be empty if this is an application
  readonly parentDar?: DataAccessRequest, // Dar will be empty if this is view only
  readonly datasets: Dataset[],
  readonly readOnlyMode: boolean,
  readonly location?: Location
  readonly researcher: DuosUser
};

export default function ProgressReportApplication (props: ProgressReportApplicationProps){
  const {dar, parentDar, datasets, readOnlyMode, location, researcher} = props;
  const [formState, setFormState] = useState<FormState>({});
  const eRACommonsDestination = 'progress_report_application/' + parentDar?.collectionId;

  const onFormChange = (newState: Partial<FormState>) => {
    setFormState(prevState => ({
      ...prevState,
      ...newState
    }));
  };

  /* required because the datasets state changes during component mount */
  useEffect(() => {
    onFormChange({datasetIds: datasets.map((ds) => ds.datasetId)});
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
            <p style={{marginBottom: '1rem'}}>Currently selected datasets:</p>
            <SelectableDatasets
                disabled={readOnlyMode}
                datasets={datasets}
                setSelectedDatasets={(selectedDatasets: Dataset[]) => {
                  onFormChange({datasetIds: selectedDatasets.map((ds) => ds.datasetId)});
                }}
            />
          </div>
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
