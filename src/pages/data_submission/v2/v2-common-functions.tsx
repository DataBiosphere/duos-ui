import React from 'react'
import {
  Study,
  StudyProperty,
  StringStudyProperty,
  DateStudyProperty, BooleanStudyProperty,
} from 'src/pages/data_submission/v2/v2-models'
import { FormField, FormFieldTypes } from 'src/components/forms/forms'
import { set } from 'lodash'

export type MasterChangeHandler = ({ key, value, isValid, remove }: { key: string, value: unknown, isValid: boolean, remove?: boolean }) => void

export const generateStudyPropertyYesNoField = (formData: Study, setStudy: React.Dispatch<React.SetStateAction<Study>>, studyProperty: BooleanStudyProperty) => {
  return (
    <FormField
      id={studyProperty.key}
      title={studyProperty.fieldTitle}
      type={FormFieldTypes.YESNORADIOGROUP}
      defaultValue={getStudyPropertyValueByKey(formData, studyProperty.key)}
      onChange={({ _key, value }: { _key: string, value: boolean }) => {
        studyProperty.value = value
        setStudyPropertyByKey(formData, setStudy, { isValid: true }, studyProperty)
      }}
    />
  )
}

export const generateStudyPropertyFormTextField = (formData: Study, setStudy: React.Dispatch<React.SetStateAction<Study>>, studyProperty: StringStudyProperty, validators: Array<unknown> = []) => {
  return (
    <FormField
      id={studyProperty.key}
      title={studyProperty.fieldTitle}
      placeholder={studyProperty.fieldPlaceholderText}
      validators={validators}
      defaultValue={getStudyPropertyValueByKey(formData, studyProperty.key)}
      onChange={(input: { key: string, value: unknown, isValid: boolean }) => {
        studyProperty.value = input.value as string
        setStudyPropertyByKey(formData, setStudy, input, studyProperty)
      }}
    />
  )
}

export const generateStudyInputFormTextField = (setStudy: React.Dispatch<React.SetStateAction<Study>>, id: string, initialValue: string | undefined, title: string, placeholder: string, validators: Array<unknown> = []) => {
  return (
    <FormField
      id={id}
      title={title}
      placeholder={placeholder}
      validators={validators}
      defaultValue={initialValue}
      onChange={(input: { key: string, value: string, isValid: boolean }) => {
        setStudy((val: Study) => {
          const newForm = structuredClone(val)
          return set(newForm, input.key, input.value)
        })
      }}
    />
  )
}

export const generateStudyPropertyFormDateField = (formData: Study, setStudy: React.Dispatch<React.SetStateAction<Study>>, studyProperty: DateStudyProperty, validators: Array<unknown> = [], style: unknown = {}) => {
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
        setStudyPropertyByKey(formData, setStudy, input, studyProperty)
      }}
    />
  )
}

export const setStudyPropertyByKey = (formData: Study, setStudy: React.Dispatch<React.SetStateAction<Study>>, input: { isValid: boolean }, propertyInstance: StudyProperty) => {
  if (!input.isValid) {
    return
  }
  const studyToUpdate = structuredClone(formData)
  studyToUpdate.properties = studyToUpdate.properties ?? []
  const filteredProperty = studyToUpdate.properties.find(prop => prop.key === propertyInstance.key)
  if (filteredProperty) {
    filteredProperty.value = propertyInstance.value
  }
  else {
    studyToUpdate.properties.push(propertyInstance.toJSON() as StudyProperty)
  }
  setStudy(() => {
    return studyToUpdate
  })
}

export const removeStudyPropertiesByKeys = (study: Study, keys: Set<string>) => {
  if (!study?.properties || !Array.isArray(study.properties)) {
    return study
  }
  else {
    const arr: StudyProperty[] = study.properties
    let i = 0
    while (i < arr.length) {
      if (keys.has(arr[i].key)) {
        arr.splice(i, 1)
      }
      else {
        ++i
      }
    }
  }
}

export const getStudyPropertyValueByKey = (formData: Study, key: string): unknown => {
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
