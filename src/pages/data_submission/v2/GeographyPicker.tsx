import React, { useEffect, useState } from 'react'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { FormField, FormFieldTitle, FormFieldTypes } from 'src/components/forms/forms'
import AddObjectButton from 'src/components/AddObjectButton'
import { Countries } from 'src/libs/ajax/Countries'
import { GeographyMetadata } from 'src/libs/data-metadata'
import { ValidationError } from 'src/pages/dar_application/FormValidationState'
import { cleanGeography, formatGeography, isCompleteGeography, sameGeography } from 'src/pages/data_submission/v2/population'

const TYPED_PARTS = [
  { part: 'region', label: 'State/Department', example: 'e.g. Massachusetts' },
  { part: 'county', label: 'County', example: 'e.g. Suffolk County' },
  { part: 'city', label: 'City/Town', example: 'e.g. Boston' },
] as const

// Consent's ISO-3166 list, fetched once per page and only when a row first needs it.
let countriesRequest: Promise<string[]> | undefined
const loadCountries = (): Promise<string[]> => {
  countriesRequest ??= Countries.getCountries().catch(() => {
    countriesRequest = undefined
    return []
  })
  return countriesRequest
}

const useCountries = (needed: boolean): string[] => {
  const [countries, setCountries] = useState<string[]>([])
  useEffect(() => {
    if (!needed) return
    let current = true
    loadCountries().then((list) => {
      if (current) setCountries(list)
    })
    return () => {
      current = false
    }
  }, [needed])
  return countries
}

/** The places the rows describe: each row with anything in it, cleaned, each place once. */
const placesFrom = (rows: GeographyMetadata[]): GeographyMetadata[] =>
  rows.map(cleanGeography)
    .filter(isCompleteGeography)
    .filter((place, index, all) => all.findIndex(other => sameGeography(other, place)) === index)

const sameList = (a: GeographyMetadata[], b: GeographyMetadata[]) =>
  a.map(formatGeography).join('|').toLowerCase() === b.map(formatGeography).join('|').toLowerCase()

export interface GeographyPickerProps {
  readonly id: string
  readonly title: string
  readonly value: GeographyMetadata[] | undefined
  readonly onChange: (value: GeographyMetadata[]) => void
  readonly required?: boolean
  readonly validation?: ValidationError
  readonly disabled?: boolean
}

/**
 * Places laid out like the PI rows: column titles once, then a row per place with Country,
 * State/Department, County, and City/Town, none required. A row counts once anything is in it;
 * an empty row stays on screen but isn't reported.
 */
export const GeographyPicker = (props: GeographyPickerProps) => {
  const { id, title, value = [], onChange, required, validation, disabled } = props
  const countries = useCountries(!disabled)

  const [rows, setRows] = useState<GeographyMetadata[]>(value.length ? value : [{}])
  // A value replaced from outside (a study loading, an inherited population changing) resets the rows;
  // one that only echoes what the rows already report leaves half-filled rows alone.
  const [prevValue, setPrevValue] = useState(value)
  if (!sameList(prevValue, value)) {
    setPrevValue(value)
    if (!sameList(placesFrom(rows), value)) {
      setRows(value.length ? value : [{}])
    }
  }

  const valueRows = value.length ? value : [{}]
  const shown = disabled ? valueRows : rows

  const updateRows = (next: GeographyMetadata[]) => {
    setRows(next)
    const places = placesFrom(next)
    setPrevValue(places)
    onChange(places)
  }

  const updateRow = (index: number, changes: Partial<GeographyMetadata>) => {
    updateRows(rows.map((row, i) => (i === index ? { ...row, ...changes } : row)))
  }

  return (
    <div className={`formField-container formField-${id} geography-picker`} data-cy={id}>
      <FormFieldTitle
        id={id}
        title={title}
        required={required}
        validation={validation}
        disabled={disabled}
        description="Where participants were recruited or samples were collected. Add a row for each place, filling in as much as you know."
      />
      {/* Column headers, shown once. Each row keeps its own labels for screen readers, hidden on screen. */}
      <div className="dsf-row dsf-person-row dsf-geo-row dsf-person-header" aria-hidden="true">
        <span className="control-label">Country</span>
        {TYPED_PARTS.map(({ label }) => <span className="control-label" key={label}>{label}</span>)}
        <span />
      </div>
      {shown.map((row, index) => (
        // Rows have no identity of their own; each field re-syncs from its defaultValue when one is removed.
        // oxlint-disable-next-line react/no-array-index-key
        <div className="dsf-row dsf-person-row dsf-geo-row" key={index} data-cy={`${id}-row-${index}`}>
          <FormField
            id={`${id}-${index}-country`}
            title="Country"
            placeholder="Search"
            type={FormFieldTypes.SELECT}
            // Creatable: if the country list can't be loaded, the country can still be typed.
            isCreatable={true}
            selectOptions={countries}
            optionsAreString={true}
            defaultValue={row.country ?? ''}
            disabled={disabled}
            onChange={({ value: country }: { value: string }) => updateRow(index, { country: country ?? '' })}
          />
          {TYPED_PARTS.map(({ part, label, example }) => (
            <FormField
              key={part}
              id={`${id}-${index}-${part}`}
              title={label}
              placeholder={example}
              defaultValue={row[part] ?? ''}
              disabled={disabled}
              onChange={({ value: partValue }: { value: string }) => updateRow(index, { [part]: partValue })}
            />
          ))}
          <div className="dsf-row-action">
            {!disabled && rows.length > 1 && (
              <button
                type="button"
                className="dsf-icon-button"
                id={`${id}-${index}-remove`}
                aria-label={`Remove place ${index + 1}`}
                onClick={() => updateRows(rows.filter((_, i) => i !== index))}
              >
                <DeleteOutlinedIcon />
              </button>
            )}
          </div>
        </div>
      ))}
      {validation?.valid === false && <div className="dsf-field-error" role="alert">Add at least one place</div>}
      {!disabled && (
        <AddObjectButton
          id={`${id}-add-btn`}
          label="Add place"
          variant="inline"
          // The next place is usually in the same country, so it starts with the last row's.
          onClick={() => updateRows([...rows, { country: rows.at(-1)?.country }])}
        />
      )}
    </div>
  )
}
