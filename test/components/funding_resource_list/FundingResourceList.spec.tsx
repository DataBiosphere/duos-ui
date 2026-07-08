import React from 'react'
import { describe, it, expect, beforeAll } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from 'react-modal'
import { FundingResource } from 'src/types/model'
import FundingResourceList from 'src/components/funding_resource_list/FundingResourceList'

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

const FundingResourceListHarness: React.FC<{ initial: FundingResource[] }> = ({ initial }) => {
  const [items, setItems] = React.useState<FundingResource[]>(initial)
  return (
    <FundingResourceList
      fundingResources={items}
      columnsToShow={['funderName', 'funderProgram', 'startDate']}
      onFundingResourceChange={setItems}
      disabled={false}
    />
  )
}

beforeAll(() => Modal.setAppElement(document.body))

describe('FundingResourceList component', () => {
  it('renders existing funding resources', () => {
    render(<FundingResourceListHarness initial={[sampleFunding]} />)
    expect(screen.getByText(sampleFunding.funderName)).toBeInTheDocument()
    expect(screen.getByText(sampleFunding.funderProgram)).toBeInTheDocument()
  })

  it('opens funding resource in view mode when view button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<FundingResourceListHarness initial={[sampleFunding]} />)
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    expect(screen.getByText(sampleFunding.funderName)).toBeInTheDocument()
    expect(container.querySelector('#funderName')).toBeDisabled()
    expect(container.querySelector('#projectTitle')).toBeDisabled()
    expect(container.querySelector('#startDate')).toHaveValue(sampleFunding.startDate)
    expect(container.querySelector('#endDate')).toHaveValue(sampleFunding.endDate)
    expect(container.querySelector('.collaborator-form-add-save-button')).not.toBeInTheDocument()
    expect(screen.getByText('Close')).toBeInTheDocument()
  })

  it('closes view mode when close button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<FundingResourceListHarness initial={[sampleFunding]} />)
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    await user.click(container.querySelector('.collaborator-form-cancel-button')!)
    expect(container.querySelector('#funderName')).not.toBeInTheDocument()
    expect(container.querySelector('.glyphicon-eye-open')).toBeInTheDocument()
  })

  it('adds a new funding resource', async () => {
    const user = userEvent.setup()
    const state: FundingResource[] = []
    const { container } = render(
      <FundingResourceList
        fundingResources={state}
        columnsToShow={['funderName', 'projectTitle']}
        onFundingResourceChange={(items: FundingResource[]) => { state.splice(0, state.length, ...items) }}
        disabled={false}
      />,
    )
    await user.click(container.querySelector('#add-funding-btn')!)
    await user.type(container.querySelector('#funderName')!, 'Added Funder')
    await user.type(container.querySelector('#projectTitle')!, 'Added Project')
    await user.type(container.querySelector('#funderProgram')!, 'Added Program')
    await user.type(container.querySelector('#grantNumber')!, 'New Grant number')
    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
    expect(state).toHaveLength(1)
    expect(state[0].funderName).toBe('Added Funder')
  })

  it('deletes a funding resource via modal confirmation', async () => {
    const user = userEvent.setup()
    const { container } = render(<FundingResourceListHarness initial={[sampleFunding]} />)
    await user.click(container.querySelector('.glyphicon-trash')!)
    await waitFor(() => expect(document.querySelector('.ReactModal__Content')).toBeVisible())
    const modal = document.querySelector('.ReactModal__Content')!
    const deleteBtn = Array.from(modal.querySelectorAll('button')).find(b => /delete/i.test(b.textContent || ''))!
    await user.click(deleteBtn)
    await waitFor(() => expect(screen.queryByText(sampleFunding.funderName)).not.toBeInTheDocument())
    expect(document.querySelector('.ReactModal__Content')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.collaborator-summary-card')).toHaveLength(0)
  })
})
