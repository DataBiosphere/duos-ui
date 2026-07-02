import React, { useMemo } from 'react'
import { Chart } from 'react-google-charts'
import { isNil, isEmpty, map } from 'src/utils/NodashUtil'
import { Vote } from 'src/types/model'

const pieSliceColors = {
  0: { color: '#1FA371' },
  1: { color: '#DA000E' },
  2: { color: '#979797' },
}

const getVoteLabel = (vote: boolean | undefined): string => {
  if (vote) return 'Yes'
  if (isNil(vote)) return 'Not Yet Voted'
  return 'No'
}

const processVotes = (votes: Vote[]) => {
  const headerData = ['Vote', 'Total Votes']
  const decisionMap: Record<string, number> = {
    'Yes': 0,
    'No': 0,
    'Not Yet Voted': 0,
  }

  votes.forEach((v) => {
    decisionMap[getVoteLabel(v.vote)]++
  })
  const decisionDataArray = map(decisionMap, (count, key) => [key, count])
  return [headerData, ...decisionDataArray]
}

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
  const processedVotes = useMemo(() => processVotes(votes), [votes])
  const options = {
    pieHole,
    is3d: false,
    fontName: 'Montserrat',
    pieSliceText: 'none',
    slices: pieSliceColors,
  }

  if (isEmpty(votes)) {
    return (
      <div style={style} className={`${keyString}-pie-chart-no-data`}>
        No data for
        {' '}
        {keyString}
      </div>
    )
  }
  return (
    <div style={{ ...style, ...styleOverride }}>
      <Chart
        chartType="PieChart"
        data={processedVotes}
        options={options}
        width={width}
        height={height}
      />
    </div>
  )
}
