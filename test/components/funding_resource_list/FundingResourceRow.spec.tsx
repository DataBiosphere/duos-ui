import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FundingResource } from 'src/types/model'
import FundingResourceRow from 'src/components/funding_resource_list/FundingResourceRow'

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

describe('FundingResourceRow', () => {
  it('shows summary when not in edit mode and triggers editAction', async () => {
    const user = userEvent.setup()
    const editFn = vi.fn()
    const { container } = render(
      <FundingResourceRow
        id={0}
        editMode={false}
        fundingResource={sampleFunding}
        fundingResources={[sampleFunding]}
        columnsToShow={['funderName', 'projectTitle']}
        editAction={editFn}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        onFundingResourcesChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(screen.getByText(sampleFunding.funderName)).toBeInTheDocument()
    await user.click(container.querySelector('.glyphicon-pencil')!)
    expect(editFn).toHaveBeenCalledTimes(1)
  })

  it('renders edit form when editMode true', () => {
    const { container } = render(
      <FundingResourceRow
        id={0}
        editMode={true}
        fundingResource={sampleFunding}
        fundingResources={[sampleFunding]}
        columnsToShow={['funderName']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        onFundingResourcesChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(container.querySelector('#funderName')).toHaveValue(sampleFunding.funderName)
  })

  it('renders view form when viewMode true and is read-only', () => {
    const { container } = render(
      <FundingResourceRow
        id={0}
        editMode={false}
        viewMode={true}
        fundingResource={sampleFunding}
        fundingResources={[sampleFunding]}
        columnsToShow={['funderName']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        viewAction={vi.fn()}
        onFundingResourcesChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(container.querySelector('#funderName')).toHaveValue(sampleFunding.funderName)
    expect(container.querySelector('#funderName')).toBeDisabled()
    expect(container.querySelector('.collaborator-form-add-save-button')).not.toBeInTheDocument()
  })

  it('triggers viewAction when view button is clicked', async () => {
    const user = userEvent.setup()
    const viewFn = vi.fn()
    const { container } = render(
      <FundingResourceRow
        id={0}
        editMode={false}
        viewMode={false}
        fundingResource={sampleFunding}
        fundingResources={[sampleFunding]}
        columnsToShow={['funderName', 'projectTitle']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        viewAction={viewFn}
        onFundingResourcesChange={vi.fn()}
        disabled={false}
      />,
    )
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    expect(viewFn).toHaveBeenCalledTimes(1)
  })
})
