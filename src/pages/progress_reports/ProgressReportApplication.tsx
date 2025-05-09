import React, { useState } from "react";
import { DataAccessRequest } from "src/types/model";
import { FormState } from "./ProgressReportFormState";
import DarCloseout from "./DarCloseout";
import DataManagementIncident from "./DataManagementIncident";

type ProgressReportApplicationProps = {
    dar?: DataAccessRequest, // Dar will be empty if this is a new application
    readOnlyMode?: boolean
};

export const ProgressReportApplication = ({ dar, readOnlyMode = true }: ProgressReportApplicationProps) => {
    const [formState, setFormState] = useState<FormState>({});

    const onFormChange = (newState: Partial<FormState>) => {
        setFormState(prevState => ({
            ...prevState,
            ...newState
        }));
    };

    return (
        <>
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
            </div>
            <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
                <DataManagementIncident readOnly={readOnlyMode} formState={formState} onFormChange={onFormChange} />
            </div>
            <div className={readOnlyMode ? 'accordion-step-container' : 'step-container'}>
                <DarCloseout readOnly={readOnlyMode} formState={formState} onFormChange={onFormChange} />
            </div>
        </>
    )
};
