import React from 'react'
import {
  Study,
  StudyProperty,
  StringStudyProperty,
  DateStudyProperty, BooleanStudyProperty,
} from 'src/pages/data_submission/v2/v2-models'
import { FormField, FormFieldTypes } from 'src/components/forms/forms'

export type MasterChangeHandler = ({ key, value, isValid }: { key: string, value: unknown, isValid: boolean }) => void

export const generateStudyPropertyYesNoField = (formData: Study, onChange: MasterChangeHandler, studyProperty: BooleanStudyProperty) => {
  return (
    <FormField
      id={studyProperty.key}
      title="Is this a multi-center study?"
      type={FormFieldTypes.YESNORADIOGROUP}
      defaultValue={getStudyPropertyValueByKey(formData, studyProperty.key)}
      onChange={({ _key, value }: { _key: string, value: boolean }) => {
        studyProperty.value = value
        setStudyPropertyByKey(formData, onChange, { isValid: true }, studyProperty)
      }}
    />
  )
}

export const generateStudyPropertyFormTextField = (formData: Study, onChange: MasterChangeHandler, studyProperty: StringStudyProperty, validators: Array<unknown> = []) => {
  return (
    <FormField
      id={studyProperty.key}
      title={studyProperty.fieldTitle}
      placeholder={studyProperty.fieldPlaceholderText}
      validators={validators}
      defaultValue={getStudyPropertyValueByKey(formData, studyProperty.key)}
      onChange={(input: { key: string, value: unknown, isValid: boolean }) => {
        studyProperty.value = input.value as string
        setStudyPropertyByKey(formData, onChange, input, studyProperty)
      }}
    />
  )
}

export const generateStudyInputFormTextField = (onChange: MasterChangeHandler, id: string, initialValue: string | undefined, title: string, placeholder: string, validators: Array<unknown> = []) => {
  return (
    <FormField
      id={id}
      title={title}
      placeholder={placeholder}
      validators={validators}
      defaultValue={initialValue}
      onChange={(input: { key: string, value: string, isValid: boolean }) => {
        onChange(input)
      }}
    />
  )
}

export const generateStudyPropertyFormDateField = (formData: Study, onChange: MasterChangeHandler, studyProperty: DateStudyProperty, validators: Array<unknown> = [], style: unknown = {}) => {
  return (
    <FormField
      id={studyProperty.key}
      title={studyProperty.fieldTitle}
      placeholder={studyProperty.fieldPlaceholderText}
      validators={validators}
      style={style}
      defaultValue={getStudyPropertyValueByKey(formData, studyProperty.key)}
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

export const getStudyPropertyValueByKey = (formData: Study, key: string) => {
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
