import React from 'react';
import { FormFieldChange, FormState } from './ProgressReportFormState';
import CollaboratorList from '../dar_application/collaborator/CollaboratorList';

interface CollaboratorProps {
    readonly readOnly: boolean;
    formState: FormState;
    onFormChange: (newState: Partial<FormState>) => void;
}

export default function CollaboratorChanges(props: CollaboratorProps): React.JSX.Element {
    const { readOnly, formState, onFormChange } = props;
    const _ignore = readOnly;

    return (
        <div data-cy='dar-closeout'>
            <div className='progress-report-step-card'>
                <h2>Step 2: Add or Remove Collaborators</h2>

                <div className='progress-report-row'>
                    <div>
                        <h3>2.1 Internal Lab Staff</h3>
                        <p>
                            Please add Internal Lab Staff here. Internal Lab Staff are defined as users of data from this Data Access Request, including any data that are downloaded or utilized in the cloud. Please do not list External Collaborators or Internal Collaborators at a PI or equivalent level here.
                        </p>
                    </div>
                    <CollaboratorList
                        collaborators={
                            [
                                { uuid: 'abc123', name: 'John Doe', email: 'john@example.com', institution: 'Broad Institute', approved: true, role: 'Data Analyst' },
                                { uuid: 'def456', name: 'Jane Smith', email: 'jane@example.com', institution: 'Broad Institute', approved: true, role: 'Data Analyst' }
                            ]
                        }
                        collaboratorKey='internalLabStaff'
                        collaboratorLabel='Internal Lab Staff'
                        setCompleted={() => {}}
                        formFieldChange={() => {}}
                    />
                </div>
                <div className='progress-report-row'>
                    <div>
                        <h3>2.2 Internal Collaborators</h3>
                        <p>
                            Please add Internal Collaborators here. Internal Collaborators are defined as individuals who are not under the direct supervision of the PI (e.g., not a member of the PI&apos;s laboratory) who assists with the PI&apos;s research project involving controlled-access data subject to the NIH GDS Policy. Internal collaborators are employees of the Requesting PI&apos;s institution and work at the same location/campus as the PI. Internal Collaborators must be at the PI or equivalent level and are required to have a Library Card in order to access data through this request. Internal Collaborators will have Data Downloader/Approver status so that they may add their own relevant Internal Lab Staff. Internal Collaborators will not be required to submit an independent DAR to collaborate on this project.
                        </p>
                    </div>
                    <CollaboratorList
                        collaborators={[]}
                        collaboratorKey='internalCollaborators'
                        collaboratorLabel='Internal Collaborators'
                        setCompleted={() => {}}
                        formFieldChange={() => {}}
                    />
                </div>
                <div className='progress-report-row'>
                    <div>
                        <h3>2.3 External Collaborators</h3>
                        <p>
                            Please list External collaborators here. External Collaboratos are not employees of the Requesting PI&apos;s institution and/or do not work at the same location as the PI, and consequently must be independently approved to access controlled-access data subject to the GDS Policy. External Collaborators must be at the PI or equivalent level and are not required to have a Library Card in order to access data, although it is encouraged. Note: External Collaborators must submit an independent DAR approved by their signing Official to collaborate on this project. External Collaborators will be able to add their Lab Staff, as needed, via their independent DAR. Approval of this DAR does not indicate approval of the External Collaborators listed.
                        </p>
                    </div>
                    <CollaboratorList
                        collaborators={[]}
                        collaboratorKey='externalCollaborators'
                        collaboratorLabel='External Collaborators'
                        setCompleted={() => {}}
                        formFieldChange={() => {}}
                    />
                </div>
            </div>
        </div>
    );
}
