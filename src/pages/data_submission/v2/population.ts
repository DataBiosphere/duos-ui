import { ValidationError, makeError } from 'src/pages/dar_application/FormValidationState'
import { GeographyMetadata, PopulationMetadata } from 'src/libs/data-metadata'
import { isEmpty } from 'src/utils/NodashUtil'

export const POPULATION_SEX_OPTIONS = ['Female', 'Male', 'Intersex', 'Unknown', 'Not Reported']

/** Suggestions only: submitters may enter any ancestry, so the select is creatable. */
export const POPULATION_ANCESTRY_OPTIONS = [
  'African',
  'African American or Afro-Caribbean',
  'East Asian',
  'European',
  'Hispanic or Latin American',
  'Middle Eastern',
  'Native American',
  'Oceanian',
  'South Asian',
  'Other',
  'Unknown',
]

/** The slider's top stop, which stands for "this age and over". */
export const AGE_RANGE_TOP = 90

export const formatAge = (age: number): string => (age >= AGE_RANGE_TOP ? `${AGE_RANGE_TOP}+` : `${age}`)

export const formatAgeRange = (range: PopulationMetadata['ageRange']): string => {
  if (!range) return 'Not set'
  if (range.max >= AGE_RANGE_TOP) return `${formatAge(range.min)} and over`
  return `${formatAge(range.min)} – ${formatAge(range.max)} years`
}

export type PopulationField = keyof PopulationMetadata

export const POPULATION_FIELD_TITLES: Record<PopulationField, string> = {
  ageRange: 'Age Range',
  sex: 'Sex',
  ancestry: 'Ancestry',
  geography: 'Geography',
}

export type PopulationValidation = Partial<Record<PopulationField, ValidationError>>

/** Every population field is required wherever the population is held: the study, or each dataset. */
export const populationErrors = (population: PopulationMetadata | undefined): PopulationValidation => {
  const errors: PopulationValidation = {}
  for (const field of Object.keys(POPULATION_FIELD_TITLES) as PopulationField[]) {
    if (isEmpty(population?.[field])) {
      errors[field] = makeError('required')
    }
  }
  return errors
}

export const missingPopulationFields = (population: PopulationMetadata | undefined): string[] =>
  (Object.keys(populationErrors(population)) as PopulationField[]).map(field => POPULATION_FIELD_TITLES[field])

/**
 * The species most used in biomedical research, as "Common name (Scientific name)". Suggestions
 * only: the field also takes any other species under "Other…".
 */
export const SPECIES_OPTIONS = [
  'Human (Homo sapiens)',
  'Mouse (Mus musculus)',
  'Rat (Rattus norvegicus)',
  'Zebrafish (Danio rerio)',
  'Fruit fly (Drosophila melanogaster)',
  'Nematode (Caenorhabditis elegans)',
  'Budding yeast (Saccharomyces cerevisiae)',
  'E. coli (Escherichia coli)',
  'Rhesus macaque (Macaca mulatta)',
  'Cynomolgus macaque (Macaca fascicularis)',
  'Pig (Sus scrofa)',
  'Dog (Canis lupus familiaris)',
  'Chicken (Gallus gallus)',
  'African clawed frog (Xenopus laevis)',
  'Thale cress (Arabidopsis thaliana)',
  'Cow (Bos taurus)',
  'Fission yeast (Schizosaccharomyces pombe)',
  'Rabbit (Oryctolagus cuniculus)',
  'Sheep (Ovis aries)',
  'Guinea pig (Cavia porcellus)',
]

/** Consent holds some multi-pick fields (species, phenotype) as one string; several are joined with this. */
const JOINED_SEPARATOR = '; '

/** An option and the names it answers to: "Mouse (Mus musculus)" also matches "Mouse" and "Mus musculus". */
const optionNames = (option: string): string[] => {
  const match = /^(.*) \((.*)\)$/.exec(option)
  return match ? [option, match[1], match[2]] : [option]
}

/**
 * The picks a stored string names. Each is matched to an option by its full label or either of its
 * names, ignoring case, so a study saved as "Homo sapiens" or "copd" lights the matching button
 * rather than showing as an unknown extra value. Anything else is kept as typed.
 */
export const parseJoinedOptions = (stored: unknown, options: string[]): string[] => {
  if (typeof stored !== 'string' || stored.trim() === '') return []
  const parsed = stored.split(';').map(part => part.trim()).filter(Boolean).map((part) => {
    const lower = part.toLowerCase()
    return options.find(option => optionNames(option).some(name => name.toLowerCase() === lower)) ?? part
  })
  return [...new Set(parsed)]
}

/** The string Consent stores for the picks; undefined when there are none. */
export const formatJoinedOptions = (picks: string[]): string | undefined =>
  picks.length ? picks.join(JOINED_SEPARATOR) : undefined

export const parseSpecies = (stored: unknown): string[] => parseJoinedOptions(stored, SPECIES_OPTIONS)
export const formatSpecies = formatJoinedOptions

/**
 * Diseases and conditions most studied in biomedical research. Suggestions only: the field also
 * takes any other phenotype or indication under "Other…".
 */
export const PHENOTYPE_OPTIONS = [
  'Breast cancer',
  'Lung cancer',
  'Colorectal cancer',
  'Prostate cancer',
  'Leukemia',
  'Lymphoma',
  'Type 2 diabetes',
  'Obesity',
  'Hypertension',
  'Coronary artery disease',
  'Heart failure',
  'Stroke',
  'Alzheimer\'s disease',
  'Parkinson\'s disease',
  'Schizophrenia',
  'Major depressive disorder',
  'Autism spectrum disorder',
  'Asthma',
  'Chronic obstructive pulmonary disease (COPD)',
  'HIV/AIDS',
]

export const parsePhenotypes = (stored: unknown): string[] => parseJoinedOptions(stored, PHENOTYPE_OPTIONS)

/**
 * Organs, tissues, and body systems most often studied. Suggestions only: the field also takes any
 * other anatomical area under "Other…".
 */
export const ANATOMICAL_AREA_OPTIONS = [
  'Brain',
  'Spinal cord',
  'Eye',
  'Heart',
  'Blood vessels',
  'Lung',
  'Liver',
  'Kidney',
  'Pancreas',
  'Stomach',
  'Intestine',
  'Breast',
  'Prostate',
  'Ovary',
  'Skin',
  'Bone',
  'Skeletal muscle',
  'Adipose tissue',
  'Blood',
  'Lymph node',
]

/** The parts of a place, most general first. Any of them is enough to describe a place. */
export const GEOGRAPHY_PARTS: (keyof GeographyMetadata)[] = ['country', 'region', 'county', 'city']

/** Only the parts a place offers, trimmed, with blanks dropped. */
export const cleanGeography = (draft: GeographyMetadata): GeographyMetadata =>
  Object.fromEntries(GEOGRAPHY_PARTS
    .map(part => [part, draft[part]?.trim()])
    .filter(([, value]) => !!value)) as GeographyMetadata

/** A place needs at least one part; none is required on its own. */
export const isCompleteGeography = (draft: GeographyMetadata): boolean =>
  GEOGRAPHY_PARTS.some(part => !!draft[part]?.trim())

/** Most specific first, as places are usually written: "Boston, Suffolk County, Massachusetts, United States". */
export const formatGeography = (place: GeographyMetadata): string =>
  [place.city, place.county, place.region, place.country].filter(Boolean).join(', ')

export const sameGeography = (a: GeographyMetadata, b: GeographyMetadata): boolean =>
  formatGeography(a).toLowerCase() === formatGeography(b).toLowerCase()
