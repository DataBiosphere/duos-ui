import React from 'react'
import { FormField, FormFieldTypes } from 'src/components/forms/forms'

export interface InheritanceToggleProps {
  readonly id: string
  readonly label: string
  readonly checked: boolean
  readonly onChange: (checked: boolean) => void
  /** What checking means for the fields it governs; shown under the checkbox. */
  readonly note: string
  /**
   * 'subtle' is a quiet line beside the fields it qualifies, so the fields keep the emphasis; every
   * apply-to-all setting in the study form uses it. 'callout' (default) is a card that stands out.
   */
  readonly variant?: 'callout' | 'subtle'
}

/**
 * The "same across all assets" checkbox, drawn as a callout paired with the fields it governs so
 * it reads as a setting for that whole group rather than one more field in it.
 */
export const InheritanceToggle = (props: InheritanceToggleProps) => {
  const { id, label, checked, onChange, note, variant = 'callout' } = props
  return (
    <div className={`dsf-section-toggle dsf-section-toggle--${variant} ${checked ? 'is-checked' : ''}`} data-cy={`${id}-toggle`}>
      <FormField
        id={id}
        type={FormFieldTypes.CHECKBOX}
        toggleText={label}
        defaultValue={checked}
        onChange={({ value }: { value: boolean }) => onChange(value)}
      />
      <p className="dsf-subtitle dsf-section-toggle-note" id={`${id}-note`}>{note}</p>
    </div>
  )
}
