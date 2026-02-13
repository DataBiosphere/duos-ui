import { Config, getEnv, getApiUrl, getBardApiUrl, getEcmApiUrl, getECMUrl, getErrorApiKey, getGaId, getHash, getProject, getSamApiUrl, getTag, getTdrApiUrl, getTerraUrl, Token, authOpts, jsonBody, multiPartOpts, textPlain } from 'src/libs/config'
import { Storage } from 'src/libs/storage'

describe('Config', () => {
  const mockConfig = {
    env: 'test',
    apiUrl: 'https://test.api.com',
    bardApiUrl: 'https://test.bard.com',
    ecmApiUrl: 'https://test.ecm.com',
    errorApiKey: 'test-error-key',
    gaId: 'GA-TEST-123',
    hash: 'test-hash-123',
    nihUrl: 'https://test.nih.gov',
    profileUrl: 'https://test.profile.com',
    samApiUrl: 'https://test.sam.com',
    tag: 'v1.0.0-test',
    tdrApiUrl: 'https://test.tdr.com',
    terraUrl: 'https://test.terra.bio',
  }

  beforeEach(() => {
    // Intercept the config.json fetch
    cy.intercept('GET', '/config.json', {
      statusCode: 200,
      body: mockConfig,
    }).as('getConfig')
  })

  describe('Config instance', () => {
    it('should be an object instance', () => {
      expect(Config).to.be.an('object')
    })

    it('should get full config', () => {
      cy.wrap(Config.getConfig()).then((result) => {
        expect(result).to.deep.equal(mockConfig)
      })
      cy.wait('@getConfig')
    })

    it('should get env', () => {
      cy.wrap(Config.getEnv()).then((result) => {
        expect(result).to.equal('test')
      })
    })

    it('should get apiUrl', () => {
      cy.wrap(Config.getApiUrl()).then((result) => {
        expect(result).to.equal('https://test.api.com')
      })
    })

    it('should get bardApiUrl', () => {
      cy.wrap(Config.getBardApiUrl()).then((result) => {
        expect(result).to.equal('https://test.bard.com')
      })
    })

    it('should get ecmApiUrl', () => {
      cy.wrap(Config.getEcmApiUrl()).then((result) => {
        expect(result).to.equal('https://test.ecm.com')
      })
    })

    it('should get ECMUrl', () => {
      cy.wrap(Config.getECMUrl()).then((result) => {
        expect(result).to.equal('https://test.ecm.com')
      })
    })

    it('should get errorApiKey', () => {
      cy.wrap(Config.getErrorApiKey()).then((result) => {
        expect(result).to.equal('test-error-key')
      })
    })

    it('should get gaId', () => {
      cy.wrap(Config.getGaId()).then((result) => {
        expect(result).to.equal('GA-TEST-123')
      })
    })

    it('should get hash', () => {
      cy.wrap(Config.getHash()).then((result) => {
        expect(result).to.equal('test-hash-123')
      })
    })

    it('should get project', () => {
      cy.wrap(Config.getProject()).then((result) => {
        expect(result).to.equal('broad-duos-test')
      })
    })

    it('should get samApiUrl', () => {
      cy.wrap(Config.getSamApiUrl()).then((result) => {
        expect(result).to.equal('https://test.sam.com')
      })
    })

    it('should get tag', () => {
      cy.wrap(Config.getTag()).then((result) => {
        expect(result).to.equal('v1.0.0-test')
      })
    })

    it('should get tdrApiUrl', () => {
      cy.wrap(Config.getTdrApiUrl()).then((result) => {
        expect(result).to.equal('https://test.tdr.com')
      })
    })

    it('should get terraUrl', () => {
      cy.wrap(Config.getTerraUrl()).then((result) => {
        expect(result).to.equal('https://test.terra.bio')
      })
    })
  })

  describe('Exported functions', () => {
    it('getEnv should return environment', () => {
      cy.wrap(getEnv()).then((result) => {
        expect(result).to.equal('test')
      })
    })

    it('getApiUrl should return API URL', () => {
      cy.wrap(getApiUrl()).then((result) => {
        expect(result).to.equal('https://test.api.com')
      })
    })

    it('getBardApiUrl should return Bard API URL', () => {
      cy.wrap(getBardApiUrl()).then((result) => {
        expect(result).to.equal('https://test.bard.com')
      })
    })

    it('getEcmApiUrl should return ECM API URL', () => {
      cy.wrap(getEcmApiUrl()).then((result) => {
        expect(result).to.equal('https://test.ecm.com')
      })
    })

    it('getECMUrl should return ECM URL', () => {
      cy.wrap(getECMUrl()).then((result) => {
        expect(result).to.equal('https://test.ecm.com')
      })
    })

    it('getErrorApiKey should return error API key', () => {
      cy.wrap(getErrorApiKey()).then((result) => {
        expect(result).to.equal('test-error-key')
      })
    })

    it('getGaId should return Google Analytics ID', () => {
      cy.wrap(getGaId()).then((result) => {
        expect(result).to.equal('GA-TEST-123')
      })
    })

    it('getHash should return hash', () => {
      cy.wrap(getHash()).then((result) => {
        expect(result).to.equal('test-hash-123')
      })
    })

    it('getProject should return project name based on environment', () => {
      cy.wrap(getProject()).then((result) => {
        expect(result).to.equal('broad-duos-test')
      })
    })

    it('getSamApiUrl should return SAM API URL', () => {
      cy.wrap(getSamApiUrl()).then((result) => {
        expect(result).to.equal('https://test.sam.com')
      })
    })

    it('getTag should return tag', () => {
      cy.wrap(getTag()).then((result) => {
        expect(result).to.equal('v1.0.0-test')
      })
    })

    it('getTdrApiUrl should return TDR API URL', () => {
      cy.wrap(getTdrApiUrl()).then((result) => {
        expect(result).to.equal('https://test.tdr.com')
      })
    })

    it('getTerraUrl should return Terra URL', () => {
      cy.wrap(getTerraUrl()).then((result) => {
        expect(result).to.equal('https://test.terra.bio')
      })
    })
  })

  describe('Token', () => {
    it('should get token from storage when available', () => {
      const mockToken = 'test-token-123'
      cy.stub(Storage, 'getOidcUser').returns({ id_token: mockToken })

      const token = Token.getToken()
      expect(token).to.equal(mockToken)
    })

    it('should return undefined when no token is available', () => {
      cy.stub(Storage, 'getOidcUser').returns(null)

      const token = Token.getToken()
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      expect(token).to.be.undefined
    })
  })

  describe('authOpts', () => {
    it('should create auth options with provided token', () => {
      const token = 'custom-token'
      const opts = authOpts(token)

      expect(opts).to.deep.equal({
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'X-App-ID': 'DUOS',
        },
      })
    })

    it('should create auth options with token from storage if not provided', () => {
      const mockToken = 'storage-token'
      cy.stub(Storage, 'getOidcUser').returns({ id_token: mockToken })

      const opts = authOpts()

      expect(opts.headers['Authorization']).to.equal(`Bearer ${mockToken}`)
      expect(opts.headers['Accept']).to.equal('application/json')
      expect(opts.headers['X-App-ID']).to.equal('DUOS')
    })
  })

  describe('jsonBody', () => {
    it('should create JSON body options with simple object', () => {
      const body = { key: 'value', number: 42 }
      const opts = jsonBody(body)

      expect(opts).to.deep.equal({
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      })
    })

    it('should create JSON body options with complex object', () => {
      const body = {
        nested: { data: 'value' },
        array: [1, 2, 3],
        boolean: true,
      }
      const opts = jsonBody(body)

      expect(opts.body).to.equal(JSON.stringify(body))
      expect(opts.headers['Content-Type']).to.equal('application/json')
    })

    it('should handle null body', () => {
      const opts = jsonBody(null)

      expect(opts.body).to.equal('null')
      expect(opts.headers['Content-Type']).to.equal('application/json')
    })
  })

  describe('multiPartOpts', () => {
    it('should create multipart options with provided token', () => {
      const token = 'custom-token'
      const opts = multiPartOpts(token)

      expect(opts).to.deep.equal({
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
          'X-App-ID': 'DUOS',
        },
      })
    })

    it('should create multipart options with token from storage if not provided', () => {
      const mockToken = 'storage-token'
      cy.stub(Storage, 'getOidcUser').returns({ id_token: mockToken })

      const opts = multiPartOpts()

      expect(opts.headers['Authorization']).to.equal(`Bearer ${mockToken}`)
      expect(opts.headers['Content-Type']).to.equal('multipart/form-data')
      expect(opts.headers['X-App-ID']).to.equal('DUOS')
    })
  })

  describe('textPlain', () => {
    it('should create text/plain options', () => {
      const opts = textPlain()

      expect(opts).to.deep.equal({
        headers: {
          'Accept': 'text/plain',
          'X-App-ID': 'DUOS',
        },
      })
    })
  })

  describe('Config instance method wrappers', () => {
    it('authOpts method should call authOpts function', () => {
      const token = 'test-token'
      const opts = Config.authOpts(token)

      expect(opts.headers['Authorization']).to.equal(`Bearer ${token}`)
    })

    it('jsonBody method should call jsonBody function', () => {
      const body = { test: 'data' }
      const opts = Config.jsonBody(body)

      expect(opts.body).to.equal(JSON.stringify(body))
      expect(opts.headers['Content-Type']).to.equal('application/json')
    })

    it('multiPartOpts method should call multiPartOpts function', () => {
      const token = 'test-token'
      const opts = Config.multiPartOpts(token)

      expect(opts.headers['Content-Type']).to.equal('multipart/form-data')
    })

    it('textPlain method should call textPlain function', () => {
      const opts = Config.textPlain()

      expect(opts.headers['Accept']).to.equal('text/plain')
    })
  })
})
