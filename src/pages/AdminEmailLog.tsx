import React, { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import { Alert, Box, MenuItem, TextField } from '@mui/material'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { EmailLogTable } from 'src/components/email_log_table/EmailLogTable'
import { emailTypeLabel, emailTypeOptions, emailTypesMatching } from 'src/components/email_log_table/emailLogUtils'
import { DATE_FORMAT, isValidRange } from 'src/components/dar_analytics/darAnalyticsRange'
import SearchBar from 'src/components/SearchBar'
import TableHeaderSection from 'src/components/TableHeaderSection'
import { usePageTitle } from 'src/hooks/usePageTitle'
import { Email, EMAIL_LOG_LIMIT, EMAIL_LOG_SEARCH_MAX_LENGTH } from 'src/libs/ajax/Email'
import { Styles } from 'src/libs/theme'
import { Notifications } from 'src/libs/utils'

const ALL_TYPES = 'all'
const DEFAULT_RANGE_DAYS = 30

export const AdminEmailLog = function AdminEmailLog(): React.JSX.Element {
  usePageTitle('Email Log')
  const [from, setFrom] = useState(() => dayjs().subtract(DEFAULT_RANGE_DAYS - 1, 'day').format(DATE_FORMAT))
  const [to, setTo] = useState(() => dayjs().format(DATE_FORMAT))
  const [emailType, setEmailType] = useState<number | undefined>()
  const [search, setSearch] = useState('')
  // A date input reports every keystroke, so only a whole, ordered range replaces the one on show.
  const [range, setRange] = useState({ from, to })
  const valid = isValidRange(from, to)
  if (valid && (range.from !== from || range.to !== to)) {
    setRange({ from, to })
  }

  const { data, isFetching, isError, errorUpdatedAt, isPlaceholderData } = useQuery({
    queryKey: ['admin-email-log', range.from, range.to, search.trim()],
    // Consent searches every recipient, not just the 100 a send lists, so the search is its to run.
    queryFn: ({ signal }) => Email.getSendsByDateRange(range.from, range.to, search, emailTypesMatching(search), signal),
    // The last range stays on screen while the next loads, so the type filter isn't judged against nothing.
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    if (isError) {
      Notifications.showError({ text: 'Error: Unable to retrieve the email log from server' })
    }
  }, [isError, errorUpdatedAt])

  // A failed load lists nothing, rather than the last result under the new range or search.
  const sends = useMemo(() => (isError ? [] : data?.sends ?? []), [data, isError])
  // The chosen type stays listed while a search's results lack it, so the select never shows blank.
  const types = useMemo(() => {
    const options = emailTypeOptions(sends)
    return emailType === undefined || options.includes(emailType) ? options : [...options, emailType]
  }, [sends, emailType])
  // Cleared rather than hidden, so a later range can't revive a filter the select no longer shows.
  // Only a loaded new range clears it; a search narrowing the results keeps the type for when it's cleared.
  if (emailType !== undefined && data !== undefined && !isPlaceholderData && search.trim() === ''
    && !emailTypeOptions(sends).includes(emailType)) {
    setEmailType(undefined)
  }

  return (
    <div style={Styles.PAGE}>
      <div>
        <TableHeaderSection
          title="Email Log"
          description="Emails DUOS has sent, one row per send, with who received them and the DAR and datasets they concern"
        />
      </div>
      <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, marginLeft: 3 }}>
          <TextField
            label="From"
            type="date"
            size="small"
            value={from}
            onChange={event => setFrom(event.target.value)}
            error={!valid}
            helperText={valid ? undefined : 'Enter dates from 1900 on, with To on or after From'}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={to}
            onChange={event => setTo(event.target.value)}
            error={!valid}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            select
            label="Type of Email Sent"
            size="small"
            value={emailType ?? ALL_TYPES}
            onChange={event => setEmailType(event.target.value === ALL_TYPES ? undefined : Number(event.target.value))}
            sx={{ minWidth: '18rem' }}
          >
            <MenuItem value={ALL_TYPES}>All types</MenuItem>
            {types.map(type => (
              <MenuItem key={type} value={type}>{emailTypeLabel(type)}</MenuItem>
            ))}
          </TextField>
        </Box>
        <SearchBar
          handleSearchChange={setSearch}
          placeholder="Search type, recipient, DAR-ID or DUOS-ID"
          width="46ch"
          maxLength={EMAIL_LOG_SEARCH_MAX_LENGTH}
          style={{ width: 'auto' }}
        />
      </div>
      {!isError && data?.truncated && (
        <Alert severity="info" sx={{ marginTop: 2, marginLeft: 3 }}>
          {`Showing the newest ${EMAIL_LOG_LIMIT.toLocaleString()} sends. Narrow the dates to see the rest.`}
        </Alert>
      )}
      <EmailLogTable sends={sends} isLoading={isFetching} emailType={emailType} />
    </div>
  )
}

export default AdminEmailLog
