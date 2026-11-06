import React from 'react'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { FormField, FormFieldTitle, FormFieldTypes } from 'src/components/forms/forms'
import AddObjectButton from 'src/components/AddObjectButton'
import { StorageProfileMetadata } from 'src/libs/data-metadata'
import {
  BYTES_PER_GB,
  FILE_TYPE_OPTIONS,
  REGION_OPTIONS,
  STORAGE_CLASS_OPTIONS,
  STORAGE_TYPE_OPTIONS,
  StorageProfileValidation,
} from 'src/components/consent_group_list/storageProfileUtils'

export interface StorageProfilesProps {
  readonly profiles: StorageProfileMetadata[]
  readonly onChange: (profiles: StorageProfileMetadata[]) => void
  readonly validation?: Record<number, StorageProfileValidation>
  readonly disabled?: boolean
}

/**
 * An empty number input reads as 0, and no count or size here is meaningfully zero, so 0 clears the
 * field. A negative value is kept so validation can flag it rather than it silently disappearing.
 */
const zeroAsUndefined = (value: number | undefined) => (value ? value : undefined)

/** Every file and storage field of a dataset, one boxed row per file/storage profile. */
export const StorageProfiles = (props: StorageProfilesProps) => {
  const { profiles, onChange, validation, disabled } = props

  const update = (index: number, changes: Partial<StorageProfileMetadata>) => {
    onChange(profiles.map((profile, i) => (i === index ? { ...profile, ...changes } : profile)))
  }

  /** Long, provider-specific lists: kept as a searchable, creatable dropdown. */
  const select = (index: number, field: 'storageClass' | 'region', title: string, options: string[]) => (
    <FormField
      id={`storage-${index}-${field}`}
      title={title}
      placeholder="Select or enter"
      type={FormFieldTypes.SELECT}
      isCreatable={true}
      selectOptions={options}
      defaultValue={profiles[index][field] ?? ''}
      onChange={({ value }: { value: string }) => update(index, { [field]: value || undefined })}
      disabled={disabled}
    />
  )

  /** Few, fixed options: every one shown at once as buttons. */
  const buttons = (index: number, field: 'fileType' | 'storageType', title: string, options: string[], allowCustom: boolean) => (
    <FormField
      id={`storage-${index}-${field}`}
      title={title}
      type={FormFieldTypes.BUTTONGROUP}
      options={options}
      allowCustom={allowCustom}
      defaultValue={profiles[index][field] ?? ''}
      onChange={({ value }: { value: string }) => update(index, { [field]: value || undefined })}
      disabled={disabled}
    />
  )

  return (
    <div className="dsf-group" data-cy="storage-profiles">
      <FormFieldTitle
        title="Files & Storage"
        description="Add a profile for each set of files that differ in type, storage, or location."
        disabled={disabled}
      />
      {profiles.map((profile, index) => (
        // Rows have no identity of their own; each field re-syncs from its defaultValue when one is removed.
        // oxlint-disable-next-line react/no-array-index-key
        <div className="dsf-storage-card" key={index} data-cy={`storage-row-${index}`}>
          <div className="dsf-storage-card-header">
            <span className="dsf-storage-card-title">{`Profile ${index + 1}`}</span>
            {!disabled && profiles.length > 1 && (
              <button
                type="button"
                className="dsf-icon-button"
                id={`storage-${index}-remove`}
                aria-label={`Remove file/storage profile ${index + 1}`}
                onClick={() => onChange(profiles.filter((_, i) => i !== index))}
              >
                <DeleteOutlinedIcon />
              </button>
            )}
          </div>
          {buttons(index, 'fileType', 'File Type/Format', FILE_TYPE_OPTIONS, false)}
          {buttons(index, 'storageType', 'Storage Type', STORAGE_TYPE_OPTIONS, true)}
          <div className="dsf-row dsf-storage-row">
            {select(index, 'storageClass', 'Storage Class', STORAGE_CLASS_OPTIONS)}
            {select(index, 'region', 'Region', REGION_OPTIONS)}
            <FormField
              id={`storage-${index}-fileCount`}
              title="File Count"
              placeholder="Number"
              type={FormFieldTypes.NUMBER}
              defaultValue={profile.fileCount ?? ''}
              validation={validation?.[index]?.fileCount}
              onChange={({ value }: { value: number }) => update(index, { fileCount: zeroAsUndefined(value) })}
              disabled={disabled}
            />
            <FormField
              id={`storage-${index}-aggregateFileSize`}
              title="Aggregate Size (GB)"
              placeholder="GB"
              type={FormFieldTypes.NUMBER}
              defaultValue={profile.aggregateFileSizeBytes === undefined ? '' : profile.aggregateFileSizeBytes / BYTES_PER_GB}
              validation={validation?.[index]?.aggregateFileSizeBytes}
              onChange={({ value }: { value: number }) => {
                const gb = zeroAsUndefined(value)
                update(index, { aggregateFileSizeBytes: gb === undefined ? undefined : Math.round(gb * BYTES_PER_GB) })
              }}
              disabled={disabled}
            />
          </div>
        </div>
      ))}
      {!disabled && (
        <AddObjectButton
          id="add-storage-profile-btn"
          label="Add File/Storage Profile"
          variant="inline"
          onClick={() => onChange([...profiles, {}])}
        />
      )}
    </div>
  )
}
