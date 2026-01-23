import React, { useEffect, useState } from 'react'
import { MasterChangeHandler } from 'src/pages/data_submission/v2/v2-common-functions'
import { FormField, FormFieldTypes, FormValidators } from 'src/components/forms/forms'
import { isEmpty, isNil } from 'lodash'
import { Institution } from 'src/libs/ajax/Institution'
import { InstitutionInterface } from 'src/types/model'
import { Notifications } from 'src/libs/utils'

export interface InstitutionPickerProps {
  initialInstitution: number
  fieldTitle: string
  fieldId: string
  isRequired: boolean
  onChange: MasterChangeHandler
}

export const InstitutionPicker = (props: InstitutionPickerProps) => {
  const { initialInstitution, fieldId, fieldTitle, isRequired, onChange } = props
  const [institutionList, setInstitutionList] = useState<InstitutionInterface[]>([])

  useEffect(() => {
    const getAllInstitutions = async () => {
      const institutions = await Institution.list()
      setInstitutionList(institutions)
    }

    const init = async () => {
      try {
        await getAllInstitutions()
      }
      catch (error) {
        Notifications.showError({
          text: 'Error: Unable to initialize data from server' + error,
        })
      }
    }
    init()
  }, [])

  const findInstitutionSelectOption = (id: number) => {
    const institution = institutionList.find(inst => inst.id === id)

    return {
      displayText: institution?.name || 'Unknown',
      id: id,
    }
  }

  const validation = isRequired ? [FormValidators.REQUIRED] : []

  return (
    <FormField
      id={fieldId}
      title={fieldTitle}
      isRendered={!isEmpty(institutionList)}
      validation={validation}
      type={FormFieldTypes.SELECT}
      selectOptions={institutionList.map(inst => ({ displayText: inst.name, id: inst.id }))}
      isCreatable={false}
      selectConfig={{}}
      onChange={({ key, value, isValid }: { key: string, value: { displayText: string, id: number }, isValid: boolean }) => {
        onChange({ key, value: value?.id, isValid })
      }}
      defaultValue={isNil(initialInstitution) ? null : findInstitutionSelectOption(initialInstitution)}
    />
  )
}
