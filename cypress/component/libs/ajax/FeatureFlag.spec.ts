import { Config } from 'src/libs/config'
import { getAllFeatureFlags, getFeatureFlag, getFlagEsIndexKeyName, resetEsIndexKeyNamePromise } from 'src/libs/ajax/FeatureFlag'

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

describe('FeatureFlag tests for ES_TYPE_TO_INDEX_ENABLED flag', () => {
  let fetchStub: ReturnType<typeof cy.stub>

  beforeEach(() => {
    resetEsIndexKeyNamePromise()
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

  it('getFlagEsIndexKeyName returns "_index" when the ES_TYPE_TO_INDEX_ENABLED flag is "true"', () => {
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify('true'), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      cy.wrap(getFlagEsIndexKeyName()).should('equal', '_index')
    })
  })

  it('getFlagEsIndexKeyName returns "_type" when the ES_TYPE_TO_INDEX_ENABLED flag is not "true"', () => {
    cy.window().then((win) => {
      fetchStub.resolves(
        new win.Response(JSON.stringify('false'), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      )
      cy.wrap(getFlagEsIndexKeyName()).should('equal', '_type')
    })
  })
})
