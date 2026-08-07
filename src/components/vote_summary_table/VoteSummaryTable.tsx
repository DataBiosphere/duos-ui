import React, { useCallback, useId, useMemo, useState } from 'react'
import { Tooltip as ReactTooltip } from 'react-tooltip'
import SimpleTable, { type CellData } from '../SimpleTable'
import { Styles } from 'src/libs/theme'
import { isEmpty, isNil } from 'src/utils/NodashUtil'
import { formatDate, Notifications } from 'src/libs/utils'
import { Email } from 'src/libs/ajax/Email'
import { ChatBubbleOutlineOutlined } from '@mui/icons-material'

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.25rem',
    fontWeight: 400,
    color: '#333F52',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    padding: '0.5rem 1%',
    lineHeight: '1.6rem',
    justifyContent: 'space-between',
    alignItems: 'center',
    whiteSpace: 'pre-line' as const,
  },
  columnStyle: {
    ...Styles.TABLE.HEADER_ROW, fontFamily: 'Montserrat',
    fontSize: '1.2rem',
    color: '#333F52',
    justifyContent: 'space-between',
  },
  cellWidths: {
    // Rationale is fixed-width (icon only, see below), so the remaining space is maximized for
    // vote/name/date to cut down on multi-line wrapping of names and dates.
    vote: '15%',
    name: '40%',
    date: '20%',
    // Rationale now only ever holds a small icon (see rationaleCellData below), so it just needs to
    // fit the "Rationale" header on one line rather than reserve room for long text.
    rationale: '6rem',
  },
  containerOverride: {
    marginTop: '0',
    borderTop: '0',
    backgroundColor: 'rgba(184, 205, 211, 0)',
    padding: '0',
  },
}

// Cells must be able to shrink and wrap below their content's natural width — otherwise long
// names/rationales refuse to shrink in a narrow container and visually spill over neighboring cells.
const wrapSafeCellStyle: React.CSSProperties = {
  minWidth: 0,
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
}

// The rationale column holds a fixed-size icon and a short "Rationale" header — it should never
// shrink narrower than that header text, nor wrap it to a second line. It's centered in its column
// and given extra right padding so it doesn't sit flush against the table's right edge.
const rationaleColumnStyle: React.CSSProperties = {
  width: styles.cellWidths.rationale,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  textAlign: 'center',
  paddingRight: '1rem',
}

const columnHeaderFormat = {
  vote: { label: 'Vote', cellStyle: { width: styles.cellWidths.vote, ...wrapSafeCellStyle } },
  name: { label: 'Name', cellStyle: { width: styles.cellWidths.name, ...wrapSafeCellStyle } },
  date: { label: 'Date', cellStyle: { width: styles.cellWidths.date, ...wrapSafeCellStyle } },
  rationale: { label: 'Rationale', cellStyle: rationaleColumnStyle },
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

const columnHeaderData = () => {
  const { vote, name, date, rationale } = columnHeaderFormat
  return [vote, name, date, rationale]
}

const processVoteSummaryRowData = ({
  dacVotes,
  isChair,
  getReminderSentState,
  sendReminder,
  rationaleTooltipId,
}: {
  dacVotes?: DacVoteRow[]
  isChair: boolean
  getReminderSentState: (voteId: number) => ReminderState
  sendReminder: (voteId: number) => void
  rationaleTooltipId: string
}): CellData[][] => {
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
        rationaleCellData({ rationale, voteId, tooltipId: rationaleTooltipId }),
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
}): CellData {
  const data = (
    isChair && (isNil(vote) || isNil(voteId))
      ? reminderLink({ reminderSentState, sendReminder })
      : voteToString(vote)
  )
  return { data, id: voteId, label, style: wrapSafeCellStyle }
}

function nameCellData({ name = '- -', voteId, label = 'name' }: { name?: string, voteId: number, label?: string }): CellData {
  return { data: name, id: voteId, label, style: wrapSafeCellStyle }
}

function dateCellData({ date, voteId, label = 'date' }: { date: string | null | undefined, voteId: number, label?: string }): CellData {
  return { data: date ?? '- -', id: voteId, label, style: wrapSafeCellStyle }
}

function rationaleCellData({ rationale, voteId, tooltipId, label = 'rationale' }: { rationale?: string | null, voteId: number, tooltipId: string, label?: string }): CellData {
  const hasRationale = !isNil(rationale) && rationale.trim().length > 0
  const data = hasRationale
    ? (
        <button
          type="button"
          data-tooltip-id={tooltipId}
          data-tooltip-content={rationale}
          aria-label={`Rationale: ${rationale}`}
          style={{ display: 'inline-flex', cursor: 'help', background: 'none', border: 'none', padding: 0 }}
        >
          <ChatBubbleOutlineOutlined style={{ fontSize: '1.6rem', color: '#0948B7' }} />
        </button>
      )
    : '- -'
  return { data, id: voteId, label, style: rationaleColumnStyle }
}

export default function VoteSummaryTable({ dacVotes, isLoading, isChair = false }: Readonly<VoteSummaryTableProps>) {
  const rationaleTooltipId = useId()
  const [reminderSentState, setReminderSentState] = useState<Record<number, ReminderState>>({})

  const getReminderSentState = useCallback((voteId: number): ReminderState => {
    return reminderSentState[voteId]
  }, [reminderSentState])

  const updateReminderState = useCallback((voteId: number, sentState: ReminderState) => {
    setReminderSentState((state) => {
      return {
        ...state,
        [voteId]: sentState,
      }
    })
  }, [])

  const visibleVotes = useMemo<CellData[][]>(() => {
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

    return processVoteSummaryRowData({ dacVotes, isChair, getReminderSentState, sendReminder, rationaleTooltipId })
  }, [dacVotes, isChair, getReminderSentState, updateReminderState, rationaleTooltipId])

  const tableSize = !isEmpty(dacVotes) ? dacVotes!.length : 5

  return (
    <>
      <SimpleTable
        isLoading={isLoading}
        rowData={visibleVotes}
        columnHeaders={columnHeaderData()}
        tableSize={tableSize}
        styles={styles}
      />
      <ReactTooltip id={rationaleTooltipId} place="top" className="tooltip-wrapper" />
    </>
  )
}
