import React, { useState, useMemo } from 'react'
import SimpleTable from 'src/components/SimpleTable'
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

const headerStyle = {
  fontWeight: 600,
  fontSize: '1.1rem',
  background: '#f5f7fa',
  color: '#2a3b4d',
  padding: '8px 0',
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
}

const cellWrapStyle = {
  whiteSpace: 'normal',
  wordBreak: 'break-word',
  overflowWrap: 'anywhere',
}

const styles = {
  baseStyle: { display: 'flex', alignItems: 'center', minHeight: 40, ...cellWrapStyle },
  columnStyle: { display: 'flex', background: '#f5f7fa', ...cellWrapStyle },
  containerOverride: { width: '100%', overflowX: 'visible' },
}

const VotingHistoryOverview: React.FC<VotingHistoryOverviewProps> = ({ dar, votes }) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const handleRationaleClick = (idx: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  const columnHeaders = useMemo(() => [
    { label: 'Dataset Name', cellStyle: { ...headerStyle, width: 200 } },
    { label: 'Vote Date', cellStyle: { ...headerStyle, width: 180 } },
    { label: 'Request Type', cellStyle: { ...headerStyle, width: 160 } },
    { label: 'Linked DAR ID', cellStyle: { ...headerStyle, width: 140 } },
    { label: 'Vote Result', cellStyle: { ...headerStyle, width: 400 } },
    { label: 'Status', cellStyle: { ...headerStyle, width: 180 } },
  ], [])

  const rowData = votes.map((vote, idx) => [
    { data: vote.datasetName },
    { data: vote.voteDate },
    { data: vote.requestType },
    {
      data: (
        <a href={`/dar_application_review/${vote.linkedDarId}`} target="_blank" rel="noopener noreferrer">
          {dar.referenceId}
        </a>
      ),
    },
    {
      data: (
        <div>
          <strong>Decision:</strong> {vote.voteResult.decision}
          <br />
          <strong>Rationale:</strong>{' '}
          {expandedRows.has(idx)
            ? vote.voteResult.rationale
            : `${vote.voteResult.rationale.substring(0, 20)}... `}
          <button
            type="button"
            className="btn-link rationale-btn"
            onClick={(e) => {
              e.preventDefault()
              handleRationaleClick(idx)
            }}
          >
            {expandedRows.has(idx) ? 'Hide Rationale' : 'View Rationale'}
          </button>
        </div>
      ),
    },
    { data: vote.status },
  ])

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
      <SimpleTable
        className="voting-history-table"
        rowData={rowData}
        columnHeaders={columnHeaders}
        styles={styles}
        tableSize={rowData.length}
        isLoading={false}
      />
    </div>
  )
}

export default VotingHistoryOverview
