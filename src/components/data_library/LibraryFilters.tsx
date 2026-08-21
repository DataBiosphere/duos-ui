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
import { COUNT_BADGE_COLOR, COUNT_BADGE_SX } from 'src/components/data_library/countBadgeStyles'
import { isFilterActive, isInvertedDateRange } from 'src/components/data_library/filterRegistry'
import { muiCheckboxFix, muiTextFieldFix } from 'src/libs/muiThemeFix'

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
  'soApprovalModel',
] as const

type CheckboxFilterKey = (typeof CHECKBOX_FILTER_KEYS)[number]

const isCheckboxFilterKey = (key: FilterKey): key is CheckboxFilterKey =>
  (CHECKBOX_FILTER_KEYS as readonly string[]).includes(key)

const COMPACT_ACCORDION_SX = {
  '&:before': { display: 'none' },
}

const COMPACT_SUMMARY_SX = {
  'minHeight': 40,
  'px': 1,
  '& .MuiAccordionSummary-content': { my: 1 },
}

const COMPACT_DETAILS_SX = {
  px: 1,
  py: 1,
}

// Weight is the only cue left that a section label is a heading: `::before` is
// hidden above and `subtitle2` already resolves to 14px against 12px options.
const SECTION_LABEL_SX = { fontWeight: 600 }

// A dot rather than a number — the count badge pill is sized for digits.
const ACTIVE_DOT_SX = {
  width: 6,
  height: 6,
  flexShrink: 0,
  borderRadius: '50%',
  backgroundColor: COUNT_BADGE_COLOR,
}

const COMPACT_OPTION_ROW_SX = { my: 0 }
const COMPACT_OPTION_CONTROL_SX = { ...muiCheckboxFix, p: 0.5 }
const COMPACT_OPTION_LABEL_SX = { fontSize: '1.2rem' }

const COMPACT_RANGE_FIELD_SX = { flex: 1, minWidth: 0 }

// Two `type="date"` inputs share ~248px here, so Chrome's ~20px picker
// indicator does not fit alongside `mm/dd/yyyy` and would be clipped by the
// sidebar's `overflowX: 'hidden'`. Hidden; the fields stay typeable.
const COMPACT_DATE_FIELD_SX = {
  'flex': 1,
  'minWidth': 0,
  '& input::-webkit-calendar-picker-indicator': { display: 'none' },
}

// `inputLabel` collides with muiTextFieldFix's own, so merge rather than spread.
const DATE_FIELD_SLOT_PROPS = {
  ...muiTextFieldFix,
  inputLabel: { ...muiTextFieldFix.inputLabel, shrink: true },
}

// The two fields each date section renders, plus the message shown when their
// bounds cross. The inversion rule itself lives in isInvertedDateRange so the
// panel, the active-filter indicator and the query cannot disagree.
const DATE_SECTION_CONFIG = {
  clinicalTrialDates: {
    fields: [
      { stateKey: 'startDate', label: 'Start Date' },
      { stateKey: 'endDate', label: 'End Date' },
    ],
    invertedMessage: 'Start Date cannot be after End Date',
  },
  biospecimenCollectionDate: {
    fields: [
      { stateKey: 'before', label: 'Collected Before' },
      { stateKey: 'after', label: 'Collected After' },
    ],
    invertedMessage: 'Collected After cannot be later than Collected Before',
  },
  ipFiledDate: {
    fields: [
      { stateKey: 'before', label: 'Filed Before' },
      { stateKey: 'after', label: 'Filed After' },
    ],
    invertedMessage: 'Filed After cannot be later than Filed Before',
  },
  fundingDate: {
    fields: [
      { stateKey: 'startDate', label: 'Start Date' },
      { stateKey: 'endDate', label: 'End Date' },
    ],
    invertedMessage: 'Start Date cannot be after End Date',
  },
} as const

type DateFilterSectionKey = keyof typeof DATE_SECTION_CONFIG

// Native date inputs report an empty value both when explicitly cleared and
// while an existing date is being edited. Keep that ambiguous empty value local
// until blur; every complete value still commits immediately.
const isCompleteDate = (value: string) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value)

interface DateFilterFieldProps {
  label: string
  value: string
  error: boolean
  errorId?: string
  onCommit: (value: string | undefined) => void
}

/**
 * A `type="date"` filter input that keeps in-progress dates local: while typing
 * it commits every date that reads as finished, including years below 1000,
 * and on blur it commits any complete value not already applied. The draft
 * state is not optional: React
 * restores a controlled input's DOM value after a change event that leaves the
 * rendered value untouched, so suppressing the commit alone would wipe every
 * segment the moment a date became complete.
 */
const DateFilterField: React.FC<DateFilterFieldProps> = ({ label, value, error, errorId, onCommit }) => {
  const [draft, setDraft] = React.useState(value)

  // Adopt values that changed upstream (Clear, a removed chip, a tab switch)
  // without clobbering a date the user is part-way through typing: while the
  // date is incomplete `value` does not change, so this does not fire. Adjusted
  // during render rather than in an effect so the stale draft is never painted.
  const [prevValue, setPrevValue] = React.useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    setDraft(value)
  }

  return (
    <TextField
      type="date"
      label={label}
      size="small"
      sx={COMPACT_DATE_FIELD_SX}
      slotProps={{
        ...DATE_FIELD_SLOT_PROPS,
        htmlInput: { 'aria-describedby': errorId },
      }}
      value={draft}
      error={error}
      onChange={(event) => {
        const next = event.target.value
        setDraft(next)
        if (next !== '' && isCompleteDate(next) && next !== value) {
          onCommit(next || undefined)
        }
      }}
      // Blur resolves an empty draft as an intentional clear and also remains
      // a fallback for browsers that defer completed-date change events.
      onBlur={() => {
        if (isCompleteDate(draft) && draft !== value) {
          onCommit(draft || undefined)
        }
      }}
    />
  )
}

// Yes/No/Any radio groups. A registered key claimed by neither this list nor
// CHECKBOX_FILTER_KEYS renders nothing at all.
const BOOLEAN_FILTER_KEYS = [
  'datasetsCited',
  'publicationsDatasetsCited',
  'instantApproval',
] as const

type BooleanFilterKey = (typeof BOOLEAN_FILTER_KEYS)[number]

const isBooleanFilterKey = (key: FilterKey): key is BooleanFilterKey =>
  (BOOLEAN_FILTER_KEYS as readonly string[]).includes(key)

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

  const renderSectionLabel = (key: FilterKey, label: string) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, overflow: 'hidden' }}>
      <Typography variant="subtitle2" sx={SECTION_LABEL_SX} title={label} noWrap>{label}</Typography>
      {isFilterActive(key, filters) && (
        <Box component="span" role="img" aria-label="Filter active" sx={ACTIVE_DOT_SX} />
      )}
    </Box>
  )

  const renderCheckboxSection = (section: LibraryFilterSection) => {
    const { key, label, options = [] } = section
    if (!isCheckboxFilterKey(key)) {
      return null
    }
    return (
      <Accordion key={key} disableGutters defaultExpanded={key === 'accessManagement'} sx={COMPACT_ACCORDION_SX}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={COMPACT_SUMMARY_SX}>
          {renderSectionLabel(key, label)}
        </AccordionSummary>
        <AccordionDetails sx={COMPACT_DETAILS_SX}>
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
                      sx={COMPACT_OPTION_ROW_SX}
                      control={(
                        <Checkbox
                          checked={(filters[key]).includes(option.value)}
                          onChange={() => handleFilterToggle(key, option.value)}
                          size="small"
                          sx={COMPACT_OPTION_CONTROL_SX}
                        />
                      )}
                      label={(
                        <Typography variant="body2" sx={COMPACT_OPTION_LABEL_SX}>
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

  const renderParticipantSection = (section: LibraryFilterSection) => (
    <Accordion key="participantCount" disableGutters sx={COMPACT_ACCORDION_SX}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={COMPACT_SUMMARY_SX}>
        {renderSectionLabel('participantCount', section.label)}
      </AccordionSummary>
      <AccordionDetails sx={COMPACT_DETAILS_SX}>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
          <TextField
            type="number"
            label="Minimum"
            size="small"
            sx={COMPACT_RANGE_FIELD_SX}
            value={filters.participantCount.min ?? ''}
            onChange={e => handleParticipantChange('min', e.target.value)}
            slotProps={{
              ...muiTextFieldFix,
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
            sx={COMPACT_RANGE_FIELD_SX}
            value={filters.participantCount.max ?? ''}
            onChange={e => handleParticipantChange('max', e.target.value)}
            slotProps={{
              ...muiTextFieldFix,
              htmlInput: {
                min: section.range?.min,
                max: section.range?.max,
              },
            }}
          />
        </Box>
      </AccordionDetails>
    </Accordion>
  )

  const renderPostMortemIntervalSection = (section: LibraryFilterSection) => (
    <Accordion key="biospecimenPostMortemInterval" disableGutters sx={COMPACT_ACCORDION_SX}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={COMPACT_SUMMARY_SX}>
        {renderSectionLabel('biospecimenPostMortemInterval', section.label)}
      </AccordionSummary>
      <AccordionDetails sx={COMPACT_DETAILS_SX}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
            <TextField
              type="number"
              label="Minimum"
              size="small"
              sx={COMPACT_RANGE_FIELD_SX}
              value={filters.biospecimenPostMortemInterval.min ?? ''}
              onChange={e => handlePostMortemIntervalChange('min', e.target.value)}
              slotProps={{
                ...muiTextFieldFix,
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
              sx={COMPACT_RANGE_FIELD_SX}
              value={filters.biospecimenPostMortemInterval.max ?? ''}
              onChange={e => handlePostMortemIntervalChange('max', e.target.value)}
              slotProps={{
                ...muiTextFieldFix,
                htmlInput: {
                  min: section.range?.min,
                  max: section.range?.max,
                },
              }}
            />
          </Box>
          {hasPostMortemIntervalWithoutUnit && (
            <Typography color="warning.main" variant="body2" sx={COMPACT_OPTION_LABEL_SX}>
              Select a post-mortem interval unit to avoid ambiguous results.
            </Typography>
          )}
        </Box>
      </AccordionDetails>
    </Accordion>
  )

  const renderDateSection = (key: DateFilterSectionKey, label: string) => {
    const { fields, invertedMessage } = DATE_SECTION_CONFIG[key]
    const hasDateRangeError = isInvertedDateRange(key, filters)
    // The error moved out of `helperText`, so wire aria-describedby by hand —
    // otherwise the fields are aria-invalid with no reachable explanation.
    const dateRangeErrorId = hasDateRangeError ? `${key}-date-range-error` : undefined

    return (
      <Accordion key={key} disableGutters sx={COMPACT_ACCORDION_SX}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={COMPACT_SUMMARY_SX}>
          {renderSectionLabel(key, label)}
        </AccordionSummary>
        <AccordionDetails sx={COMPACT_DETAILS_SX}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1 }}>
              {fields.map(dateField => (
                <DateFilterField
                  key={dateField.stateKey}
                  label={dateField.label}
                  value={(filters[key] as Record<string, string | undefined>)[dateField.stateKey] || ''}
                  error={hasDateRangeError}
                  errorId={dateRangeErrorId}
                  onCommit={(nextValue) => {
                    onChange({
                      ...filters,
                      [key]: {
                        ...(filters[key] as Record<string, string | undefined>),
                        [dateField.stateKey]: nextValue,
                      },
                    })
                  }}
                />
              ))}
            </Box>
            {/* Full width below the row: as helperText it wraps to 4-5 lines. */}
            {hasDateRangeError && (
              <Typography id={dateRangeErrorId} color="error" variant="body2" sx={COMPACT_OPTION_LABEL_SX}>
                {invertedMessage}
              </Typography>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    )
  }

  const renderBooleanSection = (key: BooleanFilterKey, label: string) => (
    <Accordion key={key} disableGutters sx={COMPACT_ACCORDION_SX}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={COMPACT_SUMMARY_SX}>
        {renderSectionLabel(key, label)}
      </AccordionSummary>
      <AccordionDetails sx={COMPACT_DETAILS_SX}>
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
                sx={COMPACT_OPTION_ROW_SX}
                control={<Radio size="small" sx={COMPACT_OPTION_CONTROL_SX} />}
                label={<Typography variant="body2" sx={COMPACT_OPTION_LABEL_SX}>{option.label}</Typography>}
              />
            ))}
            <FormControlLabel
              value=""
              sx={COMPACT_OPTION_ROW_SX}
              control={<Radio size="small" sx={COMPACT_OPTION_CONTROL_SX} />}
              label={<Typography variant="body2" sx={COMPACT_OPTION_LABEL_SX}>Any</Typography>}
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
          mb: 1,
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
          {isOpen && <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Filters</Typography>}
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
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
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
              <Skeleton height={40} />
              <Skeleton height={40} />
              <Skeleton height={40} />
            </>
          )
        : (
            <>
              {sections.map((section) => {
                if (section.key === 'participantCount') {
                  return renderParticipantSection(section)
                }

                if (section.key === 'biospecimenPostMortemInterval') {
                  return renderPostMortemIntervalSection(section)
                }

                if (isBooleanFilterKey(section.key)) {
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
