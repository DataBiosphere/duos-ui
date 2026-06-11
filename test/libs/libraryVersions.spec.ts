import { describe, it, expect } from 'vitest'
import { getLibraryVersions, getBrandedLibrary, BoolQuery } from 'src/libs/libraryVersions'

describe('Library Versions - Tests', () => {
  describe('getLibraryVersions function', () => {
    it('returns an object with library configurations', () => {
      const versions = getLibraryVersions(null, null)

      expect(typeof versions).toBe('object')
      expect(Object.keys(versions).length).toBeGreaterThan(0)
    })

    it('includes required properties for each library', () => {
      const versions = getLibraryVersions(null, null)

      Object.entries(versions).forEach(([_key, library]) => {
        expect(library).toHaveProperty('title')
        expect(library).toHaveProperty('icon')
        expect(library).toHaveProperty('featured')
        expect(typeof library.featured).toBe('boolean')
        expect(library).toHaveProperty('query')
      })
    })

    it('marks exactly the correct libraries as featured', () => {
      const versions = getLibraryVersions(null, null)

      const featuredLibraries = Object.entries(versions)
        .filter(([, library]) => library.featured)
        .map(([_key]) => _key)

      expect(featuredLibraries).toContain('/datalibrary')
      expect(featuredLibraries).toContain('broad')
      expect(featuredLibraries).toContain('elwazi')
      expect(featuredLibraries).toContain('anvil')
      expect(featuredLibraries).toContain('hca')
      expect(featuredLibraries).toContain('scp')

      expect(featuredLibraries.length).toBe(22)
    })

    it('marks non-featured libraries correctly', () => {
      const versions = getLibraryVersions(null, null)

      const nonFeaturedLibraries = Object.entries(versions)
        .filter(([, library]) => !library.featured)
        .map(([_key]) => _key)

      expect(nonFeaturedLibraries).toContain('terra')
      expect(nonFeaturedLibraries).toContain('mgb')
      expect(nonFeaturedLibraries).toContain('nhlbi')
    })

    it('includes all expected library keys', () => {
      const versions = getLibraryVersions(null, null)
      const keys = Object.keys(versions)

      expect(keys).toContain('/datalibrary')
      expect(keys).toContain('broad')
      expect(keys).toContain('anvil')
      expect(keys).toContain('hca')
      expect(keys).toContain('scp')
      expect(keys).toContain('terra')
      expect(keys).toContain('mgb')
      expect(keys).toContain('myinstitution')
    })

    it('handles myinstitution library with dynamic parameters', () => {
      const institutionId = 123
      const institutionName = 'Test Institution'
      const versions = getLibraryVersions(institutionId, institutionName)

      const myInstitution = versions.myinstitution

      expect(myInstitution).not.toBe(undefined)
      expect(myInstitution.title).toBe('Test Institution Data Library')
      if (myInstitution.query && 'match_phrase' in myInstitution.query) {
        expect(myInstitution.query.match_phrase['submitter.institution.id']).toBe(123)
      }
      expect(myInstitution.featured).toBe(false)
    })

    it('includes Elasticsearch query for most libraries', () => {
      const versions = getLibraryVersions(null, null)

      Object.entries(versions).forEach(([_key, library]) => {
        if (library.query !== null) {
          expect(typeof library.query).toBe('object')
          const hasValidQuery
            = ('match_phrase' in library.query)
              || ('term' in library.query)
              || ('bool' in library.query)
          expect(hasValidQuery).toBe(true)
        }
      })
    })

    it('maintains consistent title format', () => {
      const versions = getLibraryVersions(null, null)

      Object.entries(versions).forEach(([key, library]) => {
        if (key !== '/datalibrary') {
          expect(library.title).toContain('Data Library')
        }
      })
    })
  })

  describe('Featured libraries integration', () => {
    it('provides correct data for Home page rendering', () => {
      const versions = getLibraryVersions(null, null)

      const featuredLibraries = Object.entries(versions)
        .filter(([, library]) => library.featured)
        .map(([key, library]) => ({ key, ...library }))
        .sort((a, b) => a.order - b.order || a.key.localeCompare(b.key))

      expect(featuredLibraries.length).toBe(22)

      expect(featuredLibraries[0].key).toBe('/datalibrary') // order: 1
      expect(featuredLibraries[1].key).toBe('broad') // order: 2
      expect(featuredLibraries[2].key).toBe('elwazi') // order: 3

      featuredLibraries.forEach((library) => {
        expect(library).toHaveProperty('key')
        expect(library).toHaveProperty('title')
        expect(library).toHaveProperty('icon')
        expect(library).toHaveProperty('query')
        expect(library).toHaveProperty('order')
        expect(library.featured).toBe(true)
      })
    })
  })

  describe('getBrandedLibrary function', () => {
    it('returns the default library when queryParam is undefined', () => {
      const library = getBrandedLibrary(undefined, undefined, undefined)

      expect(library).not.toBe(undefined)
      expect(library.title).toBe('DUOS Data Library')
      expect(library.featured).toBe(true)
      expect(library.query).toBe(null)
    })

    it('returns the default library when queryParam is /datalibrary', () => {
      const library = getBrandedLibrary(undefined, undefined, '/datalibrary')

      expect(library).not.toBe(undefined)
      expect(library.title).toBe('DUOS Data Library')
      expect(library.featured).toBe(true)
    })

    it('returns correct library for branded query param (broad)', () => {
      const library = getBrandedLibrary(undefined, undefined, 'broad')

      expect(library).not.toBe(undefined)
      expect(library.title).toBe('Broad Data Library')
      expect(library.featured).toBe(true)
      expect(library.icon).not.toBe(undefined)
    })

    it('returns correct library for branded query param (anvil)', () => {
      const library = getBrandedLibrary(undefined, undefined, 'anvil')

      expect(library).not.toBe(undefined)
      expect(library.title).toBe('AnVIL Data Library')
      expect(library.featured).toBe(true)
      expect(library.query).not.toBe(null)
    })

    it('handles case-insensitive query param', () => {
      const library1 = getBrandedLibrary(undefined, undefined, 'BROAD')
      const library2 = getBrandedLibrary(undefined, undefined, 'Broad')
      const library3 = getBrandedLibrary(undefined, undefined, 'broad')

      expect(library1).toEqual(library2)
      expect(library2).toEqual(library3)
      expect(library1.title).toBe('Broad Data Library')
    })

    it('returns myinstitution library with dynamic institution data', () => {
      const institutionId = 456
      const institutionName = 'Research Institute'
      const library = getBrandedLibrary(institutionId, institutionName, 'myinstitution')

      expect(library).not.toBe(undefined)
      expect(library.title).toBe('Research Institute Data Library')
      if (library.query && 'match_phrase' in library.query) {
        expect(library.query.match_phrase['submitter.institution.id']).toBe(456)
      }
      expect(library.featured).toBe(false)
    })

    it('handles unknown query param by returning undefined', () => {
      const library = getBrandedLibrary(undefined, undefined, 'unknownbrand')

      expect(library).toBe(undefined)
    })

    it('handles terra library correctly', () => {
      const library = getBrandedLibrary(undefined, undefined, 'terra')

      expect(library).not.toBe(undefined)
      expect(library.title).toBe('Terra Data Library')
      expect(library.featured).toBe(false)
      expect(library.query).toBe(null)
    })

    it('handles mgb library correctly', () => {
      const library = getBrandedLibrary(undefined, undefined, 'mgb')

      expect(library).not.toBe(undefined)
      expect(library.title).toBe('Mass General Brigham Data Library')
      expect(library.featured).toBe(false)
    })

    it('returns library with query for data type restricted libraries', () => {
      const library = getBrandedLibrary(undefined, undefined, 'elwazi')

      expect(library).not.toBe(undefined)
      expect(library.title).toBe('eLwazi Data Library')
      expect(library.query).not.toBe(null)
      expect(library.featured).toBe(true)
    })
  })

  describe('Bool should query structure', () => {
    it('uses bool.should with match_phrase and terms for description-based libraries', () => {
      const versions = getLibraryVersions(null, null)

      const descriptionLibraries = ['elwazi', 'hca', 'scp', 'nhlbi', 'cfde', 'schare', 'stanley', 'stanleycenter']

      descriptionLibraries.forEach((key) => {
        const library = versions[key]
        expect(library.query).not.toBe(null)
        expect(library.query).toHaveProperty('bool')

        const query = library.query as { bool: { should: object[] } }
        expect(Array.isArray(query.bool.should)).toBe(true)
        expect(query.bool.should.length).toBeGreaterThan(1)

        const hasMatchPhrase = query.bool.should.some(clause => 'match_phrase' in clause)
        const hasTerms = query.bool.should.some(clause => 'terms' in clause)

        expect(hasMatchPhrase).toBe(true)
        expect(hasTerms).toBe(true)
      })
    })

    it('has matching values between match_phrase description and terms tags', () => {
      const versions = getLibraryVersions(null, null)

      const simpleDescriptionLibraries = ['elwazi', 'hca', 'nhlbi', 'cfde', 'ged']

      simpleDescriptionLibraries.forEach((key) => {
        const query = versions[key].query as BoolQuery

        const matchPhraseClause = query.bool.should.find(c => 'match_phrase' in c)
        const termsClause = query.bool.should.find(c => 'terms' in c)

        const descriptionValue = matchPhraseClause!.match_phrase['study.description'] as string
        const tagsValue = termsClause!.terms['study.data.tags.keyword']

        expect(tagsValue).toContain(descriptionValue)
      })
    })

    it('anvil library uses a single terms clause with Platform: AnVIL tag', () => {
      const versions = getLibraryVersions(null, null)
      const query = versions['anvil'].query as { bool: { should: object[] } }

      expect(query).toHaveProperty('bool')
      expect(query.bool.should).toHaveLength(1)

      const clause = query.bool.should[0] as { terms: { 'study.data.tags.keyword': string[] } }
      expect(clause).toHaveProperty('terms')
      expect(clause.terms['study.data.tags.keyword']).toEqual(['Platform: AnVIL'])
    })

    it('broad library uses submitter.institution.name and tags', () => {
      const versions = getLibraryVersions(null, null)
      const query = versions['broad'].query as BoolQuery

      const matchPhraseClause = query.bool.should.find(c => 'match_phrase' in c)
      const termsClause = query.bool.should.find(c => 'terms' in c)

      expect(matchPhraseClause).not.toBe(undefined)
      expect(termsClause).not.toBe(undefined)
      expect(matchPhraseClause!.match_phrase).toHaveProperty('submitter.institution.name')
      expect(termsClause!.terms['study.data.tags.keyword']).toContain('The Broad Institute of MIT and Harvard')
    })

    it('all terms clauses use study.data.tags.keyword (not study.data.tags) for case-sensitive matching', () => {
      const versions = getLibraryVersions(null, null)

      Object.entries(versions).forEach(([_key, library]) => {
        if (library.query === null || !('bool' in library.query)) return

        const query = library.query
        query.bool.should.forEach((clause) => {
          if ('terms' in clause) {
            expect(clause.terms).not.toHaveProperty('study.data.tags')
            expect(clause.terms).toHaveProperty('study.data.tags.keyword')
          }
        })
      })
    })
  })
})
