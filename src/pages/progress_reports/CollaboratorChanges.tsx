import React, { useState } from 'react';
import { FormState } from 'src/pages/progress_reports/ProgressReportFormState';
import { Collaborator } from 'src/components/collaborator_list/Collaborator';
import CollaboratorList from 'src/components/collaborator_list/CollaboratorList';

interface CollaboratorProps {
    readonly readOnly: boolean;
    formState: FormState;
    onFormChange: (newState: Partial<FormState>) => void;
}

export default function CollaboratorChanges(props: CollaboratorProps): React.JSX.Element {
    const { readOnly, formState, onFormChange } = props;

    const [internalLabStaff, setInternalLabStaff] = useState(formState.internalLabStaff || []);
    const [internalCollaborators, setInternalCollaborators] = useState(formState.internalCollaborators || []);
    const [externalCollaborators, setExternalCollaborators] = useState(formState.externalCollaborators || []);

    const onCollaboratorChange = (key: string, setState: React.Dispatch<Collaborator[]>, collaborators: Collaborator[]) => {
        onFormChange({ [key]: collaborators });
        setState(collaborators);
    };

    const onInternalLabStaffChange = (collaborators: Collaborator[]) => {
        onCollaboratorChange('internalLabStaff', setInternalLabStaff, collaborators);
    }

    const onInternalCollaboratorsChange = (collaborators: Collaborator[]) => {
        onCollaboratorChange('internalCollaborators', setInternalCollaborators, collaborators);
    }

    const onExternalCollaboratorsChange = (collaborators: Collaborator[]) => {
        onCollaboratorChange('externalCollaborators', setExternalCollaborators, collaborators);
    }

    return (
        <div data-cy='dar-closeout'>
            <div className='progress-report-step-card'>
                <h2>Step 3: Add or Remove Collaborators</h2>

                <div className='progress-report-row'>
                    <div>
                        <h3>3.1 Internal Lab Staff</h3>
                        <p>
                            Please add Internal Lab Staff here. Internal Lab Staff are defined as users of data from this Data Access Request, including any data that are downloaded or utilized in the cloud. Please do not list External Collaborators or Internal Collaborators at a PI or equivalent level here.
                        </p>
                    </div>
                    <CollaboratorList
                        collaborators={internalLabStaff}
                        collaboratorText='Internal Lab Staff'
                        columnsToShow={['name', 'title']}
                        onCollaboratorChange={onInternalLabStaffChange}
                        disabled={readOnly}
                    />
                </div>
                <div className='progress-report-row'>
                    <div>
                        <h3>3.2 Internal Collaborators</h3>
                        <p>
                            Please add Internal Collaborators here. Internal Collaborators are defined as individuals who are not under the direct supervision of the PI (e.g., not a member of the PI&apos;s laboratory) who assists with the PI&apos;s research project involving controlled-access data subject to the NIH GDS Policy. Internal collaborators are employees of the Requesting PI&apos;s institution and work at the same location/campus as the PI. Internal Collaborators must be at the PI or equivalent level and are required to have a Library Card in order to access data through this request. Internal Collaborators will have Data Downloader/Approver status so that they may add their own relevant Internal Lab Staff. Internal Collaborators will not be required to submit an independent DAR to collaborate on this project.
                        </p>
                    </div>
                    <CollaboratorList
                        collaborators={internalCollaborators}
                        collaboratorText='Internal Collaborators'
                        columnsToShow={['name', 'title']}
                        onCollaboratorChange={onInternalCollaboratorsChange}
                        disabled={readOnly}
                    />
                </div>
                <div className='progress-report-row'>
                    <div>
                        <h3>3.3 External Collaborators</h3>
                        <p>
                            Please list External collaborators here. External Collaboratos are not employees of the Requesting PI&apos;s institution and/or do not work at the same location as the PI, and consequently must be independently approved to access controlled-access data subject to the GDS Policy. External Collaborators must be at the PI or equivalent level and are not required to have a Library Card in order to access data, although it is encouraged. Note: External Collaborators must submit an independent DAR approved by their signing Official to collaborate on this project. External Collaborators will be able to add their Lab Staff, as needed, via their independent DAR. Approval of this DAR does not indicate approval of the External Collaborators listed.
                        </p>
                    </div>
                    <CollaboratorList
                        collaborators={externalCollaborators}
                        collaboratorText='External Collaborators'
                        columnsToShow={['name', 'title']}
                        onCollaboratorChange={onExternalCollaboratorsChange}
                        disabled={readOnly}
                    />
                </div>
            </div>
        </div>
    );
}
