import { Support } from 'src/libs/ajax/Support'

describe('Support', () => {
  beforeEach(() => {
    cy.initApplicationConfig()
  })

  describe('uploadAttachment', () => {
    it('should send multipart request with correct headers', () => {
      const mockFile = new File(['file content'], 'test.pdf', { type: 'application/pdf' })

      cy.intercept('POST', '**/support/upload', (req) => {
        expect(req.headers['content-type']).to.equal('application/binary')

        req.reply({
          statusCode: 200,
          body: { token: 'token-123' },
        })
      }).as('uploadRequest')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cy.wrap(Support.uploadAttachment(mockFile)).then((response: any) => {
        cy.wrap(response.data).should('have.property', 'token')
      })

      cy.wait('@uploadRequest')
    })

    it('should successfully upload a file and return token', () => {
      const mockFile = new File(['test content'], 'document.pdf', { type: 'application/pdf' })

      cy.intercept('POST', '**/support/upload', {
        statusCode: 200,
        body: { token: 'token-456' },
      }).as('uploadRequest')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cy.wrap(Support.uploadAttachment(mockFile)).then((response: any) => {
        expect(response.data.token).to.equal('token-456')
      })

      cy.wait('@uploadRequest')
    })
  })
})
