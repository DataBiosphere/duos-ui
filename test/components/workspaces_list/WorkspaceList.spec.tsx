import React from 'react'
import { describe, it, expect, beforeAll } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from 'react-modal'
import { Workspace } from 'src/types/model'
import WorkspaceList from 'src/components/workspaces_list/WorkspaceList'

const sampleWorkspace: Workspace = {
  workspaceId: 'w1',
  studyId: 's1',
  name: 'Analysis Workspace',
  platform: 'Terra',
  url: 'https://terra.bio/workspace',
  description: 'Main analysis workspace',
  tools: ['R', 'Python'],
  access: 'controlled',
  tags: ['genomics', 'analysis'],
}

const WorkspaceListHarness: React.FC<{ initial: Workspace[] }> = ({ initial }) => {
  const [items, setItems] = React.useState<Workspace[]>(initial)
  return (
    <WorkspaceList
      workspaces={items}
      columnsToShow={['name', 'platform']}
      onWorkspaceChange={setItems}
      disabled={false}
    />
  )
}

beforeAll(() => Modal.setAppElement(document.body))

describe('WorkspaceList component', () => {
  it('renders existing workspaces', () => {
    render(<WorkspaceListHarness initial={[sampleWorkspace]} />)
    expect(screen.getByText(sampleWorkspace.name)).toBeInTheDocument()
    expect(screen.getByText(sampleWorkspace.platform)).toBeInTheDocument()
  })

  it('opens workspace in view mode when view button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<WorkspaceListHarness initial={[sampleWorkspace]} />)
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    expect(screen.getByText(sampleWorkspace.name)).toBeInTheDocument()
    expect(container.querySelector('#name')).toBeDisabled()
    expect(container.querySelector('#platform')).toBeDisabled()
    expect(container.querySelector('.collaborator-form-add-save-button')).not.toBeInTheDocument()
    expect(screen.getByText('Close')).toBeInTheDocument()
  })

  it('closes view mode when close button is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(<WorkspaceListHarness initial={[sampleWorkspace]} />)
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    await user.click(container.querySelector('.collaborator-form-cancel-button')!)
    expect(container.querySelector('#name')).not.toBeInTheDocument()
    expect(container.querySelector('.glyphicon-eye-open')).toBeInTheDocument()
  })

  it('adds a new workspace', async () => {
    const user = userEvent.setup()
    const state: Workspace[] = []
    const { container } = render(
      <WorkspaceList
        workspaces={state}
        columnsToShow={['name', 'platform']}
        onWorkspaceChange={(items) => { state.splice(0, state.length, ...items) }}
        disabled={false}
      />,
    )
    await user.click(container.querySelector('#add-workspace-btn')!)
    await user.type(container.querySelector('#name')!, 'Added Workspace')
    await user.type(container.querySelector('#platform')!, 'Added Platform')
    await user.type(container.querySelector('#url')!, 'https://added.com')
    await user.type(container.querySelector('#description')!, 'Added Description')
    await user.type(container.querySelector('#access')!, 'open')
    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
    expect(state).toHaveLength(1)
    expect(state[0].name).toBe('Added Workspace')
  })

  it('deletes a workspace via modal confirmation', async () => {
    const user = userEvent.setup()
    const { container } = render(<WorkspaceListHarness initial={[sampleWorkspace]} />)
    await user.click(container.querySelector('.glyphicon-trash')!)
    await waitFor(() => expect(document.querySelector('.ReactModal__Content')).toBeVisible())
    const modal = document.querySelector('.ReactModal__Content')!
    const deleteBtn = Array.from(modal.querySelectorAll('button')).find(b => /delete/i.test(b.textContent || ''))!
    await user.click(deleteBtn)
    await waitFor(() => expect(screen.queryByText(sampleWorkspace.name)).not.toBeInTheDocument())
    expect(document.querySelector('.ReactModal__Content')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.collaborator-summary-card')).toHaveLength(0)
  })
})
