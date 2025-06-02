import { Election } from "src/types/model";

export function getApprovedElectionDatasetIds(elections: Array<Election>) : Array<number> {

    console.log('elections', elections);

    const approvedDatasetIds = [];
    for (const election of elections) {
        if (election.electionType === 'DataAccess') {
            const votes = Object.values(election.votes);
            const anyApprovedVotes = votes.some(vote => vote.type === 'FINAL' && vote.vote);
            if (anyApprovedVotes) {
                approvedDatasetIds.push(election.datasetId);
            }
        }
    }
    return approvedDatasetIds;
}
