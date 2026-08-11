import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LibraryFooter from 'src/components/data_library/LibraryFooter'
import { Storage } from 'src/libs/storage'

afterEach(() => vi.restoreAllMocks())

const withActiveResearcherStatus = () => vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ libraryCard: { cardNumber: '12345' } } as unknown as ReturnType<typeof Storage.getCurrentUser>)
const withoutActiveResearcherStatus = () => vi.spyOn(Storage, 'getCurrentUser').mockReturnValue({ libraryCard: null } as unknown as ReturnType<typeof Storage.getCurrentUser>)

describe('LibraryFooter — visibility', () => {
  it('does not render when no datasets are selected', () => {
    withoutActiveResearcherStatus()
    const { container } = render(
      <LibraryFooter selectedDatasetIds={[]} selectedStudyIds={[]} onApplyForAccess={vi.fn()} />,
    )
    expect(container.querySelector('[data-cy="library-footer"]')).not.toBeInTheDocument()
  })

  it('renders when at least one dataset is selected', () => {
    withoutActiveResearcherStatus()
    const { container } = render(
      <LibraryFooter selectedDatasetIds={[1]} selectedStudyIds={[101]} onApplyForAccess={vi.fn()} />,
    )
    expect(container.querySelector('[data-cy="library-footer"]')).toBeInTheDocument()
  })
})

describe('LibraryFooter — selection summary text', () => {
  it('displays singular "dataset" and "study" for single selections', () => {
    withoutActiveResearcherStatus()
    render(<LibraryFooter selectedDatasetIds={[1]} selectedStudyIds={[101]} onApplyForAccess={vi.fn()} />)
    expect(screen.getByText('1 dataset selected from 1 study')).toBeInTheDocument()
  })

  it('displays plural "datasets" and "studies" for multiple selections', () => {
    withoutActiveResearcherStatus()
    render(<LibraryFooter selectedDatasetIds={[1, 2, 3]} selectedStudyIds={[101, 102]} onApplyForAccess={vi.fn()} />)
    expect(screen.getByText('3 datasets selected from 2 studies')).toBeInTheDocument()
  })

  it('displays plural "studies" with a single dataset from multiple studies', () => {
    withoutActiveResearcherStatus()
    render(<LibraryFooter selectedDatasetIds={[1]} selectedStudyIds={[101, 102]} onApplyForAccess={vi.fn()} />)
    expect(screen.getByText('1 dataset selected from 2 studies')).toBeInTheDocument()
  })

  it('displays plural "datasets" with multiple datasets from a single study', () => {
    withoutActiveResearcherStatus()
    render(<LibraryFooter selectedDatasetIds={[1, 2]} selectedStudyIds={[101]} onApplyForAccess={vi.fn()} />)
    expect(screen.getByText('2 datasets selected from 1 study')).toBeInTheDocument()
  })
})

describe('LibraryFooter — tooltip', () => {
  it('shows a tooltip explaining that Active Researcher Status is required when the button is disabled', async () => {
    const user = userEvent.setup()
    withoutActiveResearcherStatus()
    render(<LibraryFooter selectedDatasetIds={[1]} selectedStudyIds={[101]} onApplyForAccess={vi.fn()} />)

    const btn = screen.getByRole('button', { name: 'Apply for Access' })
    await user.hover(btn.closest('span')!)

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent(
        'Active Researcher Status is required to apply for data access',
      )
    })
  })

  it('does not show a restricting tooltip when the user has Active Researcher Status', async () => {
    const user = userEvent.setup()
    withActiveResearcherStatus()
    render(<LibraryFooter selectedDatasetIds={[1]} selectedStudyIds={[101]} onApplyForAccess={vi.fn()} />)

    const btn = screen.getByRole('button', { name: 'Apply for Access' })
    await user.hover(btn.closest('span')!)

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

describe('LibraryFooter — Apply for Access button', () => {
  it('is enabled when the user has Active Researcher Status', () => {
    withActiveResearcherStatus()
    render(<LibraryFooter selectedDatasetIds={[1]} selectedStudyIds={[101]} onApplyForAccess={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Apply for Access' })).not.toBeDisabled()
  })

  it('is disabled when the user does not have Active Researcher Status', () => {
    withoutActiveResearcherStatus()
    render(<LibraryFooter selectedDatasetIds={[1]} selectedStudyIds={[101]} onApplyForAccess={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Apply for Access' })).toBeDisabled()
  })

  it('calls onApplyForAccess when clicked with Active Researcher Status', async () => {
    const user = userEvent.setup()
    const onApplyForAccess = vi.fn()
    withActiveResearcherStatus()
    render(<LibraryFooter selectedDatasetIds={[1]} selectedStudyIds={[101]} onApplyForAccess={onApplyForAccess} />)
    await user.click(screen.getByRole('button', { name: 'Apply for Access' }))
    expect(onApplyForAccess).toHaveBeenCalledOnce()
  })

  it('does not call onApplyForAccess when disabled', () => {
    const onApplyForAccess = vi.fn()
    withoutActiveResearcherStatus()
    render(<LibraryFooter selectedDatasetIds={[1]} selectedStudyIds={[101]} onApplyForAccess={onApplyForAccess} />)
    fireEvent.click(screen.getByRole('button', { name: 'Apply for Access' }))
    expect(onApplyForAccess).not.toHaveBeenCalled()
  })
})
