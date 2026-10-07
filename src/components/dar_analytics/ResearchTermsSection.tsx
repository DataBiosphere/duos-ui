import React from 'react'
import { Box, Typography } from '@mui/material'
import { Theme } from 'src/libs/theme'
import { DarMetrics } from 'src/libs/ajax/DarMetrics'
import { TermDarCount } from 'src/types/darMetrics'
import { AnalyticsSection } from 'src/components/dar_analytics/AnalyticsSection'
import { DarAnalyticsRange } from 'src/components/dar_analytics/darAnalyticsRange'
import { useDarMetricsReport } from 'src/components/dar_analytics/useDarMetricsReport'
import { descriptionStyle } from 'src/components/dashboard/dashboardStyles'

const TOP_TERMS = 10

const rowStyle = {
  display: 'grid',
  gridTemplateColumns: { xs: '2rem minmax(0, 1fr) 4rem', md: '2rem minmax(0, 2fr) minmax(0, 3fr) 4rem' },
  columnGap: '1rem',
  alignItems: 'center',
  py: '.6rem',
  borderBottom: '1px solid rgb(0 0 0 / 8%)',
}

/** `http://purl.obolibrary.org/obo/MONDO_0005015` → `MONDO:0005015`; any other id as it is. */
export const shortTermId = (id: string) => {
  const local = id.split('/').pop() ?? id
  return /^[A-Za-z]+_\w+$/.test(local) ? local.replace('_', ':') : id
}

const TermRow = ({ rank, term, max }: { rank: number, term: TermDarCount, max: number }) => {
  const label = term.label?.trim() || shortTermId(term.id)
  return (
    <Box component="li" sx={rowStyle}>
      <Typography sx={{ fontSize: '14px', fontWeight: 600, color: Theme.palette.secondary }}>{rank}</Typography>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: '14px', fontWeight: 600, color: Theme.palette.primary }} noWrap title={label}>
          {label}
        </Typography>
        {term.label?.trim() && (
          <Typography sx={{ ...descriptionStyle, fontSize: '12px' }} noWrap title={term.id}>{shortTermId(term.id)}</Typography>
        )}
      </Box>
      <Box sx={{ display: { xs: 'none', md: 'block' }, height: '.75rem', bgcolor: 'rgb(0 0 0 / 4%)', borderRadius: '4px' }} aria-hidden>
        <Box sx={{ width: `${(term.darCount / max) * 100}%`, height: '100%', bgcolor: Theme.palette.secondary, borderRadius: '4px' }} />
      </Box>
      <Typography sx={{ fontSize: '14px', textAlign: 'right' }}>
        {term.darCount}
        <span className="sr-only">{term.darCount === 1 ? ' DAR' : ' DARs'}</span>
      </Typography>
    </Box>
  )
}

export const ResearchTermsSection = ({ range }: { range: DarAnalyticsRange }) => {
  // Consent doesn't bucket this report, so a grouping change mustn't refetch it.
  const report = useDarMetricsReport('dar-terms', DarMetrics.getDarTerms, { from: range.from, to: range.to }, { limit: TOP_TERMS })
  const terms = report.data?.terms ?? []
  const max = Math.max(1, ...terms.map(({ darCount }) => darCount))
  // Terms cited by as many DARs share a rank.
  const rankOf = (darCount: number) => 1 + terms.filter(term => term.darCount > darCount).length

  return (
    <AnalyticsSection
      title="Research Terms"
      description={`Up to ${TOP_TERMS} ontology terms cited by the most DARs submitted in the range, from each DAR’s research use statement.`}
      caveats={[
        'Progress reports, and canceled or archived DARs, aren’t counted; a DAR counts once per term however often it cites it.',
        'Terms cited by as many DARs share a rank, and a tie at the last place shown can leave terms out.',
      ]}
      isLoading={report.isPending}
      isRefreshing={report.isPlaceholderData}
      error={report.error}
      isEmpty={terms.length === 0}
      emptyText="No DAR submitted in this range cited an ontology term."
    >
      <Box component="ol" aria-label="Most cited terms" sx={{ listStyle: 'none', p: 0, m: 0, maxWidth: '960px' }}>
        {terms.map(term => <TermRow key={term.id} rank={rankOf(term.darCount)} term={term} max={max} />)}
      </Box>
    </AnalyticsSection>
  )
}
