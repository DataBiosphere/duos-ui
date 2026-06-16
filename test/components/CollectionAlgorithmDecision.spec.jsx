import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import CollectionAlgorithmDecision from 'src/components/CollectionAlgorithmDecision'
import { formatDate } from 'src/libs/utils'

describe('CollectionAlgorithmDecision component', () => {
  it('renders a container with an id', () => {
    const id = 1
    const props = {
      algorithmResult: { id },
    }
    const { container } = render(<CollectionAlgorithmDecision {...props} />)

    expect(container.querySelector(`#collection-algorithm-id-${id}`)).not.toBeNull()
  })

  it('renders the decision label', () => {
    const id = 1
    const props = {
      algorithmResult: {
        result: 'No',
        id,
      },
    }
    const { container } = render(<CollectionAlgorithmDecision {...props} />)

    const decisionLabel = container.querySelector(`#collection-${id}-decision-label`)
    expect(decisionLabel).not.toBeNull()
    expect(decisionLabel.textContent).toContain('Decision:')
  })

  it('renders the date label', () => {
    const id = 1
    const props = {
      algorithmResult: {
        result: 'No',
        id,
      },
    }
    const { container } = render(<CollectionAlgorithmDecision {...props} />)

    const dateLabel = container.querySelector(`#collection-${id}-date-label`)
    expect(dateLabel).not.toBeNull()
    expect(dateLabel.textContent).toContain('Date:')
  })

  it('renders the component subtitle', () => {
    const id = 1
    const props = {
      algorithmResult: {
        result: 'No',
        id,
      },
    }
    const { container } = render(<CollectionAlgorithmDecision {...props} />)

    const subtitle = container.querySelector(`#collection-${id}-subtitle`)
    expect(subtitle).not.toBeNull()
    expect(subtitle.textContent).toContain('DUOS Algorithm Decision')
  })

  it('renders "N/A" if no result is provided', () => {
    const id = 1
    const props = {
      algorithmResult: {
        result: undefined,
        id,
      },
    }
    const { container } = render(<CollectionAlgorithmDecision {...props} />)

    const decisionValue = container.querySelector(`#collection-${id}-decision-value`)
    expect(decisionValue).not.toBeNull()
    expect(decisionValue.textContent).toContain('N/A')
  })

  it('renders "YES" if provided by algorithmResult', () => {
    const id = 1
    const props = {
      algorithmResult: {
        result: 'Yes',
        id,
      },
    }
    const { container } = render(<CollectionAlgorithmDecision {...props} />)

    const decisionValue = container.querySelector(`#collection-${id}-decision-value`)
    expect(decisionValue).not.toBeNull()
    expect(decisionValue.textContent).toContain('YES')
  })

  it('renders "NO" if provided by algorithmResult', () => {
    const id = 1
    const props = {
      algorithmResult: {
        result: 'No',
        id,
      },
    }
    const { container } = render(<CollectionAlgorithmDecision {...props} />)

    const decisionValue = container.querySelector(`#collection-${id}-decision-value`)
    expect(decisionValue).not.toBeNull()
    expect(decisionValue.textContent).toContain('NO')
  })

  it('renders createDate if provided by algorithmResult', () => {
    const createDate = new Date()
    const expectedDate = formatDate(createDate)
    const id = 1
    const props = {
      algorithmResult: {
        result: 'No',
        id,
        createDate,
      },
    }
    const { container } = render(<CollectionAlgorithmDecision {...props} />)

    const dateValue = container.querySelector(`#collection-${id}-date-value`)
    expect(dateValue).not.toBeNull()
    expect(dateValue.textContent).toContain(expectedDate)
  })

  it('renders "N/A if createDate is not provided by algorithmResult', () => {
    const id = 1
    const props = {
      algorithmResult: {
        result: 'No',
        id,
      },
    }
    const { container } = render(<CollectionAlgorithmDecision {...props} />)

    const dateValue = container.querySelector(`#collection-${id}-date-value`)
    expect(dateValue).not.toBeNull()
    expect(dateValue.textContent).toContain('N/A')
  })
})
