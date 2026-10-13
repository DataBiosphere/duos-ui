import React from 'react'
import '@testing-library/jest-dom/vitest'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RequestAccessButton from 'src/components/data_library/RequestAccessButton'
import { Storage } from 'src/libs/storage'
import { DAR } from 'src/libs/ajax/DAR'
import { DuosUser, LibraryCard } from 'src/types/model'

const navigate = vi.fn()

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>()
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

const buildUser = (libraryCard?: LibraryCard): DuosUser => ({
  displayName: 'Test User',
  email: 'test@example.com',
  userId: 42,
  libraryCard,
} as DuosUser)

describe('RequestAccessButton', () => {
  let getCurrentUserSpy: ReturnType<typeof vi.spyOn>
  let postDarDraftSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    getCurrentUserSpy = vi.spyOn(Storage, 'getCurrentUser')
    postDarDraftSpy = vi.spyOn(DAR, 'postDarDraft')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    navigate.mockReset()
  })

  it('renders an enabled "Request Now" button when the user has Active Researcher Status', () => {
    getCurrentUserSpy.mockReturnValue(buildUser({} as LibraryCard))

    render(<RequestAccessButton datasetId={101} dacApproval />)

    const button = screen.getByRole('button', { name: 'Request Now' })
    expect(button).not.toBeDisabled()
  })

  it('renders a disabled button when the user does not have Active Researcher Status', () => {
    getCurrentUserSpy.mockReturnValue(buildUser(undefined))

    render(<RequestAccessButton datasetId={101} dacApproval />)

    expect(screen.getByRole('button', { name: 'Request Now' })).toBeDisabled()
  })

  it('shows an Active Researcher Status tooltip when the user does not have it', async () => {
    getCurrentUserSpy.mockReturnValue(buildUser(undefined))

    render(<RequestAccessButton datasetId={101} dacApproval />)

    fireEvent.mouseOver(screen.getByRole('button', { name: 'Request Now' }).parentElement as HTMLElement)

    expect(await screen.findByText('Active Researcher Status is required to apply for data access')).toBeInTheDocument()
  })

  /**
   * The checkbox stopped offering these rows once selection required DAC approval, but this
   * button kept its own path to a DAR. An unapproved dataset has nothing to request yet -
   * whether the DAC has not decided, or decided against.
   */
  it('disables the button for a dataset the DAC has not approved', () => {
    getCurrentUserSpy.mockReturnValue(buildUser({} as LibraryCard))

    const { rerender } = render(<RequestAccessButton datasetId={101} />)
    expect(screen.getByRole('button', { name: 'Request Now' })).toBeDisabled()

    rerender(<RequestAccessButton datasetId={101} dacApproval={false} />)
    expect(screen.getByRole('button', { name: 'Request Now' })).toBeDisabled()
  })

  /** Its own explanation, not the selection tooltip, which would say something untrue here. */
  it('explains that the dataset is awaiting DAC approval', async () => {
    getCurrentUserSpy.mockReturnValue(buildUser({} as LibraryCard))

    render(<RequestAccessButton datasetId={101} disabledForSelection />)

    fireEvent.mouseOver(screen.getByRole('button', { name: 'Request Now' }).parentElement as HTMLElement)

    expect(await screen.findByText('This dataset is awaiting DAC approval')).toBeInTheDocument()
    expect(screen.queryByText(/Apply for Access. below to request/)).not.toBeInTheDocument()
  })

  /**
   * dacApproval false means the DAC decided against, which the submissions Status chip shows as
   * 'Rejected'. Calling that 'awaiting approval' would have the two disagree on one row.
   */
  it('says rejected rather than pending when the DAC decided against', async () => {
    getCurrentUserSpy.mockReturnValue(buildUser({} as LibraryCard))

    render(<RequestAccessButton datasetId={101} dacApproval={false} />)

    fireEvent.mouseOver(screen.getByRole('button', { name: 'Request Now' }).parentElement as HTMLElement)

    expect(await screen.findByText('The DAC has rejected this dataset')).toBeInTheDocument()
    expect(screen.queryByText('This dataset is awaiting DAC approval')).not.toBeInTheDocument()
  })

  it('creates a DAR draft for the dataset and navigates to the application on click', async () => {
    getCurrentUserSpy.mockReturnValue(buildUser({} as LibraryCard))
    postDarDraftSpy.mockResolvedValue({ referenceId: 'REF-789' })

    render(<RequestAccessButton datasetId={101} dacApproval />)

    fireEvent.click(screen.getByRole('button', { name: 'Request Now' }))

    await waitFor(() => {
      expect(postDarDraftSpy).toHaveBeenCalledWith({ datasetId: [101] })
      expect(navigate).toHaveBeenCalledWith('/dar_application/REF-789')
    })
  })

  it('is disabled with a selection tooltip when disabledForSelection is set, even with Active Researcher Status', async () => {
    getCurrentUserSpy.mockReturnValue(buildUser({} as LibraryCard))

    render(<RequestAccessButton datasetId={101} dacApproval disabledForSelection />)

    const button = screen.getByRole('button', { name: 'Request Now' })
    expect(button).toBeDisabled()

    fireEvent.mouseOver(button.parentElement as HTMLElement)
    expect(await screen.findByText('Use \'Apply for Access\' below to request the selected datasets')).toBeInTheDocument()
  })

  it('does not create a draft when clicked while disabledForSelection', () => {
    getCurrentUserSpy.mockReturnValue(buildUser({} as LibraryCard))

    render(<RequestAccessButton datasetId={101} dacApproval disabledForSelection />)

    fireEvent.click(screen.getByRole('button', { name: 'Request Now' }))

    expect(postDarDraftSpy).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('does not create a draft when the disabled button is clicked', () => {
    getCurrentUserSpy.mockReturnValue(buildUser(undefined))

    render(<RequestAccessButton datasetId={101} dacApproval />)

    fireEvent.click(screen.getByRole('button', { name: 'Request Now' }))

    expect(postDarDraftSpy).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })
})
