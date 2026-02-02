import { applyForAccess } from 'src/utils/accessUtils'
import { DAR } from 'src/libs/ajax/DAR'
import { Notifications } from 'src/libs/utils'
import { NavigateFunction } from 'react-router-dom'

describe('accessUtils', () => {
  let navigateMock: Cypress.Agent<sinon.SinonStub>
  let postDarDraftStub: Cypress.Agent<sinon.SinonStub>
  let showErrorStub: Cypress.Agent<sinon.SinonStub>

  beforeEach(() => {
    navigateMock = cy.stub()
    postDarDraftStub = cy.stub(DAR, 'postDarDraft')
    showErrorStub = cy.stub(Notifications, 'showError')
  })

  afterEach(() => {
    postDarDraftStub.restore()
    showErrorStub.restore()
  })

  const verifyStubCalledWith = (stub: Cypress.Agent<sinon.SinonStub>, expected: unknown) => {
    cy.wrap(stub).should('be.calledWith', expected)
  }

  const verifyStubNotCalled = (stub: Cypress.Agent<sinon.SinonStub>) => {
    cy.wrap(stub).should('not.be.called')
  }

  const verifyStubCalledOnce = (stub: Cypress.Agent<sinon.SinonStub>) => {
    cy.wrap(stub).should('be.calledOnce')
  }

  const verifyErrorWithTimeout = (timeout: number) => {
    verifyStubCalledOnce(showErrorStub)
    cy.wrap(showErrorStub.firstCall.args[0]).should('have.property', 'timeout', timeout)
    cy.wrap(showErrorStub.firstCall.args[0]).should('have.property', 'text')
  }

  const verifyGenericError = () => {
    verifyStubCalledOnce(showErrorStub)
    cy.wrap(showErrorStub.firstCall.args[0]).should('have.property', 'text', 'Error: Unable to create a Draft Data Access Request')
  }

  describe('applyForAccess', () => {
    it('navigates to DAR application page when draft is created successfully', () => {
      const referenceId = 'REF-123'
      const selectedDatasets = [123456, 234567]

      postDarDraftStub.resolves({ referenceId })

      cy.wrap(applyForAccess(selectedDatasets, navigateMock as unknown as NavigateFunction)).then(() => {
        verifyStubCalledWith(postDarDraftStub, { datasetId: selectedDatasets })
        verifyStubCalledWith(navigateMock, `/dar_application/${referenceId}`)
        verifyStubNotCalled(showErrorStub)
      })
    })

    it('shows error notification when response contains code and message', () => {
      const selectedDatasets = [123456]
      const errorResponse = { code: 400, message: 'Invalid dataset selection' }

      postDarDraftStub.resolves(errorResponse)

      cy.wrap(applyForAccess(selectedDatasets, navigateMock as unknown as NavigateFunction)).then(() => {
        verifyStubCalledWith(postDarDraftStub, { datasetId: selectedDatasets })
        verifyStubNotCalled(navigateMock)
        verifyErrorWithTimeout(6000)
      })
    })

    it('shows generic error when response has no referenceId, code, or message', () => {
      const selectedDatasets = [123456]

      postDarDraftStub.resolves({})

      cy.wrap(applyForAccess(selectedDatasets, navigateMock as unknown as NavigateFunction)).then(() => {
        verifyStubCalledWith(postDarDraftStub, { datasetId: selectedDatasets })
        verifyStubNotCalled(navigateMock)
        verifyGenericError()
      })
    })

    it('shows error notification when postDarDraft throws an error with message', () => {
      const selectedDatasets = [123456]

      postDarDraftStub.rejects(new Error('Network error occurred'))

      cy.wrap(applyForAccess(selectedDatasets, navigateMock as unknown as NavigateFunction)).then(() => {
        verifyStubCalledWith(postDarDraftStub, { datasetId: selectedDatasets })
        verifyStubNotCalled(navigateMock)
        verifyErrorWithTimeout(6000)
      })
    })

    it('shows generic error when postDarDraft throws an error without extractable message', () => {
      const selectedDatasets = [123456]

      postDarDraftStub.rejects(new Error(''))

      cy.wrap(applyForAccess(selectedDatasets, navigateMock as unknown as NavigateFunction)).then(() => {
        verifyStubCalledWith(postDarDraftStub, { datasetId: selectedDatasets })
        verifyStubNotCalled(navigateMock)
        verifyGenericError()
      })
    })

    it('handles multiple dataset IDs correctly', () => {
      const referenceId = 'REF-456'
      const selectedDatasets = [123456, 234567, 345678]

      postDarDraftStub.resolves({ referenceId })

      cy.wrap(applyForAccess(selectedDatasets, navigateMock as unknown as NavigateFunction)).then(() => {
        verifyStubCalledWith(postDarDraftStub, { datasetId: selectedDatasets })
        verifyStubCalledWith(navigateMock, `/dar_application/${referenceId}`)
      })
    })
  })
})
