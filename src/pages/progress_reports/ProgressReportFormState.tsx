import { PublicationOrPresentation } from 'src/components/publications_list/PublicationOrPresentation';
import {Collaborator, Dataset, SimplifiedDuosUser} from 'src/types/model';

export type ValidFormState = {
  [K in keyof FormState]: {
    key: K;
    value: FormState[K];
  }
}[keyof FormState];

export interface FormState {
    progressReportSummary: string;
    intellectualPropertyYesNo: boolean;
    intellectualPropertySummary: string;
    datasetIds: number[];
    publicationsYesNo: boolean;
    publications: PublicationOrPresentation[];
    presentationsYesNo: boolean;
    presentations: PublicationOrPresentation[];
    dsAcknowledgement: boolean;
    gsoAcknowledgement: boolean;
    pubAcknowledgement: boolean;
    labCollaborators: Collaborator[];
    internalCollaborators: Collaborator[];
    irbDocumentLocation?: string;
    irbDocumentName?: string;
    irbProtocolExpiration?: string;
    collaborationLetterLocation?: string;
    collaborationLetterName?: string;
    externalCollaborators: Collaborator[];
    dmiYesNo: boolean;
    dmiCombination: boolean;
    dmiIdentification: boolean;
    dmiSharing: boolean;
    dmiSecurity: boolean;
    dmiAcknowledgement: boolean;
    dmiPublication: boolean;
    dmiFalsification: boolean;
    dmiOther: boolean;
    dmiDescription: string;
    closeoutYesNo: boolean;
    closeoutSigningOfficial: SimplifiedDuosUser;
    closeoutProjectCompleted: boolean;
    closeoutRequestorMovedInstitution: boolean;
    closeoutProjectTransferred: boolean;
    closeoutProjectSuperseded: boolean;
    closeoutOther: boolean;
    closeoutOtherText: string;
    datasets: Dataset[];
    selectedDatasets: Dataset[];
    eraCommonsId: string;
}

export enum FormStateKey {
    PROGRESS_REPORT_SUMMARY = 'progressReportSummary',
    INTELLECTUAL_PROPERTY_YES_NO = 'intellectualPropertyYesNo',
    INTELLECTUAL_PROPERTY_SUMMARY = 'intellectualPropertySummary',
    DATASET_IDS = 'datasetIds',
    PUBLICATIONS_YES_NO = 'publicationsYesNo',
    PUBLICATIONS = 'publications',
    PRESENTATIONS_YES_NO = 'presentationsYesNo',
    PRESENTATIONS = 'presentations',
    COLLABORATOR_LAB_COLLABORATORS= 'labCollaborators',
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
    DMI_DESCRIPTION = 'dmiDescription',
    CLOSEOUT_YES_NO = 'closeoutYesNo',
    CLOSEOUT_SIGNING_OFFICIAL = 'closeoutSigningOfficial',
    CLOSEOUT_PROJECT_COMPLETED = 'closeoutProjectCompleted',
    CLOSEOUT_REQUESTOR_MOVED_INSTITUTION = 'closeoutRequestorMovedInstitution',
    CLOSEOUT_PROJECT_TRANSFERRED = 'closeoutProjectTransferred',
    CLOSEOUT_PROJECT_SUPERSEDED = 'closeoutProjectSuperseded',
    CLOSEOUT_OTHER = 'closeoutOther',
    CLOSEOUT_OTHER_TEXT = 'closeoutOtherText'
}

export const CLOSEOUT_KEYS: FormStateKey[] = [
    FormStateKey.CLOSEOUT_PROJECT_COMPLETED,
    FormStateKey.CLOSEOUT_REQUESTOR_MOVED_INSTITUTION,
    FormStateKey.CLOSEOUT_PROJECT_TRANSFERRED,
    FormStateKey.CLOSEOUT_PROJECT_SUPERSEDED,
    FormStateKey.CLOSEOUT_OTHER
];

export const DMI_INCIDENT_KEYS: FormStateKey[] = [
    FormStateKey.DMI_COMBINATION,
    FormStateKey.DMI_IDENTIFICATION,
    FormStateKey.DMI_SHARING,
    FormStateKey.DMI_SECURITY,
    FormStateKey.DMI_ACKNOWLEDGEMENT,
    FormStateKey.DMI_PUBLICATION,
    FormStateKey.DMI_FALSIFICATION,
    FormStateKey.DMI_OTHER
];
