import { Dataset, DatasetProperty, DatasetTerm, StudyProperty } from 'src/types/model'
import { isEmpty } from 'src/utils/NodashUtil'
import { SoApprovalModel } from 'src/types/library'

export const firstNonEmptyPropertyValue = (dataset: Partial<Dataset>, propertyNames: string[]): string => {
  for (const propertyName of propertyNames) {
    const propertyValue: string[] = []
    if (dataset?.study?.properties) {
      const property = dataset.study.properties?.find((property: StudyProperty) => property.key === propertyName)
      const value = property?.value
      if (value !== undefined) {
        const valueAsIterable = [value]
        propertyValue.push(...valueAsIterable)
      }
    }
    if (dataset?.properties && propertyValue.length === 0) {
      const property = dataset?.properties?.find((property: DatasetProperty) => property.propertyName === propertyName)
      const value = property?.propertyValue
      if (value !== undefined) {
        const valueAsIterable = [value]
        propertyValue.push(...valueAsIterable)
      }
    }
    if (propertyValue.length > 0) {
      return propertyValue.join(', ')
    }
  }
  return ''
}

/**
 * Datasets whose DAC has an automation rule enabled that would auto-approve a matching request,
 * as resolved server-side by the search index. A dataset carrying no flag is treated as
 * ineligible, so the badge is shown only where the index asserts eligibility.
 */
export const getRadarEnabledDatasetIds = (datasets: DatasetTerm[]): Set<number> => {
  if (isEmpty(datasets)) return new Set()

  return new Set(
    datasets
      .filter(dataset => dataset.instantApprovalEligible === true)
      .map(dataset => dataset.datasetId),
  )
}

const BACKEND_SO_APPROVAL_MODELS: Record<string, SoApprovalModel> = {
  PER_REQUEST: 'per-request',
  PRE_AUTHORIZED: 'pre-authorized',
}

/**
 * Maps every supplied dataset to its DAC's Signing Official authorization model, which the search
 * index resolves server-side. A dataset carrying no model, or an unrecognised one, maps to
 * 'unknown' so the grid shows nothing rather than naming the wrong approval process.
 */
export const getSoApprovalModelByDatasetId = (datasets: DatasetTerm[]): Map<number, SoApprovalModel> => {
  const modelByDatasetId = new Map<number, SoApprovalModel>()
  if (isEmpty(datasets)) return modelByDatasetId

  datasets.forEach((dataset) => {
    modelByDatasetId.set(
      dataset.datasetId,
      BACKEND_SO_APPROVAL_MODELS[dataset.soApprovalModel ?? ''] ?? 'unknown',
    )
  })

  return modelByDatasetId
}
