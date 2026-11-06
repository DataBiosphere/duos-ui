import { describe, it, expect, vi } from 'vitest'
import {
  composePiName,
  getDataCustodians,
  getPrincipalInvestigators,
  getStudyPropertyValueByKey,
  getStudyDataBag,
  submissionErrors,
  studyToDatasetSchemaSubmission,
  withDataCustodians,
  withPrincipalInvestigators,
  withStudyData,
} from 'src/pages/data_submission/v2/v2-common-functions'
import { Study } from 'src/pages/data_submission/v2/v2-models'
import { ConsentGroup2 } from 'src/pages/data_submission/consent_group/consentGroupUtils'
import { PopulationMetadata } from 'src/libs/data-metadata'
import { doiValidator, normalizeDoi, normalizeOrcid, orcidValidator } from 'src/components/forms/formValidation'
import { ANATOMICAL_AREA_OPTIONS, PHENOTYPE_OPTIONS, SPECIES_OPTIONS, formatSpecies, parsePhenotypes, parseSpecies } from 'src/pages/data_submission/v2/population'

vi.mock('src/libs/storage', () => ({
  Storage: { getCurrentUser: () => ({}) },
}))

const POPULATION: PopulationMetadata = {
  ageRange: { min: 18, max: 65 },
  sex: ['Female', 'Male'],
  ancestry: ['European'],
  geography: [{ country: 'United States of America (the)' }],
}

const consentGroup = (name: string, data?: ConsentGroup2['data']): ConsentGroup2 => ({
  consentGroupId: name,
  consentGroupName: name,
  name,
  numberOfParticipants: 1,
  data,
})

const studyWith = (data: Study['data'], consentGroups: ConsentGroup2[] = []): Study => ({
  name: 'Synthetic Study',
  piName: 'Synthetic Investigator',
  piEmail: '',
  data,
  assets: { consentGroups },
})

describe('Principal Investigators', () => {
  it('reads the PIs from the data bag when they were entered there', () => {
    const pis = [{ firstName: 'Ada', lastName: 'Lovelace' }, { firstName: 'Alan', lastName: 'Turing' }]
    expect(getPrincipalInvestigators(studyWith({ principalInvestigators: pis }))).toEqual(pis)
  })

  it('makes a legacy piName and piEmail the one PI, keeping every part of the name', () => {
    const study = { ...studyWith({}), piName: 'Mary Ann Jo Smith', piEmail: 'mary@example.org' }
    expect(getPrincipalInvestigators(study)).toEqual([
      { firstName: 'Mary Ann Jo', lastName: 'Smith', email: 'mary@example.org' },
    ])
  })

  it('treats a single-token legacy piName as a first name', () => {
    expect(getPrincipalInvestigators({ ...studyWith({}), piName: 'Cher' })).toEqual([{ firstName: 'Cher', lastName: '' }])
  })

  it('composes a name from the non-empty parts', () => {
    expect(composePiName({ firstName: ' Ada ', lastName: 'Lovelace' })).toBe('Ada Lovelace')
  })

  it('keeps piName and piEmail equal to the first PI', () => {
    const study = withPrincipalInvestigators(studyWith({}), [
      { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.org', orcids: ['0000-0002-1825-0097'] },
      { firstName: 'Alan', lastName: 'Turing', email: 'alan@example.org' },
    ])
    expect(study.piName).toBe('Ada Lovelace')
    expect(study.piEmail).toBe('ada@example.org')
    expect(studyToDatasetSchemaSubmission(study).data.principalInvestigators).toHaveLength(2)
  })

  it('sends no piEmail when the first PI has none', () => {
    const study = withPrincipalInvestigators({ ...studyWith({}), piEmail: 'old@example.org' }, [{ firstName: 'Ada', lastName: 'Lovelace' }])
    expect(study.piEmail).toBeUndefined()
  })
})

describe('withStudyData', () => {
  it('merges into the bag and removes keys set to undefined', () => {
    const study = withStudyData(studyWith({ tags: ['a'], doi: '10.1000/x' }), { doi: undefined, dataCollectionContext: 'clinic' })
    expect(getStudyDataBag(study)).toEqual({ tags: ['a'], dataCollectionContext: 'clinic' })
  })
})

describe('population inheritance on submission', () => {
  it('copies the study population onto every dataset when it is shared', () => {
    const study = studyWith(
      { populationSameAcrossAssets: true, population: POPULATION },
      [consentGroup('one', { tags: ['t'] }), consentGroup('two', { population: { ageRange: { min: 1, max: 2 } } })],
    )
    const submitted = studyToDatasetSchemaSubmission(study)
    expect(submitted.consentGroups.map(group => group.data)).toEqual([
      { tags: ['t'], population: POPULATION },
      { population: POPULATION },
    ])
    expect(submitted.data.population).toEqual(POPULATION)
  })

  it('treats an absent flag as shared, so existing studies keep a single population', () => {
    const submitted = studyToDatasetSchemaSubmission(studyWith({ population: POPULATION }, [consentGroup('one')]))
    expect(submitted.consentGroups[0].data?.population).toEqual(POPULATION)
  })

  it('keeps each dataset population and drops the hidden study one when it is not shared', () => {
    const own = { ...POPULATION, ageRange: { min: 0, max: 17 } }
    const study = studyWith({ populationSameAcrossAssets: false, population: POPULATION }, [consentGroup('one', { population: own })])
    const submitted = studyToDatasetSchemaSubmission(study)
    expect(submitted.consentGroups[0].data?.population).toEqual(own)
    expect(submitted.data.population).toBeUndefined()
  })

  it('leaves datasets untouched when a shared population has not been entered', () => {
    const submitted = studyToDatasetSchemaSubmission(studyWith({}, [consentGroup('one')]))
    expect(submitted.consentGroups[0].data).toBeUndefined()
  })
})

describe('submissionErrors', () => {
  it('does not require a shared study-level population', () => {
    expect(submissionErrors(studyWith({}, [consentGroup('one')]))).toEqual([])
  })

  it('names each dataset and missing field when the population is per dataset', () => {
    const study = studyWith(
      { populationSameAcrossAssets: false },
      [consentGroup('complete', { population: POPULATION }), consentGroup('partial', { population: { ageRange: { min: 18, max: 65 }, sex: [] } })],
    )
    expect(submissionErrors(study)).toEqual(['Dataset "partial" is missing: Sex, Ancestry, Geography'])
  })
})

describe('DOI and ORCID validation', () => {
  it.each(['10.1000/xyz123', 'https://doi.org/10.1000/xyz123', 'doi:10.5555/abc.def'])('accepts the DOI %s', (doi) => {
    expect(doiValidator.isValid(doi)).toBe(true)
  })

  it.each(['', '10.1/x', 'not-a-doi', '11.1000/xyz'])('rejects the DOI %s', (doi) => {
    expect(doiValidator.isValid(doi)).toBe(false)
  })

  it('stores a DOI without its resolver prefix', () => {
    expect(normalizeDoi(' https://dx.doi.org/10.1000/xyz123 ')).toBe('10.1000/xyz123')
  })

  it.each(['0000-0002-1825-0097', 'https://orcid.org/0000-0002-1694-233x', '0000-0001-5109-3700'])('accepts the ORCID iD %s', (orcid) => {
    expect(orcidValidator.isValid(orcid)).toBe(true)
  })

  it.each(['0000-0002-1825-0098', '0000-0002-1825', 'abcd-efgh-ijkl-mnop'])('rejects the ORCID iD %s', (orcid) => {
    expect(orcidValidator.isValid(orcid)).toBe(false)
  })

  it('stores an ORCID iD bare and upper-cased', () => {
    expect(normalizeOrcid('https://orcid.org/0000-0002-1694-233x')).toBe('0000-0002-1694-233X')
  })
})

describe('DOI on submission', () => {
  it('submits the study DOI without its resolver prefix', () => {
    const submitted = studyToDatasetSchemaSubmission(studyWith({ doi: 'https://doi.org/10.1000/xyz123' }))
    expect(submitted.data.doi).toBe('10.1000/xyz123')
  })
})

describe('target date and visibility inheritance on submission', () => {
  const datesStudy = (data: Study['data'], groups: ConsentGroup2[]): Study => ({
    ...studyWith(data, groups),
    publicVisibility: true,
    properties: [
      { key: 'alternativeDataSharingPlanTargetDeliveryDate', type: 'Date', value: '2030-01-01' },
      { key: 'alternativeDataSharingPlanTargetPublicReleaseDate', type: 'Date', value: '2031-01-01' },
    ] as Study['properties'],
  })

  it('copies shared dates and visibility onto every dataset', () => {
    const submitted = studyToDatasetSchemaSubmission(datesStudy({}, [consentGroup('one')]))
    expect(submitted.consentGroups[0].data).toEqual({
      targetDeliveryDate: '2030-01-01',
      targetPublicReleaseDate: '2031-01-01',
      publicVisibility: true,
    })
    expect(submitted.alternativeDataSharingPlanTargetDeliveryDate).toBe('2030-01-01')
    expect(submitted.publicVisibility).toBe(true)
  })

  it('drops the study dates and keeps each dataset its own when dates are per dataset', () => {
    const submitted = studyToDatasetSchemaSubmission(datesStudy(
      { targetDatesSameAcrossAssets: false },
      [consentGroup('one', { targetDeliveryDate: '2029-05-05', targetPublicReleaseDate: '2029-06-06' })],
    ))
    expect(submitted.alternativeDataSharingPlanTargetDeliveryDate).toBeUndefined()
    expect(submitted.alternativeDataSharingPlanTargetPublicReleaseDate).toBeUndefined()
    expect(submitted.consentGroups[0].data).toMatchObject({ targetDeliveryDate: '2029-05-05', targetPublicReleaseDate: '2029-06-06' })
  })

  it('lists the study publicly only when every dataset is visible', () => {
    const perDataset = { publicVisibilitySameAcrossAssets: false }
    const allVisible = datesStudy(perDataset, [consentGroup('a', { publicVisibility: true }), consentGroup('b', { publicVisibility: true })])
    const oneHidden = datesStudy(perDataset, [consentGroup('a', { publicVisibility: true }), consentGroup('b', { publicVisibility: false })])
    expect(studyToDatasetSchemaSubmission(allVisible).publicVisibility).toBe(true)
    expect(studyToDatasetSchemaSubmission(oneHidden).publicVisibility).toBe(false)
    expect(studyToDatasetSchemaSubmission(datesStudy(perDataset, [])).publicVisibility).toBe(false)
  })

  it('names the dates and visibility a per-dataset study is missing', () => {
    const study = studyWith(
      { targetDatesSameAcrossAssets: false, publicVisibilitySameAcrossAssets: false },
      [consentGroup('partial', { targetDeliveryDate: '2030-01-01', publicVisibility: false })],
    )
    expect(submissionErrors(study)).toEqual(['Dataset "partial" is missing: Target Public Release Date'])
  })
})

describe('Data Custodians', () => {
  it('makes each saved custodian email a row with no name yet', () => {
    const study: Study = {
      ...studyWith({}),
      properties: [{ key: 'dataCustodianEmail', type: 'Json', value: ['a@example.org', 'b@example.org'] }] as Study['properties'],
    }
    expect(getDataCustodians(study)).toEqual([{ email: 'a@example.org' }, { email: 'b@example.org' }])
  })

  it('offers one empty row when the study has none', () => {
    expect(getDataCustodians(studyWith({}))).toEqual([{}])
  })

  it('keeps the dataCustodianEmail list Consent stores equal to the rows emails', () => {
    const study = withDataCustodians(studyWith({}), [
      { firstName: 'Grace', lastName: 'Hopper', email: ' grace@example.org ' },
      { firstName: 'No', lastName: 'Email' },
      { email: 'grace@example.org' },
      { email: 'ada@example.org' },
    ])
    expect(getStudyPropertyValueByKey(study, 'dataCustodianEmail')).toEqual(['grace@example.org', 'ada@example.org'])
    const submitted = studyToDatasetSchemaSubmission(study)
    expect(submitted.dataCustodianEmail).toEqual(['grace@example.org', 'ada@example.org'])
    expect(submitted.data.dataCustodians).toHaveLength(4)
  })

  it('sends no email list once every email is cleared', () => {
    const withEmail = withDataCustodians(studyWith({}), [{ email: 'grace@example.org' }])
    const cleared = withDataCustodians(withEmail, [{ firstName: 'Grace' }])
    expect(studyToDatasetSchemaSubmission(cleared).dataCustodianEmail).toBeUndefined()
  })
})

describe('Species', () => {
  it('offers the 20 most common research species', () => {
    expect(SPECIES_OPTIONS).toHaveLength(20)
    expect(SPECIES_OPTIONS.slice(0, 3)).toEqual(['Human (Homo sapiens)', 'Mouse (Mus musculus)', 'Rat (Rattus norvegicus)'])
  })

  it('matches a stored species by scientific or common name, ignoring case', () => {
    expect(parseSpecies('Homo sapiens')).toEqual(['Human (Homo sapiens)'])
    expect(parseSpecies('mouse; ZEBRAFISH')).toEqual(['Mouse (Mus musculus)', 'Zebrafish (Danio rerio)'])
  })

  it('keeps a species that is not an option, and drops duplicates and blanks', () => {
    expect(parseSpecies('Naked mole-rat; Homo sapiens; ; Human (Homo sapiens)')).toEqual(['Naked mole-rat', 'Human (Homo sapiens)'])
    expect(parseSpecies(undefined)).toEqual([])
  })

  it('stores several species as one string Consent accepts, and none as nothing', () => {
    expect(formatSpecies(['Human (Homo sapiens)', 'Mouse (Mus musculus)'])).toBe('Human (Homo sapiens); Mouse (Mus musculus)')
    expect(parseSpecies(formatSpecies(['Human (Homo sapiens)', 'Mouse (Mus musculus)']))).toEqual(['Human (Homo sapiens)', 'Mouse (Mus musculus)'])
    expect(formatSpecies([])).toBeUndefined()
  })
})

describe('Phenotype/Indication and Anatomical Areas', () => {
  it('offers 20 of each', () => {
    expect(PHENOTYPE_OPTIONS).toHaveLength(20)
    expect(new Set(PHENOTYPE_OPTIONS).size).toBe(20)
    expect(ANATOMICAL_AREA_OPTIONS).toHaveLength(20)
    expect(new Set(ANATOMICAL_AREA_OPTIONS).size).toBe(20)
  })

  it('matches a stored phenotype by name or abbreviation, ignoring case, and keeps anything else', () => {
    expect(parsePhenotypes('copd; breast CANCER; Rare syndrome X')).toEqual([
      'Chronic obstructive pulmonary disease (COPD)', 'Breast cancer', 'Rare syndrome X',
    ])
  })

  it('stores the anatomical areas in the study metadata, and none as nothing', () => {
    const study = withStudyData(studyWith({}), { anatomicalAreas: ['Brain', 'Liver'] })
    expect(studyToDatasetSchemaSubmission(study).data.anatomicalAreas).toEqual(['Brain', 'Liver'])
    expect(studyToDatasetSchemaSubmission(withStudyData(study, { anatomicalAreas: undefined })).data).not.toHaveProperty('anatomicalAreas')
  })
})
