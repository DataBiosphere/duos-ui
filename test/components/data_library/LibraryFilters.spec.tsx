import React, { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LibraryFilters from 'src/components/data_library/LibraryFilters'
import { AvailableFilters, AssetType, FilterState, LibraryFiltersProps } from 'src/types/library'
import { EMPTY_FILTERS, getFilterSectionsForAsset } from 'src/components/data_library/filterRegistry'

const availableFilters: AvailableFilters = {
  accessManagement: [
    { value: 'controlled', label: 'via DUOS', count: 10 },
    { value: 'open', label: 'Open Access', count: 5 },
  ],
  dataUse: [
    { value: 'HMB', label: 'Health/Medical/Biomedical', count: 8 },
    { value: 'GRU', label: 'General Research Use', count: 3 },
  ],
  dataType: [
    { value: 'Phenotype', label: 'Phenotype', count: 7 },
    { value: 'Genomic', label: 'Genomic', count: 4 },
  ],
  dac: [],
  workspaceTools: [],
  workspacePlatform: [],
  clinicalTrialStatus: [],
  clinicalTrialPhase: [],
  clinicalTrialInterventionType: [],
  clinicalTrialRegistry: [],
  biospecimenType: [],
  biospecimenDataUse: [],
  biospecimenPostMortemIntervalUnit: [
    { value: 'HOURS', label: 'HOURS' },
    { value: 'DAYS', label: 'DAYS' },
  ],
  datasetsCited: [
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' },
  ],
  biospecimenPostMortemIntervalRange: { min: 0, max: 1000 },
  participantCountRange: { min: 0, max: 1000 },
}

const LibraryFiltersWrapper = ({ filters: initialFilters = EMPTY_FILTERS, onChange: externalOnChange, onClear: externalOnClear, loading = false }: Partial<LibraryFiltersProps>) => {
  const [filters, setFilters] = useState(initialFilters)

  const handleOnChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    externalOnChange?.(newFilters)
  }

  const handleOnClear = () => {
    setFilters({ ...EMPTY_FILTERS })
    externalOnClear?.()
  }

  return (
    <LibraryFilters
      filters={filters}
      onChange={handleOnChange}
      onClear={handleOnClear}
      sections={getFilterSectionsForAsset(AssetType.DATASETS, availableFilters)}
      loading={loading}
    />
  )
}

describe('LibraryFilters', () => {
  it('renders filter categories', () => {
    render(<LibraryFiltersWrapper />)
    expect(screen.getByText('Access Request Process')).toBeInTheDocument()
    expect(screen.getByText('Data Use')).toBeInTheDocument()
    expect(screen.getByText('Data Type')).toBeInTheDocument()
    expect(screen.getByText('Participants')).toBeInTheDocument()
  })

  it('renders filter options with counts', () => {
    render(<LibraryFiltersWrapper />)
    expect(screen.getByText('via DUOS (10)')).toBeInTheDocument()
    expect(screen.getByText('Open Access (5)')).toBeInTheDocument()
  })

  it('shows a helper label when a visible filter section has no options', async () => {
    const user = userEvent.setup()
    render(<LibraryFiltersWrapper />)
    await user.click(screen.getByText('DAC'))
    expect(screen.getByText('No filters available')).toBeInTheDocument()
  })

  it('calls onChange when a filter is toggled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LibraryFiltersWrapper onChange={onChange} />)
    await user.click(screen.getAllByRole('checkbox')[0])
    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_FILTERS,
      accessManagement: ['controlled'],
    })
  })

  it('calls onClear when clear button is clicked and then hides the clear button', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()
    render(<LibraryFiltersWrapper filters={{ ...EMPTY_FILTERS, accessManagement: ['controlled'] }} onClear={onClear} />)
    expect(screen.getByText('Clear')).toBeInTheDocument()
    await user.click(screen.getByText('Clear'))
    expect(onClear).toHaveBeenCalled()
    expect(screen.queryByText('Clear')).not.toBeInTheDocument()
  })

  it('handles participant count changes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LibraryFiltersWrapper onChange={onChange} />)
    await user.click(screen.getByText('Participants'))
    const minInput = screen.getByLabelText('Minimum')
    await user.clear(minInput)
    await user.type(minInput, '10')
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      participantCount: expect.objectContaining({ min: 10 }),
    })))
  })

  it('shows skeletons when loading', () => {
    render(<LibraryFiltersWrapper loading={true} />)
    expect(document.querySelectorAll('.MuiSkeleton-root')).toHaveLength(3)
    expect(screen.queryByText('Access Request Process')).not.toBeInTheDocument()
  })

  it('renders only configured filters for presentations', () => {
    render(
      <LibraryFilters
        filters={EMPTY_FILTERS}
        onChange={vi.fn()}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.PRESENTATIONS, availableFilters)}
      />,
    )
    expect(screen.getByText('Datasets Cited?')).toBeInTheDocument()
    expect(screen.queryByText('Participants')).not.toBeInTheDocument()
    expect(screen.queryByText('Access Request Process')).not.toBeInTheDocument()
  })

  it('shows post-mortem warning when range is set without a unit', async () => {
    const user = userEvent.setup()
    render(
      <LibraryFilters
        filters={{ ...EMPTY_FILTERS, biospecimenPostMortemInterval: { min: 2 } }}
        onChange={vi.fn()}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.BIOSPECIMENS, availableFilters)}
      />,
    )
    await user.click(screen.getByText('Post-mortem Interval'))
    expect(screen.getByText('Select a post-mortem interval unit to avoid ambiguous results.')).toBeInTheDocument()
  })

  it('hides post-mortem warning when a unit is selected', () => {
    render(
      <LibraryFilters
        filters={{ ...EMPTY_FILTERS, biospecimenPostMortemInterval: { min: 2 }, biospecimenPostMortemIntervalUnit: ['HOURS'] }}
        onChange={vi.fn()}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.BIOSPECIMENS, availableFilters)}
      />,
    )
    expect(screen.queryByText('Select a post-mortem interval unit to avoid ambiguous results.')).not.toBeInTheDocument()
  })
})

describe('LibraryFilters — collapseable panel', () => {
  const mountWithToggle = (isOpen: boolean, onToggle = vi.fn()) =>
    render(
      <LibraryFilters
        filters={EMPTY_FILTERS}
        onChange={vi.fn()}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.DATASETS, availableFilters)}
        isOpen={isOpen}
        onToggle={onToggle}
      />,
    )

  it('shows filter content and collapse button when open', () => {
    mountWithToggle(true)
    expect(screen.getByText('Filters')).toBeInTheDocument()
    expect(screen.getByText('Access Request Process')).toBeInTheDocument()
    expect(screen.getByLabelText('Collapse filters')).toBeInTheDocument()
  })

  it('hides filter content and shows expand button when closed', () => {
    mountWithToggle(false)
    expect(screen.queryByText('Access Request Process')).not.toBeInTheDocument()
    expect(screen.queryByText('Filters')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Show filters')).toBeInTheDocument()
    expect(screen.getByText('Show filters')).toBeInTheDocument()
  })

  it('calls onToggle when the collapse button is clicked', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    mountWithToggle(true, onToggle)
    await user.click(screen.getByLabelText('Collapse filters'))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('calls onToggle when the expand button is clicked', async () => {
    const user = userEvent.setup()
    const onToggle = vi.fn()
    mountWithToggle(false, onToggle)
    await user.click(screen.getByLabelText('Show filters'))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('does not render toggle button when onToggle is not provided', () => {
    render(
      <LibraryFilters
        filters={EMPTY_FILTERS}
        onChange={vi.fn()}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.DATASETS, availableFilters)}
      />,
    )
    expect(screen.queryByLabelText('Collapse filters')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Show filters')).not.toBeInTheDocument()
  })

  it('does not show Clear button when closed even with active filters', () => {
    render(
      <LibraryFilters
        filters={{ ...EMPTY_FILTERS, accessManagement: ['controlled'] }}
        onChange={vi.fn()}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.DATASETS, availableFilters)}
        isOpen={false}
        onToggle={vi.fn()}
      />,
    )
    expect(screen.queryByText('Clear')).not.toBeInTheDocument()
  })
})
