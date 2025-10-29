import { getLibraryVersions } from 'src/libs/libraryVersions'

describe('Library Versions - Tests', function () {
  describe('getLibraryVersions function', function () {
    it('returns an object with library configurations', function () {
      const versions = getLibraryVersions(null, null, null)

      expect(versions).to.be.an('object')
      expect(Object.keys(versions).length).to.be.greaterThan(0)
    })

    it('includes required properties for each library', function () {
      const versions = getLibraryVersions(null, null, null)

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
      const versions = getLibraryVersions(null, null, null)

      const featuredLibraries = Object.entries(versions)
        .filter(([, library]) => library.featured)
        .map(([_key]) => _key)

      // Currently featured: 20 libraries including /datalibrary, broad, elwazi, nhgri, scp, anvil, hca, etc.
      expect(featuredLibraries).to.include('/datalibrary')
      expect(featuredLibraries).to.include('broad')
      expect(featuredLibraries).to.include('elwazi')
      expect(featuredLibraries).to.include('anvil')
      expect(featuredLibraries).to.include('hca')
      expect(featuredLibraries).to.include('scp')

      // Verify count
      expect(featuredLibraries.length).to.equal(20)
    })

    it('marks non-featured libraries correctly', function () {
      const versions = getLibraryVersions(null, null, null)

      const nonFeaturedLibraries = Object.entries(versions)
        .filter(([, library]) => !library.featured)
        .map(([_key]) => _key)

      // Examples of non-featured libraries
      expect(nonFeaturedLibraries).to.include('terra')
      expect(nonFeaturedLibraries).to.include('mgb')
      expect(nonFeaturedLibraries).to.include('nhlbi')
    })

    it('includes all expected library keys', function () {
      const versions = getLibraryVersions(null, null, null)
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
      expect(keys).to.include('/custom')
    })

    it('handles myinstitution library with dynamic parameters', function () {
      const institutionId = 123
      const institutionName = 'Test Institution'
      const versions = getLibraryVersions(institutionId, institutionName, null)

      const myInstitution = versions.myinstitution

      expect(myInstitution).to.not.equal(undefined)
      expect(myInstitution.title).to.equal('Test Institution Data Library')
      if (myInstitution.query && 'match_phrase' in myInstitution.query) {
        expect(myInstitution.query.match_phrase['submitter.institution.id']).to.equal(123)
      }
      expect(myInstitution.featured).to.equal(false)
    })

    it('handles custom library with dynamic query', function () {
      const customQuery = 'custom search term'
      const versions = getLibraryVersions(null, null, customQuery)

      const customLibrary = versions['/custom']

      expect(customLibrary).to.not.equal(undefined)
      expect(customLibrary.title).to.equal('custom search term Data Library')
      if (customLibrary.query && 'bool' in customLibrary.query) {
        expect(customLibrary.query.bool.should).to.be.an('array')
        expect(customLibrary.query.bool.should.length).to.equal(2)
      }
      expect(customLibrary.featured).to.equal(false)
    })

    it('includes Elasticsearch query for most libraries', function () {
      const versions = getLibraryVersions(null, null, null)

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
      const versions = getLibraryVersions(null, null, null)

      Object.entries(versions).forEach(([key, library]) => {
        if (key !== '/datalibrary') {
          expect(library.title).to.include('Data Library')
        }
      })
    })
  })

  describe('Featured libraries integration', function () {
    it('provides correct data for Home page rendering', function () {
      const versions = getLibraryVersions(null, null, null)

      const featuredLibraries = Object.entries(versions)
        .filter(([, library]) => library.featured)
        .map(([key, library]) => ({ key, ...library }))
        .sort((a, b) => a.order - b.order || a.key.localeCompare(b.key))

      // Should have 20 featured libraries
      expect(featuredLibraries.length).to.equal(20)

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
})
