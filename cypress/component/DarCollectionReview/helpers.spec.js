/* eslint-disable no-undef */
import { updateVoteFn } from '../../../src/pages/dar_collection_review/DarCollectionReview';
import { includes } from 'lodash/fp';

const mockBuckets = [{
  key: 'test bucket',
  votes: [
    {
      rp: {
        memberVotes: [
          {
            voteId: 4,
            vote: undefined,
            rationale: undefined
          }
        ]
      },
      dataAccess: {
        memberVotes: [{
          voteId: 1,
          vote: undefined,
          rationale: undefined
        },
        {
          voteId: 2,
          vote: undefined,
          rationale: undefined
        },
        {
          voteId: 3,
          vote: undefined,
          rationale: undefined
        }]
      }
    }
  ]
}];

describe('DAR Collection Review - Helper Methods', () => {
  describe('updateVoteFn', () => {
    it('updates target votes on buckets with the vote decision and rationale', () => {
      let dataUseBuckets = mockBuckets;
      const setDataUseBuckets = () => {};
      const voteIds = [1,3];
      const voteDecision = true;
      const rationale = 'test rationale';
      const date = new Date();

      const updatedBuckets = updateVoteFn({dataUseBuckets, setDataUseBuckets, voteIds, voteDecision, rationale, date});
      const targetVotes = updatedBuckets[0].votes[0].dataAccess.memberVotes;
      targetVotes.forEach(vote => {
        if(includes(vote.voteId, voteIds)) {
          expect(vote.rationale).to.equal(rationale);
          expect(vote.vote).to.equal(voteDecision);
          expect(vote.updateDate).to.equal(date);
        }
      });
    });
  });
});