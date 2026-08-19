import React, { useCallback, useMemo, useState } from 'react'
import SimpleTable, { type CellData, type TableStyles } from '../SimpleTable'
import { formatDate, sortVisibleTable } from 'src/libs/utils'
import { ElectionWithMemberVotes, Vote } from 'src/types/model'
import { ExpandMore, ExpandLess } from '@mui/icons-material'
import VoteSummaryTable from '../vote_summary_table/VoteSummaryTable'
import { voteHistoryTableStyles, voteHistoryBaseStyle, voteHistoryColumnStyle, voteHistoryContainerOverride } from './voteHistoryTableStyles'

interface ElectionWithMemberVotesTableProps {
  electionsWithMemberVotes: ElectionWithMemberVotes[]
}

interface RowData {
  data: string
  cellStyle: React.CSSProperties
  label: string
  id: number
  electionId?: number
  memberVotes?: Vote[]
  onClick?: () => void
}

const styles = voteHistoryTableStyles

// Styling for the nested member-vote summary table shown when a row is expanded, matching
// the same Data-Library-like look as the parent table but at the summary table's smaller scale.
const memberVoteSummaryStyles: TableStyles = {
  baseStyle: { ...voteHistoryBaseStyle, fontSize: '1.25rem', padding: '0.5rem 1%', lineHeight: '1.6rem' },
  columnStyle: { ...voteHistoryColumnStyle, fontSize: '1.2rem' },
  containerOverride: voteHistoryContainerOverride,
}

const processVotesCast = (memberVotes: Vote[]) => {
  if (!memberVotes || memberVotes.length === 0) {
    return '0'
  }
  const total = memberVotes.length
  const cast = memberVotes.filter(v => v.vote !== null && v.vote !== undefined).length
  return `${cast}/${total}`
}

const processVoteSummary = (memberVotes: Vote[]) => {
  if (!memberVotes || memberVotes.length === 0
    || memberVotes.every(v => v.vote === null || v.vote === undefined)) {
    return 'No votes cast'
  }
  const positives = memberVotes.filter(v => v.vote === true).length
  const negatives = memberVotes.filter(v => v.vote === false).length
  return positives + ' Yes, ' + negatives + ' No'
}

interface TableData {
  data: string
  cellStyle?: React.CSSProperties
  label: string
  id: number
  electionId?: number
  memberVotes?: Vote[]
  onClick?: () => void
}

const ElectionWithMemberVotesTable: React.FC<ElectionWithMemberVotesTableProps> = ({ electionsWithMemberVotes }) => {
  const [expandedElections, setExpandedElections] = useState<Set<number>>(new Set())
  const [sort, setSort] = useState({ colIndex: 2, dir: -1 }) // Default sort by election date descending

  const toggleElectionExpansion = useCallback((electionId: number) => {
    const newExpanded = new Set(expandedElections)
    if (newExpanded.has(electionId)) {
      newExpanded.delete(electionId)
    }
    else {
      newExpanded.add(electionId)
    }
    setExpandedElections(newExpanded)
  }, [expandedElections])

  const electionIsExpanded = useCallback((electionId: number) => {
    return expandedElections.has(electionId)
  }, [expandedElections])

  const columnHeaderFormat = {
    requestType: { label: 'Request Type', cellStyle: { width: '15%' }, sortable: true },
    datasetIdentifier: { label: 'Dataset ID', cellStyle: { width: '20%' }, sortable: true },
    electionDate: { label: 'Election Date', cellStyle: { width: '15%' }, sortable: true },
    electionStatus: { label: 'Election Status', cellStyle: { width: '15%' }, sortable: true },
    votes: { label: 'Votes Cast', cellStyle: { width: '10%' }, sortable: true },
    voteSummary: { label: 'Vote Summary', cellStyle: { width: '20%' }, sortable: true },
  }

  const columnHeaderData = () => {
    const { requestType, datasetIdentifier, electionDate, electionStatus, votes, voteSummary } = columnHeaderFormat
    return [requestType, datasetIdentifier, electionDate, electionStatus, votes, voteSummary]
  }

  const processElectionRowData = useCallback((electionsWithMemberVotes: ElectionWithMemberVotes[]) => {
    if (!electionsWithMemberVotes) return []

    return electionsWithMemberVotes.map((election: ElectionWithMemberVotes, i) => {
      const ExpandComponent = electionIsExpanded(election.electionId) ? ExpandLess : ExpandMore
      return [
        { data: (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ExpandComponent
              id={`${election.electionId}_dropdown`}
              className={`sort-icon dar-expand-dropdown-arrow ${electionIsExpanded(election.electionId) ? 'sort-icon-up' : 'sort-icon-down'}`}
              onClick={() => toggleElectionExpansion(election.electionId)}
            />
            {election.progressReport ? 'Progress Report' : 'Initial DAR'}
          </div>
        ),
        cellStyle: { width: '10%' },
        label: 'Request Type',
        id: i,
        electionId: election.electionId,
        memberVotes: election.memberVotes,
        onClick: () => toggleElectionExpansion(election.electionId),
        },
        { data: election.datasetIdentifier, cellStyle: { width: '20%' }, label: 'Dataset ID', id: i },
        { data: formatDate(election.createDate), cellStyle: { width: '10%' }, label: 'Election Date', id: i },
        { data: election.status, cellStyle: { width: '10%' }, label: 'Election Status', id: i },
        { data: processVotesCast(election.memberVotes), cellStyle: { width: '10%' }, label: 'Votes', id: i },
        { data: processVoteSummary(election.memberVotes), cellStyle: { width: '40%' }, label: 'Vote Summary', id: i },
      ]
    })
  }, [electionIsExpanded, toggleElectionExpansion])

  const showMemberVoteDropdownWrapper = useCallback(({ renderedRow, rowData }: { renderedRow: React.ReactNode, rowData: CellData[] }) => {
    const firstData = rowData[0] as unknown as TableData
    const electionId = firstData.electionId ?? -1
    if (electionIsExpanded(electionId)) {
      return (
        <div key={`expanded-${electionId}`}>
          {renderedRow}
          <div style={{ width: '80%', margin: 'auto' }}>
            <VoteSummaryTable
              isChair={false}
              isLoading={false}
              dacVotes={firstData.memberVotes || []}
              styles={memberVoteSummaryStyles}
            />
          </div>
        </div>
      )
    }
    return renderedRow
  }, [electionIsExpanded])

  const sortedElections = useMemo(
    () => sortVisibleTable({
      list: processElectionRowData(electionsWithMemberVotes),
      sort,
    }) as RowData[][],
    [sort, electionsWithMemberVotes, processElectionRowData],
  )

  return (
    <SimpleTable
      columnHeaders={columnHeaderData()}
      rowData={sortedElections}
      styles={styles}
      rowWrapper={showMemberVoteDropdownWrapper}
      sort={sort}
      onSort={setSort}
    />
  )
}

export default ElectionWithMemberVotesTable
