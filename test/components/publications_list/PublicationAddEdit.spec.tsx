import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('src/components/DuosDatePicker', () => ({
  DuosDatePicker: ({ id, onChange, defaultValue, disabled }: {
    id?: string
    onChange: (value: string | undefined) => void
    defaultValue?: string | null
    disabled?: boolean
  }) => (
    <input
      id={id}
      type="text"
      defaultValue={typeof defaultValue === 'string' ? defaultValue : ''}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
    />
  ),
}))

import PublicationAddEdit from 'src/components/publications_list/PublicationAddEdit'
import { Publication } from 'src/types/model'

describe('PublicationAddEdit component', () => {
  it('fills in and saves a new publication', async () => {
    const user = userEvent.setup()
    const collected: Publication[] = []
    const { container } = render(
      <PublicationAddEdit
        id={-1}
        publications={[]}
        closeAction={vi.fn()}
        onPublicationChange={(items) => { collected.splice(0, collected.length, ...items) }}
      />,
    )
    await user.type(container.querySelector('#title')!, 'New Pub')
    const dateInput = container.querySelector('#publishedDate') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2024-06-15' } })
    await user.type(container.querySelector('#pubmedId')!, '99999')
    await user.type(container.querySelector('#bibliographicCitation')!, 'Bib Cit X')
    await user.type(container.querySelector('#datasetCitation')!, 'Dataset Cit X')
    await user.type(container.querySelector('#journal')!, 'Journal X')
    await user.type(container.querySelector('#doi')!, '10.1000/xyz')
    await user.type(container.querySelector('#url')!, 'https://example.org/newpub')
    await user.type(container.querySelector('#access')!, 'Public')
    await user.type(container.querySelector('input[placeholder="Author Name"]')!, 'First Author')
    await user.type(container.querySelector('input[placeholder="ORCID (0000-0000-0000-0000)"]')!, '0000-0000-0000-0003')
    expect(screen.getByRole('button', { name: /add author/i })).not.toBeDisabled()
    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
    expect(collected).toHaveLength(1)
    expect(collected[0].title).toBe('New Pub')
    expect(collected[0].authors).toHaveLength(1)
    expect(collected[0].authors[0].name).toBe('First Author')
  })

  it('shows validation errors on empty form', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <PublicationAddEdit
        id={-1}
        publications={[]}
        closeAction={vi.fn()}
        onPublicationChange={vi.fn()}
      />,
    )
    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
    expect(container.querySelector('.error-message')).toBeInTheDocument()
    expect(container.querySelectorAll('.error-message').length).toBeGreaterThan(0)
  })

  it('disables Add Author until first row has name filled', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <PublicationAddEdit
        id={-1}
        publications={[]}
        closeAction={vi.fn()}
        onPublicationChange={vi.fn()}
      />,
    )
    expect(screen.getByRole('button', { name: /add author/i })).toBeDisabled()
    await user.type(container.querySelector('input[placeholder="Author Name"]')!, 'Temp Author')
    expect(screen.getByRole('button', { name: /add author/i })).not.toBeDisabled()
    await user.type(container.querySelector('input[placeholder="ORCID (0000-0000-0000-0000)"]')!, 'BAD-ORCID')
    expect(screen.getByRole('button', { name: /add author/i })).not.toBeDisabled()
    await user.click(screen.getByRole('button', { name: /add author/i }))
    expect(container.querySelectorAll('input[placeholder="Author Name"]')).toHaveLength(2)
  })

  it('shows per-author ORCID format error', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <PublicationAddEdit
        id={-1}
        publications={[]}
        closeAction={vi.fn()}
        onPublicationChange={vi.fn()}
      />,
    )
    await user.type(container.querySelector('input[placeholder="Author Name"]')!, 'Author Bad Orcid')
    await user.type(container.querySelector('input[placeholder="ORCID (0000-0000-0000-0000)"]')!, '1111-2222-3333-444')
    await user.click(container.querySelector('.collaborator-form-add-save-button')!)
    expect(screen.getByText(/orcIdFormat@0/i)).toBeInTheDocument()
  })
})
