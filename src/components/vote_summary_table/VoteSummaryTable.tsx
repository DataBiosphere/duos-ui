import React, { useCallback, useState } from 'react'
import SimpleTable from '../SimpleTable'
import { Styles } from 'src/libs/theme'
import { isEmpty, isNil } from 'src/utils/NodashUtil'
import { formatDate, Notifications, sortVisibleTable, TableCell } from 'src/libs/utils'
import { Email } from 'src/libs/ajax/Email'

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
    whiteSpace: 'pre-line' as const,
  },
  columnStyle: {
    ...Styles.TABLE.HEADER_ROW, fontFamily: 'Montserrat',
    fontSize: '1.4rem',
    color: '#333F52',
    justifyContent: 'space-between',
  },
  cellWidths: {
    vote: '10%',
    name: '15%',
    date: '10%',
    rationale: '50%',
  },
  containerOverride: {
    marginTop: '0',
    borderTop: '0',
    backgroundColor: 'rgba(184, 205, 211, 0)',
    padding: '0',
  },
}

const columnHeaderFormat = {
  vote: { label: 'Vote', cellStyle: { width: styles.cellWidths.vote }, sortable: true },
  name: { label: 'Name', cellStyle: { width: styles.cellWidths.name }, sortable: true },
  date: { label: 'Date', cellStyle: { width: styles.cellWidths.date }, sortable: true },
  rationale: { label: 'Rationale', cellStyle: { width: styles.cellWidths.rationale }, sortable: true },
}

const ReminderStates = {
  SENT: 'sent',
  SENDING: 'sending',
} as const

type ReminderState = typeof ReminderStates[keyof typeof ReminderStates] | undefined

export interface DacVoteRow {
  vote?: boolean
  displayName: string
  voteId: number
  lastUpdated?: string | null
  rationale?: string | null
  updateDate?: string | number
}

interface VoteSummaryTableProps {
  dacVotes?: DacVoteRow[]
  isLoading?: boolean
  isChair?: boolean
  adminPage?: boolean
}

interface SortConfig {
  colIndex: number
  dir: number
}

const columnHeaderData = () => {
  const { vote, name, date, rationale } = columnHeaderFormat
  return [vote, name, date, rationale]
}

const processVoteSummaryRowData = ({
  dacVotes,
  isChair,
  getReminderSentState,
  sendReminder,
}: {
  dacVotes?: DacVoteRow[]
  isChair: boolean
  getReminderSentState: (voteId: number) => ReminderState
  sendReminder: (voteId: number) => void
}): TableCell[][] => {
  if (!isNil(dacVotes)) {
    return dacVotes.map((dacVote) => {
      const { vote, displayName, voteId, lastUpdated, rationale } = dacVote
      return [
        voteCellData({
          vote,
          voteId,
          reminderSentState: getReminderSentState(voteId),
          sendReminder: () => sendReminder(voteId),
          isChair,
        }),
        nameCellData({ name: displayName, voteId }),
        dateCellData({ date: lastUpdated ?? formatDate(dacVote.updateDate), voteId }),
        rationaleCellData({ rationale, voteId }),
      ]
    })
  }
  return []
}

const voteToString = (vote?: boolean): string => {
  if (isNil(vote)) return '- -'
  return vote ? 'Yes' : 'No'
}

const reminderLink = ({ reminderSentState, sendReminder }: { reminderSentState: ReminderState, sendReminder: () => void }): React.ReactNode => {
  switch (reminderSentState) {
    case ReminderStates.SENDING:
      return <p style={{ fontStyle: 'italic' }}>Sending...</p>
    case ReminderStates.SENT:
      return <p style={{ fontStyle: 'italic', color: 'green' }}>Sent Reminder</p>
    default:
      return (
        <button type="button" onClick={() => sendReminder()} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit' }}>
          Send Reminder
        </button>
      )
  }
}

function voteCellData({ vote, voteId, isChair, reminderSentState, sendReminder, label = 'vote' }: {
  vote?: boolean
  voteId: number
  isChair: boolean
  reminderSentState: ReminderState
  sendReminder: () => void
  label?: string
}): TableCell {
  const data = (
    isChair && (isNil(vote) || isNil(voteId))
      ? reminderLink({ reminderSentState, sendReminder })
      : voteToString(vote)
  )
  let value: string
  if (isNil(vote)) {
    value = '-'
  }
  else {
    value = vote ? 'Yes' : 'No'
  }

  return {
    data,
    value,
    id: voteId,
    cellStyle: { width: styles.cellWidths.vote },
    label,
  }
}

function nameCellData({ name = '- -', voteId, label = 'name' }: { name?: string, voteId: number, label?: string }): TableCell {
  return {
    data: name,
    id: voteId,
    cellStyle: { width: styles.cellWidths.name },
    label,
  }
}

function dateCellData({ date, voteId, label = 'date' }: { date: string | null | undefined, voteId: number, label?: string }): TableCell {
  return {
    data: date,
    id: voteId,
    cellStyle: { width: styles.cellWidths.date },
    label,
  }
}

function rationaleCellData({ rationale = '- -', voteId, label = 'rationale' }: { rationale?: string | null, voteId: number, label?: string }): TableCell {
  return {
    data: rationale ?? '- -',
    id: voteId,
    cellStyle: { width: styles.cellWidths.rationale },
    label,
  }
}

export default function VoteSummaryTable({ dacVotes, isLoading, isChair = false }: Readonly<VoteSummaryTableProps>) {
  const [sort, setSort] = useState<SortConfig>({ colIndex: 0, dir: -1 })
  const [visibleVotes, setVisibleVotes] = useState<TableCell[][]>([])
  const [tableSize, setTableSize] = useState(5)

  const [reminderSentState, setReminderSentState] = useState<Record<number, ReminderState>>({})

  const getReminderSentState = useCallback((voteId: number): ReminderState => {
    return reminderSentState[voteId]
  }, [reminderSentState])

  const updateReminderState = (voteId: number, sentState: ReminderState) => {
    setReminderSentState((state) => {
      return {
        ...state,
        [voteId]: sentState,
      }
    })
  }

  React.useEffect(() => {
    const sendReminder = (voteId: number) => {
      updateReminderState(voteId, ReminderStates.SENDING)

      Email.sendReminderEmail(voteId)
        .then(() => {
          Notifications.showSuccess({ text: 'Successfully sent reminder.' })
          updateReminderState(voteId, ReminderStates.SENT)
        })
        .catch(() => {
          Notifications.showError({ text: 'There was an issue sending the reminder. Please try again later.' })
          updateReminderState(voteId, undefined)
        })
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisibleVotes(
      sortVisibleTable({
        list: processVoteSummaryRowData({ dacVotes, isChair, getReminderSentState, sendReminder }),
        sort,
      }),
    )
    if (!isEmpty(dacVotes)) {
      setTableSize(dacVotes!.length)
    }
  }, [sort, dacVotes, isChair, getReminderSentState])

  return (
    <SimpleTable
      isLoading={isLoading}
      rowData={visibleVotes}
      columnHeaders={columnHeaderData()}
      tableSize={tableSize}
      styles={styles}
      sort={sort}
      onSort={setSort}
    />
  )
}
