import { Config } from 'src/libs/config'
import {
  getAllFeatureFlags,
  getFeatureFlag,
  getFlagEsIndexKeyName,
  getFlagNhgriDacId,
  resetEsIndexKeyNamePromise, resetNhgriDacIdPromise,
} from 'src/libs/ajax/FeatureFlag'

describe('FeatureFlag ajax', () => {
  let fetchStub: ReturnType<typeof cy.stub>

  beforeEach(() => {
    cy.initApplicationConfig()
    cy.stub(Config, 'getApiUrl').resolves('')
    cy.window().then((win) => {
      fetchStub = cy.stub(win, 'fetch')
    })
  })

  afterEach(() => {
    cy.window().then(() => {
      fetchStub.restore()
    })
  })

  it('getAllFeatureFlags returns a map of flags', () => {
    const response = { featureAlpha: 'on', featureBeta: 'off' }
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify(response), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      cy.wrap(getAllFeatureFlags()).should('deep.equal', response)
    })
  })

  it('getFeatureFlag returns the per-key value when available', () => {
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify('enabled'), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      cy.wrap(getFeatureFlag('someFlag')).should('equal', 'enabled')
    })
  })

  it('getFeatureFlag returns undefined when per-key endpoint errors', () => {
    cy.window().then(() => {
      fetchStub.rejects(new Error('Not found'))
      cy.wrap(getFeatureFlag('missingFlag')).should('be.undefined')
    })
  })
})

const createFlagTestSuite = <T>(
  flagName: string,
  getFlagFn: () => Promise<T>,
  resetFn: () => void,
  mockResponseValue: string,
  expectedValue: T,
  expectedErrorValue: T | undefined = undefined,
) => {
  describe(`FeatureFlag tests for ${flagName} flag`, () => {
    let fetchStub: ReturnType<typeof cy.stub>

    beforeEach(() => {
      resetFn()
      cy.initApplicationConfig()
      cy.stub(Config, 'getApiUrl').resolves('')
      cy.window().then((win) => {
        fetchStub = cy.stub(win, 'fetch')
      })
    })

    afterEach(() => {
      cy.window().then(() => {
        fetchStub.restore()
      })
    })

    it(`${getFlagFn.name} returns the value when available`, () => {
      cy.window().then((win) => {
        fetchStub.resolves(
          new win.Response(JSON.stringify(mockResponseValue), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        )
        cy.wrap(getFlagFn()).should('equal', expectedValue)
      })
    })

    it(`${getFlagFn.name} returns undefined when the flag fetch errors`, () => {
      cy.window().then(() => {
        fetchStub.rejects(new Error('Not found'))
        cy.wrap(getFlagFn()).should('equal', expectedErrorValue)
      })
    })

    it(`${getFlagFn.name} caches the promise and does not refetch on subsequent calls`, () => {
      cy.window().then((win) => {
        fetchStub.resolves(
          new win.Response(JSON.stringify(mockResponseValue), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        )
        cy.wrap(getFlagFn()).should('equal', expectedValue)
        cy.wrap(getFlagFn()).should('equal', expectedValue)
        cy.wrap(null).then(() => {
          expect(fetchStub.callCount).to.equal(1)
        })
      })
    })
  })
}

createFlagTestSuite('ES_TYPE_TO_INDEX_ENABLED', getFlagEsIndexKeyName, resetEsIndexKeyNamePromise, 'true', '_index', '_type')
createFlagTestSuite('NHGRI_RESTRICTED_DAC', getFlagNhgriDacId, resetNhgriDacIdPromise, 'dac-id', 'dac-id', undefined)
