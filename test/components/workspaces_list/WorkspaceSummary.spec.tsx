import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Workspace } from 'src/types/model'
import WorkspaceSummary from 'src/components/workspaces_list/WorkspaceSummary'

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

describe('WorkspaceSummary', () => {
  it('renders columns including arrays and url', () => {
    const { container } = render(
      <WorkspaceSummary
        workspace={sampleWorkspace}
        columnsToShow={['name', 'platform', 'description', 'url', 'tools', 'tags']}
        editAction={vi.fn()}
        deleteAction={vi.fn()}
        disabled={false}
      />,
    )
    expect(screen.getByText(sampleWorkspace.name)).toBeInTheDocument()
    expect(screen.getByText(sampleWorkspace.platform)).toBeInTheDocument()
    expect(screen.getByText(sampleWorkspace.description)).toBeInTheDocument()
    expect(screen.getByText('R, Python')).toBeInTheDocument()
    expect(screen.getByText('genomics, analysis')).toBeInTheDocument()
    expect(container.querySelector('a[href="https://terra.bio/workspace"]')).toBeInTheDocument()
  })

  it('renders view button and triggers viewAction', async () => {
    const user = userEvent.setup()
    const viewFn = vi.fn()
    const { container } = render(
      <WorkspaceSummary
        workspace={sampleWorkspace}
        columnsToShow={['name']}
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
