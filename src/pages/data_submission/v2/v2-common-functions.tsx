import React from 'react'
import {
  Study,
  StudyProperty,
  StringStudyProperty,
  DateStudyProperty,
} from 'src/pages/data_submission/v2/v2-models'
import { FormField } from 'src/components/forms/forms'

export type MasterChangeHandler = ({ key, value, isValid }: { key: string, value: unknown, isValid: boolean }) => void

export const generateFormTextField = (formData: Study, onChange: MasterChangeHandler, studyProperty: StringStudyProperty, validators: Array<unknown> = []) => {
  return (
    <FormField
      id={studyProperty.key}
      title={studyProperty.fieldTitle}
      placeholder={studyProperty.fieldPlaceholderText}
      validators={validators}
      defaultValue={getStudyPropertyByKey(formData, studyProperty.key)}
      onChange={(input: { key: string, value: unknown, isValid: boolean }) => {
        studyProperty.value = input.value as string
        setStudyPropertyByKey(formData, onChange, input, studyProperty)
      }}
    />
  )
}

export const generateFormDateField = (formData: Study, onChange: MasterChangeHandler, studyProperty: DateStudyProperty, validators: Array<unknown> = [], style: unknown = {}) => {
  return (
    <FormField
      id={studyProperty.key}
      title={studyProperty.fieldTitle}
      placeholder={studyProperty.fieldPlaceholderText}
      validators={validators}
      style={style}
      defaultValue={getStudyPropertyByKey(formData, studyProperty.key)}
      onChange={(input: { key: string, value: unknown, isValid: boolean }) => {
        studyProperty.value = input.value as Date
        setStudyPropertyByKey(formData, onChange, input, studyProperty)
      }}
    />
  )
}

export const setStudyPropertyByKey = (formData: Study, onChange: MasterChangeHandler, input: { isValid: boolean }, propertyInstance: StudyProperty) => {
  if (!input.isValid) {
    return
  }
  formData.properties = formData.properties ?? []
  const filteredProperty = formData.properties.find(prop => prop.key === propertyInstance.key)
  if (filteredProperty) {
    filteredProperty.value = propertyInstance.value
  }
  else {
    formData.properties.push(propertyInstance.toJSON() as StudyProperty)
  }
  onChange({ key: 'properties', value: formData.properties, isValid: input.isValid })
}

export const getStudyPropertyByKey = (formData: Study, key: string) => {
  if (!formData?.properties) {
    return undefined
  }
  const filteredProperty = formData.properties.find(prop => prop.key === key)
  if (filteredProperty) {
    return filteredProperty.value
  }
  else {
    return undefined
  }
}
