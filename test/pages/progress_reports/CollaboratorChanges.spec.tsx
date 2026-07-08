import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import CollaboratorChanges from 'src/pages/progress_reports/CollaboratorChanges'
import { FormState } from 'src/pages/progress_reports/ProgressReportFormState'
import { Collaborator } from 'src/types/model'

const countriesOfOperation = ['United States of America (the)', 'France']

const initialCollaborators: Partial<Collaborator>[] = [
  { name: 'Test User 1', title: 'Researcher', eraCommonsId: 'user1', email: 'user1@example.com', countryOfOperation: 'France', approverStatus: false },
  { name: 'Test User 2', title: 'Assistant', eraCommonsId: 'user2', email: 'user2@example.com', approverStatus: false, countryOfOperation: 'United States of America (the)' },
]

const baseFormState: Partial<FormState> = {
  labCollaborators: [],
  internalCollaborators: [],
  externalCollaborators: [],
}

function renderComponent(customState: Partial<FormState> = {}, readOnly = false) {
  const onFormChange = vi.fn()
  render(
    <CollaboratorChanges
      readOnly={readOnly}
      formState={{ ...baseFormState, ...customState } as FormState}
      onFormChange={onFormChange}
      countriesOfOperation={countriesOfOperation}
    />,
  )
  return { onFormChange }
}

describe('CollaboratorChanges', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the component correctly', () => {
    renderComponent()
    expect(document.querySelector('[data-cy="dar-closeout"]')).toBeInTheDocument()
    expect(screen.getByText('Step 3: Add or Remove Collaborators')).toBeInTheDocument()
    expect(screen.getByText('3.1 Internal Lab Staff')).toBeInTheDocument()
    expect(screen.getByText('3.2 Internal Collaborators')).toBeInTheDocument()
    expect(screen.getByText('3.3 External Collaborators')).toBeInTheDocument()
  })

  it('renders all three collaborator sections', () => {
    renderComponent()
    expect(screen.getByRole('button', { name: 'Add Internal Lab Staff' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Internal Collaborators' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add External Collaborators' })).toBeInTheDocument()
  })

  it('displays preloaded internal lab staff', () => {
    renderComponent({ labCollaborators: initialCollaborators as Collaborator[] })
    expect(screen.getByText('Test User 1')).toBeInTheDocument()
    expect(screen.getByText('Test User 2')).toBeInTheDocument()
    expect(screen.getByText('Researcher')).toBeInTheDocument()
    expect(screen.getByText('Assistant')).toBeInTheDocument()
  })

  it('displays preloaded internal collaborators', () => {
    renderComponent({ internalCollaborators: initialCollaborators as Collaborator[] })
    expect(screen.getByText('Test User 1')).toBeInTheDocument()
    expect(screen.getByText('Test User 2')).toBeInTheDocument()
  })

  it('displays preloaded external collaborators', () => {
    renderComponent({ externalCollaborators: initialCollaborators as Collaborator[] })
    expect(screen.getByText('Test User 1')).toBeInTheDocument()
    expect(screen.getByText('Test User 2')).toBeInTheDocument()
  })

  it('renders in read-only mode correctly', () => {
    renderComponent({ labCollaborators: initialCollaborators as Collaborator[] }, true)
    expect(screen.getByText('Test User 1')).toBeInTheDocument()
    expect(screen.getByText('Test User 2')).toBeInTheDocument()
  })

  it('handles empty collaborator lists', () => {
    renderComponent({ labCollaborators: [], internalCollaborators: [], externalCollaborators: [] })
    expect(screen.getByText('3.1 Internal Lab Staff')).toBeInTheDocument()
    expect(screen.getByText('3.2 Internal Collaborators')).toBeInTheDocument()
    expect(screen.getByText('3.3 External Collaborators')).toBeInTheDocument()
  })

  it('displays correct description text for each collaborator type', () => {
    renderComponent()
    expect(screen.getByText(/Please add Internal Lab Staff here/)).toBeInTheDocument()
    expect(screen.getByText(/Please add Internal Collaborators here/)).toBeInTheDocument()
    expect(screen.getByText(/Please list External collaborators here/)).toBeInTheDocument()
    expect(screen.getByText(/Internal Lab Staff are defined as users of data/)).toBeInTheDocument()
    expect(screen.getByText(/Internal Collaborators are defined as individuals/)).toBeInTheDocument()
    expect(screen.getByText(/External Collaborators are not employees/)).toBeInTheDocument()
  })
})
