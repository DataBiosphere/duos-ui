import { MasterChangeHandler, Study, StudyProperty } from 'src/pages/data_submission/v2/v2-models'

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
  onChange({ key: 'properties', value: formData.properties })
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
