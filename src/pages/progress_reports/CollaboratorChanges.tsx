import React, { useState } from 'react';
import {FormState, FormStateKey} from 'src/pages/progress_reports/ProgressReportFormState';
import CollaboratorList from 'src/components/collaborator_list/CollaboratorList';
import {Collaborator} from "src/types/model";
import {FormFieldTitle} from "src/components/forms/forms";

interface CollaboratorProps {
    readonly readOnly: boolean;
    formState: FormState;
    onFormChange: (newState: Partial<FormState>) => void;
}

export default function CollaboratorChanges(props: CollaboratorProps): React.JSX.Element {
    const { readOnly, formState, onFormChange } = props;

    const [labCollaborators, setLabCollaborators] = useState<Collaborator[]>(formState.labCollaborators || []);
    const [internalCollaborators, setInternalCollaborators] = useState<Collaborator[]>(formState.internalCollaborators || []);
    const [externalCollaborators, setExternalCollaborators] = useState<Collaborator[]>(formState.externalCollaborators || []);

    const onCollaboratorChange = (key: string, setState: React.Dispatch<Collaborator[]>, collaborators: Collaborator[]) => {
        onFormChange({ [key]: collaborators } as Partial<FormState>);
        setState(collaborators);
    };

    const onInternalLabStaffChange = (collaborators: Collaborator[]) => {
        onCollaboratorChange(FormStateKey.COLLABORATOR_LAB_COLLABORATORS, setLabCollaborators, collaborators);
    }

    const onInternalCollaboratorsChange = (collaborators: Collaborator[]) => {
        onCollaboratorChange(FormStateKey.COLLABORATOR_INTERNAL_COLLABORATORS, setInternalCollaborators, collaborators);
    }

    const onExternalCollaboratorsChange = (collaborators: Collaborator[]) => {
        onCollaboratorChange(FormStateKey.COLLABORATOR_EXTERNAL_COLLABORATORS, setExternalCollaborators, collaborators);
    }

    return (
        <div data-cy='dar-closeout'>
            <div className='progress-report-step-card'>
                <h2>Step 3: Add or Remove Collaborators</h2>

                <div className='progress-report-row'>
                    <FormFieldTitle
                        id='internalLabStaffTitle'
                        title='3.1 Internal Lab Staff'
                        description='Please add Internal Lab Staff here. Internal Lab Staff are defined as users of data from this Data Access Request, including any data that are downloaded or utilized in the cloud. Please do not list External Collaborators or Internal Collaborators at a PI or equivalent level here.'
                    />
                    <CollaboratorList
                        collaborators={labCollaborators}
                        collaboratorText='Internal Lab Staff'
                        columnsToShow={['name', 'title']}
                        onCollaboratorChange={onInternalLabStaffChange}
                        disabled={readOnly}
                        showApproverStatus={true}
                    />
                </div>
                <div className='progress-report-row'>
                    <FormFieldTitle
                        id='internalCollaboratorsTitle'
                        title='3.2 Internal Collaborators'
                        description='Please list Internal Collaborators here. Internal Collaborators are defined as individuals who are not under the direct supervision of the PI (e.g., not a member of the PI&apos;s laboratory) who assists with the PI&apos;s research project involving controlled-access data subject to the NIH GDS Policy. Internal collaborators are employees of the Requesting PI&apos;s institution and work at the same location/campus as the PI. Internal Collaborators must be at the PI or equivalent level and are required to have a Library Card in order to access data through this request. Internal Collaborators will have Data Downloader/Approver status so that they may add their own relevant Internal Lab Staff. Internal Collaborators will not be required to submit an independent DAR to collaborate on this project.'
                    />
                    <CollaboratorList
                        collaborators={internalCollaborators}
                        collaboratorText='Internal Collaborators'
                        columnsToShow={['name', 'title']}
                        onCollaboratorChange={onInternalCollaboratorsChange}
                        disabled={readOnly}
                    />
                </div>
                <div className='progress-report-row'>
                    <FormFieldTitle
                        id='externalCollaboratorsTitle'
                        title='3.3 External Collaborators'
                        description='Please list External collaborators here. External Collaborators are not employees of the Requesting PI&apos;s institution and/or do not work at the same location as the PI, and consequently must be independently approved to access controlled-access data subject to the GDS Policy. External Collaborators must be at the PI or equivalent level and are not required to have a Library Card in order to access data, although it is encouraged. Note: External Collaborators must submit an independent DAR approved by their signing Official to collaborate on this project. External Collaborators will be able to add their Lab Staff, as needed, via their independent DAR. Approval of this DAR does not indicate approval of the External Collaborators listed.'
                    />
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
