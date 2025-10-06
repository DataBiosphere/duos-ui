import React, { useMemo, useState } from 'react'
import { FormField, FormFieldTypes } from './forms'
import { isEmpty, isNil } from 'lodash/fp'
import { Institution } from 'src/libs/ajax/Institution'
import { Notifications } from 'src/libs/utils'

export type InstitutionSelectorProps = {
  title: string
  id: string
  field: number | undefined
  validators: { id: string, isValid: (value: boolean) => boolean, msg: string }[]
  onChange: ({ key, value }: {
    key: string
    value: unknown
  }) => void
}

export type User = {
  email: string
  displayName: string
  createDate: number
  emailPreference: boolean
  eraCommonsId: string
}

export type InstitutionEntity = {
  id: number
  name: string
  dunsNumber: number
  createdDate: string
  createUserId: number
  createUser: User
  updateUser: User | object
}

export const InstitutionSelector = (props: InstitutionSelectorProps) => {
  const { title, id, field, validators, onChange } = props
  const [institutions, setInstitutions] = useState<Array<InstitutionEntity>>([])
  const findInstitutionSelectOption = (id: number): { displayText: string, id: number } => {
    const institution: InstitutionEntity | undefined = institutions.find(inst => inst.id === id)

    return {
      displayText: institution?.name || 'Unknown',
      id: id,
    }
  }

  useMemo(() => {
    const getAllInstitutions = async () => {
      const institutions = await Institution.list()
      setInstitutions(institutions)
    }

    const init = async () => {
      try {
        await getAllInstitutions()
      }
      catch (error) {
        console.error(error)
        Notifications.showError(
          {
            severity: 'error',
            text: 'Error: Unable to initialize data from server',
            timeout: 3500,
            layout: {
              vertical: 'bottom',
              horizontal: 'right',
            },
          })
      }
    }

    init()
  }, [])

  return (
    <FormField
      id={id}
      title={title}
      isRendered={!isEmpty(institutions)}
      validators={validators}
      type={FormFieldTypes.SELECT}
      selectOptions={institutions.map(inst => ({ displayText: inst.name, id: inst.id }))}
      isCreatable={false}
      selectConfig={{}}
      onChange={({ key, value }: { key: string, value: { id: number } | undefined }) => {
        onChange({ key: key, value: value?.id })
      }}
      defaultValue={!isNil(field) ? findInstitutionSelectOption(field) : null}
    />
  )
}
export default InstitutionSelector
