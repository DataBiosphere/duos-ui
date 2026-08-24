import React, { useMemo } from 'react'
import { isNil, isEmpty } from 'src/utils/NodashUtil'
import { Vote } from 'src/types/model'

// This chart must stay inline SVG with no chart library: the CSP allows
// scripts from 'self' only, so it cannot load a remote chart loader at runtime.
const VOTE_CATEGORIES = [
  { label: 'Yes', color: '#1FA371' },
  { label: 'No', color: '#DA000E' },
  { label: 'Not Yet Voted', color: '#979797' },
] as const

type VoteLabel = (typeof VOTE_CATEGORIES)[number]['label']

const VIEW_BOX_SIZE = 100
const CENTER = VIEW_BOX_SIZE / 2
const OUTER_RADIUS = CENTER

const getVoteLabel = (vote: boolean | undefined): VoteLabel => {
  if (vote) return 'Yes'
  if (isNil(vote)) return 'Not Yet Voted'
  return 'No'
}

const countVotes = (votes: Vote[]): Record<VoteLabel, number> => {
  const counts: Record<VoteLabel, number> = { 'Yes': 0, 'No': 0, 'Not Yet Voted': 0 }
  votes.forEach((v) => {
    counts[getVoteLabel(v.vote)]++
  })
  return counts
}

interface PieSlice {
  readonly label: VoteLabel
  readonly color: string
  readonly count: number
  readonly fraction: number
  readonly start: number
}

const toSlices = (counts: Record<VoteLabel, number>, total: number): PieSlice[] => {
  let start = 0
  return VOTE_CATEGORIES.flatMap(({ label, color }) => {
    const count = counts[label]
    if (count === 0) return []
    const fraction = count / total
    const slice = { label, color, count, fraction, start }
    start += fraction
    return [slice]
  })
}

// A point on a circle around CENTER; fraction 0 is 12 o'clock, clockwise.
const polarPoint = (radius: number, fraction: number): string => {
  const angle = 2 * Math.PI * fraction
  const x = CENTER + radius * Math.sin(angle)
  const y = CENTER - radius * Math.cos(angle)
  return `${x.toFixed(3)} ${y.toFixed(3)}`
}

const donutSlicePath = (start: number, end: number, innerRadius: number): string => {
  const largeArc = end - start > 0.5 ? 1 : 0
  return [
    `M ${polarPoint(OUTER_RADIUS, start)}`,
    `A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 ${largeArc} 1 ${polarPoint(OUTER_RADIUS, end)}`,
    `L ${polarPoint(innerRadius, end)}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${polarPoint(innerRadius, start)}`,
    'Z',
  ].join(' ')
}

const sliceTitle = (label: VoteLabel, count: number, fraction: number): string =>
  `${label}: ${count} (${Math.round(fraction * 100)}%)`

interface VotesPieChartProps {
  readonly votes?: Vote[]
  readonly keyString: string
  readonly pieHole?: number
  readonly height?: string
  readonly width?: string
  readonly style?: React.CSSProperties
  readonly styleOverride?: React.CSSProperties
}

export default function VotesPieChart({
  votes = [],
  keyString,
  pieHole = 0.3,
  height = 'inherit',
  width = '100%',
  style = { width: '70%' },
  styleOverride,
}: VotesPieChartProps) {
  const counts = useMemo(() => countVotes(votes), [votes])

  if (isEmpty(votes)) {
    return (
      <div style={style} className={`${keyString}-pie-chart-no-data`}>
        No data for
        {' '}
        {keyString}
      </div>
    )
  }

  const slices = toSlices(counts, votes.length)
  const innerRadius = OUTER_RADIUS * pieHole
  const summary = VOTE_CATEGORIES.map(({ label }) => `${counts[label]} ${label}`).join(', ')

  return (
    <div style={{ ...style, ...styleOverride }} className={`${keyString}-pie-chart`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '1.5rem 1rem', width, height }}>
        <svg
          viewBox={`0 0 ${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE}`}
          role="img"
          aria-label={`Vote summary: ${summary}`}
          style={{ width: '40%', maxWidth: '150px', flex: '0 0 auto' }}
        >
          {slices.length === 1
            ? (
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={(OUTER_RADIUS + innerRadius) / 2}
                  fill="none"
                  stroke={slices[0].color}
                  strokeWidth={OUTER_RADIUS - innerRadius}
                >
                  <title>{sliceTitle(slices[0].label, slices[0].count, 1)}</title>
                </circle>
              )
            : (
                slices.map(slice => (
                  <path
                    key={slice.label}
                    d={donutSlicePath(slice.start, slice.start + slice.fraction, innerRadius)}
                    fill={slice.color}
                  >
                    <title>{sliceTitle(slice.label, slice.count, slice.fraction)}</title>
                  </path>
                ))
              )}
        </svg>
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            fontFamily: 'Montserrat',
            fontSize: 13,
            fontWeight: 400,
            color: '#222222',
          }}
        >
          {slices.map(({ label, color }) => (
            <li key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                aria-hidden="true"
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: color,
                  display: 'inline-block',
                  flex: '0 0 auto',
                }}
              />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
