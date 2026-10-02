import React, { useEffect, useRef, useState } from 'react'
import { Box, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { MetricsBucket } from 'src/types/darMetrics'
import { BUCKETS, DarAnalyticsRange, isValidRange } from 'src/components/dar_analytics/darAnalyticsRange'

interface DarAnalyticsControlsProps {
  range: DarAnalyticsRange
  onChange: (change: Partial<DarAnalyticsRange>) => void
}

// A date input reports every keystroke, so typing a year passes through years like 0002.
const DATE_SETTLE_MS = 400

const controlsStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  gap: '1rem',
  mt: '1.5rem',
}

/** Holds the dates locally so a half-typed or inverted range never reaches the reports. */
export const DarAnalyticsControls = ({ range, onChange }: DarAnalyticsControlsProps) => {
  const [from, setFrom] = useState(range.from)
  const [to, setTo] = useState(range.to)
  const settle = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Back and Forward change the range without remounting; show the dates the reports now use.
  const [shownRange, setShownRange] = useState(`${range.from}|${range.to}`)
  if (shownRange !== `${range.from}|${range.to}`) {
    setShownRange(`${range.from}|${range.to}`)
    setFrom(range.from)
    setTo(range.to)
  }
  useEffect(() => clearTimeout(settle.current), [range.from, range.to])
  useEffect(() => () => clearTimeout(settle.current), [])

  const valid = isValidRange(from, to)

  const updateDates = (nextFrom: string, nextTo: string) => {
    setFrom(nextFrom)
    setTo(nextTo)
    clearTimeout(settle.current)
    if (isValidRange(nextFrom, nextTo)) {
      settle.current = setTimeout(() => onChange({ from: nextFrom, to: nextTo }), DATE_SETTLE_MS)
    }
  }

  return (
    <Box sx={controlsStyle}>
      <TextField
        label="From"
        type="date"
        size="small"
        value={from}
        onChange={e => updateDates(e.target.value, to)}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <TextField
        label="To"
        type="date"
        size="small"
        value={to}
        onChange={e => updateDates(from, e.target.value)}
        error={!valid}
        helperText={valid ? undefined : 'Enter dates from 1900 on, with To on or after From'}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <ToggleButtonGroup
        aria-label="Group by"
        size="small"
        exclusive
        value={range.bucket}
        onChange={(_e, bucket: MetricsBucket | null) => bucket && onChange({ bucket })}
      >
        {BUCKETS.map(({ value, label }) => (
          <ToggleButton key={value} value={value}>{label}</ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  )
}
