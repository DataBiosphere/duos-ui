import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LibraryFooter from 'src/components/data_library/LibraryFooter'
import { Storage } from 'src/libs/storage'

afterEach(() => vi.restoreAllMocks())

const withLibraryCard = () => vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ libraryCard: { cardNumber: '12345' } } as unknown as ReturnType<typeof Storage.getCurrentUser>)
const withoutLibraryCard = () => vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ libraryCard: null } as unknown as ReturnType<typeof Storage.getCurrentUser>)

describe('LibraryFooter — visibility', () => {
  it('does not render when no datasets are selected', () => {
    withoutLibraryCard()
    const { container } = render(
      <LibraryFooter selectedDatasetIds={[]} selectedStudyIds={[]} onApplyForAccess={vi.fn()} />,
    )
    expect(container.querySelector('[data-cy="library-footer"]')).not.toBeInTheDocument()
  })

  it('renders when at least one dataset is selected', () => {
    withoutLibraryCard()
    const { container } = render(
      <LibraryFooter selectedDatasetIds={[1]} selectedStudyIds={[101]} onApplyForAccess={vi.fn()} />,
    )
    expect(container.querySelector('[data-cy="library-footer"]')).toBeInTheDocument()
  })
})

describe('LibraryFooter — selection summary text', () => {
  it('displays singular "dataset" and "study" for single selections', () => {
    withoutLibraryCard()
    render(<LibraryFooter selectedDatasetIds={[1]} selectedStudyIds={[101]} onApplyForAccess={vi.fn()} />)
    expect(screen.getByText('1 dataset selected from 1 study')).toBeInTheDocument()
  })

  it('displays plural "datasets" and "studies" for multiple selections', () => {
    withoutLibraryCard()
    render(<LibraryFooter selectedDatasetIds={[1, 2, 3]} selectedStudyIds={[101, 102]} onApplyForAccess={vi.fn()} />)
    expect(screen.getByText('3 datasets selected from 2 studies')).toBeInTheDocument()
  })

  it('displays plural "studies" with a single dataset from multiple studies', () => {
    withoutLibraryCard()
    render(<LibraryFooter selectedDatasetIds={[1]} selectedStudyIds={[101, 102]} onApplyForAccess={vi.fn()} />)
    expect(screen.getByText('1 dataset selected from 2 studies')).toBeInTheDocument()
  })

  it('displays plural "datasets" with multiple datasets from a single study', () => {
    withoutLibraryCard()
    render(<LibraryFooter selectedDatasetIds={[1, 2]} selectedStudyIds={[101]} onApplyForAccess={vi.fn()} />)
    expect(screen.getByText('2 datasets selected from 1 study')).toBeInTheDocument()
  })
})

describe('LibraryFooter — Apply for Access button', () => {
  it('is enabled when the user has a library card', () => {
    withLibraryCard()
    render(<LibraryFooter selectedDatasetIds={[1]} selectedStudyIds={[101]} onApplyForAccess={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Apply for Access' })).not.toBeDisabled()
  })

  it('is disabled when the user has no library card', () => {
    withoutLibraryCard()
    render(<LibraryFooter selectedDatasetIds={[1]} selectedStudyIds={[101]} onApplyForAccess={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Apply for Access' })).toBeDisabled()
  })

  it('calls onApplyForAccess when clicked with a library card', async () => {
    const user = userEvent.setup()
    const onApplyForAccess = vi.fn()
    withLibraryCard()
    render(<LibraryFooter selectedDatasetIds={[1]} selectedStudyIds={[101]} onApplyForAccess={onApplyForAccess} />)
    await user.click(screen.getByRole('button', { name: 'Apply for Access' }))
    expect(onApplyForAccess).toHaveBeenCalledOnce()
  })

  it('does not call onApplyForAccess when disabled', () => {
    const onApplyForAccess = vi.fn()
    withoutLibraryCard()
    render(<LibraryFooter selectedDatasetIds={[1]} selectedStudyIds={[101]} onApplyForAccess={onApplyForAccess} />)
    fireEvent.click(screen.getByRole('button', { name: 'Apply for Access' }))
    expect(onApplyForAccess).not.toHaveBeenCalled()
  })
})
