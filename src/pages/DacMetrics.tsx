import React, { useState } from 'react'
import { MenuItem, TextField } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import MetricsPage from 'src/components/dar_analytics/MetricsPage'
import { DAC } from 'src/libs/ajax/DAC'
import { Storage } from 'src/libs/storage'
import { USER_ROLES } from 'src/libs/utils'
import { DAC_METRICS_TABS } from 'src/pages/admin_console/metricsTabs'

const DAC_ROLES = new Set<string>([USER_ROLES.chairperson, USER_ROLES.member])
const ALL_DACS = 'all'

const currentUserDacIds = (): number[] =>
  [...new Set((Storage.getCurrentUser().roles ?? [])
    .flatMap(role => (DAC_ROLES.has(role.name) && role.dacId !== undefined ? [role.dacId] : [])))]

// Unnamed, consent reads a chair's or member's current DACs, which roles stored at sign-in may lag;
// an admin would get every DAC, so theirs are named.
const scope = (selected: number | undefined, dacIds: number[], isAdmin: boolean) => {
  if (selected !== undefined) {
    return [selected]
  }
  return isAdmin ? dacIds : undefined
}

export default function DacMetrics(): React.JSX.Element {
  const [dacIds] = useState(currentUserDacIds)
  const [isAdmin] = useState(() => Storage.getCurrentUser().isAdmin === true)
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = Number(searchParams.get('dac'))
  // A DAC the user isn't on, such as one from a shared link, falls back to all of theirs.
  const selected = dacIds.includes(requested) ? requested : undefined
  const { data: dacs } = useQuery({
    queryKey: ['dac-names'],
    queryFn: () => DAC.list(false),
    enabled: dacIds.length > 1,
  })
  const nameOf = (dacId: number) => dacs?.find(dac => dac.dacId === dacId)?.name ?? `DAC ${dacId}`

  const choose = (value: string) => {
    const next = new URLSearchParams(searchParams)
    if (value === ALL_DACS) {
      next.delete('dac')
    }
    else {
      next.set('dac', value)
    }
    setSearchParams(next, { replace: true })
  }

  const picker = dacIds.length > 1 && (
    <TextField
      select
      label="DAC"
      size="small"
      value={selected === undefined ? ALL_DACS : String(selected)}
      onChange={event => choose(event.target.value)}
      sx={{ minWidth: '16rem', mt: '1.5rem' }}
    >
      <MenuItem value={ALL_DACS}>All my DACs</MenuItem>
      {[...dacIds].sort((a, b) => nameOf(a).localeCompare(nameOf(b))).map(dacId => (
        <MenuItem key={dacId} value={String(dacId)}>{nameOf(dacId)}</MenuItem>
      ))}
    </TextField>
  )

  return (
    <MetricsPage
      tabs={DAC_METRICS_TABS}
      description="How data access requests for your DACs' datasets move through DUOS. The range and grouping apply to every tab."
      dacIds={scope(selected, dacIds, isAdmin)}
      scopeControl={picker}
      // Unnamed, an admin's reports would cover every DAC, so with no DAC to name there's nothing to show.
      unavailableText={dacIds.length === 0 ? 'You aren\'t a chair or member of any DAC, so there are no DAC metrics to show.' : undefined}
    />
  )
}
