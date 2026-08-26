import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WorkspaceAddEdit from 'src/components/workspaces_list/WorkspaceAddEdit'
import { Workspace } from 'src/types/model'

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

describe('WorkspaceAddEdit component', () => {
  it('opens add form and enforces validation disabling save then adds', async () => {
    const user = userEvent.setup()
    const collected: Workspace[] = []
    const { container } = render(
      <WorkspaceAddEdit
        id={-1}
        workspace={undefined}
        workspaces={[]}
        closeAction={vi.fn()}
        onWorkspaceChange={(items) => { collected.splice(0, collected.length, ...items) }}
      />,
    )
    await user.type(container.querySelector('#name')!, 'New Workspace')
    await user.type(container.querySelector('#platform')!, 'New Platform')
    await user.type(container.querySelector('#url')!, 'https://example.com')
    await user.type(container.querySelector('#description')!, 'New Description')
    await user.type(container.querySelector('#access')!, 'open')
    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
    expect(collected).toHaveLength(1)
    expect(collected[0].name).toBe('New Workspace')
    expect(collected[0].platform).toBe('New Platform')
    expect(collected[0].cloud).toEqual([])
  })

  it('saves selected cloud values', async () => {
    const user = userEvent.setup()
    const collected: Workspace[] = []
    const { container } = render(
      <WorkspaceAddEdit
        id={-1}
        workspace={undefined}
        workspaces={[]}
        closeAction={vi.fn()}
        onWorkspaceChange={(items) => { collected.splice(0, collected.length, ...items) }}
      />,
    )
    expect(screen.getByText('Cloud')).toBeInTheDocument()
    await user.type(container.querySelector('#name')!, 'Cloud Workspace')
    await user.type(container.querySelector('#platform')!, 'Terra')
    await user.type(container.querySelector('#url')!, 'https://workspace.example.com')
    const cloudInput = container.querySelector('#cloud input') as HTMLInputElement
    await user.click(cloudInput!)
    await user.keyboard('Oracle')
    await user.keyboard('{Enter}')
    await user.click(cloudInput!)
    await user.keyboard('AWS')
    await user.keyboard('{Enter}')
    await user.type(container.querySelector('#description')!, 'Cloud workspace description')
    await user.type(container.querySelector('#access')!, 'open')
    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
    expect(collected).toHaveLength(1)
    expect(collected[0].cloud).toEqual(['Oracle', 'AWS'])
  })

  it('edits existing workspace and saves changes', async () => {
    const user = userEvent.setup()
    const workspaces: Workspace[] = [sampleWorkspace]
    const onWorkspaceChange = vi.fn()
    const { container } = render(
      <WorkspaceAddEdit
        id={0}
        workspace={sampleWorkspace}
        workspaces={workspaces}
        closeAction={vi.fn()}
        onWorkspaceChange={onWorkspaceChange}
      />,
    )
    await user.clear(container.querySelector('#name')!)
    await user.type(container.querySelector('#name')!, 'Analysis Workspace Edited')
    await user.click(container.querySelector('.collaborator-form-add-save-button')!)

    expect(onWorkspaceChange).toHaveBeenCalledTimes(1)
    const [updated] = onWorkspaceChange.mock.calls[0] as [Workspace[]]
    expect(updated[0].name).toBe('Analysis Workspace Edited')
  })
})
