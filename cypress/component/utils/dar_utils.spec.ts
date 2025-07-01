import {
  convertFormStateToDAR,
  getApprovedElectionDatasetIds,
  getCloseoutInfo,
  getDataManagementIncidents,
  getPresentationList,
  getPublicationList
} from 'src/utils/DarUtils';
import {Election, Vote} from 'src/types/model';
import {FormState} from 'src/pages/progress_reports/ProgressReportFormState';

describe('DarUtils', () => {
  describe('getApprovedElectionDatasetIds', () => {
    it('should return an empty array when given an empty array of elections', () => {
      const elections: Election[] = [];
      const result = getApprovedElectionDatasetIds(elections);
      expect(result).to.deep.equal([]);
    });

    it('should return only dataset IDs from DataAccess elections with approved votes', () => {
      const elections: Election[] = [
        {
          electionId: 1,
          electionType: 'DataAccess',
          datasetId: 101,
          votes: {
            1: { voteId: 1, type: 'FINAL', vote: true, userId: 10, electionId: 1 } as Vote
          } as object,
        } as Election,
        {
          electionId: 2,
          electionType: 'DataAccess',
          datasetId: 102,
          votes: {
            2: { voteId: 2, type: 'FINAL', userId: 11, electionId: 2 } as Vote
          } as object,
        } as Election,
        {
          electionId: 3,
          electionType: 'DataAccess',
          datasetId: 103,
          votes: {
            3: { voteId: 3, type: 'FINAL', vote: false, userId: 12, electionId: 3 } as Vote
          } as object,
        } as Election
      ];

      const result = getApprovedElectionDatasetIds(elections);
      expect(result).to.deep.equal([101]);
    });

    it('should ignore non-DataAccess elections', () => {
      const elections: Election[] = [
        {
          electionId: 1,
          electionType: 'DataAccess',
          datasetId: 101,
          votes: {
            1: { voteId: 1, type: 'FINAL', vote: true, userId: 10, electionId: 1 } as Vote
          } as object,
        } as Election,
        {
          electionId: 2,
          electionType: 'RP',
          datasetId: 102,
          votes: {
            2: { voteId: 2, type: 'FINAL', vote: true, userId: 11, electionId: 2 } as Vote
          } as object,
        } as Election
      ];

      const result = getApprovedElectionDatasetIds(elections);
      expect(result).to.deep.equal([101]);
    });

    it('should handle multiple votes per election', () => {
      const elections: Election[] = [
        {
          electionId: 1,
          electionType: 'DataAccess',
          datasetId: 101,
          votes: {
            1: { voteId: 1, type: 'FINAL', vote: true, userId: 10, electionId: 1 } as Vote,
            2: { voteId: 2, type: 'Chairperson', vote: false, userId: 11, electionId: 1 } as Vote
          } as object,
        } as Election,
        {
          electionId: 2,
          electionType: 'DataAccess',
          datasetId: 102,
          votes: {
            3: { voteId: 3, type: 'DAC', vote: true, userId: 12, electionId: 2 } as Vote,
            4: { voteId: 4, type: 'FINAL', vote: false, userId: 13, electionId: 2 } as Vote
          } as object,
        } as Election
      ];

      const result = getApprovedElectionDatasetIds(elections);
      expect(result).to.deep.equal([101]);
    });

    it('should only consider FINAL vote types', () => {
      const elections: Election[] = [
        {
          electionId: 1,
          electionType: 'DataAccess',
          datasetId: 101,
          votes: {
            1: { voteId: 1, type: 'DAC', vote: true, userId: 10, electionId: 1 } as Vote
          } as object,
        } as Election,
        {
          electionId: 2,
          electionType: 'DataAccess',
          datasetId: 102,
          votes: {
            2: { voteId: 2, type: 'Chairperson', vote: true, userId: 11, electionId: 2 } as Vote
          } as object,
        } as Election,
        {
          electionId: 3,
          electionType: 'DataAccess',
          datasetId: 103,
          votes: {
            3: { voteId: 3, type: 'FINAL', vote: true, userId: 12, electionId: 3 } as Vote
          } as object,
        } as Election
      ];

      const result = getApprovedElectionDatasetIds(elections);
      expect(result).to.deep.equal([103]);
    });

    it('should handle elections with no votes', () => {
      const elections: Election[] = [
        {
          electionId: 1,
          electionType: 'DataAccess',
          datasetId: 101,
          votes: {} as object,
        } as Election,
        {
          electionId: 2,
          electionType: 'DataAccess',
          datasetId: 102,
          votes: {
            1: { voteId: 1, type: 'FINAL', vote: true, userId: 10, electionId: 2 } as Vote
          } as object,
        } as Election
      ];

      const result = getApprovedElectionDatasetIds(elections);
      expect(result).to.deep.equal([102]);
    });

    it('should return unique dataset IDs even if duplicated in multiple elections', () => {
      const elections: Election[] = [
        {
          electionId: 1,
          electionType: 'DataAccess',
          datasetId: 101,
          votes: {
            1: { voteId: 1, type: 'FINAL', vote: true, userId: 10, electionId: 1 } as Vote
          } as object,
        } as Election,
        {
          electionId: 2,
          electionType: 'DataAccess',
          datasetId: 101,
          votes: {
            2: { voteId: 2, type: 'FINAL', vote: true, userId: 11, electionId: 2 } as Vote
          } as object,
        } as Election
      ];

      const result = getApprovedElectionDatasetIds(elections);
      expect(result).to.deep.equal([101, 101]);
    });
  });

  describe('convertFormStateToDAR', () => {
    it('should convert FormState to DAR format', () => {
      const formState = {
        progressReportSummary: 'Test summary',
        intellectualPropertyYesNo: true,
        intellectualPropertySummary: 'IP summary',
        datasetIds: [1, 2],
        publicationsYesNo: true,
        publications: [{
          title: 'Publication 1',
          pubmed_id: '12345',
          date: '2023-01-01',
          authors: ['Author A'],
          bibliographic_citation: 'Citation 1',
          dataset_citation: 'Dataset 1',
          did_cite: true
        }],
        presentationsYesNo: true,
        labCollaborators: ['Lab A'],
        internalCollaborators: ['Internal A'],
        externalCollaborators: ['External A'],
        dmiYesNo: true,
        closeoutYesNo: true,
        dsAcknowledgement: true,
        gsoAcknowledgement: true,
        pubAcknowledgement: true,
        irbDocumentLocation: 'location',
        irbDocumentName: 'IRB Document',
        irbProtocolExpiration: '2024-01-01',
        collaborationLetterLocation: 'collab_location',
        collaborationLetterName: 'Collaboration Letter'
      } as unknown as FormState;
      const result = convertFormStateToDAR(formState);
      expect(result.progressReportSummary).to.equal(formState.progressReportSummary);
      expect(result.intellectualPropertySummary).to.equal(formState.intellectualPropertySummary);
      expect(result.datasetIds).to.equal(formState.datasetIds);
      expect(result.publications).to.deep.equal(getPublicationList(formState));
      expect(result.presentations).to.deep.equal(getPresentationList(formState));
      expect(result.labCollaborators).to.equal(formState.labCollaborators);
      expect(result.internalCollaborators).to.equal(formState.internalCollaborators);
      expect(result.externalCollaborators).to.equal(formState.externalCollaborators);
      expect(result.dmi).to.deep.equal(getDataManagementIncidents(formState));
      expect(result.closeoutSupplement).to.deep.equal(getCloseoutInfo(formState));
      expect(result.dsAcknowledgement).to.equal(formState.dsAcknowledgement);
      expect(result.gsoAcknowledgement).to.equal(formState.gsoAcknowledgement);
      expect(result.pubAcknowledgement).to.equal(formState.pubAcknowledgement);
      expect(result.irbDocumentLocation).to.equal(formState.irbDocumentLocation);
      expect(result.irbDocumentName).to.equal(formState.irbDocumentName);
      expect(result.irbProtocolExpiration).to.equal(formState.irbProtocolExpiration);
      expect(result.collaborationLetterLocation).to.equal(formState.collaborationLetterLocation);
      expect(result.collaborationLetterName).to.equal(formState.collaborationLetterName);
    })
  });
});
