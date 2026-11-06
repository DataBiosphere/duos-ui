import React from 'react'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { PopulationMetadata } from 'src/libs/data-metadata'
import { AgeRangeSlider } from 'src/pages/data_submission/v2/AgeRangeSlider'
import { GeographyPicker } from 'src/pages/data_submission/v2/GeographyPicker'
import {
  POPULATION_ANCESTRY_OPTIONS,
  POPULATION_FIELD_TITLES,
  POPULATION_SEX_OPTIONS,
  PopulationField,
  PopulationValidation,
} from 'src/pages/data_submission/v2/population'

export interface PopulationFieldsProps {
  /** Prefixes field ids so the study and an open dataset form never share an id on one page. */
  readonly idPrefix: string
  readonly population: PopulationMetadata | undefined
  readonly onChange: (population: PopulationMetadata) => void
  /** Only passed by forms that validate on their own; otherwise each field validates itself. */
  readonly validation?: PopulationValidation
  readonly disabled?: boolean
  /** False where the population is optional: the study-level population shared by every dataset. */
  readonly required?: boolean
}

export const PopulationFields = (props: PopulationFieldsProps) => {
  const { idPrefix, population, onChange, validation, disabled, required = true } = props
  const validators = required ? [FormValidators.REQUIRED] : []
  const update = (field: PopulationField, value: unknown) => {
    onChange({ ...population, [field]: value })
  }

  return (
    <>
      <AgeRangeSlider
        id={`${idPrefix}ageRange`}
        title={POPULATION_FIELD_TITLES.ageRange}
        value={population?.ageRange}
        required={required}
        validation={validation?.ageRange}
        disabled={disabled}
        onChange={value => update('ageRange', value)}
      />
      <FormField
        id={`${idPrefix}sex`}
        title={POPULATION_FIELD_TITLES.sex}
        type={FormFieldTypes.BUTTONGROUP}
        allowCustom={true}
        isMulti={true}
        options={POPULATION_SEX_OPTIONS}
        validators={validators}
        validation={validation?.sex}
        defaultValue={population?.sex ?? []}
        disabled={disabled}
        onChange={({ value }: { value: string[] }) => update('sex', value)}
      />
      <FormField
        id={`${idPrefix}ancestry`}
        title={POPULATION_FIELD_TITLES.ancestry}
        type={FormFieldTypes.BUTTONGROUP}
        allowCustom={true}
        isMulti={true}
        options={POPULATION_ANCESTRY_OPTIONS}
        validators={validators}
        validation={validation?.ancestry}
        defaultValue={population?.ancestry ?? []}
        disabled={disabled}
        onChange={({ value }: { value: string[] }) => update('ancestry', value)}
      />
      <GeographyPicker
        id={`${idPrefix}geography`}
        title={POPULATION_FIELD_TITLES.geography}
        value={population?.geography}
        required={required}
        validation={validation?.geography}
        disabled={disabled}
        onChange={value => update('geography', value)}
      />
    </>
  )
}
