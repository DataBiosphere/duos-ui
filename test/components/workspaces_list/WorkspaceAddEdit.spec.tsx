import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WorkspaceAddEdit from 'src/components/workspaces_list/WorkspaceAddEdit'
import { Workspace } from 'src/types/model'

vi.mock('src/libs/utils', async (importActual) => {
  const actual = await importActual<typeof import('src/libs/utils')>()
  return {
    ...actual,
    findOntologyTerms: vi.fn().mockResolvedValue([]),
    searchOntologyTerm: vi.fn().mockResolvedValue([]),
  }
})

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

describe('WorkspaceAddEdit data use and access management', () => {
  const renderForm = (workspace?: Workspace) => {
    const saved: Workspace[][] = []
    const view = render(
      <WorkspaceAddEdit
        id={workspace ? 0 : -1}
        workspace={workspace}
        workspaces={workspace ? [workspace] : []}
        closeAction={vi.fn()}
        onWorkspaceChange={items => saved.push(items)}
      />,
    )
    return { ...view, saved }
  }

  const fillRequired = async (user: ReturnType<typeof userEvent.setup>, container: HTMLElement) => {
    await user.type(container.querySelector('#name')!, 'New Workspace')
    await user.type(container.querySelector('#platform')!, 'Terra')
    await user.type(container.querySelector('#url')!, 'https://example.com')
    await user.type(container.querySelector('#description')!, 'Description')
  }

  const save = (user: ReturnType<typeof userEvent.setup>, container: HTMLElement) =>
    user.click(container.querySelector('.collaborator-form-add-save-button')!)

  it('asks for the terms of the workspace, without requiring them', () => {
    const { container } = renderForm()
    expect(container).toHaveTextContent('data use permissions for your workspace')
    expect(container).not.toHaveTextContent('Data Access Management*')
  })

  it('saves a workspace without data use or access management', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm()
    await fillRequired(user, container)
    await save(user, container)

    expect(saved).toHaveLength(1)
    expect(saved[0][0].accessManagement).toBeUndefined()
    expect(saved[0][0].dataUse).toBeUndefined()
  })

  it('saves the access management and data use that are set, beside the free-text access', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm()
    await fillRequired(user, container)
    await user.type(container.querySelector('#access')!, 'Registered users')
    await user.click(container.querySelector('#accessManagement_external')!)
    await user.click(container.querySelector('#primaryConsent_generalResearchUse')!)
    await user.click(container.querySelector('#pub')!)
    await save(user, container)

    expect(saved[0][0]).toMatchObject({
      access: 'Registered users',
      accessManagement: 'external',
      dataUse: { generalUse: true, publicationResults: true },
    })
  })

  it('does not save a secondary term without a primary term', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm()
    await fillRequired(user, container)
    await user.click(container.querySelector('#pub')!)
    await save(user, container)

    expect(saved).toHaveLength(0)
  })

  it('leaves a saved workspace\'s data use as stored when only other fields change', async () => {
    const user = userEvent.setup()
    const dataUse = { hmbResearch: true, nonProfitUse: false }
    const { container, saved } = renderForm({ ...sampleWorkspace, accessManagement: 'controlled', dataUse })
    await user.type(container.querySelector('#name')!, ' v2')
    await save(user, container)

    expect(saved[0][0].dataUse).toEqual(dataUse)
    expect(saved[0][0].accessManagement).toBe('controlled')
  })

  it('keeps stored data use values the form does not show when another term changes', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm({
      ...sampleWorkspace,
      accessManagement: 'controlled',
      dataUse: { hmbResearch: true, methodsResearch: true, nonProfitUse: false },
    })
    await user.click(container.querySelector('#gso')!)
    await save(user, container)

    expect(saved[0][0].dataUse).toEqual({ hmbResearch: true, methodsResearch: true, nonProfitUse: false, geneticStudiesOnly: true })
  })

  it('clears access management and data use, including fields the form does not show', async () => {
    const user = userEvent.setup()
    const { container, saved } = renderForm({
      ...sampleWorkspace,
      accessManagement: 'controlled',
      dataUse: { hmbResearch: true, aiLlmUse: true },
    })
    await user.click(container.querySelector('#clearDataUseTerms')!)
    await save(user, container)

    expect(saved[0][0].accessManagement).toBeUndefined()
    expect(saved[0][0].dataUse).toBeUndefined()
  })
})
