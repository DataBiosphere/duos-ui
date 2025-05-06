import React, { useState } from 'react';
import SelectableDatasets from "../pages/dar_application/SelectableDatasets";
import {Dataset} from "src/types/model";

interface RemoveDatasetsProps {
  datasets: Dataset[];
  readOnlyMode: boolean;
}

interface FormStateInterface {
    datasetIds: number[];
}

export default function RemoveDatasets(_props: RemoveDatasetsProps): React.JSX.Element {
    const { datasets, readOnlyMode } = _props;
    const [formState, setFormState] = useState<FormStateInterface>({datasetIds: []});

    function setSelectedDatasets(selectedDatasets: Dataset[]) {
        setFormState({...formState, datasetIds: selectedDatasets.map((ds) => ds.datasetId)});

    }
  return (
      <div data-cy='remove-datasets'>
        <div className='progress-report-step-card'>
          <h2>Step 2: Dataset(s) in this DAR</h2>
          <p style={{ marginBottom: '1rem' }}>Currently selected datasets:</p>
          <SelectableDatasets
              disabled={readOnlyMode}
              datasets={datasets}
              setSelectedDatasets={setSelectedDatasets}
          />
        </div>
      </div>

  )
}