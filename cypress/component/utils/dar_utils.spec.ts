import {
  convertFormStateToDAR,
  ElectionStatus, ElectionType,
  getApprovedElectionDatasetIds,
  getCloseoutInfo,
  getDataManagementIncidents, getIntellectualPropertyList,
  getPresentationList,
  getPublicationList,
  userHasOpenDataAccessElection,
  VOTE_TYPES,
} from 'src/utils/DarUtils'
import { Collaborator, DarCollection, DataAccessRequest, Election, Vote } from 'src/types/model'
import { FormState } from 'src/pages/progress_reports/ProgressReportFormState'

describe('DarUtils', () => {
  describe('getApprovedElectionDatasetIds', () => {
    it('should return an empty array when given an empty array of elections', () => {
      const elections: Election[] = []
      const result = getApprovedElectionDatasetIds(elections)
      expect(result).to.deep.equal([])
    })

    it('should return only dataset IDs from DataAccess elections with approved votes', () => {
      const elections: Election[] = [
        {
          electionId: 1,
          electionType: 'DataAccess',
          datasetId: 101,
          votes: {
            1: { voteId: 1, type: VOTE_TYPES.FINAL, vote: true, userId: 10, electionId: 1 } as Vote,
          } as object,
        } as Election,
        {
          electionId: 2,
          electionType: 'DataAccess',
          datasetId: 102,
          votes: {
            2: { voteId: 2, type: VOTE_TYPES.RADAR_APPROVE, userId: 11, electionId: 2 } as Vote,
          } as object,
        } as Election,
        {
          electionId: 3,
          electionType: 'DataAccess',
          datasetId: 103,
          votes: {
            3: { voteId: 3, type: VOTE_TYPES.FINAL, vote: false, userId: 12, electionId: 3 } as Vote,
          } as object,
        } as Election,
      ]

      const result = getApprovedElectionDatasetIds(elections)
      expect(result).to.deep.equal([101])
    })

    it('should ignore non-DataAccess elections', () => {
      const elections: Election[] = [
        {
          electionId: 1,
          electionType: 'DataAccess',
          datasetId: 101,
          votes: {
            1: { voteId: 1, type: VOTE_TYPES.FINAL, vote: true, userId: 10, electionId: 1 } as Vote,
          } as object,
        } as Election,
        {
          electionId: 2,
          electionType: 'RP',
          datasetId: 102,
          votes: {
            2: { voteId: 2, type: VOTE_TYPES.FINAL, vote: true, userId: 11, electionId: 2 } as Vote,
          } as object,
        } as Election,
      ]

      const result = getApprovedElectionDatasetIds(elections)
      expect(result).to.deep.equal([101])
    })

    it('should handle multiple votes per election', () => {
      const elections: Election[] = [
        {
          electionId: 1,
          electionType: 'DataAccess',
          datasetId: 101,
          votes: {
            1: { voteId: 1, type: VOTE_TYPES.RADAR_APPROVE, vote: true, userId: 10, electionId: 1 } as Vote,
            2: { voteId: 2, type: 'Chairperson', vote: false, userId: 11, electionId: 1 } as Vote,
          } as object,
        } as Election,
        {
          electionId: 2,
          electionType: 'DataAccess',
          datasetId: 102,
          votes: {
            3: { voteId: 3, type: 'DAC', vote: true, userId: 12, electionId: 2 } as Vote,
            4: { voteId: 4, type: VOTE_TYPES.FINAL, vote: false, userId: 13, electionId: 2 } as Vote,
          } as object,
        } as Election,
      ]

      const result = getApprovedElectionDatasetIds(elections)
      expect(result).to.deep.equal([101])
    })

    it('should only consider VOTE_TYPES.FINAL vote types', () => {
      const elections: Election[] = [
        {
          electionId: 1,
          electionType: 'DataAccess',
          datasetId: 101,
          votes: {
            1: { voteId: 1, type: 'DAC', vote: true, userId: 10, electionId: 1 } as Vote,
          } as object,
        } as Election,
        {
          electionId: 2,
          electionType: 'DataAccess',
          datasetId: 102,
          votes: {
            2: { voteId: 2, type: 'Chairperson', vote: true, userId: 11, electionId: 2 } as Vote,
          } as object,
        } as Election,
        {
          electionId: 3,
          electionType: 'DataAccess',
          datasetId: 103,
          votes: {
            3: { voteId: 3, type: VOTE_TYPES.FINAL, vote: true, userId: 12, electionId: 3 } as Vote,
          } as object,
        } as Election,
      ]

      const result = getApprovedElectionDatasetIds(elections)
      expect(result).to.deep.equal([103])
    })

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
            1: { voteId: 1, type: VOTE_TYPES.FINAL, vote: true, userId: 10, electionId: 2 } as Vote,
          } as object,
        } as Election,
      ]

      const result = getApprovedElectionDatasetIds(elections)
      expect(result).to.deep.equal([102])
    })

    it('should return unique dataset IDs even if duplicated in multiple elections', () => {
      const elections: Election[] = [
        {
          electionId: 1,
          electionType: 'DataAccess',
          datasetId: 101,
          votes: {
            1: { voteId: 1, type: VOTE_TYPES.FINAL, vote: true, userId: 10, electionId: 1 } as Vote,
          } as object,
        } as Election,
        {
          electionId: 2,
          electionType: 'DataAccess',
          datasetId: 101,
          votes: {
            2: { voteId: 2, type: VOTE_TYPES.RADAR_APPROVE, vote: true, userId: 11, electionId: 2 } as Vote,
          } as object,
        } as Election,
      ]

      const result = getApprovedElectionDatasetIds(elections)
      expect(result).to.deep.equal([101, 101])
    })
  })

  describe('convertFormStateToDAR', () => {
    it('should convert FormState to DAR format', () => {
      const formState = {
        progressReportSummary: 'Test summary',
        intellectualPropertiesYesNo: true,
        intellectualProperties: [{
          ipId: 'ip-1',
          studyId: 'study-1',
          type: 'Patent',
          title: 'IP 1',
          assignee: 'Inventor A',
          patentNumber: 'App123',
          filingDate: '2023-01-01',
          status: 'Filed',
          url: 'https://example.com/ip',
          contact: 'contact@example.com',
          tags: [],
        }],
        datasetIds: [1, 2],
        publicationsYesNo: true,
        publications: [{
          title: 'Publication 1',
          pubmedId: '12345',
          date: '2023-01-01',
          authors: ['Author A'],
          bibliographicCitation: 'Citation 1',
          datasetCitation: 'Dataset 1',
          citation: true,
        }],
        presentationsYesNo: true,
        presentations: [{
          title: 'Presentation 1',
          pubmedId: '67890',
          date: '2023-02-01',
          authors: ['Author B'],
          bibliographicCitation: 'Citation 2',
          datasetCitation: 'Dataset 2',
          citation: true,
        }],
        labCollaborators: [{
          approverStatus: true,
          countryOfOperation: 'USA',
          email: 'email',
          eraCommonsId: 'test_era',
          name: 'Collaborator A',
          title: 'Collaborator Title',
          uuid: 'collab-uuid',
        } as Collaborator],
        internalCollaborators: [{
          approverStatus: true,
          countryOfOperation: 'USA',
          email: 'email',
          eraCommonsId: 'test_era',
          name: 'Internal Collaborator A',
          title: 'Internal Collaborator Title',
          uuid: 'collab-uuid-internal',
        } as Collaborator],
        externalCollaborators: [{
          approverStatus: true,
          countryOfOperation: 'USA',
          email: 'email',
          eraCommonsId: 'test_era',
          name: 'External Collaborator A',
          title: 'External Collaborator Title',
          uuid: 'collab-uuid-external',
        } as Collaborator],
        dmiYesNo: true,
        closeoutYesNo: true,
        dsAcknowledgement: true,
        gsoAcknowledgement: true,
        pubAcknowledgement: true,
        irbDocumentLocation: 'location',
        irbDocumentName: 'IRB Document',
        irbProtocolExpiration: '2024-01-01',
        collaborationLetterLocation: 'collab_location',
        collaborationLetterName: 'Collaboration Letter',
        daaIds: [101, '102', 101, 'bad-id'] as unknown as number[],
      } as unknown as FormState
      const result = convertFormStateToDAR(formState)
      expect(result.progressReportSummary).to.equal(formState.progressReportSummary)
      expect(result.intellectualProperties).to.deep.equal(getIntellectualPropertyList(formState))
      expect(result.datasetIds).to.equal(formState.datasetIds)
      expect(result.publications).to.deep.equal(getPublicationList(formState))
      expect(result.presentations).to.deep.equal(getPresentationList(formState))
      expect(result.labCollaborators).to.equal(formState.labCollaborators)
      expect(result.internalCollaborators).to.equal(formState.internalCollaborators)
      expect(result.externalCollaborators).to.equal(formState.externalCollaborators)
      expect(result.dmi).to.deep.equal(getDataManagementIncidents(formState))
      expect(result.closeoutSupplement).to.deep.equal(getCloseoutInfo(formState))
      expect(result.dsAcknowledgement).to.equal(formState.dsAcknowledgement)
      expect(result.gsoAcknowledgement).to.equal(formState.gsoAcknowledgement)
      expect(result.pubAcknowledgement).to.equal(formState.pubAcknowledgement)
      expect(result.irbDocumentLocation).to.equal(formState.irbDocumentLocation)
      expect(result.irbDocumentName).to.equal(formState.irbDocumentName)
      expect(result.irbProtocolExpiration).to.equal(formState.irbProtocolExpiration)
      expect(result.collaborationLetterLocation).to.equal(formState.collaborationLetterLocation)
      expect(result.collaborationLetterName).to.equal(formState.collaborationLetterName)
      // closeoutYesNo is true in this formState, so daaIds should be absent
      expect(result.daaIds).to.equal(undefined)
    })

    it('should include daaIds when closeoutYesNo is false', () => {
      const formState = {
        progressReportSummary: 'Test summary',
        datasetIds: [1],
        daaIds: [101, 102, 101] as number[],
        closeoutYesNo: false,
        labCollaborators: [],
        internalCollaborators: [],
        externalCollaborators: [],
      } as unknown as FormState
      const result = convertFormStateToDAR(formState)
      expect(result.daaIds).to.deep.equal([101, 102])
    })

    it('should omit daaIds when closeoutYesNo is true', () => {
      const formState = {
        progressReportSummary: 'Test summary',
        datasetIds: [1],
        daaIds: [101, 102] as number[],
        closeoutYesNo: true,
        labCollaborators: [],
        internalCollaborators: [],
        externalCollaborators: [],
      } as unknown as FormState
      const result = convertFormStateToDAR(formState)
      expect(result.daaIds).to.equal(undefined)
    })
  })

  describe('hasOpenElection', () => {
    const baseVote = {
      voteId: 1,
      userId: 42,
      electionStatus: ElectionStatus.OPEN,
    } as Vote

    const openElection = {
      electionId: 1,
      status: ElectionStatus.OPEN,
      electionType: ElectionType.DATA_ACCESS,
      votes: {
        1: { ...baseVote },
      } as object,
    } as Election

    const closedElection = {
      electionId: 2,
      status: ElectionStatus.CLOSED,
      electionType: ElectionType.DATA_ACCESS,
      votes: {
        1: { ...baseVote },
      } as object,
    } as Election

    const nonMatchingVote = {
      electionId: 3,
      status: ElectionStatus.OPEN,
      electionType: ElectionType.DATA_ACCESS,
      votes: {
        1: { ...baseVote, userId: 99 },
      } as object,
    } as Election

    const nonOpenVote = {
      electionId: 4,
      status: ElectionStatus.OPEN,
      electionType: ElectionType.DATA_ACCESS,
      votes: {
        1: { ...baseVote, electionStatus: ElectionStatus.CLOSED },
      } as object,
    } as Election

    const nonDataAccessElection = {
      electionId: 5,
      status: ElectionStatus.OPEN,
      electionType: 'OtherType',
      votes: {
        1: { ...baseVote },
      } as object,
    } as Election

    const makeCollection = (elections: Election[]) => ({
      dars: {
        1: { elections: { ...elections.reduce((acc, e, i) => ({ ...acc, [i]: e }), {}) } } as object as DataAccessRequest,
      } as object,
    } as DarCollection)

    it('returns true if there is an open DataAccess election with a matching open vote for the user', () => {
      expect(userHasOpenDataAccessElection(makeCollection([openElection]), 42)).to.equal(true)
    })

    it('returns false if there are no dars', () => {
      expect(userHasOpenDataAccessElection({ dars: undefined } as object as DarCollection, 42)).to.equal(false)
    })

    it('returns false if election is closed', () => {
      expect(userHasOpenDataAccessElection(makeCollection([closedElection]), 42)).to.equal(false)
    })

    it('returns false if vote userId does not match', () => {
      expect(userHasOpenDataAccessElection(makeCollection([nonMatchingVote]), 42)).to.equal(false)
    })

    it('returns false if vote.electionStatus is not OPEN', () => {
      expect(userHasOpenDataAccessElection(makeCollection([nonOpenVote]), 42)).to.equal(false)
    })

    it('returns false if electionType is not DataAccess', () => {
      expect(userHasOpenDataAccessElection(makeCollection([nonDataAccessElection]), 42)).to.equal(false)
    })

    it('returns true if at least one election matches among many', () => {
      expect(userHasOpenDataAccessElection(makeCollection([closedElection, nonMatchingVote, openElection]), 42)).to.equal(true)
    })

    it('returns false if no elections exist', () => {
      expect(userHasOpenDataAccessElection({ dars: { 1: { elections: {} } as DataAccessRequest } } as object as DarCollection, 42)).to.equal(false)
    })
  })
})
