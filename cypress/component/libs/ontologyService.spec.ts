import { OntologyService, OntologyEntry } from 'src/libs/ontologyService'
import { Config } from 'src/libs/config'
import { Storage } from 'src/libs/storage'
import { Notifications } from 'src/libs/utils'

const mockApiUrl = 'https://consent.example.org'

const mockOntologyResults: OntologyEntry[] = [
  { id: 'DOID_0001', label: 'test disease alpha' },
  { id: 'DOID_0002', label: 'test disease beta' },
]

const doidUrls = [
  'https://purl.obolibrary.org/obo/DOID_0001',
  'https://purl.obolibrary.org/obo/DOID_0002',
]

const nonDoidUrls = [
  'https://purl.obolibrary.org/obo/HP_0001250',
  'https://example.com/no-doid',
]

const mixedDoidUrls = [
  'https://purl.obolibrary.org/obo/DOID_0001',
  'https://purl.obolibrary.org/obo/HP_0001250',
  'https://purl.obolibrary.org/obo/DOID_0002',
]

const midPathDoidUrl = 'https://purl.obolibrary.org/obo/extra/path/DOID_0003/suffix'

describe('OntologyService', () => {
  beforeEach(() => {
    cy.initApplicationConfig()
    cy.stub(Config, 'getApiUrl').resolves(mockApiUrl)
    cy.window().then((win) => {
      win.localStorage.clear()
    })
  })

  afterEach(() => {
    cy.window().then((win) => {
      win.localStorage.clear()
    })
  })

  describe('searchOntology', () => {
    it('should return an empty array when obolibraryURL is empty', () => {
      cy.wrap(OntologyService.searchOntology('')).then((result) => {
        expect(result).to.deep.equal([])
      })
    })

    it('should fetch from API and return results when cache is empty', () => {
      cy.intercept('GET', `${mockApiUrl}/ontology/search*`, {
        statusCode: 200,
        body: mockOntologyResults,
      }).as('ontologySearch')

      cy.wrap(OntologyService.searchOntology('DOID_0001')).then((result) => {
        expect(result).to.deep.equal(mockOntologyResults)
      })

      cy.wait('@ontologySearch').its('request.url').should('include', 'ids=DOID_0001')
    })

    it('should return cached results without making another API call', () => {
      Storage.setData('DOID_0001', mockOntologyResults)

      let networkCallMade = false
      cy.intercept('GET', `${mockApiUrl}/ontology/search*`, () => {
        networkCallMade = true
      })

      cy.wrap(OntologyService.searchOntology('DOID_0001')).then((result) => {
        expect(result).to.deep.equal(mockOntologyResults)
        expect(networkCallMade).to.equal(false)
      })
    })

    it('should store API results in cache after fetching', () => {
      cy.intercept('GET', `${mockApiUrl}/ontology/search*`, {
        statusCode: 200,
        body: mockOntologyResults,
      })

      cy.wrap(OntologyService.searchOntology('DOID_0001')).then(() => {
        const cached = Storage.getData<OntologyEntry[]>('DOID_0001')
        expect(cached).to.deep.equal(mockOntologyResults)
      })
    })

    it('should show error notification and return empty array on API failure', () => {
      cy.stub(Notifications, 'showError').as('showError')

      cy.intercept('GET', `${mockApiUrl}/ontology/search*`, {
        statusCode: 500,
        body: { message: 'Internal Server Error' },
      })

      cy.wrap(OntologyService.searchOntology('DOID_0001')).then((result) => {
        expect(result).to.deep.equal([])
        cy.get('@showError').should('have.been.calledOnce')
      })
    })

    it('should pass the ids param to the API', () => {
      const ontologyId = 'DOID_0001,DOID_0002'

      cy.intercept('GET', `${mockApiUrl}/ontology/search*`, {
        statusCode: 200,
        body: mockOntologyResults,
      }).as('ontologySearch')

      cy.wrap(OntologyService.searchOntology(ontologyId)).then(() => {
        cy.wait('@ontologySearch').its('request.url').should('include', encodeURIComponent(ontologyId))
      })
    })
  })

  describe('extractDOIDFromUrl', () => {
    it('should extract DOID identifiers from a list of URLs', () => {
      const result = OntologyService.extractDOIDFromUrl(doidUrls)
      expect(result).to.deep.equal(['DOID_0001', 'DOID_0002'])
    })

    it('should return an empty array when no URLs contain DOID identifiers', () => {
      const result = OntologyService.extractDOIDFromUrl(nonDoidUrls)
      expect(result).to.deep.equal([])
    })

    it('should return an empty array for an empty input', () => {
      const result = OntologyService.extractDOIDFromUrl([])
      expect(result).to.deep.equal([])
    })

    it('should only extract DOID identifiers and skip non-DOID URLs', () => {
      const result = OntologyService.extractDOIDFromUrl(mixedDoidUrls)
      expect(result).to.deep.equal(['DOID_0001', 'DOID_0002'])
    })

    it('should handle URLs where DOID identifier appears mid-path', () => {
      const result = OntologyService.extractDOIDFromUrl([midPathDoidUrl])
      expect(result).to.deep.equal(['DOID_0003/suffix'])
    })
  })
})
