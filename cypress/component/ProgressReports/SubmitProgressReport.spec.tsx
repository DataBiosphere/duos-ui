import React from 'react'
import { mount } from 'cypress/react'
import SubmitProgressReport from 'src/pages/progress_reports/SubmitProgressReport'
import { FormState } from 'src/pages/progress_reports/ProgressReportFormState'
import { CombinedDataAccessRequest } from 'src/types/model'
import StackdriverErrorReporter from 'stackdriver-errors-js'

describe('SubmitProgressReport tests', () => {
  beforeEach(() => {
    cy.initApplicationConfig()
    cy.viewport(600, 300)
  },
  )

  it('Should show a submit and cancel button', () => {
    mount(
      <SubmitProgressReport
        formState={{} as FormState}
        parentReferenceId="1"
        onSuccess={() => {
        }}
        onCancel={() => {
        }}
      />,
    )
    cy.get('[data-cy=pr-submit-button]').should('exist')
    cy.get('[data-cy=pr-cancel-button]').should('exist')
  })

  it('Submit should succeed', () => {
    cy.intercept('POST', '/api/dar/v2/progress_report/1', {
      statusCode: 200,
      body: {},
    }).as('submitProgressReport')
    mount(
      <SubmitProgressReport
        formState={{} as FormState}
        parentReferenceId="1"
        onSuccess={() => {
        }}
        onCancel={() => {
        }}
      />,
    )
    cy.get('[data-cy=pr-submit-button]').click()
    cy.wait('@submitProgressReport').then((interception) => {
      assert(interception?.response?.statusCode === 200, 'Submit was successful')
    })
  })

  it('On Submit handler should be called after successful submit', () => {
    const functionSpy = {
      successHandler: () => {
        console.log('successHandler')
      },
    }
    cy.spy(functionSpy, 'successHandler').as('successHandler')
    cy.intercept('POST', '/api/dar/v2/progress_report/1', {
      statusCode: 200,
      body: {},
    })

    mount(
      <SubmitProgressReport
        formState={{} as FormState}
        parentReferenceId="1"
        onSuccess={functionSpy.successHandler}
        onCancel={() => {
        }}
      />,
    )
    cy.get('[data-cy=pr-submit-button]').should('exist')
    cy.get('[data-cy=pr-submit-button]').click()
    cy.get('@successHandler').should('have.been.calledOnce')
  })

  it('On Cancel handler should be called after cancel button clicked', () => {
    const functionSpy = {
      cancelHandler: () => {
        console.log('cancelHandler')
      },
    }
    cy.spy(functionSpy, 'cancelHandler').as('cancelHandler')
    mount(
      <SubmitProgressReport
        formState={{} as FormState}
        parentReferenceId="1"
        onSuccess={() => {
        }}
        onCancel={functionSpy.cancelHandler}
      />,
    )
    cy.get('[data-cy=pr-cancel-button]').should('exist')
    cy.get('[data-cy=pr-cancel-button]').click()
    cy.get('@cancelHandler').should('have.been.calledOnce')
  })

  it('Submit failure message should be captured', () => {
    cy.stub(StackdriverErrorReporter.prototype, 'setUser').callsFake(() => {
    })
    mount(
      <SubmitProgressReport
        formState={{} as FormState}
        parentReferenceId="1"
        onSuccess={() => {}}
        onCancel={() => {}}
      />,
    )
    // Simulate a click and check for the error notification
    cy.get('[data-cy=pr-submit-button]').click()
    cy.get('[data-cy=notification-alert]').should('exist')
    cy.get('[data-cy=notification-alert]').contains('Error')
  })

  describe('IRB Document Inheritance Tests', () => {
    const mockFormState: FormState = {
      irbProtocolExpiration: '2026-06-14',
    } as FormState

    const mockParentDar: CombinedDataAccessRequest = {
      referenceId: 'DAR-123',
      irbDocumentName: 'parent-irb-document.pdf',
      irbDocumentLocation: 'f7e8d9c0-b1a2-3456-7890-abcdef123456',
    } as CombinedDataAccessRequest

    const mockParentDarWithoutIrb: CombinedDataAccessRequest = {
      referenceId: 'DAR-456',
      irbDocumentName: undefined,
      irbDocumentLocation: undefined,
    } as CombinedDataAccessRequest

    it('Should submit with uploaded IRB document when one is provided', () => {
      cy.intercept('POST', '/api/dar/v2/progress_report/1', {
        statusCode: 200,
        body: {},
      }).as('submitProgressReport')

      const mockFile = new File(['test content'], 'new-irb.pdf', { type: 'application/pdf' })

      mount(
        <SubmitProgressReport
          formState={mockFormState}
          parentReferenceId="1"
          onSuccess={() => {}}
          onCancel={() => {}}
          uploadedIrbDocument={mockFile}
          parentDar={mockParentDar}
        />,
      )

      cy.get('[data-cy=pr-submit-button]').click()
      cy.wait('@submitProgressReport').then((interception) => {
        assert(interception?.response?.statusCode === 200, 'Submit was successful')
        // Verify the new file was included in the form data
        const requestBody = interception.request.body
        expect(requestBody).to.be.a('string')
        expect(requestBody).to.include('filename="new-irb.pdf"')
        expect(requestBody).to.include('test content')
        expect(interception.request.headers['content-type']).to.include('multipart/form-data')
      })
    })

    it('Should fetch and submit parent IRB document when no new document is uploaded', () => {
      // Mock the blob data that would be returned by the parent DAR
      const mockBlob = new Blob(['parent irb content'], { type: 'application/pdf' })

      cy.intercept('GET', '/api/dar/v2/1/irbDocument', {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/pdf',
        },
        body: mockBlob,
      }).as('getDARDocument')

      cy.intercept('POST', '/api/dar/v2/progress_report/1', {
        statusCode: 200,
        body: {},
      }).as('submitProgressReport')

      mount(
        <SubmitProgressReport
          formState={mockFormState}
          parentReferenceId="1"
          onSuccess={() => {}}
          onCancel={() => {}}
          uploadedIrbDocument={null}
          parentDar={mockParentDar}
        />,
      )

      cy.get('[data-cy=pr-submit-button]').click()

      cy.wait('@getDARDocument').then((interception) => {
        assert(interception?.response?.statusCode === 200, 'Parent IRB document was fetched')
      })

      cy.wait('@submitProgressReport').then((interception) => {
        assert(interception?.response?.statusCode === 200, 'Submit was successful')
        // Verify the parent file was included in the form data
        const requestBody = interception.request.body
        expect(requestBody).to.be.a('string')
        expect(requestBody).to.include('filename="parent-irb-document.pdf"')
        expect(interception.request.headers['content-type']).to.include('multipart/form-data')
      })
    })

    it('Should handle parent IRB document fetch failure gracefully', () => {
      // Mock failed fetch of parent IRB document
      cy.intercept('GET', '/api/dar/v2/1/irbDocument', {
        statusCode: 404,
        body: { message: 'Document not found' },
      }).as('getDARDocumentFail')

      cy.intercept('POST', '/api/dar/v2/progress_report/1', {
        statusCode: 200,
        body: {},
      }).as('submitProgressReport')

      mount(
        <SubmitProgressReport
          formState={mockFormState}
          parentReferenceId="1"
          onSuccess={() => {}}
          onCancel={() => {}}
          uploadedIrbDocument={null}
          parentDar={mockParentDar}
        />,
      )

      cy.get('[data-cy=pr-submit-button]').click()

      cy.wait('@getDARDocumentFail').then((interception) => {
        assert(interception?.response?.statusCode === 404, 'Parent IRB document fetch failed as expected')
      })

      cy.wait('@submitProgressReport').then((interception) => {
        assert(interception?.response?.statusCode === 200, 'Submit was still successful despite fetch failure')
        // Verify submission continues without IRB document when fetch fails
        const requestBody = interception.request.body
        expect(requestBody).to.be.a('string')
        expect(requestBody).to.not.include('filename=')
        expect(requestBody).to.include('name="ethicsApprovalRequiredFile"\r\n\r\n\r\n')
        expect(interception.request.headers['content-type']).to.include('multipart/form-data')
      })
    })

    it('Should submit without IRB document when no new document and no parent document exists', () => {
      cy.intercept('POST', '/api/dar/v2/progress_report/1', {
        statusCode: 200,
        body: {},
      }).as('submitProgressReport')

      mount(
        <SubmitProgressReport
          formState={mockFormState}
          parentReferenceId="1"
          onSuccess={() => {}}
          onCancel={() => {}}
          uploadedIrbDocument={null}
          parentDar={mockParentDarWithoutIrb}
        />,
      )

      cy.get('[data-cy=pr-submit-button]').click()
      cy.wait('@submitProgressReport').then((interception) => {
        assert(interception?.response?.statusCode === 200, 'Submit was successful')
        // Verify no IRB document filename was included
        const requestBody = interception.request.body
        expect(requestBody).to.be.a('string')
        expect(requestBody).to.not.include('filename=')
        expect(requestBody).to.include('name="ethicsApprovalRequiredFile"\r\n\r\n\r\n')
        expect(interception.request.headers['content-type']).to.include('multipart/form-data')
      })
    })

    it('Should handle missing parent DAR gracefully', () => {
      cy.intercept('POST', '/api/dar/v2/progress_report/1', {
        statusCode: 200,
        body: {},
      }).as('submitProgressReport')

      mount(
        <SubmitProgressReport
          formState={mockFormState}
          parentReferenceId="1"
          onSuccess={() => {}}
          onCancel={() => {}}
          uploadedIrbDocument={null}
          parentDar={undefined}
        />,
      )

      cy.get('[data-cy=pr-submit-button]').click()
      cy.wait('@submitProgressReport').then((interception) => {
        assert(interception?.response?.statusCode === 200, 'Submit was successful')
        // Verify no IRB document was included when no parent DAR
        const requestBody = interception.request.body
        expect(requestBody).to.be.a('string')
        expect(requestBody).to.not.include('filename=')
        expect(requestBody).to.include('name="ethicsApprovalRequiredFile"\r\n\r\n\r\n')
        expect(interception.request.headers['content-type']).to.include('multipart/form-data')
      })
    })
  })
})
