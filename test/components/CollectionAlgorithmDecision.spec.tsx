import React from 'react'
import { describe, it, expect } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import CollectionAlgorithmDecision from 'src/components/CollectionAlgorithmDecision'
import { formatDate } from 'src/libs/utils'

const id = '1'

describe('CollectionAlgorithmDecision component', () => {
  it('renders nothing when algorithmResult is not provided', () => {
    const { container } = render(<CollectionAlgorithmDecision />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a container with an id', () => {
    const { container } = render(<CollectionAlgorithmDecision algorithmResult={{ id, result: 'No' }} />)
    expect(container.querySelector(`#collection-algorithm-id-${id}`)).toBeInTheDocument()
  })

  it('renders the decision label', () => {
    const { container } = render(<CollectionAlgorithmDecision algorithmResult={{ result: 'No', id }} />)
    const decisionLabel = container.querySelector(`#collection-${id}-decision-label`) as HTMLElement
    expect(decisionLabel).toBeInTheDocument()
    expect(decisionLabel.textContent).toContain('Decision:')
  })

  it('renders the date label', () => {
    const { container } = render(<CollectionAlgorithmDecision algorithmResult={{ result: 'No', id }} />)
    const dateLabel = container.querySelector(`#collection-${id}-date-label`) as HTMLElement
    expect(dateLabel).toBeInTheDocument()
    expect(dateLabel.textContent).toContain('Date:')
  })

  it('renders the component subtitle', () => {
    const { container } = render(<CollectionAlgorithmDecision algorithmResult={{ result: 'No', id }} />)
    const subtitle = container.querySelector(`#collection-${id}-subtitle`) as HTMLElement
    expect(subtitle).toBeInTheDocument()
    expect(subtitle.textContent).toContain('DUOS Algorithm Suggested Decision')
  })

  it('renders "N/A" if result is an empty string', () => {
    const { container } = render(<CollectionAlgorithmDecision algorithmResult={{ result: '', id }} />)
    const decisionValue = container.querySelector(`#collection-${id}-decision-value`) as HTMLElement
    expect(decisionValue).toBeInTheDocument()
    expect(decisionValue.textContent).toContain('N/A')
  })

  it('renders an unrecognized result as given rather than as N/A', () => {
    const result = 'Unable to interpret the system match'
    const { container } = render(<CollectionAlgorithmDecision algorithmResult={{ result, id }} />)
    const decisionValue = container.querySelector(`#collection-${id}-decision-value`) as HTMLElement
    expect(decisionValue.textContent).toContain(result)
  })

  it('renders "YES" if provided by algorithmResult', () => {
    const { container } = render(<CollectionAlgorithmDecision algorithmResult={{ result: 'Yes', id }} />)
    const decisionValue = container.querySelector(`#collection-${id}-decision-value`) as HTMLElement
    expect(decisionValue).toBeInTheDocument()
    expect(decisionValue.textContent).toContain('YES')
  })

  it('renders "NO" if provided by algorithmResult', () => {
    const { container } = render(<CollectionAlgorithmDecision algorithmResult={{ result: 'No', id }} />)
    const decisionValue = container.querySelector(`#collection-${id}-decision-value`) as HTMLElement
    expect(decisionValue).toBeInTheDocument()
    expect(decisionValue.textContent).toContain('NO')
  })

  it('renders "ABSTAIN" if provided by algorithmResult', () => {
    const { container } = render(<CollectionAlgorithmDecision algorithmResult={{ result: 'Abstain', id }} />)
    const decisionValue = container.querySelector(`#collection-${id}-decision-value`) as HTMLElement
    expect(decisionValue).toBeInTheDocument()
    expect(decisionValue.textContent).toContain('ABSTAIN')
  })

  it('renders createDate if provided by algorithmResult', () => {
    const createDate = '2023-11-14'
    const expectedDate = formatDate(createDate)
    const { container } = render(<CollectionAlgorithmDecision algorithmResult={{ result: 'No', id, createDate }} />)
    const dateValue = container.querySelector(`#collection-${id}-date-value`) as HTMLElement
    expect(dateValue).toBeInTheDocument()
    expect(dateValue.textContent).toContain(expectedDate)
  })

  it('renders "N/A" if createDate is not provided by algorithmResult', () => {
    const { container } = render(<CollectionAlgorithmDecision algorithmResult={{ result: 'No', id }} />)
    const dateValue = container.querySelector(`#collection-${id}-date-value`) as HTMLElement
    expect(dateValue).toBeInTheDocument()
    expect(dateValue.textContent).toContain('N/A')
  })

  it('renders rationales when provided', () => {
    const { container } = render(
      <CollectionAlgorithmDecision algorithmResult={{ id, result: 'No', rationales: ['Reason A', 'Reason B'] }} />,
    )
    const reasonValue = container.querySelector(`#collection-${id}-reason-value`) as HTMLElement
    expect(reasonValue).toBeInTheDocument()
    expect(reasonValue.textContent).toContain('Reason A')
    expect(reasonValue.textContent).toContain('Reason B')
  })

  it('renders "N/A" for reason when rationales are empty', () => {
    const { container } = render(<CollectionAlgorithmDecision algorithmResult={{ id, result: 'No', rationales: [] }} />)
    const reasonValue = container.querySelector(`#collection-${id}-reason-value`) as HTMLElement
    expect(reasonValue).toBeInTheDocument()
    expect(reasonValue.textContent).toContain('N/A')
  })
})
