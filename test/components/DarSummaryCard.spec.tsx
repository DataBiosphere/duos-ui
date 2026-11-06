import React from 'react'
import { describe, expect, it } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import DarSummaryCard from 'src/components/DarSummaryCard'
import { DatasetStatisticsDar } from 'src/types/model'

const day = (iso: string) => Date.parse(`${iso}T12:00:00Z`)
const shown = (iso: string) => new Date(day(iso)).toLocaleDateString()

const dar = (overrides: Partial<DatasetStatisticsDar> = {}): DatasetStatisticsDar => ({
  updateDate: day('2026-01-01'),
  projectTitle: 'Cancer genomics',
  darCode: 'DAR-1',
  nonTechRus: '',
  referenceId: 'dar-1',
  expired: false,
  submissionDate: day('2025-01-10'),
  ...overrides,
})

describe('DarSummaryCard', () => {
  it('lists the approval, each renewal and the closeout after submission, in place of an expiration', () => {
    render(
      <DarSummaryCard dar={dar({
        approvalDate: day('2025-02-01'),
        progressReportApprovalDates: [day('2026-01-15'), day('2026-06-15')],
        expirationDate: day('2027-06-15'),
        closeoutDate: day('2026-09-01'),
      })}
      />,
    )

    expect(screen.getAllByRole('listitem').map(item => item.textContent)).toEqual([
      `Submitted ${shown('2025-01-10')}`,
      `Approved ${shown('2025-02-01')}`,
      `Renewed ${shown('2026-01-15')}, ${shown('2026-06-15')}`,
      `Closed out ${shown('2026-09-01')}`,
    ])
    expect(screen.getByText('Closed out')).toBeInTheDocument()
  })

  it('dates a current DAR\'s coming expiration', () => {
    render(<DarSummaryCard dar={dar({ approvalDate: day('2026-02-01'), expirationDate: day('2027-02-01') })} />)

    expect(screen.getByText(`Expires ${shown('2027-02-01')}`)).toBeInTheDocument()
    expect(screen.getByText('Current')).toBeInTheDocument()
  })

  it('dates an expired DAR\'s expiration', () => {
    render(<DarSummaryCard dar={dar({ expired: true, expirationDate: day('2026-02-01') })} />)

    expect(screen.getByText(`Expired ${shown('2026-02-01')}`)).toBeInTheDocument()
    expect(screen.getByText('Expired')).toBeInTheDocument()
  })

  it('shows only the submission until consent sends the other dates', () => {
    render(<DarSummaryCard dar={dar({ submissionDate: undefined, progressReportApprovalDates: [] })} />)

    expect(screen.getAllByRole('listitem').map(item => item.textContent)).toEqual(['Submitted date not available'])
    expect(screen.getByText('Current')).toBeInTheDocument()
  })

  it('marks an expired DAR that was not closed out as expired', () => {
    render(<DarSummaryCard dar={dar({ expired: true })} />)

    expect(screen.getByText('Expired')).toBeInTheDocument()
  })
})
