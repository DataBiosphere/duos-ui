import { Dataset, DatasetProperty, DatasetTerm, DataUseSummary, StudyProperty } from 'src/types/model'
import { isEmpty } from 'lodash'
import { DAC as Dac } from 'src/libs/ajax/DAC'
import { DACbotRule } from 'src/components/dac_bot/DACBotComponent'

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

export const isOnlyGRUorHMB = (dataUse: DataUseSummary) => {
  const modifiers = new Set(['IRB', 'COL', 'GSO', 'NPU'])
  const primaryCodes = dataUse.primary.map(p => p.code)
  const secondaryCodes = dataUse.secondary?.map(s => s.code)

  return (
    primaryCodes.length === 1
    && (primaryCodes[0] === 'GRU' || primaryCodes[0] === 'HMB')
    && (secondaryCodes?.length === 0 || !secondaryCodes?.some(mod => modifiers.has(mod)))
  )
}

export const getRadarEnabledDatasetsWithRules = async (datasets: DatasetTerm[]) => {
  if (isEmpty(datasets)) return

  // Get unique DAC IDs from datasets that have a DAC ID
  const uniqueDacIds = Array.from(
    new Set(datasets.filter(dataset => dataset.dacId !== undefined).map(dataset => dataset.dacId)),
  )
  const ruleTypesToMatch = new Set(['GRU_V1', 'HMB_V1', 'GRU_DSV1', 'HMB_DSV1'])

  // Fetch DACbot rules for each unique DAC ID
  const dacIdToRules: Record<number, DACbotRule[]> = {}
  await Promise.all(
    uniqueDacIds.map(async (dacId) => {
      const rules: DACbotRule[] = await Dac.fetchDACbotRules(dacId)
      const matchingRules = rules.filter(
        (rule: { activationDate: number, ruleType: string }) => rule.activationDate && ruleTypesToMatch.has(rule.ruleType),
      )
      if (matchingRules.length > 0) {
        dacIdToRules[dacId] = matchingRules
      }
    }),
  )

  // Apply both DAC rule and DataUse (GRU/HMB) filters
  return new Set(datasets
    .filter((dataset: DatasetTerm) =>
      dataset.dacId
      && dacIdToRules[dataset.dacId]
      && isOnlyGRUorHMB(dataset.dataUse),
    )
    .map((dataset: { datasetId: number }) => dataset.datasetId))
}
