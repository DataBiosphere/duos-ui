import { Config } from 'src/libs/config'
import { getAllFeatureFlags, getFeatureFlag } from 'src/libs/ajax/FeatureFlag'

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
      fetchStub.resolves(new win.Response(JSON.stringify(response), { status: 200, headers: { 'content-type': 'application/json' } }))
      cy.wrap(getAllFeatureFlags()).should('deep.equal', response)
    })
  })

  it('getFeatureFlag returns the per-key value when available', () => {
    cy.window().then((win) => {
      fetchStub.resolves(new win.Response(JSON.stringify('enabled'), { status: 200, headers: { 'content-type': 'application/json' } }))
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
