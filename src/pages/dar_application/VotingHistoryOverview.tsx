import React, { useState } from 'react'

type VoteResult = {
  decision: string
  rationale: string
}

type Vote = {
  datasetName: string
  voteDate: string
  requestType: string
  linkedDarId: string
  voteResult: VoteResult
  status: string
}

type VotingHistoryOverviewProps = {
  votes: Vote[]
}

const VotingHistoryOverview: React.FC<VotingHistoryOverviewProps> = ({ votes }) => {
  const [showFullRationale, setShowFullRationale] = useState<boolean>(false)

  const handleRationaleClick = () => setShowFullRationale(!showFullRationale)

  return (
    <div>
      <h2><strong>Voting History</strong></h2>
      <div style={{ marginBottom: '1em' }}>
        <strong>Application/DAR Overview</strong>
        <div><strong>Application/DAR ID:</strong> DAR-001234</div>
        <div><strong>Applicant:</strong> Dr. Jane Doe (University Medical Center)</div>
        <div><strong>Current Status:</strong> Completed</div>
      </div>
      <h3><strong>DAR and Progress Report Voting History</strong></h3>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Dataset Name</th>
            <th>Vote Date</th>
            <th>Request Type</th>
            <th>Linked DAR ID</th>
            <th>Vote Result</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {votes.map((vote, idx) => (
            <tr key={'id_' + idx}>
              <td>{vote.datasetName}</td>
              <td>{vote.voteDate}</td>
              <td>{vote.requestType}</td>
              <td>
                <a href={`/dar_application/${vote.linkedDarId}`} target="_blank" rel="noopener noreferrer">
                  {vote.linkedDarId}
                </a>
              </td>
              <td>
                <div>
                  <strong>Decision:</strong> {vote.voteResult.decision}<br />
                  <strong>Rationale:</strong>{' '}
                  {showFullRationale
                    ? vote.voteResult.rationale
                    : `${vote.voteResult.rationale.substring(0, 80)}... `}
                  <button
                    type="button"
                    className="btn-link"
                    onClick={(e) => {
                      e.preventDefault()
                      handleRationaleClick()
                    }}
                  >
                    {showFullRationale ? 'Hide Rationale' : 'View Rationale'}
                  </button>
                </div>
              </td>
              <td>{vote.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default VotingHistoryOverview
