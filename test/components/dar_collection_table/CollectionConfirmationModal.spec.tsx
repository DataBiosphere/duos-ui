import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CollectionConfirmationModal, { CollectionConfirmationModalProps } from 'src/components/dar_collection_table/CollectionConfirmationModal'
import { DarCollectionSummary } from 'src/types/model'

vi.mock('src/libs/utils', async () => {
  const actual = await vi.importActual<typeof import('src/libs/utils')>('src/libs/utils')
  return { ...actual, isCollectionCanceled: vi.fn().mockReturnValue(false) }
})

vi.mock('src/components/modals/ConfirmationModal', () => ({
  default: ({ title, message, header, showConfirmation, onConfirm, closeConfirmation }: {
    title: string
    message: string
    header: string
    showConfirmation: boolean
    onConfirm: () => Promise<void>
    closeConfirmation: () => void
  }) =>
    showConfirmation
      ? (
          <div data-testid="confirmation-modal">
            <span data-testid="modal-title">{title}</span>
            <span data-testid="modal-message">{message}</span>
            <span data-testid="modal-header">{header}</span>
            <button type="button" onClick={onConfirm}>Confirm</button>
            <button type="button" onClick={closeConfirmation}>Close</button>
          </div>
        )
      : null,
}))

const collection: DarCollectionSummary = {
  darCollectionId: 1,
  darCode: 'DAR-100',
  name: 'Test Collection',
  actions: [],
  dacNames: [],
  dacCode: '',
  datasetCount: 1,
  datasetIds: [1],
  expired: false,
  expiresAt: 0,
  institutionName: 'Broad',
  latestReferenceId: 'ref-1',
  progressReport: false,
  referenceIds: ['ref-1'],
  requiresSOApproval: false,
  researcherName: 'John',
  status: 'Open',
  submissionDate: 0,
}

const baseProps: CollectionConfirmationModalProps = {
  collection,
  showConfirmation: true,
  setShowConfirmation: vi.fn(),
  cancelCollection: vi.fn().mockResolvedValue(undefined),
  reviseCollection: vi.fn().mockResolvedValue(undefined),
  openCollection: vi.fn().mockResolvedValue(undefined),
  deleteDraft: vi.fn().mockResolvedValue(undefined),
  approveCollection: vi.fn().mockResolvedValue(undefined),
}

function renderModal(overrides: Partial<CollectionConfirmationModalProps> = {}) {
  return render(<CollectionConfirmationModal {...baseProps} {...overrides} />)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CollectionConfirmationModal - modal header', () => {
  it('shows darCode and name in the header', () => {
    renderModal({ consoleAction: 'cancel' })
    expect(screen.getByTestId('modal-header')).toHaveTextContent('DAR-100 - Test Collection')
  })
})

describe('CollectionConfirmationModal - consoleAction: cancel', () => {
  it('renders the cancel modal title', () => {
    renderModal({ consoleAction: 'cancel' })
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Cancel Data Access Request')
  })

  it('renders the cancel confirmation message', () => {
    renderModal({ consoleAction: 'cancel' })
    expect(screen.getByTestId('modal-message')).toHaveTextContent('Are you sure you want to cancel DAR-100?')
  })

  it('calls cancelCollection and closes on confirm', async () => {
    const setShowConfirmation = vi.fn()
    const cancelCollection = vi.fn().mockResolvedValue(undefined)
    renderModal({ consoleAction: 'cancel', setShowConfirmation, cancelCollection })
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(cancelCollection).toHaveBeenCalledWith(collection)
    expect(setShowConfirmation).toHaveBeenCalledWith(false)
  })

  it('calls setShowConfirmation(false) on close', async () => {
    const setShowConfirmation = vi.fn()
    renderModal({ consoleAction: 'cancel', setShowConfirmation })
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(setShowConfirmation).toHaveBeenCalledWith(false)
  })
})

describe('CollectionConfirmationModal - consoleAction: revise', () => {
  it('renders the revise modal title', () => {
    renderModal({ consoleAction: 'revise' })
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Revise Data Access Request')
  })

  it('calls reviseCollection and closes on confirm', async () => {
    const setShowConfirmation = vi.fn()
    const reviseCollection = vi.fn().mockResolvedValue(undefined)
    renderModal({ consoleAction: 'revise', setShowConfirmation, reviseCollection })
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(reviseCollection).toHaveBeenCalledWith(collection)
    expect(setShowConfirmation).toHaveBeenCalledWith(false)
  })
})

describe('CollectionConfirmationModal - consoleAction: open', () => {
  it('renders the open modal title', () => {
    renderModal({ consoleAction: 'open' })
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Open Data Access Request')
  })

  it('calls openCollection and closes on confirm', async () => {
    const setShowConfirmation = vi.fn()
    const openCollection = vi.fn().mockResolvedValue(undefined)
    renderModal({ consoleAction: 'open', setShowConfirmation, openCollection })
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(openCollection).toHaveBeenCalledWith(collection)
    expect(setShowConfirmation).toHaveBeenCalledWith(false)
  })
})

describe('CollectionConfirmationModal - consoleAction: approve', () => {
  it('renders the approve modal title', () => {
    renderModal({ consoleAction: 'approve' })
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Approve Data Access Request')
  })

  it('calls approveCollection and closes on confirm', async () => {
    const setShowConfirmation = vi.fn()
    const approveCollection = vi.fn().mockResolvedValue(undefined)
    renderModal({ consoleAction: 'approve', setShowConfirmation, approveCollection })
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(approveCollection).toHaveBeenCalledWith(collection)
    expect(setShowConfirmation).toHaveBeenCalledWith(false)
  })
})

describe('CollectionConfirmationModal - consoleAction: delete', () => {
  it('renders the delete modal title', () => {
    renderModal({ consoleAction: 'delete' })
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Delete Data Access Request Draft')
  })

  it('calls deleteDraft and closes on confirm', async () => {
    const setShowConfirmation = vi.fn()
    const deleteDraft = vi.fn().mockResolvedValue(undefined)
    renderModal({ consoleAction: 'delete', setShowConfirmation, deleteDraft })
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(deleteDraft).toHaveBeenCalledWith(collection)
    expect(setShowConfirmation).toHaveBeenCalledWith(false)
  })
})

describe('CollectionConfirmationModal - default (no consoleAction)', () => {
  it('shows the cancel modal when collection is not canceled', async () => {
    const { isCollectionCanceled } = await import('src/libs/utils')
    vi.mocked(isCollectionCanceled).mockReturnValue(false)
    renderModal()
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Cancel Data Access Request')
  })

  it('shows the revise modal when collection is canceled', async () => {
    const { isCollectionCanceled } = await import('src/libs/utils')
    vi.mocked(isCollectionCanceled).mockReturnValue(true)
    renderModal()
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Revise Data Access Request')
  })
})
