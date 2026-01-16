import React, { useCallback, useEffect, useState } from 'react'
import SimpleTable from '../SimpleTable'
import { Styles } from 'src/libs/theme'
import { formatDate, sortVisibleTable } from '../../libs/utils'
import { ElectionWithMemberVotes, Vote } from 'src/types/model'
import { ExpandMore, ExpandLess } from '@mui/icons-material'
import VoteSummaryTable from '../vote_summary_table/VoteSummaryTable'

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

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.4rem',
    fontWeight: 400,
    color: '#333F52',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    padding: '1rem 2%',
    lineHeight: '2rem',
    justifyContent: 'space-between',
    alignItems: 'center',
    whiteSpace: 'pre-line',
  },
  columnStyle: {
    ...Styles.TABLE.HEADER_ROW,
    ...{
      fontFamily: 'Montserrat',
      fontSize: '1.4rem',
      color: '#333F52',
      justifyContent: 'space-between',
    },
  },
  containerOverride: {
    marginTop: '0',
    borderTop: '0',
    backgroundColor: 'rgba(184, 205, 211, 0)',
    padding: '0',
  },
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
  const [sortedElections, setSortedElections] = useState<RowData[][]>([])
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

  const showMemberVoteDropdownWrapper = useCallback(({ renderedRow, rowData }: { renderedRow: React.ReactNode, rowData: TableData[] }) => {
    const electionId = rowData[0].electionId ?? -1
    if (electionIsExpanded(electionId)) {
      return (
        <div key={`expanded-${electionId}`}>
          {renderedRow}
          <div style={{ width: '80%', margin: 'auto' }}>
            <VoteSummaryTable
              isChair={false}
              isLoading={false}
              dacVotes={rowData[0].memberVotes || []}
            />
          </div>
        </div>
      )
    }
    return renderedRow
  }, [electionIsExpanded])

  useEffect(() => {
    setSortedElections(sortVisibleTable({
      list: processElectionRowData(electionsWithMemberVotes),
      sort,
    }))
  }, [sort, electionsWithMemberVotes, processElectionRowData])

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
