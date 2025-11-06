import React, { useState } from 'react'
import { SelectOptionWithKeyNameAndAbbreviation } from 'src/components/forms/SelectOptionInterface'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'

export interface SelectInterfacePickerSelection {
  displayText: string
  key: string
}

export interface SelectOptionsInterfacePickerProps {
  fieldId: string
  initialValue: string | string[]
  onChange: ({ value, isValid }: { value: SelectInterfacePickerSelection | undefined | SelectInterfacePickerSelection[], isValid: boolean }) => void
  optionList: SelectOptionWithKeyNameAndAbbreviation[]
  fieldTitle: string
  fieldPlaceholder: string
  isRequired?: boolean
  isMulti?: boolean
}

export const SelectOptionsInterfacePicker = (props: SelectOptionsInterfacePickerProps) => {
  const { fieldId, fieldTitle, fieldPlaceholder, initialValue, onChange, optionList, isRequired, isMulti } = props

  const getDisplayName = (value: SelectOptionWithKeyNameAndAbbreviation | undefined) => {
    if (!value) {
      return (`Error loading choice`)
    }
    return (`${value.name} (${value.abbreviation})`)
  }

  const optionsListWithNameAndKey = () => {
    return optionList.map((val) => {
      return { displayText: getDisplayName(val), key: val.key }
    })
  }

  const fullOptionsListWithNameAndKey = optionsListWithNameAndKey()

  const [formattedOptionsList, setFormattedOptionsList] = useState<SelectInterfacePickerSelection[]>(optionsListWithNameAndKey())

  const getInitialValueFromKey = (key: undefined | string | string[]) => {
    if (Array.isArray(key)) {
      return key.map(akey => fullOptionsListWithNameAndKey.find(value => value.key == akey))
    }
    else if (!key) {
      return null
    }
    return fullOptionsListWithNameAndKey.find(value => value.key == key)
  }

  return (
    <FormField
      id={fieldId}
      title={fieldTitle}
      validation={isRequired ? [FormValidators.REQUIRED] : []}
      placeholder={fieldPlaceholder}
      onChange={({ value, isValid }: { value: SelectInterfacePickerSelection | undefined | SelectInterfacePickerSelection[], isValid: boolean }) => {
        if (isValid) {
          if (isMulti && value && Array.isArray(value)) {
            const keys = new Set(value.map(entry => entry.key))
            setFormattedOptionsList(fullOptionsListWithNameAndKey.filter(entry => !keys.has(entry.key)))
          }
          onChange({ value, isValid })
        }
      }}
      type={FormFieldTypes.SELECT}
      defaultValue={getInitialValueFromKey(initialValue)}
      selectOptions={formattedOptionsList}
      isMulti={isMulti}
    />
  )
}
