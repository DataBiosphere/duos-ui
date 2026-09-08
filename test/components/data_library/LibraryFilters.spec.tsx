import React, { useState } from 'react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
  dataUseModifiers: [
    { value: 'NPU', label: 'Non-profit Use Only (NPU)' },
    { value: 'IRB', label: 'Ethics Approval Required (IRB)' },
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

const LibraryFiltersWrapper = ({ filters: initialFilters = EMPTY_FILTERS, onChange: externalOnChange, onClear: externalOnClear, loading = false, assetType = AssetType.DATASETS }: Partial<LibraryFiltersProps> & { assetType?: AssetType }) => {
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
      sections={getFilterSectionsForAsset(assetType, availableFilters)}
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

  // Asserted against the registry so a newly registered filter claimed by neither key list,
  // which renders nothing at all, fails here rather than silently
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

  it('toggles a secondary data use condition independently of the primary codes', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LibraryFiltersWrapper filters={{ ...EMPTY_FILTERS, dataUse: ['HMB'] }} onChange={onChange} />)

    await user.click(screen.getByText('Data Use Modifiers'))
    await user.click(screen.getByRole('checkbox', { name: 'Non-profit Use Only (NPU)' }))

    // The primary selection survives, so the two combine rather than replace.
    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_FILTERS,
      dataUse: ['HMB'],
      dataUseModifiers: ['NPU'],
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

  it('marks only the section whose filter is active with a dot', () => {
    render(
      <LibraryFilters
        filters={{ ...EMPTY_FILTERS, accessManagement: ['controlled'] }}
        onChange={vi.fn()}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.DATASETS, availableFilters)}
      />,
    )
    const dots = screen.getAllByLabelText('Filter active')
    expect(dots).toHaveLength(1)
    expect(dots[0].closest('.MuiAccordionSummary-root')).toHaveTextContent('Access Request Process')
  })

  it('shows no section dots when nothing is active', () => {
    render(
      <LibraryFilters
        filters={EMPTY_FILTERS}
        onChange={vi.fn()}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.DATASETS, availableFilters)}
      />,
    )
    expect(screen.queryByLabelText('Filter active')).not.toBeInTheDocument()
  })

  it('marks the post-mortem interval range section, not its unit section', () => {
    render(
      <LibraryFilters
        filters={{ ...EMPTY_FILTERS, biospecimenPostMortemInterval: { min: 5 } }}
        onChange={vi.fn()}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.BIOSPECIMENS, availableFilters)}
      />,
    )
    const dots = screen.getAllByLabelText('Filter active')
    expect(dots).toHaveLength(1)
    // 'Post-mortem Interval' and 'Post-mortem Interval Unit' are separate
    // sections, so an exact match guards against the dot landing on the unit.
    expect(dots[0].closest('.MuiAccordionSummary-root')?.textContent).toBe('Post-mortem Interval')
  })

  it('runs the filter for every complete date reported while editing the year', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <LibraryFilters
        filters={EMPTY_FILTERS}
        onChange={onChange}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.CLINICAL_TRIALS, availableFilters)}
      />,
    )
    await user.click(screen.getByText('Clinical Trial Dates'))
    const startDate = screen.getByLabelText('Start Date')

    // Native date inputs can report each intermediate year as a complete,
    // valid date. Each one must update the search, including years below 1000.
    fireEvent.change(startDate, { target: { value: '0002-05-13' } })
    fireEvent.change(startDate, { target: { value: '0020-05-13' } })
    fireEvent.change(startDate, { target: { value: '0202-05-13' } })
    expect(onChange).toHaveBeenCalledTimes(3)
    expect(onChange).toHaveBeenNthCalledWith(1, expect.objectContaining({
      clinicalTrialDates: { startDate: '0002-05-13' },
    }))
    expect(onChange).toHaveBeenNthCalledWith(2, expect.objectContaining({
      clinicalTrialDates: { startDate: '0020-05-13' },
    }))
    expect(onChange).toHaveBeenNthCalledWith(3, expect.objectContaining({
      clinicalTrialDates: { startDate: '0202-05-13' },
    }))
    expect(startDate).toHaveValue('0202-05-13')

    fireEvent.change(startDate, { target: { value: '2024-05-13' } })
    expect(onChange).toHaveBeenCalledTimes(4)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      clinicalTrialDates: { startDate: '2024-05-13' },
    }))
  })

  it('runs the filter on blur when a date is cleared', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <LibraryFilters
        filters={{ ...EMPTY_FILTERS, clinicalTrialDates: { startDate: '2024-05-13' } }}
        onChange={onChange}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.CLINICAL_TRIALS, availableFilters)}
      />,
    )
    await user.click(screen.getByText('Clinical Trial Dates'))
    const startDate = screen.getByLabelText('Start Date')
    fireEvent.change(startDate, { target: { value: '' } })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.blur(startDate)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      clinicalTrialDates: { startDate: undefined },
    }))
  })

  it('does not clear an existing filter while its date is being replaced', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <LibraryFilters
        filters={{ ...EMPTY_FILTERS, clinicalTrialDates: { startDate: '2023-05-13' } }}
        onChange={onChange}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.CLINICAL_TRIALS, availableFilters)}
      />,
    )
    await user.click(screen.getByText('Clinical Trial Dates'))
    const startDate = screen.getByLabelText('Start Date')

    // The browser emits an empty value while the date is incomplete.
    fireEvent.change(startDate, { target: { value: '' } })
    expect(onChange).not.toHaveBeenCalled()

    fireEvent.change(startDate, { target: { value: '2024-05-13' } })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      clinicalTrialDates: { startDate: '2024-05-13' },
    }))
  })

  it('does not re-run the filter while an empty date field is being filled in', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <LibraryFilters
        filters={EMPTY_FILTERS}
        onChange={onChange}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.CLINICAL_TRIALS, availableFilters)}
      />,
    )
    await user.click(screen.getByText('Clinical Trial Dates'))
    // An incomplete date reads as an empty value, which is already the state.
    fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '' } })
    expect(onChange).not.toHaveBeenCalled()
  })

  it('applies a date with an early year immediately', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <LibraryFilters
        filters={EMPTY_FILTERS}
        onChange={onChange}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.CLINICAL_TRIALS, availableFilters)}
      />,
    )
    await user.click(screen.getByText('Clinical Trial Dates'))
    const startDate = screen.getByLabelText('Start Date')

    fireEvent.change(startDate, { target: { value: '0007-01-01' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      clinicalTrialDates: { startDate: '0007-01-01' },
    }))
  })

  it('flags an inverted clinical-trial range entered with early years', async () => {
    const user = userEvent.setup()
    render(<LibraryFiltersWrapper assetType={AssetType.CLINICAL_TRIALS} />)
    await user.click(screen.getByText('Clinical Trial Dates'))

    const startDate = screen.getByLabelText('Start Date')
    fireEvent.change(startDate, { target: { value: '0007-01-01' } })
    fireEvent.blur(startDate)
    const endDate = screen.getByLabelText('End Date')
    fireEvent.change(endDate, { target: { value: '0004-01-01' } })
    fireEvent.blur(endDate)

    expect(screen.getByText('Start Date cannot be after End Date')).toBeInTheDocument()
  })

  it('flags an inverted funding date range', async () => {
    const user = userEvent.setup()
    render(
      <LibraryFilters
        filters={{ ...EMPTY_FILTERS, fundingDate: { startDate: '2024-01-01', endDate: '2023-01-01' } }}
        onChange={vi.fn()}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.FUNDING_RESOURCES, availableFilters)}
      />,
    )
    await user.click(screen.getByText('Funding Dates'))
    expect(screen.getByText('Start Date cannot be after End Date')).toBeInTheDocument()
  })

  it('flags an inverted before/after range with wording that matches its fields', async () => {
    const user = userEvent.setup()
    render(
      <LibraryFilters
        filters={{ ...EMPTY_FILTERS, biospecimenCollectionDate: { after: '2024-01-01', before: '2020-01-01' } }}
        onChange={vi.fn()}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.BIOSPECIMENS, availableFilters)}
      />,
    )
    await user.click(screen.getByText('Collection Date'))
    expect(screen.getByText('Collected After cannot be later than Collected Before')).toBeInTheDocument()
  })

  it('does not flag a date range that is only half filled in', async () => {
    const user = userEvent.setup()
    render(
      <LibraryFilters
        filters={{ ...EMPTY_FILTERS, fundingDate: { startDate: '2024-01-01' } }}
        onChange={vi.fn()}
        onClear={vi.fn()}
        sections={getFilterSectionsForAsset(AssetType.FUNDING_RESOURCES, availableFilters)}
      />,
    )
    await user.click(screen.getByText('Funding Dates'))
    expect(screen.queryByText('Start Date cannot be after End Date')).not.toBeInTheDocument()
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
