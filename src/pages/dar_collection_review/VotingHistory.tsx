import React from 'react'
import ChairVoteHistoryTable from 'src/components/vote_history_table/ChairVoteHistoryTable';
import VoteSummaryTable from 'src/components/vote_summary_table/VoteSummaryTable.jsx'
import { Styles } from 'src/libs/theme'
import {DarCollection, DataAccessRequest, Election, Vote, VoteHistoryRow} from 'src/types/model';

interface DarCollectionVoteSummaryProps {
    darCollection: DarCollection
    isLoading: boolean
    isAdmin: boolean
}

const styles = {
    baseStyle: {
        backgroundColor: '#FFFFFF',
        padding: '35px',
        whiteSpace: 'pre-line',
    },
    container: {
        ...Styles.PAGE,
        color: '#333F52',
    },
    tableSection: {
        marginBottom: '3rem',
    },
    tableTitle: {
        fontFamily: 'Montserrat',
        fontSize: '1.8rem',
        fontWeight: 600,
        color: '#333F52',
        marginBottom: '1rem',
        paddingBottom: '0.5rem',
        borderBottom: '2px solid #E0E6ED',
    },
    flexRowElement: {
        fontFamily: 'Montserrat',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        width: '49rem',
    },
    label: {
        fontWeight: 600,
        flex: 1,
        fontSize: '2rem',
    },
    value: {
        fontWeight: 400,
        flex: 2,
        fontSize: '2rem',
    },
    row: {
        width: '80%',
        display: 'flex',
        justifyContent: 'flex-start',
        marginBottom: '3rem',
        columnGap: '2rem',
    },
    title: {
        fontWeight: 800,
        fontSize: '2.7rem',
        margin: '1.5rem 0',
    }
}


const extractVotesByRole = (darCollection: DarCollection, isChair: boolean) => {
    if (!darCollection?.dars) {
        return []
    }

    const votesByRole: VoteHistoryRow[] = []

    Object.entries(darCollection.dars).forEach(([key, dar]: [string, DataAccessRequest]) => {
            Object.entries(dar.elections || {})
            .filter(([key, election]: [string, Election]) => election.electionType == 'DataAccess')
            .forEach(([key, election]: [string, Election]) => {
                Object.entries(election.votes || {}).forEach(([key, vote]: [string, Vote]) => {
                    if (isChairVote(vote) === isChair) {
                        votesByRole.push({
                            ...vote,
                            darTitle: dar.data.projectTitle,
                            progressReport: dar.progressReport,
                            electionDate: election.createDate,
                        })
                    }
                })
            })
        })

    return votesByRole
}

const isChairVote = (vote: Vote) => {
    return (vote.type === 'FINAL' || vote.type === 'RADAR_APPROVE') && vote.vote != null;
}

export default function DarCollectionVoteSummary({
                                                     darCollection,
                                                     isLoading = false
                                                 }: DarCollectionVoteSummaryProps) {
    const chairVotes = extractVotesByRole(darCollection, true)
    const memberVotes = extractVotesByRole(darCollection, false)
    

    return (
        <div style={styles.baseStyle}>
            <div>
                <div style={styles.title}>Votes</div>
            </div>

            <div style={styles.tableSection}>
                <div style={styles.tableTitle}>Chair Votes</div>
                <ChairVoteHistoryTable
                    voteHistory={chairVotes}
                />
            </div>

            <div style={styles.tableSection}>
                <div style={styles.tableTitle}>Member Votes</div>
                <VoteSummaryTable
                    dacVotes={memberVotes}
                    isLoading={isLoading}
                    isChair={false}
                />
            </div>
        </div>
    )
}