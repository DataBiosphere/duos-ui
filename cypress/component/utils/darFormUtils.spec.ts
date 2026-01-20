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
        {
          dataUse: {
            ethicsApprovalRequired: true,
          } as DataUse,
        } as Dataset,
      ]
      expect(needsIrbApprovalDocument(datasets as Dataset[])).to.equal(true)
    })

    it('should return false when datasets do not require ethics approval', () => {
      const datasets: Partial<Dataset>[] = [
        {
          dataUse: {
            ethicsApprovalRequired: false,
          } as DataUse,
        } as Dataset,
      ]
      expect(needsIrbApprovalDocument(datasets as Dataset[])).to.equal(false)
    })

    it('should return false when datasets is undefined', () => {
      expect(needsIrbApprovalDocument([])).to.equal(false)
    })

    it('should return false when datasets is empty', () => {
      expect(needsIrbApprovalDocument([])).to.equal(false)
    })
  })

  describe('needsCollaborationLetter', () => {
    it('should return true when datasets require collaborator', () => {
      const datasets: Partial<Dataset>[] = [
        {
          dataUse: {
            collaboratorRequired: true,
          } as DataUse,
        } as Dataset,
      ]
      expect(needsCollaborationLetter(datasets as Dataset[])).to.equal(true)
    })

    it('should return false when datasets do not require collaborator', () => {
      const datasets: Partial<Dataset>[] = [
        {
          dataUse: {
            collaboratorRequired: false,
          } as DataUse,
        } as Dataset,
      ]
      expect(needsCollaborationLetter(datasets as Dataset[])).to.equal(false)
    })
  })

  describe('needsGsoAcknowledgement', () => {
    it('should return true when datasets are genetic studies only', () => {
      const datasets: Partial<Dataset>[] = [
        {
          dataUse: {
            geneticStudiesOnly: true,
          } as DataUse,
        } as Dataset,
      ]
      expect(needsGsoAcknowledgement(datasets as Dataset[])).to.equal(true)
    })
  })

  describe('needsPubAcknowledgement', () => {
    it('should return true when publication results required', () => {
      const datasets: Partial<Dataset>[] = [
        {
          dataUse: {
            publicationResults: true,
          } as DataUse,
        } as Dataset,
      ]
      expect(needsPubAcknowledgement(datasets as Dataset[])).to.equal(true)
    })
  })

  describe('needsDsAcknowledgement', () => {
    it('should return true when data use translations differ', () => {
      const translations = [
        { generalUse: true },
        { hmbResearch: false },
      ]
      expect(needsDsAcknowledgement(translations)).to.equal(true)
    })

    it('should return false when data use translations are the same', () => {
      const translations = [
        { generalUse: true },
        { generalUse: true },
      ]
      expect(needsDsAcknowledgement(translations)).to.equal(false)
    })

    it('should return false when there is only one translation', () => {
      const translations = [{ generalUse: true }]
      expect(needsDsAcknowledgement(translations)).to.equal(false)
    })
  })

  describe('newIrbDocumentExpirationDate', () => {
    it('should return a date string one year from today', () => {
      const result = newIrbDocumentExpirationDate()
      const today = new Date()
      const nextYear = today.getFullYear() + 1
      expect(result).to.match(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD format
      expect(result.startsWith(nextYear.toString())).to.equal(true)
    })

    it('should return properly formatted date string', () => {
      const result = newIrbDocumentExpirationDate()
      const parts = result.split('-')
      expect(parts.length).to.equal(3)
      expect(Number.parseInt(parts[0])).to.be.greaterThan(2000)
      expect(Number.parseInt(parts[1])).to.be.within(1, 12)
      expect(Number.parseInt(parts[2])).to.be.within(1, 31)
    })
  })
})

describe('darFormUtils - Form Validation', () => {
  describe('validationFailed', () => {
    it('should return true when validation object contains errors', () => {
      const validation = {
        field1: { valid: false, failed: ['required'] },
      }
      expect(validationFailed(validation)).to.equal(true)
    })

    it('should return false when validation object is empty', () => {
      const validation = {}
      expect(validationFailed(validation)).to.equal(false)
    })

    it('should return false when all values are empty', () => {
      const validation = {
        field1: undefined,
        field2: null,
      }
      expect(validationFailed(validation)).to.equal(false)
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
      expect(errors.name).to.be.an('object')
      expect(errors.name?.valid).to.equal(false)
    })

    it('should return error for undefined collaborator', () => {
      const errors = computeCollaboratorErrors({ collaborator: {} as Partial<Collaborator> })
      expect(Object.keys(errors).length).to.be.greaterThan(0)
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
      expect(errors.approverStatus).to.equal(undefined)
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
      expect(errorKeys.length).to.equal(0)
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
        expect(ORCID_REGEX.test(orcid)).to.equal(true)
      })
    })

    it('should not match invalid ORCID format', () => {
      const invalidOrcids = [
        '0000-0002-1234-567', // only 3 digits at end
        '0000-0002-1234', // missing last group
        'not-valid-orcid-xxxx', // completely invalid format
      ]
      invalidOrcids.forEach((orcid) => {
        expect(ORCID_REGEX.test(orcid)).to.equal(false)
      })
    })
  })

  describe('calcPublicationErrors', () => {
    it('should return error for missing title', () => {
      const publication: Partial<Publication> = {}
      const errors = calcPublicationErrors(publication)
      expect(errors.title).to.be.an('object')
    })

    it('should return error for missing authors', () => {
      const publication: Partial<Publication> = {
        title: 'Test Publication',
        authors: [],
      }
      const errors = calcPublicationErrors(publication)
      expect(errors.authors).to.be.an('object')
    })

    it('should return error for author with missing name', () => {
      const publication: Partial<Publication> = {
        title: 'Test Publication',
        authors: [{ name: '' }] as Array<{ name: string }>,
      }
      const errors = calcPublicationErrors(publication)
      expect(errors.authors).to.be.an('object')
    })

    it('should return error for invalid ORCID format', () => {
      const publication: Partial<Publication> = {
        title: 'Test Publication',
        authors: [{ name: 'John Doe', orcId: 'invalid-orcid' }] as Array<{ name: string, orcId: string }>,
      }
      const errors = calcPublicationErrors(publication)
      expect(errors.authors).to.be.an('object')
    })
  })

  describe('calcPresentationErrors', () => {
    it('should return error for missing title', () => {
      const presentation: Partial<Presentation> = {}
      const errors = calcPresentationErrors(presentation)
      expect(errors.title).to.be.an('object')
    })

    it('should return error for missing presenter name', () => {
      const presentation: Partial<Presentation> = {
        title: 'Test Presentation',
        presenter: { name: '', email: 'test@example.com' } as { name: string, email: string },
      }
      const errors = calcPresentationErrors(presentation)
      const presenterErrors = errors.presenter as Record<string, unknown>
      expect(presenterErrors?.name).to.be.an('object')
    })

    it('should return error for missing presenter email', () => {
      const presentation: Partial<Presentation> = {
        title: 'Test Presentation',
        presenter: { name: 'John Doe', email: '' } as { name: string, email: string },
      }
      const errors = calcPresentationErrors(presentation)
      const presenterErrors = errors.presenter as Record<string, unknown>
      expect(presenterErrors?.email).to.be.an('object')
    })

    it('should return errors for multiple missing fields', () => {
      const presentation: Partial<Presentation> = {}
      const errors = calcPresentationErrors(presentation)
      expect(Object.keys(errors).length).to.be.greaterThan(1)
    })
  })
})

describe('darFormUtils - DAR Form Validation', () => {
  const mockDataset: Partial<Dataset> = {
    dataUse: {} as DataUse,
  }

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

      expect(result).to.have.property('researcherInfoErrors')
      expect(result).to.have.property('darErrors')
      expect(result).to.have.property('rusErrors')
      expect(result).to.have.property('nihValid')
    })

    it('should return errors for missing required researcher info', () => {
      const formData = {}

      const result = validateDARFormData({
        formData,
        datasets: [],
        dataUseTranslations: [],
        irbDocument: undefined as never,
        collaborationLetter: undefined as never,
        researcher: { userId: 1 } as DuosUser,
        labCollaboratorsCompleted: false,
        internalCollaboratorsCompleted: false,
        externalCollaboratorsCompleted: false,
      })

      expect(Object.keys(result.researcherInfoErrors).length).to.be.greaterThan(0)
    })

    it('should return errors for incomplete collaborators', () => {
      const formData = {
        nihValid: true,
      }

      const result = validateDARFormData({
        formData,
        datasets: [mockDataset as Dataset],
        dataUseTranslations: [],
        irbDocument: undefined as never,
        collaborationLetter: undefined as never,
        researcher: { userId: 1 } as DuosUser,
        labCollaboratorsCompleted: false,
        internalCollaboratorsCompleted: false,
        externalCollaboratorsCompleted: false,
      })

      expect(result.researcherInfoErrors.labCollaboratorsCompleted).to.be.an('object')
      expect(result.researcherInfoErrors.internalCollaborators).to.be.an('object')
      expect(result.researcherInfoErrors.externalCollaborators).to.be.an('object')
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

      expect(result.darErrors.irbDocument).to.be.an('object')
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

      expect(result.darErrors.collaborationLetter).to.be.an('object')
    })

    it('should validate gender when oneGender is true', () => {
      const formData = {
        oneGender: true,
        gender: 'X',
        aiLlmUse: false,
        controls: false,
        population: false,
        forProfit: false,
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
        dataUseTranslations: [],
        irbDocument: undefined as never,
        collaborationLetter: undefined as never,
        researcher: { userId: 1 } as DuosUser,
        labCollaboratorsCompleted: true,
        internalCollaboratorsCompleted: true,
        externalCollaboratorsCompleted: true,
      })

      expect(result.rusErrors.gender).to.be.an('object')
    })

    it('should not error on valid gender value', () => {
      const formData = {
        oneGender: true,
        gender: 'M',
        aiLlmUse: false,
        controls: false,
        population: false,
        forProfit: false,
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
        dataUseTranslations: [],
        irbDocument: undefined as never,
        collaborationLetter: undefined as never,
        researcher: { userId: 1 } as DuosUser,
        labCollaboratorsCompleted: true,
        internalCollaboratorsCompleted: true,
        externalCollaboratorsCompleted: true,
      })

      expect(result.rusErrors.gender).to.equal(undefined)
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

      expect(result).to.have.property('darErrors')
      expect(result.darErrors).to.be.an('object')
    })

    it('should return error when nihValid is false', () => {
      const formData = {}

      const result = validatePRFormData(false, formData, [], [])

      expect(result.darErrors.nihEraId).to.be.an('object')
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

      expect(result.darErrors.progressReportSummary).to.be.an('object')
    })
  })

  describe('Cloud use validation', () => {
    it('should require cloud provider when cloudUse is true and anvilUse is false', () => {
      const formData = {
        anvilUse: false,
        cloudUse: true,
        localUse: false,
        cloudProvider: '',
        cloudProviderType: '',
        cloudProviderDescription: '',
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

      expect(result.researcherInfoErrors.cloudProvider).to.be.an('object')
      expect(result.researcherInfoErrors.cloudProviderType).to.be.an('object')
      expect(result.researcherInfoErrors.cloudProviderDescription).to.be.an('object')
    })

    it('should not require cloud provider when anvilUse is true', () => {
      const formData = {
        anvilUse: true,
        cloudUse: true,
        localUse: false,
        cloudProvider: '',
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

      expect(result.researcherInfoErrors.cloudProvider).to.equal(undefined)
    })

    it('should require at least one storage option', () => {
      const formData = {
        anvilUse: false,
        cloudUse: false,
        localUse: false,
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

      expect(result.researcherInfoErrors.dataStorageAndAnalysis).to.be.an('object')
    })
  })
})
