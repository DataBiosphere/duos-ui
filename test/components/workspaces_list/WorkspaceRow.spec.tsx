import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Workspace } from 'src/types/model'
import WorkspaceRow from 'src/components/workspaces_list/WorkspaceRow'

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

describe('WorkspaceRow', () => {
  it('shows summary when not in edit mode and triggers editAction', async () => {
    const user = userEvent.setup()
    const editFn = vi.fn()
    const { container } = render(
      <WorkspaceRow
        id={0}
        editMode={false}
        workspace={sampleWorkspace}
        workspaces={[sampleWorkspace]}
        columnsToShow={['name', 'platform']}
        editAction={editFn}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        onWorkspaceChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(screen.getByText(sampleWorkspace.name)).toBeInTheDocument()
    await user.click(container.querySelector('.glyphicon-pencil')!)
    expect(editFn).toHaveBeenCalledTimes(1)
  })

  it('renders edit form when editMode true', () => {
    const { container } = render(
      <WorkspaceRow
        id={0}
        editMode={true}
        workspace={sampleWorkspace}
        workspaces={[sampleWorkspace]}
        columnsToShow={['name']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        onWorkspaceChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(container.querySelector('#name')).toHaveValue(sampleWorkspace.name)
  })

  it('renders view form when viewMode true and is read-only', () => {
    const { container } = render(
      <WorkspaceRow
        id={0}
        editMode={false}
        viewMode={true}
        workspace={sampleWorkspace}
        workspaces={[sampleWorkspace]}
        columnsToShow={['name']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        viewAction={vi.fn()}
        onWorkspaceChange={vi.fn()}
        disabled={false}
      />,
    )
    expect(container.querySelector('#name')).toHaveValue(sampleWorkspace.name)
    expect(container.querySelector('#name')).toBeDisabled()
    expect(container.querySelector('.collaborator-form-add-save-button')).not.toBeInTheDocument()
  })

  it('triggers viewAction when view button is clicked', async () => {
    const user = userEvent.setup()
    const viewFn = vi.fn()
    const { container } = render(
      <WorkspaceRow
        id={0}
        editMode={false}
        viewMode={false}
        workspace={sampleWorkspace}
        workspaces={[sampleWorkspace]}
        columnsToShow={['name', 'platform']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        closeAction={vi.fn()}
        viewAction={viewFn}
        onWorkspaceChange={vi.fn()}
        disabled={false}
      />,
    )
    await user.click(container.querySelector('.glyphicon-eye-open')!)
    expect(viewFn).toHaveBeenCalledTimes(1)
  })
})
