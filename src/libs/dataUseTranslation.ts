import { isNil, isEmpty, filter, join, concat, clone, uniq, head } from 'lodash'
import { OntologyService } from './ontologyService'
import { Notifications } from './utils'
import { DataUse, DataUseSummary, DataUseTerm } from '../types/model'

export const ControlledAccessType = {
  permissions: 'Permissions',
  modifiers: 'Modifiers',
} as const

export type ControlledAccessTypeValue = typeof ControlledAccessType[keyof typeof ControlledAccessType]

export interface TranslationEntry {
  code: string
  description: string
  manualReview?: boolean
  type: ControlledAccessTypeValue
  alternateLabel?: string
}

export interface DiseaseOntology {
  label: string
}

/**
 * Represents Data Access Request information used for translation.
 *
 * Note: Many of these fields are required in the DAR form
 * (see `requiredRusFields` in `darFormUtils.ts`). They are typed as
 * optional here to handle:
 * 1. Legacy DARs that predate when fields became required
 * 2. Newer fields (like aiLlmUse) that don't exist in older DARs
 * 3. Incomplete/draft DARs during form submission
 *
 * Making fields optional lets translation functions handle both new,
 * complete DARs and older, incomplete ones gracefully.
 *
 * Fields required by current DAR form (kept optional for backward
 * compatibility):
 * - aiLlmUse, controls, forProfit, pediatric, illegalBehavior,
 *   sexualDiseases
 * - stigmatizedDiseases, vulnerablePopulation, population,
 *   psychiatricTraits, notHealth
 *
 * Primary purpose fields (form requires at least one of these):
 * - hmb, diseases, poa / populationMigration, methods, or other
 */
export interface DarInfo {
  hmb?: boolean
  poa?: boolean
  populationMigration?: boolean
  diseases?: boolean
  other?: boolean
  otherText?: string
  ontologies?: DiseaseOntology[]
  methods?: boolean
  aiLlmUse?: boolean
  controls?: boolean
  forProfit?: boolean
  gender?: string
  pediatric?: boolean
  illegalBehavior?: boolean
  addiction?: boolean
  sexualDiseases?: boolean
  stigmatizedDiseases?: boolean
  vulnerablePopulation?: boolean
  population?: boolean
  psychiatricTraits?: boolean
  notHealth?: boolean
}

/**
 * Primary source of truth for Data Access Request (purpose) data use translations
 * This constant holds all potential DUO codes that a dar might contain.
 * It is intended to map codes and descriptions for easier viewing.
 */
export const srpTranslations = {
  hmb: {
    code: 'HMB',
    description: 'The primary purpose of the study is to investigate a health/medical/biomedical (or biological) phenomenon or condition.',
    manualReview: false,
    type: ControlledAccessType.permissions,
  },
  poa: {
    code: 'POA',
    description: 'The dataset will be used for the study of Population Origins/Migration patterns.',
    manualReview: true,
    type: ControlledAccessType.permissions,
  },
  diseases: (diseases: DiseaseOntology[]): TranslationEntry => {
    const outputStruct: TranslationEntry = {
      code: 'DS',
      description: 'The dataset will be used for disease related studies',
      manualReview: false,
      type: ControlledAccessType.permissions,
    }
    if (!isEmpty(diseases)) {
      const sortedDiseases = diseases.toSorted((a, b) => a.label.localeCompare(b.label))
      const diseaseArray = sortedDiseases.map(disease => disease.label)
      const diseaseString = diseaseArray.length > 1 ? join(diseaseArray, '; ') : diseaseArray[0]
      outputStruct.description = outputStruct.description + ` (${diseaseString})`
    }
    return outputStruct
  },
  researchTypeDisease: {
    code: 'DS',
    description: 'The primary purpose of the research is to learn more about a particular disease or disorder, a trait, or a set of related conditions.',
    manualReview: false,
    type: ControlledAccessType.permissions,
  },
  other: (otherText: string | null): TranslationEntry => {
    return {
      code: 'OTHER',
      description: isEmpty(otherText) ? 'Other: Not provided' : otherText!,
      manualReview: true,
      type: ControlledAccessType.permissions,
    }
  },
  methods: {
    code: 'MDS',
    description: 'The primary purpose of the research is to develop and/or validate new methods for analyzing or interpreting data. Data will be used for developing and/or validating new methods.',
    manualReview: false,
    type: ControlledAccessType.modifiers,
  },
  aiLlmUse: {
    code: 'AI',
    description: 'The research involves the use of Artificial Intelligence (AI) or Large Language Models (LLMs).',
    manualReview: true,
    type: ControlledAccessType.modifiers,
  },
  controls: {
    code: 'CTRL',
    description: 'The reason for this request is to increase the number of controls available for a comparison group.',
    manualReview: false,
    type: ControlledAccessType.modifiers,
  },
  forProfit: {
    code: 'NCU',
    description: 'The dataset will be used in a study related to a commercial purpose.',
    manualReview: false,
    type: ControlledAccessType.modifiers,
  },
  notForProfit: {
    code: 'NPU',
    description: 'This dataset will not be used in a study related to a commercial purpose.',
    manualReview: false,
    type: ControlledAccessType.modifiers,
  },
  genderFemale: {
    code: 'POP-F',
    description: 'The dataset will be used for the study of females.',
    manualReview: false,
    type: ControlledAccessType.modifiers,
  },
  genderMale: {
    code: 'POP-M',
    description: 'The dataset will be used for the study of males.',
    manualReview: false,
    type: ControlledAccessType.modifiers,
  },
  pediatric: {
    code: 'POP-P',
    description: 'The dataset will be used for the study of children.',
    manualReview: false,
    type: ControlledAccessType.modifiers,
  },
  illegalBehavior: {
    code: 'OTHER',
    description: 'The dataset will be used for the study of illegal behaviors (violence, domestic abuse, prostitution, sexual victimization).',
    manualReview: true,
    type: ControlledAccessType.modifiers,
  },
  addiction: {
    code: 'OTHER',
    description: 'The dataset will be used for the study of alcohol or drug abuse, or abuse of other addictive products.',
    manualReview: true,
    type: ControlledAccessType.modifiers,
  },
  sexualDiseases: {
    code: 'OTHER',
    description: 'The dataset will be used for the study of sexual preferences or sexually transmitted diseases.',
    manualReview: true,
    type: ControlledAccessType.modifiers,
  },
  stigmatizedDiseases: {
    code: 'OTHER',
    description: 'The dataset will be used for the study of stigmatizing illnesses.',
    manualReview: true,
    type: ControlledAccessType.modifiers,
  },
  vulnerablePopulation: {
    code: 'OTHER',
    description: 'The dataset will be used for a study targeting a vulnerable population as defined in 456 CFR (children, prisoners, pregnant women, mentally disabled persons, or [SIGNIFICANTLY] economically or educationally disadvantaged persons).',
    manualReview: true,
    type: ControlledAccessType.modifiers,
  },
  population: {
    code: 'OTHER',
    description: 'The dataset will be used to study variations within the general population (e.g., general substructure of a population).',
    manualReview: true,
    type: ControlledAccessType.modifiers,
  },
  psychiatricTraits: {
    code: 'OTHER',
    description: 'The dataset will be used for the study of psychological traits, including intelligence, attention, emotion.',
    manualReview: true,
    type: ControlledAccessType.modifiers,
  },
  notHealth: {
    code: 'OTHER',
    description: 'The dataset will be used for the research that correlates ethnicity, race, or gender with genotypic or other phenotypic variables, for purposes beyond biomedical or health-related research, or in ways may not be easily related to Health.',
    manualReview: true,
    type: ControlledAccessType.modifiers,
  },
}

type TranslationFunction = (arg: string[]) => TranslationEntry | string

export interface ConsentTranslationsMap {
  [key: string]: TranslationEntry | TranslationFunction
}

/**
 * Primary source of truth for Dataset translations
 * This constant holds all potential DUO codes that a dataset might contain.
 * It is intended to map codes and descriptions for easier viewing.
 */
export const consentTranslations: ConsentTranslationsMap = {
  noRestrictions: {
    code: 'NRES',
    description: 'No restrictions on data use',
    type: ControlledAccessType.permissions,
  },
  generalUse: {
    code: 'GRU',
    description: 'Use is permitted for any research purpose',
    type: ControlledAccessType.permissions,
  },
  hmbResearch: {
    code: 'HMB',
    description: 'Use is permitted for a health, medical, or biomedical research purpose',
    type: ControlledAccessType.permissions,
  },
  diseaseRestrictions: (restrictions: string[]): TranslationEntry | string => {
    if (isEmpty(restrictions)) {
      return 'Use is permitted for the specified disease(s): Not specified'
    }
    const restrictionList = restrictions.join(', ')
    return {
      code: 'DS',
      alternateLabel: `DS (${restrictions.join(', ')})`,
      description: `Use is permitted for the specified disease(s): ${restrictionList}`,
      type: ControlledAccessType.permissions,
    }
  },
  populationOriginsAncestry: {
    code: 'POA',
    description: 'Use is limited to population, origin, or ancestry research',
    type: ControlledAccessType.permissions,
  },
  methodsResearch: {
    code: 'NMDS',
    description: 'Use for methods development research (e.g., development of software or algorithms) only within the bounds of other use limitations',
    type: ControlledAccessType.modifiers,
  },
  controlSetOption: {
    code: 'NCTRL',
    description: 'Future use as a control set for diseases other than those specified is prohibited',
    type: ControlledAccessType.modifiers,
  },
  aggregateResearch: {
    code: 'NAGR',
    description: 'Future use of aggregate-level data for general research purposes is prohibited',
    type: ControlledAccessType.modifiers,
  },
  geneticStudiesOnly: {
    code: 'GSO',
    description: 'Use is limited to genetic studies only',
    type: ControlledAccessType.modifiers,
  },
  nonProfitUse: {
    code: 'NPU',
    description: 'Use is limited to non-profit and non-commercial research',
    type: ControlledAccessType.modifiers,
  },
  publicationResults: {
    code: 'PUB',
    description: 'Use requires users to make results of studies using the data available to the larger scientific community',
    type: ControlledAccessType.modifiers,
  },
  collaboratorRequired: {
    code: 'COL',
    description: 'Use requires users to collaborate with the primary study investigators',
    type: ControlledAccessType.modifiers,
  },
  ethicsApprovalRequired: {
    code: 'IRB',
    description: 'Use requires users to provide documentation of local IRB/ERB approval',
    type: ControlledAccessType.modifiers,
  },
  geographicalRestrictions: {
    code: 'GS',
    description: 'Use is limited to within a certain geographic area',
    type: ControlledAccessType.modifiers,
  },
  gender: {
    code: 'RS-G',
    description: 'Use is limited to research involving a particular gender',
    type: ControlledAccessType.modifiers,
  },
  pediatric: {
    code: 'RS-PD',
    description: 'Use is limited to pediatric research',
    type: ControlledAccessType.modifiers,
  },
}

interface OntologyResult {
  label: string
}

const getOntologyName = async (urls: string[]): Promise<string[]> => {
  const doidArr = OntologyService.extractDOIDFromUrl(urls)
  const params = doidArr.join(',')
  const ontology = await OntologyService.searchOntology(params) as OntologyResult[]
  return ontology.map(data => data.label)
}

// Helper function to process disease restrictions with ontology labels
const processDiseaseRestrictionsWithLabels = (diseaseValue: { label: string }[]): TranslationEntry | undefined => {
  const labels = diseaseValue.map(ont => ont.label)
  const diseaseRestrictionsFunc = consentTranslations.diseaseRestrictions as (restrictions: string[]) => TranslationEntry | string
  const result = diseaseRestrictionsFunc(labels)
  return typeof result !== 'string' ? result : undefined
}

// Helper function to process disease restrictions with ontology URLs
const processDiseaseRestrictionsWithUrls = async (diseaseValue: string[]): Promise<TranslationEntry | undefined> => {
  try {
    const ontologyUrls = uniq(diseaseValue)
    if (isEmpty(ontologyUrls)) {
      return undefined
    }
    const ontologyLabels = await getOntologyName(ontologyUrls)
    const diseaseRestrictionsFunc = consentTranslations.diseaseRestrictions as (restrictions: string[]) => TranslationEntry | string
    const result = diseaseRestrictionsFunc(ontologyLabels)
    return typeof result !== 'string' ? result : undefined
  }
  catch (error) {
    console.error('Ontology API Request Error:', error)
    Notifications.showError({ text: 'Ontology API Request Error' })
    return undefined
  }
}

export const processRestrictionStatements = async (
  key: string,
  dataUse: DataUse,
): Promise<TranslationEntry | undefined> => {
  const value = dataUse[key as keyof DataUse]
  if (isNil(value) || !value) {
    return undefined
  }

  if (key !== 'diseaseRestrictions') {
    return processDefinedLimitations(key, dataUse, consentTranslations)
  }

  const diseaseValue = value as (string | { label: string })[]
  const firstElement = head(diseaseValue)

  // Check if ontology labels are contained within the dataUse object
  if (!isNil(firstElement) && !isNil((firstElement as { label: string }).label)) {
    return processDiseaseRestrictionsWithLabels(diseaseValue as { label: string }[])
  }

  // Process datasets without ontology labels saved on the dataUse object
  return processDiseaseRestrictionsWithUrls(diseaseValue as string[])
}

export const processDefinedLimitations = (
  key: string,
  dataUse: DataUse,
  translations: ConsentTranslationsMap,
): TranslationEntry | undefined => {
  const targetKeys = ['hmbResearch', 'populationOriginsAncestry', 'generalUse']
  const isHMBActive = !!dataUse.hmbResearch && isEmpty(dataUse.diseaseRestrictions)
  const isPOAActive = !!dataUse.populationOriginsAncestry
  const isGeneralUseActive = !!dataUse.generalUse && !isHMBActive && !isPOAActive && isEmpty(dataUse.diseaseRestrictions)
  let statement: TranslationEntry | undefined
  if (
    !targetKeys.includes(key)
    || (key === 'hmbResearch' && isHMBActive)
    || (key === 'populationOriginsAncestry' && isPOAActive)
    || (key === 'generalUse' && isGeneralUseActive)
  ) {
    const translation = translations[key]
    if (translation && typeof translation !== 'function') {
      statement = translation
    }
  }
  return statement
}

// Extend DataUse to include otherRestrictions for runtime compatibility
interface ExtendedDataUse extends DataUse {
  otherRestrictions?: boolean
}

// Helper function to handle OTHER attribute translations in dataUse
const processOtherInDataUse = (
  dataUse: ExtendedDataUse,
  restrictionStatements: Promise<TranslationEntry | undefined>[],
): Promise<TranslationEntry | undefined>[] => {
  // Wrapping the statements in a Promise.resolve before adding it to the array allows the restrictionStatements to be compatible with future Promise.all calls
  if (dataUse.otherRestrictions === true || !isNil(dataUse.other)) {
    restrictionStatements.push(
      Promise.resolve({
        code: 'OTH1',
        description: `Primary Other: ${isEmpty(dataUse.other) ? 'Not provided' : dataUse.other}`,
        type: ControlledAccessType.modifiers,
      }),
    )
  }
  if (!isNil(dataUse.secondaryOther)) {
    restrictionStatements.push(
      Promise.resolve({
        code: 'OTH2',
        description: `Secondary Other: ${isEmpty(dataUse.secondaryOther) ? 'Not provided' : dataUse.secondaryOther}`,
        type: ControlledAccessType.modifiers,
      }),
    )
  }
  return restrictionStatements
}

// Function to translate restrictions from a single dataUse
const translateDataUseRestrictions = async (dataUse: ExtendedDataUse | null): Promise<TranslationEntry[]> => {
  if (!dataUse) {
    return []
  }
  let restrictionStatements: Promise<TranslationEntry | undefined>[] = []
  const targetKeys = Object.keys(consentTranslations)
  restrictionStatements = targetKeys.map(async key =>
    await processRestrictionStatements(key, dataUse))
  restrictionStatements = filter(restrictionStatements, statement => !isNil(statement))
  restrictionStatements = processOtherInDataUse(dataUse, restrictionStatements)
  const results = await Promise.all(restrictionStatements)
  return results.filter((value): value is TranslationEntry => !isEmpty(value))
}

// Function to translate restrictions in an array of dataUses
export const translateDataUseRestrictionsFromDataUseArray = async (
  dataUses: ExtendedDataUse[],
): Promise<(TranslationEntry | undefined)[][]> => {
  const targetKeys = Object.keys(consentTranslations)
  try {
    const translationPromises = dataUses.map((dataUse) => {
      const restrictionStatementPromises = targetKeys.map(key => processRestrictionStatements(key, dataUse))
      processOtherInDataUse(dataUse, restrictionStatementPromises)
      return Promise.all(restrictionStatementPromises)
    })
    return filter(
      await Promise.all(translationPromises),
      restriction => !isEmpty(restriction),
    )
  }
  catch (error) {
    console.error('Failed to translate Data Use Restrictions from list:', error)
    throw new Error('Failed to translate Data Use Restrictions from list')
  }
}

// Helper function to add primary codes to DataUseSummary
const addPrimaryCodes = (darInfo: DarInfo, dataUseSummary: DataUseSummary): void => {
  if (darInfo.hmb) {
    dataUseSummary.primary = concat(dataUseSummary.primary, [srpTranslations.hmb]) as DataUseTerm[]
  }

  /**
   * population refers to question 2.3.2: The outcome of this study is expected to provide
   * new knowledge about the origins of a certain population or its ancestry.
   * populationMigration refers to question 3.1.9: Does the research aim involve the study
   * of Population Origins/Migration patterns?
   * Both map to http://purl.obolibrary.org/obo/DUO_0000011 (POA)
   *
   * Additional check on hmb, diseases, and other are needed for older DARs where
   * populationMigration - poa link was not established
   */
  if ((darInfo.poa || darInfo.populationMigration) && (!darInfo.hmb && !darInfo.diseases && !darInfo.other)) {
    dataUseSummary.primary = concat(dataUseSummary.primary, srpTranslations.poa)
  }

  if (darInfo.diseases) {
    const diseaseTranslation = srpTranslations.diseases(clone(darInfo.ontologies || []))
    dataUseSummary.primary = uniq(concat(dataUseSummary.primary, [diseaseTranslation]))
  }

  if (darInfo.other) {
    dataUseSummary.primary = concat(dataUseSummary.primary, [srpTranslations.other(darInfo.otherText || null)])
  }

  // **FALLBACK CHECK**
  // If no primary codes were added, add an "OTHER: Not provided" code
  if (isEmpty(dataUseSummary.primary)) {
    dataUseSummary.primary = concat(dataUseSummary.primary, [srpTranslations.other(null)])
  }
}

// Helper function to add secondary codes to DataUseSummary
const addSecondaryCodes = (darInfo: DarInfo, dataUseSummary: DataUseSummary): void => {
  if (darInfo.methods) {
    dataUseSummary.secondary = concat(dataUseSummary.secondary, [srpTranslations.methods]) as DataUseTerm[]
  }
  if (darInfo.aiLlmUse) {
    dataUseSummary.secondary = concat(dataUseSummary.secondary, [srpTranslations.aiLlmUse]) as DataUseTerm[]
  }
  if (darInfo.controls) {
    dataUseSummary.secondary = concat(dataUseSummary.secondary, [srpTranslations.controls]) as DataUseTerm[]
  }
  if (darInfo.forProfit) {
    dataUseSummary.secondary = concat(dataUseSummary.secondary, [srpTranslations.forProfit]) as DataUseTerm[]
  }
  else {
    dataUseSummary.secondary = concat(dataUseSummary.secondary, [srpTranslations.notForProfit]) as DataUseTerm[]
  }
  if (darInfo.gender?.slice(0, 1).toLowerCase() === 'f') {
    dataUseSummary.secondary = concat(dataUseSummary.secondary, [srpTranslations.genderFemale]) as DataUseTerm[]
  }
  if (darInfo.gender?.slice(0, 1).toLowerCase() === 'm') {
    dataUseSummary.secondary = concat(dataUseSummary.secondary, [srpTranslations.genderMale]) as DataUseTerm[]
  }
  if (darInfo.pediatric) {
    dataUseSummary.secondary = concat(dataUseSummary.secondary, [srpTranslations.pediatric]) as DataUseTerm[]
  }
  if (darInfo.illegalBehavior) {
    dataUseSummary.secondary = concat(dataUseSummary.secondary, [srpTranslations.illegalBehavior]) as DataUseTerm[]
  }
  if (darInfo.addiction) {
    dataUseSummary.secondary = concat(dataUseSummary.secondary, [srpTranslations.addiction]) as DataUseTerm[]
  }
  if (darInfo.sexualDiseases) {
    dataUseSummary.secondary = concat(dataUseSummary.secondary, [srpTranslations.sexualDiseases]) as DataUseTerm[]
  }
  if (darInfo.stigmatizedDiseases) {
    dataUseSummary.secondary = concat(dataUseSummary.secondary, [srpTranslations.stigmatizedDiseases]) as DataUseTerm[]
  }
  if (darInfo.vulnerablePopulation) {
    dataUseSummary.secondary = concat(dataUseSummary.secondary, [srpTranslations.vulnerablePopulation]) as DataUseTerm[]
  }
  if (darInfo.population) {
    dataUseSummary.secondary = concat(dataUseSummary.secondary, [srpTranslations.population]) as DataUseTerm[]
  }
  if (darInfo.psychiatricTraits) {
    dataUseSummary.secondary = concat(dataUseSummary.secondary, [srpTranslations.psychiatricTraits]) as DataUseTerm[]
  }
  if (darInfo.notHealth) {
    dataUseSummary.secondary = concat(dataUseSummary.secondary, [srpTranslations.notHealth]) as DataUseTerm[]
  }
}

export const DataUseTranslation = {

  /**
   * Translates a raw data access request into an ontology service compatible
   * DataUseSummary object that reflects a Data Access Request instead of a Consent.
   * See https://consent-ontology.dsde-prod.broadinstitute.org/#/Data%20Use/post_translate_summary
   *
   * @param darInfo
   * @returns {{primary: [{code: '', description: ''}], secondary: [{code: '', description: ''}]}}
   */

  translateDarInfo: (darInfo: DarInfo): DataUseSummary => {
    const dataUseSummary: DataUseSummary = {
      primary: [],
      secondary: [],
    }

    addPrimaryCodes(darInfo, dataUseSummary)
    addSecondaryCodes(darInfo, dataUseSummary)

    return dataUseSummary
  },
  translateDataUseRestrictions,
}
