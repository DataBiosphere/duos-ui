import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import BiospecimenAddEdit from 'src/components/biospecimen_list/BiospecimenAddEdit'

describe('BiospecimenAddEdit component', () => {
  it('renders nothing after mount', async () => {
    const { container } = render(
      <MemoryRouter>
        <BiospecimenAddEdit
          id={-1}
          biospecimen={undefined}
          biospecimens={[]}
          closeAction={vi.fn()}
          onBiospecimensChange={vi.fn()}
        />
      </MemoryRouter>,
    )
    expect(container.querySelector('[data-cy="biospecimen-add-edit"]')).not.toBeInTheDocument()
  })
})
