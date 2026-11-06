import React from 'react'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import {
  AlternativeDataSharingPlanTargetDeliveryDate,
  AlternativeDataSharingPlanTargetPublicReleaseDate,
  Study,
} from 'src/pages/data_submission/v2/v2-models'
import {
  generateStudyPropertyFormDateField,
  isPublicVisibilitySameAcrossAssets,
  isTargetDatesSameAcrossAssets,
  updateStudyData,
} from 'src/pages/data_submission/v2/v2-common-functions'
import { InheritanceToggle } from 'src/pages/data_submission/v2/InheritanceToggle'
import {
  STUDY_PUBLIC_VISIBILITY_HELP,
  TARGET_DELIVERY_DATE_HELP,
  TARGET_PUBLIC_RELEASE_DATE_HELP,
} from 'src/pages/data_submission/v2/releaseGuidance'
import { StudyDataKeys } from 'src/libs/data-metadata'
import { set } from 'src/utils/NodashUtil'

const APPLY_TO_ALL_ASSETS_LABEL = 'Apply to all assets in this Study'

export interface StudyReleaseSettingsProps {
  study: Study
  setStudy: React.Dispatch<React.SetStateAction<Study>>
}

/**
 * Target dates and Public Visibility, each with its own "apply to all assets" checkbox. Checked,
 * the value is set here and copied to every dataset on submission; unchecked, each dataset sets it.
 */
export const StudyReleaseSettings = (props: StudyReleaseSettingsProps) => {
  const { study, setStudy } = props
  const datesShared = isTargetDatesSameAcrossAssets(study)
  const visibilityShared = isPublicVisibilitySameAcrossAssets(study)

  // Each box leads with its fields; the apply-to-all choice follows, quieter, since it qualifies them.
  return (
    <>
      <div className="dsf-group" data-cy="study-release-dates">
        <h3>Target Release Dates</h3>
        {datesShared && (
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
            {generateStudyPropertyFormDateField(study, setStudy, new AlternativeDataSharingPlanTargetDeliveryDate(), [FormValidators.DATE], { width: '48%' }, TARGET_DELIVERY_DATE_HELP)}
            {generateStudyPropertyFormDateField(study, setStudy, new AlternativeDataSharingPlanTargetPublicReleaseDate(), [FormValidators.DATE], { width: '48%' }, TARGET_PUBLIC_RELEASE_DATE_HELP)}
          </div>
        )}
        <InheritanceToggle
          variant="subtle"
          id={StudyDataKeys.TARGET_DATES_SAME_ACROSS_ASSETS}
          label={APPLY_TO_ALL_ASSETS_LABEL}
          checked={datesShared}
          onChange={value => updateStudyData(setStudy, { [StudyDataKeys.TARGET_DATES_SAME_ACROSS_ASSETS]: value })}
          note={datesShared
            ? 'These dates are applied to every dataset in this study.'
            : 'Enter a Target Delivery Date and Target Public Release Date on each dataset below.'}
        />
      </div>

      <div className="dsf-group" data-cy="study-visibility">
        <h3>Public Visibility</h3>
        {visibilityShared && (
          <FormField
            id="publicVisibility"
            title="Public Visibility"
            hideTitle={true}
            validators={[FormValidators.REQUIRED]}
            type={FormFieldTypes.RADIOGROUP}
            description={STUDY_PUBLIC_VISIBILITY_HELP}
            name="publicVisibility"
            options={[
              { name: true, text: 'Yes, I want my dataset info to be visible and available for requests' },
              { name: false, text: 'No, I do not want my dataset info to be visible and available for requests' },
            ]}
            defaultValue={study?.publicVisibility}
            onChange={({ key, value }: { key: string, value: unknown }) => {
              setStudy(prev => set(structuredClone(prev), key, value))
            }}
          />
        )}
        <InheritanceToggle
          variant="subtle"
          id={StudyDataKeys.PUBLIC_VISIBILITY_SAME_ACROSS_ASSETS}
          label={APPLY_TO_ALL_ASSETS_LABEL}
          checked={visibilityShared}
          onChange={value => updateStudyData(setStudy, { [StudyDataKeys.PUBLIC_VISIBILITY_SAME_ACROSS_ASSETS]: value })}
          note={visibilityShared
            ? 'This visibility is applied to every dataset in this study.'
            : 'Set visibility on each dataset below. The study is listed publicly only if every dataset is visible.'}
        />
      </div>
    </>
  )
}
