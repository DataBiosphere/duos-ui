import {
    Closeout,
    CombinedDataAccessRequest,
    DataManagementIncident,
    Election,
    Presentation,
    Publication
} from 'src/types/model';
import {CLOSEOUT_KEYS, DMI_INCIDENT_KEYS, FormState} from 'src/pages/progress_reports/ProgressReportFormState';
import {PublicationOrPresentation} from 'src/components/publications_list/PublicationOrPresentation';

export function getApprovedElectionDatasetIds(elections: Array<Election>) : Array<number> {
    const approvedDatasetIds = [];
    for (const election of elections) {
        if (election.electionType === 'DataAccess') {
            const votes = Object.values(election.votes);
            const anyApprovedFinalVotes = votes.some(vote => vote.type === 'FINAL' && vote.vote);
            if (anyApprovedFinalVotes) {
                approvedDatasetIds.push(election.datasetId);
            }
        }
    }
    return approvedDatasetIds;
}

export function convertFormStateToDAR(formState: FormState): Partial<CombinedDataAccessRequest> {
    const expectedForm: Partial<CombinedDataAccessRequest> = {} as Partial<CombinedDataAccessRequest>;
    expectedForm.progressReportSummary = formState.progressReportSummary;
    if (formState.intellectualPropertyYesNo) {
        expectedForm.intellectualPropertySummary = formState.intellectualPropertySummary;
    }
    expectedForm.datasetIds = formState.datasetIds ?? [];
    if (formState.publicationsYesNo) {
        expectedForm.publications = getPublicationList(formState);
    }
    if (formState.presentationsYesNo) {
        expectedForm.presentations = getPresentationList(formState);
    }
    expectedForm.labCollaborators = formState.labCollaborators;
    expectedForm.internalCollaborators = formState.internalCollaborators;
    expectedForm.externalCollaborators = formState.externalCollaborators;
    if (formState.dmiYesNo) {
        expectedForm.dmi = getDataManagementIncidents(formState);
    }
    if (formState.closeoutYesNo) {
        expectedForm.closeoutSupplement = getCloseoutInfo(formState);
    }
    expectedForm.dsAcknowledgement = formState.dsAcknowledgement;
    expectedForm.gsoAcknowledgement = formState.gsoAcknowledgement;
    expectedForm.pubAcknowledgement = formState.pubAcknowledgement;
    expectedForm.irbDocumentLocation = formState.irbDocumentLocation;
    expectedForm.irbDocumentName = formState.irbDocumentName;
    expectedForm.irbProtocolExpiration = formState.irbProtocolExpiration;
    expectedForm.collaborationLetterLocation = formState.collaborationLetterLocation;
    expectedForm.collaborationLetterName = formState.collaborationLetterName;
    return expectedForm;
}

export function getPublicationList(formState: FormState): Publication[] {
    const publications: PublicationOrPresentation[] = formState.publications ?? [];
    return publications.map((pub: PublicationOrPresentation) => {
        const expectedPublication: Publication = {} as Publication;
        expectedPublication.title = pub.title;
        expectedPublication.pubmedId = pub.pubmed_id;
        expectedPublication.date = pub.date;
        expectedPublication.authors = pub.authors;
        expectedPublication.bibliographicCitation = pub.bibliographic_citation
        expectedPublication.datasetCitation = pub.dataset_citation;
        expectedPublication.citation = pub.did_cite;
        return expectedPublication;
    });
}

export function getPresentationList(formState: FormState): Presentation[] {
    const presentations: PublicationOrPresentation[] = formState.presentations ?? [];
    return presentations.map((pub: PublicationOrPresentation) => {
        const expectedPresentation: Presentation= {} as Presentation;
        expectedPresentation.title = pub.title;
        expectedPresentation.date = pub.date;
        expectedPresentation.authors = pub.authors;
        expectedPresentation.datasetCitation = pub.dataset_citation;
        expectedPresentation.citation = pub.did_cite;
        expectedPresentation.link = pub.link;
        return expectedPresentation;
    });
}

export function getDataManagementIncidents(formState: FormState): DataManagementIncident {
    const dataManagementIncident: DataManagementIncident = {} as DataManagementIncident;
    dataManagementIncident.incidents = []
    DMI_INCIDENT_KEYS.forEach((key) => {
        const incident = formState[key] ?? undefined;
        if (incident) {
            dataManagementIncident.incidents.push(key);
        }
    });
    dataManagementIncident.description = formState.dmiDescription ?? '';

    return dataManagementIncident;
}

export function getCloseoutInfo (formState: FormState): Closeout {
    const closeout: Closeout = {} as Closeout;
    closeout.reasons = []
    CLOSEOUT_KEYS.forEach((key) => {
        const reason = formState[key] ?? undefined;
        if (reason) {
            closeout.reasons.push(key);
        }
    });
    closeout.otherText = formState.closeoutOtherText ?? '';
    closeout.signingOfficialId = formState.closeoutSigningOfficial?.userId;

    return closeout;
}
