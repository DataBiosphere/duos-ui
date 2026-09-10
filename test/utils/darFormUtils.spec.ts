import { describe, it, expect } from 'vitest'
import {
  needsIrbApprovalDocument,
  needsCollaborationLetter,
  needsGsoAcknowledgement,
  needsPubAcknowledgement,
  needsDsAcknowledgement,
  newIrbDocumentExpirationDate,
  validationFailed,
  computeCollaboratorErrors,
  calcPublicationErrors,
  calcPresentationErrors,
  validateDARFormData,
  validatePRFormData,
  ORCID_REGEX,
} from 'src/utils/darFormUtils'
import { translateDataUseRestrictionsFromDataUseArray } from 'src/libs/dataUseTranslation'
import type {
  Dataset,
  DataUse,
  Publication,
  Presentation,
  Collaborator,
  DuosUser,
} from 'src/types/model'

describe('darFormUtils - DUL Logic', () => {
  describe('needsIrbApprovalDocument', () => {
    it('should return true when datasets require ethics approval', () => {
      const datasets: Partial<Dataset>[] = [
        { dataUse: { ethicsApprovalRequired: true } as DataUse } as Dataset,
      ]
      expect(needsIrbApprovalDocument(datasets as Dataset[])).toBe(true)
    })

    it('should return false when datasets do not require ethics approval', () => {
      const datasets: Partial<Dataset>[] = [
        { dataUse: { ethicsApprovalRequired: false } as DataUse } as Dataset,
      ]
      expect(needsIrbApprovalDocument(datasets as Dataset[])).toBe(false)
    })

    it('should return false when datasets is undefined', () => {
      expect(needsIrbApprovalDocument([])).toBe(false)
    })

    it('should return false when datasets is empty', () => {
      expect(needsIrbApprovalDocument([])).toBe(false)
    })
  })

  describe('needsCollaborationLetter', () => {
    it('should return true when datasets require collaborator', () => {
      const datasets: Partial<Dataset>[] = [
        { dataUse: { collaboratorRequired: true } as DataUse } as Dataset,
      ]
      expect(needsCollaborationLetter(datasets as Dataset[])).toBe(true)
    })

    it('should return false when datasets do not require collaborator', () => {
      const datasets: Partial<Dataset>[] = [
        { dataUse: { collaboratorRequired: false } as DataUse } as Dataset,
      ]
      expect(needsCollaborationLetter(datasets as Dataset[])).toBe(false)
    })
  })

  describe('needsGsoAcknowledgement', () => {
    it('should return true when datasets are genetic studies only', () => {
      const datasets: Partial<Dataset>[] = [
        { dataUse: { geneticStudiesOnly: true } as DataUse } as Dataset,
      ]
      expect(needsGsoAcknowledgement(datasets as Dataset[])).toBe(true)
    })
  })

  describe('needsPubAcknowledgement', () => {
    it('should return true when publication results required', () => {
      const datasets: Partial<Dataset>[] = [
        { dataUse: { publicationResults: true } as DataUse } as Dataset,
      ]
      expect(needsPubAcknowledgement(datasets as Dataset[])).toBe(true)
    })
  })

  describe('needsDsAcknowledgement', () => {
    it('should return true when data use translations differ', () => {
      const translations = [{ generalUse: true }, { hmbResearch: false }]
      expect(needsDsAcknowledgement(translations)).toBe(true)
    })

    it('should return false when data use translations are the same', () => {
      const translations = [{ generalUse: true }, { generalUse: true }]
      expect(needsDsAcknowledgement(translations)).toBe(false)
    })

    it('should return false when there is only one translation', () => {
      const translations = [{ generalUse: true }]
      expect(needsDsAcknowledgement(translations)).toBe(false)
    })

    describe('normalization behavior', () => {
      it('should return false for semantically equivalent DataUse objects when using translations', async () => {
        const dataUse1: Partial<DataUse> = { generalUse: true, other: undefined }
        const dataUse2: Partial<DataUse> = { generalUse: true, other: undefined }

        const translations = await translateDataUseRestrictionsFromDataUseArray([
          dataUse1 as DataUse,
          dataUse2 as DataUse,
        ])

        expect(needsDsAcknowledgement(translations)).toBe(false)
      })

      it('would incorrectly return true for raw DataUse objects with empty string vs undefined', () => {
        const dataUse1 = { generalUse: true, other: '' }
        const dataUse2 = { generalUse: true, other: undefined }

        const result = needsDsAcknowledgement([dataUse1, dataUse2])
        expect(result).toBe(true)
      })

      it('should return false for semantically equivalent empty arrays vs null', async () => {
        const dataUse1: Partial<DataUse> = { generalUse: true, diseaseRestrictions: [] }
        const dataUse2: Partial<DataUse> = { generalUse: true, diseaseRestrictions: undefined }

        const translations = await translateDataUseRestrictionsFromDataUseArray([
          dataUse1 as DataUse,
          dataUse2 as DataUse,
        ])

        expect(needsDsAcknowledgement(translations)).toBe(false)
      })

      it('should still return true when datasets actually have different restrictions', async () => {
        const dataUse1: Partial<DataUse> = { generalUse: true }
        const dataUse2: Partial<DataUse> = { hmbResearch: true }

        const translations = await translateDataUseRestrictionsFromDataUseArray([
          dataUse1 as DataUse,
          dataUse2 as DataUse,
        ])

        expect(needsDsAcknowledgement(translations)).toBe(true)
      })
    })
  })

  describe('newIrbDocumentExpirationDate', () => {
    it('should return a date string one year from today', () => {
      const result = newIrbDocumentExpirationDate()
      const nextYear = new Date().getFullYear() + 1
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(result.startsWith(nextYear.toString())).toBe(true)
    })

    it('should return properly formatted date string', () => {
      const result = newIrbDocumentExpirationDate()
      const parts = result.split('-')
      expect(parts).toHaveLength(3)
      expect(Number.parseInt(parts[0])).toBeGreaterThan(2000)
      expect(Number.parseInt(parts[1])).toBeGreaterThanOrEqual(1)
      expect(Number.parseInt(parts[1])).toBeLessThanOrEqual(12)
      expect(Number.parseInt(parts[2])).toBeGreaterThanOrEqual(1)
      expect(Number.parseInt(parts[2])).toBeLessThanOrEqual(31)
    })
  })
})

describe('darFormUtils - Form Validation', () => {
  describe('validationFailed', () => {
    it('should return true when validation object contains errors', () => {
      const validation = { field1: { valid: false, failed: ['required'] } }
      expect(validationFailed(validation)).toBe(true)
    })

    it('should return false when validation object is empty', () => {
      expect(validationFailed({})).toBe(false)
    })

    it('should return false when all values are empty', () => {
      const validation = { field1: undefined, field2: null }
      expect(validationFailed(validation)).toBe(false)
    })
  })

  describe('computeCollaboratorErrors', () => {
    it('should return error for empty collaborator name', () => {
      const collaborator = {
        name: '',
        eraCommonsId: 'ID123',
        title: 'Dr.',
        countryOfOperation: 'USA',
        email: 'test@example.com',
        approverStatus: true,
      } as Partial<Collaborator>

      const errors = computeCollaboratorErrors({ collaborator })
      expect(errors.name).toBeDefined()
      expect(errors.name?.valid).toBe(false)
    })

    it('should return error for undefined collaborator', () => {
      const errors = computeCollaboratorErrors({ collaborator: {} as Partial<Collaborator> })
      expect(Object.keys(errors).length).toBeGreaterThan(0)
    })

    it('should not return error when needsApproverStatus is false', () => {
      const collaborator = {
        name: 'John Doe',
        eraCommonsId: 'ID123',
        title: 'Dr.',
        countryOfOperation: 'USA',
        email: 'test@example.com',
      } as Partial<Collaborator>

      const errors = computeCollaboratorErrors({ collaborator, needsApproverStatus: false })
      expect(errors.approverStatus).toBeUndefined()
    })

    it('should return no errors for valid collaborator', () => {
      const collaborator = {
        name: 'John Doe',
        eraCommonsId: 'ID123',
        title: 'Dr.',
        countryOfOperation: 'USA',
        email: 'test@example.com',
        approverStatus: true,
      } as Partial<Collaborator>

      const errors = computeCollaboratorErrors({ collaborator })
      const errorKeys = Object.keys(errors).filter(key => errors[key] !== undefined)
      expect(errorKeys).toHaveLength(0)
    })
  })
})

describe('darFormUtils - Publication & Presentation Validation', () => {
  describe('ORCID_REGEX', () => {
    it('should match valid ORCID format', () => {
      const validOrcids = [
        '0000-0002-1234-567X',
        '0000-0002-1234-5678',
        '1234-5678-9012-345X',
      ]
      validOrcids.forEach((orcid) => {
        expect(ORCID_REGEX.test(orcid)).toBe(true)
      })
    })

    it('should not match invalid ORCID format', () => {
      const invalidOrcids = [
        '0000-0002-1234-567', // only 3 digits at end
        '0000-0002-1234', // missing last group
        'not-valid-orcid-xxxx', // completely invalid format
      ]
      invalidOrcids.forEach((orcid) => {
        expect(ORCID_REGEX.test(orcid)).toBe(false)
      })
    })
  })

  describe('calcPublicationErrors', () => {
    it('should return error for missing title', () => {
      const errors = calcPublicationErrors({} as Partial<Publication>)
      expect(errors.title).toBeDefined()
    })

    it('should return error for missing authors', () => {
      const publication: Partial<Publication> = { title: 'Test Publication', authors: [] }
      const errors = calcPublicationErrors(publication)
      expect(errors.authors).toBeDefined()
    })

    it('should return error for author with missing name', () => {
      const publication: Partial<Publication> = {
        title: 'Test Publication',
        authors: [{ name: '' }] as Array<{ name: string }>,
      }
      const errors = calcPublicationErrors(publication)
      expect(errors.authors).toBeDefined()
    })

    it('should return error for invalid ORCID format', () => {
      const publication: Partial<Publication> = {
        title: 'Test Publication',
        authors: [{ name: 'John Doe', orcId: 'invalid-orcid' }] as Array<{ name: string, orcId: string }>,
      }
      const errors = calcPublicationErrors(publication)
      expect(errors.authors).toBeDefined()
    })

    it('should return error for missing citation', () => {
      const errors = calcPublicationErrors({} as Partial<Publication>)
      expect(errors.citation).toBeDefined()
    })

    it('should not return citation error when citation is set', () => {
      const publication: Partial<Publication> = { citation: false }
      const errors = calcPublicationErrors(publication)
      expect(errors.citation).toBeUndefined()
    })
  })

  describe('calcPresentationErrors', () => {
    it('should return error for missing title', () => {
      const errors = calcPresentationErrors({} as Partial<Presentation>)
      expect(errors.title).toBeDefined()
    })

    it('should return errors for multiple missing fields', () => {
      const errors = calcPresentationErrors({} as Partial<Presentation>)
      expect(Object.keys(errors).length).toBeGreaterThan(1)
    })
  })
})

describe('darFormUtils - DAR Form Validation', () => {
  const mockDataset: Partial<Dataset> = { dataUse: {} as DataUse }

  describe('validateDARFormData', () => {
    it('should validate minimal form data', () => {
      const formData = {
        researcher: 'John Doe',
        nihValid: true,
        piCountryOfOperation: 'USA',
        signingOfficial: 'Jane Smith',
        itDirector: 'Bob Johnson',
        itDirectorEmail: 'bob@example.com',
        anvilUse: true,
        localUse: false,
        cloudUse: false,
        datasetIds: [1, 2],
        projectTitle: 'Test Project',
        rus: 'Research use statement',
        diseases: true,
        ontologies: ['DOID:1234'],
        nonTechRus: 'Non-technical RUS',
        aiLlmUse: false,
        controls: false,
        population: false,
        forProfit: false,
        oneGender: false,
        pediatric: false,
        vulnerablePopulation: false,
        illegalBehavior: false,
        sexualDiseases: false,
        psychiatricTraits: false,
        notHealth: false,
        stigmatizedDiseases: false,
      }

      const result = validateDARFormData({
        formData,
        datasets: [mockDataset as Dataset],
        dataUseTranslations: [{}],
        irbDocument: undefined as never,
        collaborationLetter: undefined as never,
        researcher: { userId: 1 } as DuosUser,
        labCollaboratorsCompleted: true,
        internalCollaboratorsCompleted: true,
        externalCollaboratorsCompleted: true,
      })

      expect(result).toHaveProperty('researcherInfoErrors')
      expect(result).toHaveProperty('darErrors')
      expect(result).toHaveProperty('rusErrors')
      expect(result).toHaveProperty('nihValid')
    })

    it('should return errors for missing required researcher info', () => {
      const result = validateDARFormData({
        formData: {},
        datasets: [],
        dataUseTranslations: [],
        irbDocument: undefined as never,
        collaborationLetter: undefined as never,
        researcher: { userId: 1 } as DuosUser,
        labCollaboratorsCompleted: false,
        internalCollaboratorsCompleted: false,
        externalCollaboratorsCompleted: false,
      })

      expect(Object.keys(result.researcherInfoErrors).length).toBeGreaterThan(0)
    })

    it('should return errors for incomplete collaborators', () => {
      const result = validateDARFormData({
        formData: { nihValid: true },
        datasets: [mockDataset as Dataset],
        dataUseTranslations: [],
        irbDocument: undefined as never,
        collaborationLetter: undefined as never,
        researcher: { userId: 1 } as DuosUser,
        labCollaboratorsCompleted: false,
        internalCollaboratorsCompleted: false,
        externalCollaboratorsCompleted: false,
      })

      expect(result.researcherInfoErrors.labCollaboratorsCompleted).toBeDefined()
      expect(result.researcherInfoErrors.internalCollaborators).toBeDefined()
      expect(result.researcherInfoErrors.externalCollaborators).toBeDefined()
    })

    it('should require IRB document when dataset requires it', () => {
      const datasetWithIrb: Partial<Dataset> = {
        dataUse: { ethicsApprovalRequired: true } as DataUse,
      }
      const formData = {
        projectTitle: 'Test Project',
        rus: 'RUS',
        diseases: true,
        ontologies: ['DOID:1234'],
        nonTechRus: 'Non-tech RUS',
      }

      const result = validateDARFormData({
        formData,
        datasets: [datasetWithIrb as Dataset],
        dataUseTranslations: [{}],
        irbDocument: undefined as never,
        collaborationLetter: undefined as never,
        researcher: { userId: 1 } as DuosUser,
        labCollaboratorsCompleted: true,
        internalCollaboratorsCompleted: true,
        externalCollaboratorsCompleted: true,
      })

      expect(result.darErrors.irbDocument).toBeDefined()
    })

    it('should require collaboration letter when dataset requires it', () => {
      const datasetWithCollaboration: Partial<Dataset> = {
        dataUse: { collaboratorRequired: true } as DataUse,
      }
      const formData = {
        projectTitle: 'Test Project',
        rus: 'RUS',
        diseases: true,
        ontologies: ['DOID:1234'],
        nonTechRus: 'Non-tech RUS',
      }

      const result = validateDARFormData({
        formData,
        datasets: [datasetWithCollaboration as Dataset],
        dataUseTranslations: [{}],
        irbDocument: undefined as never,
        collaborationLetter: undefined as never,
        researcher: { userId: 1 } as DuosUser,
        labCollaboratorsCompleted: true,
        internalCollaboratorsCompleted: true,
        externalCollaboratorsCompleted: true,
      })

      expect(result.darErrors.collaborationLetter).toBeDefined()
    })

    it('should validate gender when oneGender is true', () => {
      const formData = {
        oneGender: true, gender: 'X',
        aiLlmUse: false, controls: false, population: false, forProfit: false,
        pediatric: false, vulnerablePopulation: false, illegalBehavior: false,
        sexualDiseases: false, psychiatricTraits: false, notHealth: false, stigmatizedDiseases: false,
      }

      const result = validateDARFormData({
        formData,
        datasets: [mockDataset as Dataset],
        dataUseTranslations: [],
        irbDocument: undefined as never,
        collaborationLetter: undefined as never,
        researcher: { userId: 1 } as DuosUser,
        labCollaboratorsCompleted: true,
        internalCollaboratorsCompleted: true,
        externalCollaboratorsCompleted: true,
      })

      expect(result.rusErrors.gender).toBeDefined()
    })

    it('should not error on valid gender value', () => {
      const formData = {
        oneGender: true, gender: 'M',
        aiLlmUse: false, controls: false, population: false, forProfit: false,
        pediatric: false, vulnerablePopulation: false, illegalBehavior: false,
        sexualDiseases: false, psychiatricTraits: false, notHealth: false, stigmatizedDiseases: false,
      }

      const result = validateDARFormData({
        formData,
        datasets: [mockDataset as Dataset],
        dataUseTranslations: [],
        irbDocument: undefined as never,
        collaborationLetter: undefined as never,
        researcher: { userId: 1 } as DuosUser,
        labCollaboratorsCompleted: true,
        internalCollaboratorsCompleted: true,
        externalCollaboratorsCompleted: true,
      })

      expect(result.rusErrors.gender).toBeUndefined()
    })
  })

  describe('validatePRFormData', () => {
    it('should validate progress report form data', () => {
      const formData = {
        progressReportSummary: 'Summary of progress',
        intellectualPropertiesYesNo: false,
        publicationsYesNo: false,
        presentationsYesNo: false,
        dmiYesNo: false,
        closeoutYesNo: false,
      }

      const result = validatePRFormData(true, formData, [], [])

      expect(result).toHaveProperty('darErrors')
      expect(typeof result.darErrors).toBe('object')
    })

    it('should return error when nihValid is false', () => {
      const result = validatePRFormData(false, {}, [], [])
      expect(result.darErrors.nihEraId).toBeDefined()
    })

    it('should require progress report summary', () => {
      const formData = {
        intellectualPropertiesYesNo: false,
        publicationsYesNo: false,
        presentationsYesNo: false,
        dmiYesNo: false,
        closeoutYesNo: false,
      }

      const result = validatePRFormData(true, formData, [], [])
      expect(result.darErrors.progressReportSummary).toBeDefined()
    })
  })

  describe('Cloud use validation', () => {
    it('should require cloud provider when cloudUse is true and anvilUse is false', () => {
      const formData = {
        anvilUse: false, cloudUse: true, localUse: false,
        cloudProvider: '', cloudProviderType: '', cloudProviderDescription: '',
      }

      const result = validateDARFormData({
        formData,
        datasets: [mockDataset as Dataset],
        dataUseTranslations: [],
        irbDocument: undefined as never,
        collaborationLetter: undefined as never,
        researcher: { userId: 1 } as DuosUser,
        labCollaboratorsCompleted: true,
        internalCollaboratorsCompleted: true,
        externalCollaboratorsCompleted: true,
      })

      expect(result.researcherInfoErrors.cloudProvider).toBeDefined()
      expect(result.researcherInfoErrors.cloudProviderType).toBeDefined()
      expect(result.researcherInfoErrors.cloudProviderDescription).toBeDefined()
    })

    it('should not require cloud provider when anvilUse is true', () => {
      const formData = { anvilUse: true, cloudUse: true, localUse: false, cloudProvider: '' }

      const result = validateDARFormData({
        formData,
        datasets: [mockDataset as Dataset],
        dataUseTranslations: [],
        irbDocument: undefined as never,
        collaborationLetter: undefined as never,
        researcher: { userId: 1 } as DuosUser,
        labCollaboratorsCompleted: true,
        internalCollaboratorsCompleted: true,
        externalCollaboratorsCompleted: true,
      })

      expect(result.researcherInfoErrors.cloudProvider).toBeUndefined()
    })

    it('should require at least one storage option', () => {
      const formData = { anvilUse: false, cloudUse: false, localUse: false }

      const result = validateDARFormData({
        formData,
        datasets: [mockDataset as Dataset],
        dataUseTranslations: [],
        irbDocument: undefined as never,
        collaborationLetter: undefined as never,
        researcher: { userId: 1 } as DuosUser,
        labCollaboratorsCompleted: true,
        internalCollaboratorsCompleted: true,
        externalCollaboratorsCompleted: true,
      })

      expect(result.researcherInfoErrors.dataStorageAndAnalysis).toBeDefined()
    })
  })
})
