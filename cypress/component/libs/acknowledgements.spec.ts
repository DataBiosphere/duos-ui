import * as Acknowledgements from 'src/libs/acknowledgements'
import { User } from 'src/libs/ajax/User'
import { Storage } from 'src/libs/storage'

describe('Acknowledgements Service', () => {
  let getAcknowledgementsStub: Cypress.Agent<sinon.SinonStub>
  let acceptAcknowledgmentsStub: Cypress.Agent<sinon.SinonStub>
  let getCurrentUserSettingsStub: Cypress.Agent<sinon.SinonStub>
  let setCurrentUserSettingsStub: Cypress.Agent<sinon.SinonStub>

  beforeEach(() => {
    getAcknowledgementsStub = cy.stub(User, 'getAcknowledgements')
    acceptAcknowledgmentsStub = cy.stub(User, 'acceptAcknowledgments')
    getCurrentUserSettingsStub = cy.stub(Storage, 'getCurrentUserSettings')
    setCurrentUserSettingsStub = cy.stub(Storage, 'setCurrentUserSettings')
  })

  afterEach(() => {
    getAcknowledgementsStub.restore()
    acceptAcknowledgmentsStub.restore()
    getCurrentUserSettingsStub.restore()
    setCurrentUserSettingsStub.restore()
  })

  // Helper functions for assertions
  const verifyStubCalledWith = (stub: Cypress.Agent<sinon.SinonStub>, ...expected: unknown[]) => {
    cy.wrap(stub).should('be.calledWith', ...expected)
  }

  const verifyStubNotCalled = (stub: Cypress.Agent<sinon.SinonStub>) => {
    cy.wrap(stub).should('not.be.called')
  }

  const verifyStubCalledOnce = (stub: Cypress.Agent<sinon.SinonStub>) => {
    cy.wrap(stub).should('be.calledOnce')
  }

  it('returns true if all acknowledgements are in storage', () => {
    getCurrentUserSettingsStub.callsFake((key: string) => {
      return key === 'acknowledgement_foo' || key === 'acknowledgement_bar'
    })
    cy.wrap(Acknowledgements.hasAccepted('foo', 'bar')).then((result) => {
      expect(result).to.equal(true)
      verifyStubNotCalled(getAcknowledgementsStub)
      verifyStubNotCalled(setCurrentUserSettingsStub)
    })
  })

  it('fetches and caches acknowledgements if not in storage', () => {
    getCurrentUserSettingsStub.returns(false)
    getAcknowledgementsStub.resolves({ foo: true, bar: true })
    setCurrentUserSettingsStub.returns(undefined)

    cy.wrap(Acknowledgements.hasAccepted('foo', 'bar')).then((result) => {
      expect(result).to.equal(true)
      verifyStubCalledOnce(getAcknowledgementsStub)
      verifyStubCalledWith(setCurrentUserSettingsStub, 'acknowledgement_foo', true)
      verifyStubCalledWith(setCurrentUserSettingsStub, 'acknowledgement_bar', true)
    })
  })

  it('returns false if not all acknowledgements are accepted', () => {
    getCurrentUserSettingsStub.returns(false)
    getAcknowledgementsStub.resolves({ foo: true })
    setCurrentUserSettingsStub.returns(undefined)

    cy.wrap(Acknowledgements.hasAccepted('foo', 'bar')).then((result) => {
      expect(result).to.equal(false)
    })
  })

  it('hasSOAcceptedDAAs checks both required acknowledgements', () => {
    getCurrentUserSettingsStub.returns(false)
    getAcknowledgementsStub.resolves({
      [Acknowledgements.Acknowledgments.broadLcaAcknowledgement]: true,
      [Acknowledgements.Acknowledgments.nihLcaAcknowledgement]: true,
    })
    setCurrentUserSettingsStub.returns(undefined)

    cy.wrap(Acknowledgements.hasSOAcceptedDAAs()).then((result) => {
      expect(result).to.equal(true)
    })
  })

  it('acceptAcknowledgments calls User.acceptAcknowledgments and caches results', () => {
    acceptAcknowledgmentsStub.resolves({ foo: true, bar: true })
    setCurrentUserSettingsStub.returns(undefined)

    cy.wrap(Acknowledgements.acceptAcknowledgments('foo', 'bar')).then(() => {
      verifyStubCalledWith(acceptAcknowledgmentsStub, 'foo', 'bar')
      verifyStubCalledWith(setCurrentUserSettingsStub, 'acknowledgement_foo', true)
      verifyStubCalledWith(setCurrentUserSettingsStub, 'acknowledgement_bar', true)
    })
  })
})
