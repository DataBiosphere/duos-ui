import React, { useState } from 'react'
import './VotingHistoryOverview.css'

type Dar = {
  referenceId: string
  piName: string
  institution: string
  status: string
}

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
  dar: Dar
  votes: Vote[]
}

const VotingHistoryOverview: React.FC<VotingHistoryOverviewProps> = ({ dar, votes }) => {
  const [showFullRationale, setShowFullRationale] = useState<boolean>(false)

  const handleRationaleClick = () => setShowFullRationale(!showFullRationale)

  return (
    <div className="voting-history-container">
      <h3 className="voting-history-title">Voting History</h3>
      <div className="dar-overview">
        <strong>Application/DAR Overview</strong>
        <div>
          <strong>Application/DAR ID:</strong> {dar.referenceId}
        </div>
        <div>
          <strong>Applicant:</strong> {dar.piName} ({dar.institution})
        </div>
        <div>
          <strong>Current Status:</strong> {dar.status}
        </div>
      </div>
      <h4 className="voting-history-subtitle">DAR and Progress Report Voting History</h4>
      <table className="voting-history-table">
        <thead>
          <tr>
            <th scope="col">
              Dataset Name
              <br />
              <small className="header-subtext">Name of the dataset voted on</small>
            </th>
            <th scope="col">
              Vote Date
              <br />
              <small className="header-subtext">Date the vote occurred</small>
            </th>
            <th scope="col">
              Request Type
              <br />
              <small className="header-subtext">Type of data access request</small>
            </th>
            <th scope="col">
              Linked DAR ID
              <br />
              <small className="header-subtext">Reference to related DAR</small>
            </th>
            <th scope="col">
              Vote Result
              <br />
              <small className="header-subtext">Decision and rationale</small>
            </th>
            <th scope="col">
              Status
              <br />
              <small className="header-subtext">Current vote status</small>
            </th>
          </tr>
        </thead>
        <tbody>
          {votes.map((vote, idx) => (
            <tr key={'id_' + idx}>
              <td>{vote.datasetName}</td>
              <td>{vote.voteDate}</td>
              <td>{vote.requestType}</td>
              <td>
                <a href={`/dar_application_review/${vote.linkedDarId}`} target="_blank" rel="noopener noreferrer">
                  {dar.referenceId}
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
                    className="btn-link rationale-btn"
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
