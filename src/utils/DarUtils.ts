import { Election } from "src/types/model";

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
