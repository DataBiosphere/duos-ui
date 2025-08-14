import React from 'react'
import ChairVoteHistoryTable from 'src/components/vote_history_table/ChairVoteHistoryTable'
import ElectionWithMemberVotesTable from 'src/components/vote_history_table/ElectionWithMemberVotesTable'
import { Styles } from 'src/libs/theme'
import { DarCollection, DataAccessRequest, Election, ElectionWithMemberVotes, Vote, VoteHistoryRow } from 'src/types/model'

interface VotingHistoryProps {
  readonly darCollection: DarCollection
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
  },
}

const extractChairVotes = (darCollection: DarCollection) => {
  if (!darCollection?.dars) {
    return []
  }

  const votesByRole: VoteHistoryRow[] = []

  Object.values(darCollection.dars).forEach((dar: DataAccessRequest) => {
    Object.values(dar.elections ?? {})
      .filter((election: Election) => election.electionType == 'DataAccess')
      .forEach((election: Election) => {
        Object.values(election.votes ?? {}).forEach((vote: Vote) => {
          if (isChairVote(vote)) {
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

const extractElectionsWithMemberVotes = (darCollection: DarCollection) => {
  if (!darCollection?.dars) {
    return []
  }

  const dacMemberVotes: ElectionWithMemberVotes[] = []

  Object.values(darCollection.dars).forEach((dar: DataAccessRequest) => {
    Object.values(dar.elections ?? {})
      .filter((election: Election) => election.electionType == 'DataAccess')
      .forEach((election: Election) => {
        const electionWithMemberVotes: ElectionWithMemberVotes = {
          ...election,
          darTitle: dar.data.projectTitle,
          progressReport: dar.progressReport,
          memberVotes: [],
        }
        Object.values(election.votes ?? []).forEach((vote: Vote) => {
          if (vote.type === 'DAC') {
            electionWithMemberVotes.memberVotes.push(vote)
          }
        })
        dacMemberVotes.push(electionWithMemberVotes)
      })
  })

  return dacMemberVotes
}

const isChairVote = (vote: Vote) => {
  return (vote.type === 'FINAL' || vote.type === 'RADAR_APPROVE') && vote.vote != null
}

export default function VotingHistory({ darCollection }: VotingHistoryProps) {
  const chairVotes: VoteHistoryRow[] = extractChairVotes(darCollection)
  const memberVotes: ElectionWithMemberVotes[] = extractElectionsWithMemberVotes(darCollection)

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
        <ElectionWithMemberVotesTable
          electionsWithMemberVotes={memberVotes}
        />
      </div>
    </div>
  )
}
