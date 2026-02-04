import StackdriverReporter from 'src/libs/stackdriverReporter'
import { Storage } from 'src/libs/storage'
import { Config } from 'src/libs/config'

describe('StackdriverReporter', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.clear()
    })
  })

  afterEach(() => {
    cy.window().then((win) => {
      win.localStorage.clear()
    })
  })

  describe('report', () => {
    it('should not throw error when errorHandler context is undefined', () => {
      // Setup: Mock Storage and Config
      cy.stub(Storage, 'getCurrentUser').returns({ email: 'test@example.com' })
      cy.stub(Config, 'getEnv').resolves('test')

      // This test simulates the scenario where report() is called
      // before start() has been called or when errorHandler is not initialized
      // The errorHandler.context will be undefined in this case

      // Call report without calling start first
      cy.wrap(StackdriverReporter.report('Test error message')).then(() => {
        // If the fix is working, this should not throw an error
        // The test passing means the error was silently handled
      })
    })

    it('should format message correctly', () => {
      cy.stub(Config, 'getEnv').resolves('production')

      cy.wrap(StackdriverReporter.format('Test message')).should('equal', '[production] Test message ')
    })
  })

  describe('generateErrorConfig', () => {
    it('should generate correct error configuration', () => {
      const mockUser = { email: 'test@example.com' }
      cy.stub(Storage, 'getCurrentUser').returns(mockUser)
      cy.stub(Config, 'getErrorApiKey').resolves('test-api-key')
      cy.stub(Config, 'getProject').resolves('test-project')
      cy.stub(Config, 'getHash').resolves('abc123')
      cy.stub(Config, 'getTag').resolves('production_v1.0')
      cy.stub(Config, 'getEnv').resolves('prod')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cy.wrap(StackdriverReporter.generateErrorConfig()).then((config: any) => {
        expect(config).to.deep.include({
          key: 'test-api-key',
          projectId: 'test-project',
          service: 'DUOS',
          reportUncaughtExceptions: false,
          reportUnhandledPromiseRejections: false,
        })
        expect(config.version).to.include('v1.0')
        expect(config.version).to.include('abc123')
        expect(config.version).to.include('prod')
        expect(config.context.user).to.equal('test@example.com')
      })
    })

    it('should use "anonymous" when user has no email', () => {
      cy.stub(Storage, 'getCurrentUser').returns(null)
      cy.stub(Config, 'getErrorApiKey').resolves('test-api-key')
      cy.stub(Config, 'getProject').resolves('test-project')
      cy.stub(Config, 'getHash').resolves('abc123')
      cy.stub(Config, 'getTag').resolves('staging_v2.0')
      cy.stub(Config, 'getEnv').resolves('staging')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cy.wrap(StackdriverReporter.generateErrorConfig()).then((config: any) => {
        expect(config.context.user).to.equal('anonymous')
      })
    })
  })

  describe('start', () => {
    it('should not start when config key is nil', () => {
      cy.stub(Config, 'getErrorApiKey').resolves(null)
      cy.stub(Config, 'getProject').resolves('test-project')
      cy.stub(Storage, 'getCurrentUser').returns(null)
      cy.stub(Config, 'getHash').resolves('abc123')
      cy.stub(Config, 'getTag').resolves('production_v1.0')
      cy.stub(Config, 'getEnv').resolves('test')

      // Should not throw error even when key is nil
      cy.wrap(StackdriverReporter.start())
    })
  })
})
