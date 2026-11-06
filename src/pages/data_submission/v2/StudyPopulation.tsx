import React from 'react'
import { InheritanceToggle } from 'src/pages/data_submission/v2/InheritanceToggle'
import { PhenotypeIndication, Species, Study } from 'src/pages/data_submission/v2/v2-models'
import {
  getStudyPropertyValueByKey,
  setStudyPropertyByKey,
  getStudyDataBag,
  isPopulationSameAcrossAssets,
  updateStudyData,
} from 'src/pages/data_submission/v2/v2-common-functions'
import { PopulationFields } from 'src/pages/data_submission/v2/PopulationFields'
import {
  ANATOMICAL_AREA_OPTIONS,
  PHENOTYPE_OPTIONS,
  SPECIES_OPTIONS,
  formatJoinedOptions,
  formatSpecies,
  parsePhenotypes,
  parseSpecies,
} from 'src/pages/data_submission/v2/population'
import { FormField, FormFieldTypes } from 'src/components/forms/forms'
import { StudyDataKeys } from 'src/libs/data-metadata'

const POPULATION_SAME_ACROSS_ASSETS_LABEL = 'My population is the same across all assets in this Study.'

export interface StudyPopulationProps {
  study: Study
  setStudy: React.Dispatch<React.SetStateAction<Study>>
}

/**
 * Every population field in one place. Species and Phenotype/Indication describe the study as a
 * whole and are always held here; the rest are held here or on each dataset, per the checkbox.
 */
export const StudyPopulation = (props: StudyPopulationProps) => {
  const { study, setStudy } = props
  const sameAcrossAssets = isPopulationSameAcrossAssets(study)
  const population = getStudyDataBag(study).population

  return (
    <div className="dsf-group" data-cy="study-population">
      <h3>Population</h3>
      {/* Paired with the heading: it decides where everything below is entered. */}
      <InheritanceToggle
        variant="subtle"
        id={StudyDataKeys.POPULATION_SAME_ACROSS_ASSETS}
        label={POPULATION_SAME_ACROSS_ASSETS_LABEL}
        checked={sameAcrossAssets}
        onChange={value => updateStudyData(setStudy, { [StudyDataKeys.POPULATION_SAME_ACROSS_ASSETS]: value })}
        note={sameAcrossAssets
          ? 'Age Range, Sex, Ancestry and Geography entered here are applied to every dataset in this study.'
          : 'Enter Age Range, Sex, Ancestry and Geography on each dataset below.'}
      />
      <FormField
        id={Species.key}
        title="Species"
        type={FormFieldTypes.BUTTONGROUP}
        isMulti={true}
        allowCustom={true}
        customPlaceholder="Enter a species"
        options={SPECIES_OPTIONS}
        defaultValue={parseSpecies(getStudyPropertyValueByKey(study, Species.key))}
        onChange={({ value }: { value: string[] }) => {
          setStudyPropertyByKey(study, setStudy, { isValid: true }, new Species(formatSpecies(value ?? [])))
        }}
      />
      <FormField
        id={PhenotypeIndication.key}
        title="Phenotype/Indication Studied"
        type={FormFieldTypes.BUTTONGROUP}
        isMulti={true}
        allowCustom={true}
        customPlaceholder="Enter a phenotype or indication"
        options={PHENOTYPE_OPTIONS}
        defaultValue={parsePhenotypes(getStudyPropertyValueByKey(study, PhenotypeIndication.key))}
        onChange={({ value }: { value: string[] }) => {
          setStudyPropertyByKey(study, setStudy, { isValid: true }, new PhenotypeIndication(formatJoinedOptions(value ?? [])))
        }}
      />
      <FormField
        id={StudyDataKeys.ANATOMICAL_AREAS}
        title="Anatomical Areas of Study"
        type={FormFieldTypes.BUTTONGROUP}
        isMulti={true}
        allowCustom={true}
        customPlaceholder="Enter an anatomical area"
        options={ANATOMICAL_AREA_OPTIONS}
        defaultValue={getStudyDataBag(study).anatomicalAreas ?? []}
        onChange={({ value }: { value: string[] }) => {
          updateStudyData(setStudy, { [StudyDataKeys.ANATOMICAL_AREAS]: value?.length ? value : undefined })
        }}
      />
      {sameAcrossAssets && (
        <PopulationFields
          idPrefix="study-population-"
          population={population}
          onChange={value => updateStudyData(setStudy, { [StudyDataKeys.POPULATION]: value })}
          required={false}
        />
      )}
    </div>
  )
}
