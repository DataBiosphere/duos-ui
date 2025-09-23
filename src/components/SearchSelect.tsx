import React, { useState, useEffect } from 'react'
import './SearchSelect.css'
import { FormField, FormFieldTypes } from './forms/forms'

type Option = {
  key: string
  displayText: string
}

type SearchSelectProps = {
  onSelection: (selection: never) => void
  placeholder: string
  options: Option[]
  value: string
  isClearable: boolean
  disabled: boolean
}

export const SearchSelect: React.FC<SearchSelectProps> = (props: SearchSelectProps) => {
  const { onSelection, placeholder, options, value, isClearable, disabled } = props
  const [selectedInstitution, setSelectedInstitution] = useState<Option | undefined>()

  useEffect(() => {
    const selected = options.find(o => o.key === value)
    setSelectedInstitution(selected)
  }, [value, options])

  return (
    <FormField
      id={'form_field_selection_id_' + value}
      type={FormFieldTypes.SELECT}
      selectOptions={options.map(i => ({
        institutionId: i?.key,
        displayText: i?.displayText,
      }))}
      placeholder={placeholder}
      isCreatable={false}
      defaultValue={{
        institutionId: selectedInstitution?.key,
        displayText: selectedInstitution?.displayText,
      }}
      isClearable={isClearable}
      onChange={onSelection}
      disabled={disabled}
    >
    </FormField>
  )
}
