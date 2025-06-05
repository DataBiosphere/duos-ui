import { getApprovedElectionDatasetIds } from 'src/utils/DarUtils';
import { Election, Vote } from 'src/types/model';

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
});