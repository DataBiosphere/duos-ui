import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FundingResource } from 'src/types/model'
import FundingResourceSummary from 'src/components/funding_resource_list/FundingResourceSummary'

const sampleFunding: FundingResource = {
  fundingId: 'f1',
  studyId: 's1',
  funderName: 'Funder A',
  funderProgram: 'Program Z',
  grantNumber: 'GN12345',
  projectTitle: 'Project Alpha',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  url: 'https://example.org',
  tags: ['tag1', 'tag2'],
}

describe('FundingResourceSummary', () => {
  it('renders columns including arrays and url', () => {
    const { container } = render(
      <FundingResourceSummary
        fundingResource={sampleFunding}
        columnsToShow={['funderName', 'funderProgram', 'projectTitle', 'url', 'tags']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        disabled={false}
      />,
    )
    expect(screen.getByText(sampleFunding.funderName)).toBeInTheDocument()
    expect(screen.getByText(sampleFunding.funderProgram)).toBeInTheDocument()
    expect(screen.getByText(sampleFunding.projectTitle)).toBeInTheDocument()
    expect(screen.getByText('tag1, tag2')).toBeInTheDocument()
    expect(container.querySelector('a[href="https://example.org"]')).toBeInTheDocument()
  })

  it('renders view button and triggers viewAction', async () => {
    const user = userEvent.setup()
    const viewFn = vi.fn()
    const { container } = render(
      <FundingResourceSummary
        fundingResource={sampleFunding}
        columnsToShow={['funderName']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        viewAction={viewFn}
        disabled={false}
      />,
    )
    expect(container.querySelector('.glyphicon-eye-open')).toBeInTheDocument()
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    expect(viewFn).toHaveBeenCalledTimes(1)
  })
})
