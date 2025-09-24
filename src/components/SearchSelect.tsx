import React, { useState, useEffect } from 'react'
import './SearchSelect.css'
import { FormField, FormFieldTypes } from './forms/forms'

type Option = {
  key: string | number
  displayText: string
}

type SearchSelectProps = {
  onSelection: (selection: never) => void
  placeholder: string
  options: Option[]
  value: string
  isClearable: boolean
  disabled?: boolean
}

export const SearchSelect: React.FC<SearchSelectProps> = (props: SearchSelectProps) => {
  const { onSelection, placeholder, options, value, isClearable, disabled = false } = props
  const [selectedOption, setSelectedOption] = useState<Option | undefined>()

  useEffect(() => {
    const selected = options.find(option => option.key === value)
    setSelectedOption(selected)
  }, [value, options])

  return (
    <FormField
      id={'form_field_selection_id_' + value}
      type={FormFieldTypes.SELECT}
      selectOptions={options}
      placeholder={placeholder}
      isCreatable={false}
      defaultValue={selectedOption}
      isClearable={isClearable}
      onChange={onSelection}
      disabled={disabled}
    >
    </FormField>
  )
}
