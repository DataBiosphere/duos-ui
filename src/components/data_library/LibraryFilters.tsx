import React from 'react'
import {
  Box,
  Button,
  Checkbox,
  TextField,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
  FormControlLabel,
  Skeleton,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { LibraryFiltersProps } from 'src/types/library'

export const LibraryFilters: React.FC<LibraryFiltersProps> = ({
  filters,
  onChange,
  onClear,
  availableFilters,
  loading = false,
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
    const numValue = value === '' ? undefined : parseInt(value)
    onChange({
      ...filters,
      participantCount: {
        ...filters.participantCount,
        [type]: numValue,
      },
    })
  }

  const hasActiveFilters
    = filters.accessManagement.length > 0
      || filters.dataUse.length > 0
      || filters.dataType.length > 0
      || filters.dac.length > 0
      || filters.participantCount.min !== undefined
      || filters.participantCount.max !== undefined

  return (
    <Box sx={{ width: '14%', padding: '0 1em' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="h6">Filters</Typography>
        {hasActiveFilters && (
          <Button size="small" onClick={onClear}>
            Clear
          </Button>
        )}
      </Box>

      {loading
        ? (
            <>
              <Skeleton height={60} />
              <Skeleton height={60} />
              <Skeleton height={60} />
            </>
          )
        : (
            <>
              {/* Access Management Filter */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Access Management</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormGroup>
                    {availableFilters.accessManagement.map(option => (
                      <FormControlLabel
                        key={option.value}
                        control={(
                          <Checkbox
                            checked={filters.accessManagement.includes(
                              option.value,
                            )}
                            onChange={() =>
                              handleFilterToggle('accessManagement', option.value)}
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
                </AccordionDetails>
              </Accordion>

              {/* Data Use Filter */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Data Use</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormGroup>
                    {availableFilters.dataUse.map(option => (
                      <FormControlLabel
                        key={option.value}
                        control={(
                          <Checkbox
                            checked={filters.dataUse.includes(option.value)}
                            onChange={() =>
                              handleFilterToggle('dataUse', option.value)}
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
                </AccordionDetails>
              </Accordion>

              {/* Data Type Filter */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Data Type</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormGroup>
                    {availableFilters.dataType.map(option => (
                      <FormControlLabel
                        key={option.value}
                        control={(
                          <Checkbox
                            checked={filters.dataType.includes(option.value)}
                            onChange={() =>
                              handleFilterToggle('dataType', option.value)}
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
                </AccordionDetails>
              </Accordion>

              {/* DAC Filter */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">DAC</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <FormGroup>
                    {availableFilters.dac.map(option => (
                      <FormControlLabel
                        key={option.value}
                        control={(
                          <Checkbox
                            checked={filters.dac.includes(option.value)}
                            onChange={() => handleFilterToggle('dac', option.value)}
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
                </AccordionDetails>
              </Accordion>

              {/* Participant Count Filter */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Participants</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      type="number"
                      label="Minimum"
                      size="small"
                      value={filters.participantCount.min || ''}
                      onChange={e =>
                        handleParticipantChange('min', e.target.value)}
                      inputProps={{
                        min: availableFilters.participantCountRange.min,
                        max: availableFilters.participantCountRange.max,
                      }}
                    />
                    <TextField
                      type="number"
                      label="Maximum"
                      size="small"
                      value={filters.participantCount.max || ''}
                      onChange={e =>
                        handleParticipantChange('max', e.target.value)}
                      inputProps={{
                        min: availableFilters.participantCountRange.min,
                        max: availableFilters.participantCountRange.max,
                      }}
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>
            </>
          )}
    </Box>
  )
}

export default LibraryFilters
