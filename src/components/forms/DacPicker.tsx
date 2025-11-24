import React, { useEffect, useState } from 'react'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { isEmpty, isNil } from 'lodash/fp'
import { Notifications } from 'src/libs/utils'
import { DAC } from 'src/libs/ajax/DAC'
import { DacObject } from 'src/types/model'

export interface DacPickerProps {
  initialDac?: number
  fieldTitle: string
  fieldId: string
  isRequired: boolean
  validation?: unknown
  onChange: ({ key, value, isValid }: { key: string, value: number, isValid: boolean }) => void
}

export const DacPicker = (props: DacPickerProps) => {
  const { initialDac, fieldId, fieldTitle, isRequired, validation, onChange } = props
  const [dacList, setDacList] = useState<DacObject[]>([])

  useEffect(() => {
    const getAllDacs = async () => {
      const dacs = await DAC.list(false)
      setDacList(dacs)
    }

    const init = async () => {
      try {
        await getAllDacs()
      }
      catch (error) {
        Notifications.showError({
          text: 'Error: Unable to initialize data from server' + error,
        })
      }
    }
    init()
  }, [])

  const findDacSelectOption = (id: number) => {
    const dac = dacList.find(dac => dac.dacId === id)

    return {
      displayText: dac?.name || 'Unknown',
      id: id,
    }
  }

  return (
    <FormField
      id={fieldId}
      title={fieldTitle}
      isRendered={!isEmpty(dacList)}
      validation={validation}
      type={FormFieldTypes.SELECT}
      selectOptions={dacList.map(dac => ({ displayText: dac.name, id: dac.dacId }))}
      isCreatable={false}
      selectConfig={{}}
      validators={isRequired ? [FormValidators.REQUIRED] : []}
      onChange={({ key, value, isValid }: { key: string, value: { displayText: string, id: number }, isValid: boolean }) => {
        onChange({ key, value: value?.id, isValid })
      }}
      defaultValue={isNil(initialDac) ? null : findDacSelectOption(initialDac)}
    />
  )
}
