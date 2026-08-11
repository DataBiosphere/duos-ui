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

  it('renders an enabled "Request Now" button when the user has a library card', () => {
    getCurrentUserSpy.mockReturnValue(buildUser({} as LibraryCard))

    render(<RequestAccessButton datasetId={101} />)

    const button = screen.getByRole('button', { name: 'Request Now' })
    expect(button).not.toBeDisabled()
  })

  it('renders a disabled button when the user has no library card', () => {
    getCurrentUserSpy.mockReturnValue(buildUser(undefined))

    render(<RequestAccessButton datasetId={101} />)

    expect(screen.getByRole('button', { name: 'Request Now' })).toBeDisabled()
  })

  it('shows a library card tooltip on hover when the user has no library card', async () => {
    getCurrentUserSpy.mockReturnValue(buildUser(undefined))

    render(<RequestAccessButton datasetId={101} />)

    fireEvent.mouseOver(screen.getByRole('button', { name: 'Request Now' }).parentElement as HTMLElement)

    expect(await screen.findByText('A Library Card is required to apply for data access')).toBeInTheDocument()
  })

  it('creates a DAR draft for the dataset and navigates to the application on click', async () => {
    getCurrentUserSpy.mockReturnValue(buildUser({} as LibraryCard))
    postDarDraftSpy.mockResolvedValue({ referenceId: 'REF-789' })

    render(<RequestAccessButton datasetId={101} />)

    fireEvent.click(screen.getByRole('button', { name: 'Request Now' }))

    await waitFor(() => {
      expect(postDarDraftSpy).toHaveBeenCalledWith({ datasetId: [101] })
      expect(navigate).toHaveBeenCalledWith('/dar_application/REF-789')
    })
  })

  it('is disabled with a selection tooltip when disabledForSelection is set, even with a library card', async () => {
    getCurrentUserSpy.mockReturnValue(buildUser({} as LibraryCard))

    render(<RequestAccessButton datasetId={101} disabledForSelection />)

    const button = screen.getByRole('button', { name: 'Request Now' })
    expect(button).toBeDisabled()

    fireEvent.mouseOver(button.parentElement as HTMLElement)
    expect(await screen.findByText('Use \'Apply for Access\' below to request the selected datasets')).toBeInTheDocument()
  })

  it('does not create a draft when clicked while disabledForSelection', () => {
    getCurrentUserSpy.mockReturnValue(buildUser({} as LibraryCard))

    render(<RequestAccessButton datasetId={101} disabledForSelection />)

    fireEvent.click(screen.getByRole('button', { name: 'Request Now' }))

    expect(postDarDraftSpy).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('does not create a draft when the disabled button is clicked', () => {
    getCurrentUserSpy.mockReturnValue(buildUser(undefined))

    render(<RequestAccessButton datasetId={101} />)

    fireEvent.click(screen.getByRole('button', { name: 'Request Now' }))

    expect(postDarDraftSpy).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })
})
