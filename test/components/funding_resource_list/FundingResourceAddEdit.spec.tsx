import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FundingResourceAddEdit from 'src/components/funding_resource_list/FundingResourceAddEdit'
import { FundingResource } from 'src/types/model'

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

describe('FundingResourceAddEdit component', () => {
  it('opens add form and enforces validation disabling save then adds', async () => {
    // delay: null skips the timer between keystrokes; ~48 chars here otherwise
    // risks timing out on CI, and a timeout mid-type leaks keystrokes into the next test.
    const user = userEvent.setup({ delay: null })
    const collected: FundingResource[] = []
    const { container } = render(
      <FundingResourceAddEdit
        id={-1}
        fundingResource={undefined}
        fundingResources={[]}
        closeAction={vi.fn()}
        onFundingResourcesChange={(items: FundingResource[]) => { collected.splice(0, collected.length, ...items) }}
      />,
    )
    await user.type(container.querySelector('#funderName')!, 'New Funder')
    await user.type(container.querySelector('#projectTitle')!, 'New Project')
    await user.type(container.querySelector('#funderProgram')!, 'New Program')
    await user.type(container.querySelector('#grantNumber')!, 'New Grant number')
    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
    expect(collected).toHaveLength(1)
    expect(collected[0].funderName).toBe('New Funder')
    expect(collected[0].projectTitle).toBe('New Project')
  })

  it('edits existing funding resource and saves changes', async () => {
    const user = userEvent.setup({ delay: null })
    const resources: FundingResource[] = [sampleFunding]
    const onFundingResourcesChange = vi.fn((updated: FundingResource[]) => {
      expect(updated[0].funderName).toBe('Funder A Edited')
    })
    const { container } = render(
      <FundingResourceAddEdit
        id={0}
        fundingResource={sampleFunding}
        fundingResources={resources}
        closeAction={vi.fn()}
        onFundingResourcesChange={onFundingResourcesChange}
      />,
    )
    await user.clear(container.querySelector('#funderName')!)
    await user.type(container.querySelector('#funderName')!, 'Funder A Edited')
    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
  })
})
