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
  publicationsDatasetsCited: [
    { value: 'true', label: 'Yes' },
    { value: 'false', label: 'No' },
  ],
  soApprovalModel: [
    { value: 'PER_REQUEST', label: 'Per-Request Approval' },
    { value: 'PRE_AUTHORIZED', label: 'Pre-Authorized Researchers' },
  ],
  instantApproval: [
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

  // Driven off the registry rather than a hardcoded list. A key registered in assetFilterRegistry
  // but claimed by neither CHECKBOX_FILTER_KEYS nor BOOLEAN_FILTER_KEYS falls through
  // renderCheckboxSection's type guard and renders nothing at all — silently, with every other
  // test still green. Asserting against the registry covers each new filter the day it lands.
  it('renders a section for every filter registered for the asset', () => {
    render(<LibraryFiltersWrapper />)

    const sections = getFilterSectionsForAsset(AssetType.DATASETS, availableFilters)
    expect(sections.length).toBeGreaterThan(0)
    sections.forEach((section) => {
      expect(
        screen.getAllByText(section.label).length,
        `no section rendered for "${section.key}"`,
      ).toBeGreaterThan(0)
    })
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

  it('shows a participant minimum of 0 in the input rather than a blank field', async () => {
    const user = userEvent.setup()
    render(<LibraryFiltersWrapper filters={{ ...EMPTY_FILTERS, participantCount: { min: 0 } }} />)
    await user.click(screen.getByText('Participants'))
    expect(screen.getByLabelText('Minimum')).toHaveValue(0)
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
    expect(screen.getByText('Datasets Cited (Presentations)?')).toBeInTheDocument()
    expect(screen.queryByText('Participants')).not.toBeInTheDocument()
    expect(screen.queryByText('Access Request Process')).not.toBeInTheDocument()
  })

  it('renders removable chips for filters carried over from other tabs', async () => {
    const user = userEvent.setup()
    const onRemoveExternalFilter = vi.fn()
    render(
      <LibraryFilters
        filters={EMPTY_FILTERS}
        onChange={vi.fn()}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.MODELS, availableFilters)}
        externalFilters={[
          { key: 'clinicalTrialStatus', sectionLabel: 'Status', valueLabel: 'Recruiting', value: 'Recruiting' },
        ]}
        onRemoveExternalFilter={onRemoveExternalFilter}
      />,
    )

    expect(screen.getByText('Filters from other views')).toBeInTheDocument()
    expect(screen.getByText('Status: Recruiting')).toBeInTheDocument()

    await user.click(screen.getByTestId('CancelIcon'))
    expect(onRemoveExternalFilter).toHaveBeenCalledWith(
      { key: 'clinicalTrialStatus', sectionLabel: 'Status', valueLabel: 'Recruiting', value: 'Recruiting' },
    )
  })

  it('shows the Clear button when only external filters are active', () => {
    render(
      <LibraryFilters
        filters={EMPTY_FILTERS}
        onChange={vi.fn()}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.MODELS, availableFilters)}
        externalFilters={[
          { key: 'clinicalTrialStatus', sectionLabel: 'Status', valueLabel: 'Recruiting', value: 'Recruiting' },
        ]}
      />,
    )
    expect(screen.getByText('Clear')).toBeInTheDocument()
  })

  it('does not render the external-filters block when there are none', () => {
    render(
      <LibraryFilters
        filters={EMPTY_FILTERS}
        onChange={vi.fn()}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.DATASETS, availableFilters)}
      />,
    )
    expect(screen.queryByText('Filters from other views')).not.toBeInTheDocument()
  })

  it('shows an active-filter count indicator when the panel is collapsed', () => {
    render(
      <LibraryFilters
        filters={{ ...EMPTY_FILTERS, accessManagement: ['controlled'] }}
        onChange={vi.fn()}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.DATASETS, availableFilters)}
        externalFilters={[
          { key: 'clinicalTrialStatus', sectionLabel: 'Status', valueLabel: 'Recruiting', value: 'Recruiting' },
        ]}
        isOpen={false}
        onToggle={vi.fn()}
      />,
    )
    // One visible section value (accessManagement) + one external filter = 2.
    expect(screen.getByLabelText('2 active filters')).toBeInTheDocument()
    expect(screen.getByText('Filters active')).toBeInTheDocument()
  })

  it('counts a multi-value external filter once so the collapsed indicator is tab-independent', () => {
    render(
      <LibraryFilters
        filters={EMPTY_FILTERS}
        onChange={vi.fn()}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.MODELS, availableFilters)}
        externalFilters={[
          { key: 'dac', sectionLabel: 'DAC', valueLabel: 'DAC A', value: 'A' },
          { key: 'dac', sectionLabel: 'DAC', valueLabel: 'DAC B', value: 'B' },
          { key: 'dac', sectionLabel: 'DAC', valueLabel: 'DAC C', value: 'C' },
        ]}
        isOpen={false}
        onToggle={vi.fn()}
      />,
    )
    // Three dac values are one filter category, so the indicator reads 1 — the
    // same number the Datasets tab would show with dac as a visible section.
    expect(screen.getByLabelText('1 active filters')).toBeInTheDocument()
  })

  it('shows "Show filters" with no indicator when collapsed and nothing is active', () => {
    render(
      <LibraryFilters
        filters={EMPTY_FILTERS}
        onChange={vi.fn()}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.DATASETS, availableFilters)}
        isOpen={false}
        onToggle={vi.fn()}
      />,
    )
    expect(screen.getByText('Show filters')).toBeInTheDocument()
    expect(screen.queryByLabelText(/active filters/)).not.toBeInTheDocument()
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
