import {DataManagementIncident, Presentation, Publication} from "src/types/model";

export interface FormState {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export interface FormFieldChange {
    key: string;
    value: boolean | string;
}

export enum FormStateKey {
    PROGRESS_REPORT_SUMMARY = 'progressReportSummary',
    INTELLECTUAL_PROPERTY_YES_NO = 'intellectualPropertyYesNo',
    INTELLECTUAL_PROPERTY_SUMMARY = 'intellectualPropertySummary',
    DATASET_IDS = 'datasetIds',
    PUBLICATION_YES_NO = 'publicationYesNo',
    PUBLICATIONS = 'publications',
    PRESENTATION_YES_NO = 'presentationYesNo',
    PRESENTATIONS = 'presentations',
    COLLABORATOR_INTERNAL_LAB_STAFF = 'internalLabStaff',
    COLLABORATOR_INTERNAL_COLLABORATORS = 'internalCollaborators',
    COLLABORATOR_EXTERNAL_COLLABORATORS  = 'externalCollaborators',
    DMI_YES_NO = 'dmiYesNo',
    DMI_COMBINATION = 'dmiCombination',
    DMI_IDENTIFICATION = 'dmiIdentification',
    DMI_SHARING = 'dmiSharing',
    DMI_SECURITY = 'dmiSecurity',
    DMI_ACKNOWLEDGEMENT = 'dmiAcknowledgement',
    DMI_PUBLICATION = 'dmiPublication',
    DMI_FALSIFICATION = 'dmiFalsification',
    DMI_OTHER = 'dmiOther',
    DMI_DESCRIPTION = 'dmiDescription'
}

export interface ExpectedFormState {
    progressReportSummary?: string;
    intellectualPropertyYesNo?: boolean;
    intellectualPropertySummary?: string;
    datasetIds?: number[];
    publications?: Publication[];
    presentations?: Presentation[];
    dataManagementIncident?: DataManagementIncident;
}

export const DMI_INCIDENT_KEYS = [
    FormStateKey.DMI_COMBINATION,
    FormStateKey.DMI_IDENTIFICATION,
    FormStateKey.DMI_SHARING,
    FormStateKey.DMI_SECURITY,
    FormStateKey.DMI_ACKNOWLEDGEMENT,
    FormStateKey.DMI_PUBLICATION,
    FormStateKey.DMI_FALSIFICATION,
    FormStateKey.DMI_OTHER
]
