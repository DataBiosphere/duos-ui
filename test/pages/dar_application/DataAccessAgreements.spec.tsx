import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('src/libs/ajax/DAA', () => ({
  DAA: { getDaas: vi.fn() },
}))

import { DataAccessAgreements } from 'src/pages/dar_application/DataAccessAgreements'
import { DAA } from 'src/libs/ajax/DAA'

const daa1 = {
  daaId: 100,
  createUserId: 1,
  createDate: 1,
  dacs: [{ dacId: 2, dacName: 'DAC 2', dacEmail: 'dac2@test.com' }],
  file: { fileStorageObjectId: 1, entityId: '1', fileName: 'SharedDAA.pdf', category: 'dataAccessAgreement', mediaType: 'application/pdf', createUserId: 1, createDate: 1 },
}

const daa2 = {
  daaId: 101,
  createUserId: 1,
  createDate: 1,
  dacs: [{ dacId: 3, dacName: 'DAC 3', dacEmail: 'dac3@test.com' }],
  file: { fileStorageObjectId: 2, entityId: '2', fileName: 'UniqueDAA.pdf', category: 'dataAccessAgreement', mediaType: 'application/pdf', createUserId: 1, createDate: 1 },
}

const defaultProps = {
  save: vi.fn(),
  attest: vi.fn(),
  isDraft: true,
  isAttested: false,
  cancelAttest: vi.fn(),
  onDaaIdsChange: vi.fn(),
  datasets: [],
}

const mountComponent = (customProps = {}) =>
  render(<DataAccessAgreements {...defaultProps} {...customProps} />)

beforeEach(() => {
  defaultProps.save = vi.fn()
  defaultProps.attest = vi.fn()
  defaultProps.cancelAttest = vi.fn()
  defaultProps.onDaaIdsChange = vi.fn()
  vi.mocked(DAA.getDaas).mockResolvedValue([])
})

afterEach(() => vi.clearAllMocks())

describe('DataAccessAgreements Component Tests', () => {
  it('emits displayed DAA ids based on selected datasets', async () => {
    vi.mocked(DAA.getDaas).mockResolvedValue([daa1, daa2] as never)
    const onDaaIdsChange = vi.fn()
    mountComponent({
      datasets: [
        { dataSetId: 1, datasetId: 1, dacId: 2 },
        { dataSetId: 2, datasetId: 2, dacId: 3 },
      ],
      onDaaIdsChange,
    })
    await waitFor(() => expect(onDaaIdsChange).toHaveBeenCalledWith([100, 101]))
  })

  it('renders the component with default props', async () => {
    const { container } = mountComponent()
    await waitFor(() => expect(container.querySelector('.dar-step-card')).toBeInTheDocument())
    expect(container.querySelector('[data-cy="attest-button"]')).toBeInTheDocument()
    expect(container.querySelector('[data-cy="save-button"]')).toBeInTheDocument()
  })

  it('renders data access request agreement text for RequiredDAAs', async () => {
    vi.mocked(DAA.getDaas).mockResolvedValue([{
      daaId: 100,
      createUserId: 1,
      createDate: 1,
      dacs: [{ dacId: 2, dacName: 'Test DAC', dacEmail: 'dac@test.com' }],
      file: { fileStorageObjectId: 1, entityId: '1', fileName: 'TestDAA.pdf', category: 'dataAccessAgreement', mediaType: 'application/pdf', createUserId: 1, createDate: 1 },
    }] as never)
    mountComponent({ datasets: [{ dataSetId: 1, datasetId: 1, dacId: 2 }] })
    await waitFor(() =>
      expect(document.body).toHaveTextContent('By submitting this data access request and in accordance with your Institution’s issuance of Library Cards to you for the agreement(s) below.'),
    )
  })

  it('calls save when the save button is clicked', async () => {
    const save = vi.fn()
    const user = userEvent.setup()
    const { container } = mountComponent({ save })
    await waitFor(() => expect(container.querySelector('[data-cy="save-button"]')).toBeInTheDocument())
    await user.click(container.querySelector('[data-cy="save-button"]')!)
    expect(save).toHaveBeenCalled()
  })

  it('calls attest when the attest button is clicked', async () => {
    const attest = vi.fn()
    const user = userEvent.setup()
    const { container } = mountComponent({ attest })
    await waitFor(() => expect(container.querySelector('[data-cy="attest-button"]')).toBeInTheDocument())
    await user.click(container.querySelector('[data-cy="attest-button"]')!)
    expect(attest).toHaveBeenCalled()
  })

  it('calls cancelAttest when the cancel attest button is clicked', async () => {
    const cancelAttest = vi.fn()
    const user = userEvent.setup()
    const { container } = mountComponent({ isAttested: true, cancelAttest })
    await waitFor(() => expect(container.querySelector('[data-cy="cancel-button"]')).toBeInTheDocument())
    expect(container.querySelector('[data-cy="cancel-button"]')).toBeInTheDocument()
    await user.click(container.querySelector('[data-cy="cancel-button"]')!)
    expect(cancelAttest).toHaveBeenCalled()
  })
})
