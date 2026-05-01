import { getLibraryVersions, getBrandedLibrary, BoolQuery } from 'src/libs/libraryVersions'

describe('Library Versions - Tests', function () {
  describe('getLibraryVersions function', function () {
    it('returns an object with library configurations', function () {
      const versions = getLibraryVersions(null, null)

      expect(versions).to.be.an('object')
      expect(Object.keys(versions).length).to.be.greaterThan(0)
    })

    it('includes required properties for each library', function () {
      const versions = getLibraryVersions(null, null)

      Object.entries(versions).forEach(([_key, library]) => {
        expect(library).to.have.property('title')
        expect(library).to.have.property('icon')
        expect(library).to.have.property('featured')
        expect(library.featured).to.be.a('boolean')

        // Query can be null or an object
        expect(library).to.have.property('query')
      })
    })

    it('marks exactly the correct libraries as featured', function () {
      const versions = getLibraryVersions(null, null)

      const featuredLibraries = Object.entries(versions)
        .filter(([, library]) => library.featured)
        .map(([_key]) => _key)

      // Currently featured: 22 libraries including /datalibrary, broad, elwazi, nhgri, scp, anvil, hca, etc.
      expect(featuredLibraries).to.include('/datalibrary')
      expect(featuredLibraries).to.include('broad')
      expect(featuredLibraries).to.include('elwazi')
      expect(featuredLibraries).to.include('anvil')
      expect(featuredLibraries).to.include('hca')
      expect(featuredLibraries).to.include('scp')

      // Verify count
      expect(featuredLibraries.length).to.equal(22)
    })

    it('marks non-featured libraries correctly', function () {
      const versions = getLibraryVersions(null, null)

      const nonFeaturedLibraries = Object.entries(versions)
        .filter(([, library]) => !library.featured)
        .map(([_key]) => _key)

      // Examples of non-featured libraries
      expect(nonFeaturedLibraries).to.include('terra')
      expect(nonFeaturedLibraries).to.include('mgb')
      expect(nonFeaturedLibraries).to.include('nhlbi')
    })

    it('includes all expected library keys', function () {
      const versions = getLibraryVersions(null, null)
      const keys = Object.keys(versions)

      // Check for some expected keys
      expect(keys).to.include('/datalibrary')
      expect(keys).to.include('broad')
      expect(keys).to.include('anvil')
      expect(keys).to.include('hca')
      expect(keys).to.include('scp')
      expect(keys).to.include('terra')
      expect(keys).to.include('mgb')
      expect(keys).to.include('myinstitution')
    })

    it('handles myinstitution library with dynamic parameters', function () {
      const institutionId = 123
      const institutionName = 'Test Institution'
      const versions = getLibraryVersions(institutionId, institutionName)

      const myInstitution = versions.myinstitution

      expect(myInstitution).to.not.equal(undefined)
      expect(myInstitution.title).to.equal('Test Institution Data Library')
      if (myInstitution.query && 'match_phrase' in myInstitution.query) {
        expect(myInstitution.query.match_phrase['submitter.institution.id']).to.equal(123)
      }
      expect(myInstitution.featured).to.equal(false)
    })

    it('includes Elasticsearch query for most libraries', function () {
      const versions = getLibraryVersions(null, null)

      Object.entries(versions).forEach(([_key, library]) => {
        // Some libraries have null query (/datalibrary, terra)
        if (library.query !== null) {
          expect(library.query).to.be.an('object')
          // Should have either match_phrase, term, or bool
          const hasValidQuery
            = ('match_phrase' in library.query)
              || ('term' in library.query)
              || ('bool' in library.query)
          expect(hasValidQuery).to.equal(true)
        }
      })
    })

    it('maintains consistent title format', function () {
      const versions = getLibraryVersions(null, null)

      Object.entries(versions).forEach(([key, library]) => {
        if (key !== '/datalibrary') {
          expect(library.title).to.include('Data Library')
        }
      })
    })
  })

  describe('Featured libraries integration', function () {
    it('provides correct data for Home page rendering', function () {
      const versions = getLibraryVersions(null, null)

      const featuredLibraries = Object.entries(versions)
        .filter(([, library]) => library.featured)
        .map(([key, library]) => ({ key, ...library }))
        .sort((a, b) => a.order - b.order || a.key.localeCompare(b.key))

      // Should have 22 featured libraries
      expect(featuredLibraries.length).to.equal(22)

      // Should be sorted by order parameter
      expect(featuredLibraries[0].key).to.equal('/datalibrary') // order: 1
      expect(featuredLibraries[1].key).to.equal('broad') // order: 2
      expect(featuredLibraries[2].key).to.equal('elwazi') // order: 3

      // Each should have required properties
      featuredLibraries.forEach((library) => {
        expect(library).to.have.property('key')
        expect(library).to.have.property('title')
        expect(library).to.have.property('icon')
        expect(library).to.have.property('query')
        expect(library).to.have.property('order')
        expect(library.featured).to.equal(true)
      })
    })
  })

  describe('getBrandedLibrary function', function () {
    it('returns the default library when queryParam is undefined', function () {
      const library = getBrandedLibrary(undefined, undefined, undefined)

      expect(library).to.not.equal(undefined)
      expect(library.title).to.equal('DUOS Data Library')
      expect(library.featured).to.equal(true)
      expect(library.query).to.equal(null)
    })

    it('returns the default library when queryParam is /datalibrary', function () {
      const library = getBrandedLibrary(undefined, undefined, '/datalibrary')

      expect(library).to.not.equal(undefined)
      expect(library.title).to.equal('DUOS Data Library')
      expect(library.featured).to.equal(true)
    })

    it('returns correct library for branded query param (broad)', function () {
      const library = getBrandedLibrary(undefined, undefined, 'broad')

      expect(library).to.not.equal(undefined)
      expect(library.title).to.equal('Broad Data Library')
      expect(library.featured).to.equal(true)
      expect(library.icon).to.not.equal(undefined)
    })

    it('returns correct library for branded query param (anvil)', function () {
      const library = getBrandedLibrary(undefined, undefined, 'anvil')

      expect(library).to.not.equal(undefined)
      expect(library.title).to.equal('AnVIL Data Library')
      expect(library.featured).to.equal(true)
      expect(library.query).to.not.equal(null)
    })

    it('handles case-insensitive query param', function () {
      const library1 = getBrandedLibrary(undefined, undefined, 'BROAD')
      const library2 = getBrandedLibrary(undefined, undefined, 'Broad')
      const library3 = getBrandedLibrary(undefined, undefined, 'broad')

      expect(library1).to.deep.equal(library2)
      expect(library2).to.deep.equal(library3)
      expect(library1.title).to.equal('Broad Data Library')
    })

    it('returns myinstitution library with dynamic institution data', function () {
      const institutionId = 456
      const institutionName = 'Research Institute'
      const library = getBrandedLibrary(institutionId, institutionName, 'myinstitution')

      expect(library).to.not.equal(undefined)
      expect(library.title).to.equal('Research Institute Data Library')
      if (library.query && 'match_phrase' in library.query) {
        expect(library.query.match_phrase['submitter.institution.id']).to.equal(456)
      }
      expect(library.featured).to.equal(false)
    })

    it('handles unknown query param by returning undefined', function () {
      const library = getBrandedLibrary(undefined, undefined, 'unknownbrand')

      expect(library).to.equal(undefined)
    })

    it('handles terra library correctly', function () {
      const library = getBrandedLibrary(undefined, undefined, 'terra')

      expect(library).to.not.equal(undefined)
      expect(library.title).to.equal('Terra Data Library')
      expect(library.featured).to.equal(false)
      expect(library.query).to.equal(null)
    })

    it('handles mgb library correctly', function () {
      const library = getBrandedLibrary(undefined, undefined, 'mgb')

      expect(library).to.not.equal(undefined)
      expect(library.title).to.equal('Mass General Brigham Data Library')
      expect(library.featured).to.equal(false)
    })

    it('returns library with query for data type restricted libraries', function () {
      const library = getBrandedLibrary(undefined, undefined, 'elwazi')

      expect(library).to.not.equal(undefined)
      expect(library.title).to.equal('eLwazi Data Library')
      expect(library.query).to.not.equal(null)
      expect(library.featured).to.equal(true)
    })
  })

  describe('Bool should query structure', function () {
    it('uses bool.should with match_phrase and terms for description-based libraries', function () {
      const versions = getLibraryVersions(null, null)

      const descriptionLibraries = ['elwazi', 'anvil', 'hca', 'scp', 'nhlbi', 'cfde', 'schare', 'stanley', 'stanleycenter']

      descriptionLibraries.forEach((key) => {
        const library = versions[key]
        expect(library.query).to.not.equal(null)
        expect(library.query).to.have.property('bool')

        const query = library.query as { bool: { should: object[] } }
        expect(query.bool.should).to.be.an('array')
        expect(query.bool.should.length).to.be.greaterThan(1)

        const hasMatchPhrase = query.bool.should.some(clause => 'match_phrase' in clause)
        const hasTerms = query.bool.should.some(clause => 'terms' in clause)

        expect(hasMatchPhrase).to.equal(true, `${key} should have a match_phrase clause`)
        expect(hasTerms).to.equal(true, `${key} should have a terms clause`)
      })
    })

    it('has matching values between match_phrase description and terms tags', function () {
      const versions = getLibraryVersions(null, null)

      const simpleDescriptionLibraries = ['elwazi', 'anvil', 'hca', 'nhlbi', 'cfde', 'ged']

      simpleDescriptionLibraries.forEach((key) => {
        const query = versions[key].query as BoolQuery

        const matchPhraseClause = query.bool.should.find(c => 'match_phrase' in c)
        const termsClause = query.bool.should.find(c => 'terms' in c)

        const descriptionValue = matchPhraseClause!.match_phrase['study.description'] as string
        const tagsValue = termsClause!.terms['study.data.tags.keyword']

        expect(tagsValue).to.include(descriptionValue, `${key} tags should include the description value`)
      })
    })

    it('broad library uses submitter.institution.name and tags', function () {
      const versions = getLibraryVersions(null, null)
      const query = versions['broad'].query as BoolQuery

      const matchPhraseClause = query.bool.should.find(c => 'match_phrase' in c)
      const termsClause = query.bool.should.find(c => 'terms' in c)

      expect(matchPhraseClause).to.not.equal(undefined)
      expect(termsClause).to.not.equal(undefined)
      expect(matchPhraseClause!.match_phrase).to.have.property('submitter.institution.name')
      expect(termsClause!.terms['study.data.tags.keyword']).to.include('The Broad Institute of MIT and Harvard')
    })

    it('all terms clauses use study.data.tags.keyword (not study.data.tags) for case-sensitive matching', function () {
      const versions = getLibraryVersions(null, null)

      Object.entries(versions).forEach(([key, library]) => {
        if (library.query === null || !('bool' in library.query)) return

        const query = library.query as BoolQuery
        query.bool.should.forEach((clause) => {
          if ('terms' in clause) {
            expect(clause.terms).to.not.have.property(
              'study.data.tags',
              `${key} should use study.data.tags.keyword, not study.data.tags`,
            )
            expect(clause.terms).to.have.property('study.data.tags.keyword')
          }
        })
      })
    })
  })
})
