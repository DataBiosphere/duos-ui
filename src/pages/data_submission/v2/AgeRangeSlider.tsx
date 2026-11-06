import React from 'react'
import Slider from '@mui/material/Slider'
import { FormFieldTitle } from 'src/components/forms/forms'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'
import { PopulationMetadata } from 'src/libs/data-metadata'
import { AGE_RANGE_TOP, formatAge, formatAgeRange } from 'src/pages/data_submission/v2/population'

type AgeRange = NonNullable<PopulationMetadata['ageRange']>

const MARKS = [0, 18, 30, 45, 65, AGE_RANGE_TOP].map(value => ({ value, label: formatAge(value) }))

export interface AgeRangeSliderProps {
  readonly id: string
  readonly title: string
  readonly value: AgeRange | undefined
  readonly onChange: (value: AgeRange | undefined) => void
  readonly required?: boolean
  readonly validation?: ValidationError
  readonly disabled?: boolean
}

/**
 * Two handles over 0 to 90+. An unset range shows the full span greyed out and reads "Not set", so
 * an untouched slider is never mistaken for a submitter having chosen 0 to 90+.
 */
export const AgeRangeSlider = (props: AgeRangeSliderProps) => {
  const { id, title, value, onChange, required, validation, disabled } = props
  const invalid = validation?.valid === false
  const shown: number[] = value ? [value.min, value.max] : [0, AGE_RANGE_TOP]

  return (
    <div className={`formField-container formField-${id} age-range-slider`} data-cy={id}>
      <FormFieldTitle id={id} title={title} required={required} validation={validation} disabled={disabled} />
      <div className="age-range-slider-summary">
        <span id={`${id}-value`} aria-live="polite" className={value ? '' : 'age-range-slider-unset'}>
          {formatAgeRange(value)}
        </span>
        {value && !disabled && (
          <button type="button" className="age-range-slider-clear" id={`${id}-clear`} onClick={() => onChange(undefined)}>
            Clear
          </button>
        )}
      </div>
      <Slider
        id={id}
        value={shown}
        min={0}
        max={AGE_RANGE_TOP}
        step={1}
        marks={MARKS}
        disableSwap
        disabled={disabled}
        valueLabelDisplay="auto"
        valueLabelFormat={formatAge}
        getAriaLabel={index => (index === 0 ? `${title} minimum` : `${title} maximum`)}
        getAriaValueText={formatAge}
        aria-describedby={`${id}-value`}
        className={value ? '' : 'age-range-slider-untouched'}
        onChange={(_event, next) => {
          const [min, max] = next as number[]
          onChange({ min, max })
        }}
      />
      {invalid && <div className="age-range-slider-error" role="alert">Please select an age range</div>}
    </div>
  )
}
