import { Dataset, DatasetProperty, DatasetTerm, DataUseSummary, StudyProperty } from 'src/types/model'
import { isEmpty } from 'src/utils/NodashUtil'
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

const RULE_TYPE_TO_CODE: Record<string, 'GRU' | 'HMB'> = {
  GRU_V1: 'GRU',
  GRU_DSV1: 'GRU',
  HMB_V1: 'HMB',
  HMB_DSV1: 'HMB',
}

export const getRadarEnabledDatasetsWithRules = async (datasets: DatasetTerm[]) => {
  if (isEmpty(datasets)) return

  // Get unique DAC IDs from datasets that have a DAC ID
  const uniqueDacIds = Array.from(
    new Set(datasets.filter(dataset => dataset.dacId !== undefined).map(dataset => dataset.dacId)),
  )

  // Fetch DACbot rules for each unique DAC ID, tracking which specific data use code
  // (GRU or HMB) each DAC has actually enabled auto-approval for
  const dacIdToEnabledCodes: Record<number, Set<'GRU' | 'HMB'>> = {}
  await Promise.all(
    uniqueDacIds.map(async (dacId) => {
      const rules: DACbotRule[] = await Dac.fetchDACbotRules(dacId)
      const enabledCodes = new Set(
        rules
          .filter((rule: { activationDate: number, ruleType: string }) => rule.activationDate && RULE_TYPE_TO_CODE[rule.ruleType])
          .map((rule: { ruleType: string }) => RULE_TYPE_TO_CODE[rule.ruleType]),
      )
      if (enabledCodes.size > 0) {
        dacIdToEnabledCodes[dacId] = enabledCodes
      }
    }),
  )

  // A dataset is only radar-enabled if its DAC has enabled auto-approval for that
  // dataset's own clean GRU/HMB code, not merely enabled it for the other code
  return new Set(datasets
    .filter((dataset: DatasetTerm) => {
      const enabledCodes = dataset.dacId ? dacIdToEnabledCodes[dataset.dacId] : undefined
      return enabledCodes !== undefined
        && isOnlyGRUorHMB(dataset.dataUse)
        && enabledCodes.has(dataset.dataUse.primary[0].code as 'GRU' | 'HMB')
    })
    .map((dataset: { datasetId: number }) => dataset.datasetId))
}
