import React from 'react'
import { describe, expect, it } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import DarSummaryCard from 'src/components/DarSummaryCard'
import { DatasetStatisticsDar } from 'src/types/model'

const day = (date: string) => new Date(`${date}T12:00:00`).getTime()
const shown = (date: string) => new Date(day(date)).toLocaleDateString()

const dar = (overrides: Partial<DatasetStatisticsDar> = {}): DatasetStatisticsDar => ({
  darCode: 'DAR-1',
  projectTitle: 'Synthetic project',
  updateDate: day('2026-01-01'),
  expired: false,
  referenceId: 'ref-1',
  nonTechRus: '',
  ...overrides,
})

/** Each label with its date, in the order the card lists them. */
const lifecycle = () =>
  screen.queryAllByRole('term').map(term => [term.textContent, term.nextElementSibling?.textContent])

describe('DarSummaryCard', () => {
  it('lists submission, approval, each renewal and the expiration in the order they happen', () => {
    render(
      <DarSummaryCard
        dar={dar({
          submissionDate: day('2024-01-10'),
          approvalDate: day('2024-01-20'),
          progressReportApprovalDates: [day('2025-01-15'), day('2026-01-12')],
          expirationDate: day('2027-01-05'),
        })}
      />,
    )

    expect(lifecycle()).toEqual([
      ['Submitted', shown('2024-01-10')],
      ['Approved', shown('2024-01-20')],
      ['Renewed', shown('2025-01-15')],
      ['Renewed', shown('2026-01-12')],
      ['Expires', shown('2027-01-05')],
    ])
    expect(screen.getByText('Current')).toBeInTheDocument()
  })

  it('says when an expired request expired', () => {
    render(<DarSummaryCard dar={dar({ expired: true, expirationDate: day('2025-03-01') })} />)

    expect(lifecycle()).toEqual([['Expired', shown('2025-03-01')]])
    expect(screen.getByText('Expired', { selector: '.MuiChip-label' })).toBeInTheDocument()
  })

  it('shows a closeout in place of the expiration it cut short', () => {
    render(
      <DarSummaryCard
        dar={dar({
          expired: true,
          submissionDate: day('2026-01-10'),
          expirationDate: day('2027-01-10'),
          closeoutDate: day('2026-06-01'),
        })}
      />,
    )

    expect(lifecycle()).toEqual([
      ['Submitted', shown('2026-01-10')],
      ['Closed out', shown('2026-06-01')],
    ])
    expect(screen.getByText('Closed out', { selector: '.MuiChip-label' })).toBeInTheDocument()
    expect(screen.queryByText('Expired')).not.toBeInTheDocument()
    expect(screen.queryByText('Expires')).not.toBeInTheDocument()
  })

  it('leaves off the dates consent does not send', () => {
    render(<DarSummaryCard dar={dar({ submissionDate: day('2026-01-10') })} />)

    expect(lifecycle()).toEqual([['Submitted', shown('2026-01-10')]])
  })

  it('shows no date list when consent sends no dates at all', () => {
    render(<DarSummaryCard dar={dar()} />)

    expect(lifecycle()).toEqual([])
    expect(screen.getByText('Current')).toBeInTheDocument()
  })

  it('leaves off a date consent sends in a form that cannot be shown', () => {
    const malformed = {
      submissionDate: '2026-01-10',
      approvalDate: null,
      progressReportApprovalDates: [day('2026-02-01'), 'soon', 8.64e15 + 1],
      expirationDate: Number.NaN,
      closeoutDate: 'never',
    } as unknown as Partial<DatasetStatisticsDar>

    render(<DarSummaryCard dar={dar(malformed)} />)

    expect(lifecycle()).toEqual([['Renewed', shown('2026-02-01')]])
    // A closeout date that cannot be read is not a closeout
    expect(screen.getByText('Current')).toBeInTheDocument()
    expect(screen.queryByText(/Invalid Date/)).not.toBeInTheDocument()
  })

  it('survives a renewal list that is not a list', () => {
    render(
      <DarSummaryCard
        dar={dar({ progressReportApprovalDates: 'none' as unknown as number[], expirationDate: day('2027-01-05') })}
      />,
    )

    expect(lifecycle()).toEqual([['Expires', shown('2027-01-05')]])
  })
})
