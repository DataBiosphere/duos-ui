import React from 'react'
import { formatDate } from 'src/libs/utils'
import { isEmpty, isNil } from 'src/utils/NodashUtil'
import { AlgorithmResult } from 'src/types/model'

interface CollectionAlgorithmDecisionProps {
  algorithmResult?: AlgorithmResult
  styleOverride?: React.CSSProperties
}

interface OtherResultProps {
  text: string
}

const YesResult = () => <span style={{ color: 'rgb(31,163,113)' }}><strong>YES</strong></span>

const NoResult = () => <span style={{ color: 'rgb(218,0,3)' }}><strong>NO</strong></span>

const AbstainResult = () => <span style={{ color: '#0948B7' }}><strong>ABSTAIN</strong></span>

const OtherResult = (otherResultProps: Readonly<OtherResultProps>) => {
  const { text } = otherResultProps
  return <span><strong>{text}</strong></span>
}

const getResult = (resultValue: string | undefined): React.ReactElement => {
  if (resultValue?.toLowerCase().trim() === 'abstain') {
    return <AbstainResult />
  }
  if (resultValue && resultValue.trim().length > 0) {
    switch (resultValue.toLowerCase().trim()) {
      case 'yes':
        return <YesResult />
      case 'no':
        return <NoResult />
      default:
    }
  }
  return <OtherResult text="N/A" />
}

export default function CollectionAlgorithmDecision(props: Readonly<CollectionAlgorithmDecisionProps>) {
  const { algorithmResult, styleOverride = {} } = props
  if (!algorithmResult) return null
  const { createDate, id, result, rationales = [] } = algorithmResult

  const containerProps = {
    id: `collection-algorithm-id-${id}`,
    style: {
      fontFamily: 'Montserrat',
      width: '100%',
      display: 'flex',
      flexDirection: 'column' as const,
      rowGap: '0.2rem',
      ...styleOverride,
    },
  }

  return (
    <div {...containerProps} data-cy="collection-algorithm-decision">
      <h5
        id={`collection-${id}-subtitle`}
        style={{
          fontFamily: 'Montserrat',
          fontWeight: 800,
          fontSize: 13,
          color: '#333F52',
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          margin: 0,
        }}
      >
        DUOS Algorithm Suggested Decision
      </h5>
      <div style={{ fontSize: '1.2rem' }}>
        <span id={`collection-${id}-decision-label`} style={{ paddingRight: '0.3rem', color: '#333F52' }}>Decision:</span>
        <span id={`collection-${id}-decision-value`} style={{ fontWeight: 400 }}>{getResult(result)}</span>
      </div>
      <div style={{ fontSize: '1.2rem' }}>
        <span id={`collection-${id}-reason-label`} style={{ paddingRight: '0.3rem', color: '#333F52' }}>Reason:</span>
        <span id={`collection-${id}-reason-value`} style={{ fontWeight: 400 }}>
          {isEmpty(rationales) ? 'N/A' : rationales.map(r => <p key={r} style={{ margin: 0 }}>{r}</p>)}
        </span>
      </div>
      <div style={{ fontSize: '1.2rem' }}>
        <span id={`collection-${id}-date-label`} style={{ paddingRight: '0.3rem', color: '#333F52' }}>Date:</span>
        <span id={`collection-${id}-date-value`} style={{ fontWeight: 400 }}>{isNil(createDate) ? 'N/A' : formatDate(createDate)}</span>
      </div>
    </div>
  )
}
