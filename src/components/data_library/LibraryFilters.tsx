import React from 'react'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  IconButton,
  Radio,
  RadioGroup,
  TextField,
  Tooltip,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
  FormControlLabel,
  Skeleton,
} from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { FilterKey, LibraryFilterSection, LibraryFiltersProps } from 'src/types/library'
import { COUNT_BADGE_SX } from 'src/components/data_library/countBadgeStyles'
import { isFilterActive } from 'src/components/data_library/filterRegistry'

const CHECKBOX_FILTER_KEYS = [
  'accessManagement',
  'dataUse',
  'dataType',
  'dac',
  'workspaceTools',
  'workspacePlatform',
  'clinicalTrialStatus',
  'clinicalTrialPhase',
  'clinicalTrialInterventionType',
  'clinicalTrialRegistry',
  'biospecimenType',
  'biospecimenDataUse',
  'biospecimenPostMortemIntervalUnit',
] as const

type CheckboxFilterKey = (typeof CHECKBOX_FILTER_KEYS)[number]

const isCheckboxFilterKey = (key: FilterKey): key is CheckboxFilterKey =>
  (CHECKBOX_FILTER_KEYS as readonly string[]).includes(key)

export const LibraryFilters: React.FC<LibraryFiltersProps> = React.memo(({
  filters,
  onChange,
  onClear,
  sections,
  loading = false,
  isOpen = true,
  onToggle,
  externalFilters = [],
  onRemoveExternalFilter,
}) => {
  const handleFilterToggle = (category: keyof typeof filters, value: string) => {
    const currentValues = filters[category] as string[]
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]

    onChange({
      ...filters,
      [category]: newValues,
    })
  }

  const handleParticipantChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : Number.parseInt(value)
    onChange({
      ...filters,
      participantCount: {
        ...filters.participantCount,
        [type]: numValue,
      },
    })
  }

  const handlePostMortemIntervalChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : Number.parseInt(value)
    onChange({
      ...filters,
      biospecimenPostMortemInterval: {
        ...filters.biospecimenPostMortemInterval,
        [type]: numValue,
      },
    })
  }

  const hasInvalidClinicalTrialDateRange = !!(
    filters.clinicalTrialDates.startDate
    && filters.clinicalTrialDates.endDate
    && filters.clinicalTrialDates.startDate > filters.clinicalTrialDates.endDate
  )

  const hasPostMortemIntervalValue = (
    filters.biospecimenPostMortemInterval.min !== undefined
    || filters.biospecimenPostMortemInterval.max !== undefined
  )
  const hasPostMortemIntervalWithoutUnit = hasPostMortemIntervalValue
    && filters.biospecimenPostMortemIntervalUnit.length === 0

  // Delegate the per-key "is this filter active" decision to the shared
  // isFilterActive helper so the collapsed-panel active-filter count and the
  // external filter chips (getExternalActiveFilters) can never disagree.
  const hasSectionValue = (section: LibraryFilterSection) => isFilterActive(section.key, filters)

  // Active if a visible section has a value or a filter carried over from
  // another tab is still applied. Count by filter category (not by selected
  // value) on both sides so the indicator is stable regardless of which tab is
  // active — a visible multi-select section counts once, and an external filter
  // counts once even though it contributes one chip per selected value.
  const activeSectionCount = sections.filter(hasSectionValue).length
  const externalFilterCount = new Set(externalFilters.map(chip => chip.key)).size
  const activeFilterCount = activeSectionCount + externalFilterCount
  const hasActiveFilters = activeFilterCount > 0

  const renderCheckboxSection = (section: LibraryFilterSection) => {
    const { key, label, options = [] } = section
    if (!isCheckboxFilterKey(key)) {
      return null
    }
    return (
      <Accordion key={key} defaultExpanded={key === 'accessManagement'}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{label}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {options.length === 0
            ? (
                <Typography variant="body2" color="text.secondary">
                  No filters available
                </Typography>
              )
            : (
                <FormGroup>
                  {options.map(option => (
                    <FormControlLabel
                      key={option.value}
                      control={(
                        <Checkbox
                          checked={(filters[key]).includes(option.value)}
                          onChange={() => handleFilterToggle(key, option.value)}
                          size="small"
                        />
                      )}
                      label={(
                        <Typography variant="body2">
                          {option.label}
                          {option.count !== undefined && ` (${option.count})`}
                        </Typography>
                      )}
                    />
                  ))}
                </FormGroup>
              )}
        </AccordionDetails>
      </Accordion>
    )
  }

  const renderParticipantSection = (label: string) => (
    <Accordion key="participantCount">
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{label}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            type="number"
            label="Minimum"
            size="small"
            value={filters.participantCount.min ?? ''}
            onChange={e => handleParticipantChange('min', e.target.value)}
            slotProps={{
              htmlInput: {
                min: sections.find(section => section.key === 'participantCount')?.range?.min,
                max: sections.find(section => section.key === 'participantCount')?.range?.max,
              },
            }}
          />
          <TextField
            type="number"
            label="Maximum"
            size="small"
            value={filters.participantCount.max ?? ''}
            onChange={e => handleParticipantChange('max', e.target.value)}
            slotProps={{
              htmlInput: {
                min: sections.find(section => section.key === 'participantCount')?.range?.min,
                max: sections.find(section => section.key === 'participantCount')?.range?.max,
              },
            }}
          />
        </Box>
      </AccordionDetails>
    </Accordion>
  )

  const renderPostMortemIntervalSection = (section: LibraryFilterSection) => (
    <Accordion key="biospecimenPostMortemInterval">
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{section.label}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            type="number"
            label="Minimum"
            size="small"
            value={filters.biospecimenPostMortemInterval.min ?? ''}
            onChange={e => handlePostMortemIntervalChange('min', e.target.value)}
            slotProps={{
              htmlInput: {
                min: section.range?.min,
                max: section.range?.max,
              },
            }}
          />
          <TextField
            type="number"
            label="Maximum"
            size="small"
            value={filters.biospecimenPostMortemInterval.max ?? ''}
            onChange={e => handlePostMortemIntervalChange('max', e.target.value)}
            slotProps={{
              htmlInput: {
                min: section.range?.min,
                max: section.range?.max,
              },
            }}
          />
          {hasPostMortemIntervalWithoutUnit && (
            <Typography color="warning.main" variant="body2">
              Select a post-mortem interval unit to avoid ambiguous results.
            </Typography>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  )

  const renderDateSection = (
    key: 'clinicalTrialDates' | 'biospecimenCollectionDate' | 'ipFiledDate' | 'fundingDate',
    label: string,
  ) => {
    const dateFieldsBySection = {
      clinicalTrialDates: [
        { stateKey: 'startDate', label: 'Start Date' },
        { stateKey: 'endDate', label: 'End Date' },
      ],
      biospecimenCollectionDate: [
        { stateKey: 'before', label: 'Collected Before' },
        { stateKey: 'after', label: 'Collected After' },
      ],
      ipFiledDate: [
        { stateKey: 'before', label: 'Filed Before' },
        { stateKey: 'after', label: 'Filed After' },
      ],
      fundingDate: [
        { stateKey: 'startDate', label: 'Start Date' },
        { stateKey: 'endDate', label: 'End Date' },
      ],
    } as const

    const dateFields = dateFieldsBySection[key]

    return (
      <Accordion key={key}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{label}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {dateFields.map(dateField => (
              <TextField
                key={dateField.stateKey}
                type="date"
                label={dateField.label}
                size="small"
                slotProps={{
                  inputLabel: { shrink: true },
                }}
                value={(filters[key] as Record<string, string | undefined>)[dateField.stateKey] || ''}
                onChange={(event) => {
                  onChange({
                    ...filters,
                    [key]: {
                      ...(filters[key] as Record<string, string | undefined>),
                      [dateField.stateKey]: event.target.value || undefined,
                    },
                  })
                }}
                error={key === 'clinicalTrialDates' && hasInvalidClinicalTrialDateRange}
                helperText={
                  key === 'clinicalTrialDates' && dateField.stateKey === 'endDate' && hasInvalidClinicalTrialDateRange
                    ? 'Start Date cannot be after End Date'
                    : undefined
                }
              />
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
    )
  }

  const renderBooleanSection = (key: 'datasetsCited' | 'publicationsDatasetsCited', label: string) => (
    <Accordion key={key}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{label}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <FormControl>
          <RadioGroup
            aria-label={label}
            value={filters[key] === undefined ? '' : String(filters[key])}
            onChange={(event) => {
              const value = event.target.value
              onChange({
                ...filters,
                [key]: value === '' ? undefined : value === 'true',
              })
            }}
          >
            {(sections.find(section => section.key === key)?.options || []).map(option => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio size="small" />}
                label={option.label}
              />
            ))}
            <FormControlLabel
              value=""
              control={<Radio size="small" />}
              label="Any"
            />
          </RadioGroup>
        </FormControl>
      </AccordionDetails>
    </Accordion>
  )

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: isOpen ? 'row' : 'column',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          {onToggle && (
            <Tooltip title={isOpen ? 'Collapse filters' : 'Show filters'} placement="right">
              <IconButton size="small" onClick={onToggle} aria-label={isOpen ? 'Collapse filters' : 'Show filters'}>
                {isOpen ? <ChevronLeftIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
          {isOpen && <Typography variant="h6">Filters</Typography>}
          {!isOpen && onToggle && (
            <>
              {activeFilterCount > 0 && (
                <Box
                  component="button"
                  type="button"
                  aria-label={`${activeFilterCount} active filters`}
                  onClick={onToggle}
                  sx={{
                    ...COUNT_BADGE_SX,
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    border: 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  {activeFilterCount}
                </Box>
              )}
              <Typography
                variant="caption"
                onClick={onToggle}
                sx={{
                  writingMode: 'vertical-rl',
                  cursor: 'pointer',
                  color: 'text.secondary',
                  fontSize: '11px',
                  userSelect: 'none',
                }}
              >
                {activeFilterCount > 0 ? 'Filters active' : 'Show filters'}
              </Typography>
            </>
          )}
        </Box>
        {isOpen && hasActiveFilters && (
          <Button size="small" onClick={onClear}>
            Clear
          </Button>
        )}
      </Box>

      {isOpen && externalFilters.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Filters from other views
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {externalFilters.map(chip => (
              <Chip
                key={`${chip.key}:${chip.value ?? ''}`}
                size="small"
                variant="outlined"
                label={`${chip.sectionLabel}: ${chip.valueLabel}`}
                onDelete={onRemoveExternalFilter ? () => onRemoveExternalFilter(chip) : undefined}
              />
            ))}
          </Box>
        </Box>
      )}

      {isOpen && (loading
        ? (
            <>
              <Skeleton height={60} />
              <Skeleton height={60} />
              <Skeleton height={60} />
            </>
          )
        : (
            <>
              {sections.map((section) => {
                if (section.key === 'participantCount') {
                  return renderParticipantSection(section.label)
                }

                if (section.key === 'biospecimenPostMortemInterval') {
                  return renderPostMortemIntervalSection(section)
                }

                if (section.key === 'datasetsCited' || section.key === 'publicationsDatasetsCited') {
                  return renderBooleanSection(section.key, section.label)
                }

                if (
                  section.key === 'clinicalTrialDates'
                  || section.key === 'biospecimenCollectionDate'
                  || section.key === 'ipFiledDate'
                  || section.key === 'fundingDate'
                ) {
                  return renderDateSection(section.key, section.label)
                }

                return renderCheckboxSection(section)
              })}
            </>
          )
      )}
    </Box>
  )
})

LibraryFilters.displayName = 'LibraryFilters'

export default LibraryFilters
