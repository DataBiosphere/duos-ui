import React, { useMemo, useState } from 'react'
import SimpleTable from '../SimpleTable'
import { VoteHistoryRow } from 'src/types/model'
import { formatDate, sortVisibleTable } from 'src/libs/utils'
import { voteHistoryTableStyles } from './voteHistoryTableStyles'

interface ChairVoteHistoryTableProps {
  voteHistory: VoteHistoryRow[]
}

interface RowData {
  data: string
  cellStyle: React.CSSProperties
  label: string
  id: number | string
}

const styles = voteHistoryTableStyles

const getVoteText = (vote: boolean | null | undefined) => {
  if (vote === true) return 'Yes'
  if (vote === false) return 'No'
  return '--'
}

const processVoteHistoryRowData = (voteHistory: VoteHistoryRow[]) => {
  if (!voteHistory) return []

  return voteHistory.map((row: VoteHistoryRow, i) => [
    {
      data: row.progressReport ? 'Progress Report' : 'Initial DAR',
      cellStyle: { width: '15%' },
      label: 'Request Type',
      id: i,
    },
    { data: row.datasetIdentifier, cellStyle: { width: '20%' }, label: 'Dataset ID', id: i },
    { data: formatDate(row.electionDate), cellStyle: { width: '15%' }, label: 'Election Date', id: i },
    { data: getVoteText(row.vote), cellStyle: { width: '10%' }, label: 'Vote', id: i },
    { data: row.displayName, cellStyle: { width: '15%' }, label: 'Name', id: i },
    { data: formatDate(row.updateDate), cellStyle: { width: '10%' }, label: 'Vote Date', id: i },
    { data: row.type, cellStyle: { width: '15%' }, label: 'Vote Type', id: i },
    { data: row.rationale || '--', cellStyle: { width: '15%' }, label: 'Rationale', id: i },
  ])
}

const ChairVoteHistoryTable: React.FC<ChairVoteHistoryTableProps> = ({ voteHistory }) => {
  const [sort, setSort] = useState({ colIndex: 5, dir: -1 }) // Default sort by voteDate descending

  const columnHeaderFormat = {
    requestType: { label: 'Request Type', cellStyle: { width: '15%' }, sortable: true },
    datasetIdentifier: { label: 'Dataset ID', cellStyle: { width: '20%' }, sortable: true },
    electionDate: { label: 'Election Date', cellStyle: { width: '15%' }, sortable: true },
    vote: { label: 'Vote', cellStyle: { width: '10%' }, sortable: true },
    name: { label: 'Name', cellStyle: { width: '15%' }, sortable: true },
    voteDate: { label: 'Vote Date', cellStyle: { width: '10%' }, sortable: true },
    voteType: { label: 'Vote Type', cellStyle: { width: '15%' }, sortable: true },
    rationale: { label: 'Rationale', cellStyle: { width: '15%' }, sortable: true },
  }

  const columnHeaderData = () => {
    const { requestType, datasetIdentifier, electionDate, vote, name, voteDate, voteType, rationale } = columnHeaderFormat
    return [requestType, datasetIdentifier, electionDate, vote, name, voteDate, voteType, rationale]
  }

  const sortedVotes = useMemo(
    () => sortVisibleTable({
      list: processVoteHistoryRowData(voteHistory),
      sort,
    }) as RowData[][],
    [sort, voteHistory],
  )

  return (
    <SimpleTable
      columnHeaders={columnHeaderData()}
      rowData={sortedVotes}
      styles={styles}
      sort={sort}
      onSort={setSort}
    />
  )
}

export default ChairVoteHistoryTable
