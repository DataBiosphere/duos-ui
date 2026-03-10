import React from 'react'
import { SupportRequestModal } from 'src/components/modals/SupportRequestModal'
import { Storage } from 'src/libs/storage'
import { BrowserRouter } from 'react-router-dom'

interface MockUser {
  displayName: string
  email: string
}

const mockUser: MockUser = {
  displayName: 'Display Name',
  email: 'email@test.com',
}

const handler = (): void => {
}

describe('Support Request Modal Tests', () => {
  beforeEach(() => {
    cy.viewport(500, 500)
    cy.initApplicationConfig()
  })

  describe('When a user is logged in:', () => {
    beforeEach(() => {
      cy.stub(Storage, 'userIsLogged').returns(true)
      cy.stub(Storage, 'getCurrentUser').returns(mockUser)
    })

    it('Renders form correctly', () => {
      cy.mount(
        <BrowserRouter>
          <SupportRequestModal
            onCloseRequest={handler}
            url="url"
            showModal={true}
          />
        </BrowserRouter>,
      )
      // These fields should exist
      cy.get('[data-cy="closeButton"]').should('exist')
      cy.get('[data-cy="supportRequestModal"]').should('exist')
      cy.get('[data-cy="supportFormEmail"]').should('not.exist')
      cy.get('[data-cy="supportFormName"]').should('not.exist')
      cy.get('[data-cy="supportFormType"]').should('exist')
      cy.get('[data-cy="supportFormSubject"]').should('exist')
      cy.get('[data-cy="supportFormDescription"]').should('exist')
      cy.get('[data-cy="supportFormAttachment"]').should('exist')
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled')
      cy.get('[data-cy="supportFormCancel"]').should('not.be.disabled')
    })

    it('Submits properly', () => {
      cy.mount(
        <BrowserRouter>
          <SupportRequestModal
            onCloseRequest={handler}
            url="url"
            showModal={true}
          />
        </BrowserRouter>,
      )
      // Ensure that all required fields are filled out before submit becomes available
      cy.get('[data-cy="supportFormType"]').click()
      cy.contains('Bug').click()
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled')
      cy.get('[data-cy="supportFormSubject"]').type('Subject')
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled')
      cy.get('[data-cy="supportFormDescription"]').type('Description')
      // Form is complete:
      cy.get('[data-cy="supportFormSubmit"]').should('not.be.disabled')
      cy.get('[data-cy="supportFormCancel"]').should('not.be.disabled')
      cy.intercept({ method: 'POST', url: '**/support/request' }, { statusCode: 201 }).as('request')
      cy.intercept({ method: 'POST', url: '**/support/upload' }, { statusCode: 201, body: { token: 'token_string' } }).as('upload')
      // {force: true} is necessary here due to the surrounding div that covers the input.
      cy.get('[data-cy="supportFormAttachment"]').selectFile(['cypress/fixtures/example.json'], { force: true })
      cy.get('[data-cy="supportFormSubmit"]').click()
      cy.wait(['@request', '@upload']).then((interceptions) => {
        expect(interceptions).to.have.length(2)
      })
    })
  })

  describe('When a user is NOT logged in:', () => {
    beforeEach(() => {
      cy.stub(Storage, 'userIsLogged').returns(false)
      cy.stub(Storage, 'getCurrentUser').returns(undefined)
    })

    it('Renders form correctly', () => {
      cy.mount(
        <BrowserRouter>
          <SupportRequestModal
            onCloseRequest={handler}
            url="url"
            showModal={true}
          />
        </BrowserRouter>,
      )
      // These fields should exist
      cy.get('[data-cy="closeButton"]').should('exist')
      cy.get('[data-cy="supportRequestModal"]').should('exist')
      cy.get('[data-cy="supportFormEmail"]').should('exist')
      cy.get('[data-cy="supportFormName"]').should('exist')
      cy.get('[data-cy="supportFormType"]').should('exist')
      cy.get('[data-cy="supportFormSubject"]').should('exist')
      cy.get('[data-cy="supportFormDescription"]').should('exist')
      cy.get('[data-cy="supportFormAttachment"]').should('exist')
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled')
      cy.get('[data-cy="supportFormCancel"]').should('not.be.disabled')
    })

    it('Submits properly', () => {
      cy.mount(
        <BrowserRouter>
          <SupportRequestModal
            onCloseRequest={handler}
            url="url"
            showModal={true}
          />
        </BrowserRouter>,
      )
      // Ensure that all required fields are filled out before submit becomes available
      cy.get('[data-cy="supportFormName"]').type('Name')
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled')
      cy.get('[data-cy="supportFormType"]').click()
      cy.contains('Bug').click()
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled')
      cy.get('[data-cy="supportFormSubject"]').type('Subject')
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled')
      cy.get('[data-cy="supportFormDescription"]').type('Description')
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled')
      cy.get('[data-cy="supportFormEmail"]').type(mockUser.email)
      // Form is complete:
      cy.get('[data-cy="supportFormSubmit"]').should('not.be.disabled')
      cy.get('[data-cy="supportFormCancel"]').should('not.be.disabled')
      cy.intercept({ method: 'POST', url: '**/support/request' }, { statusCode: 201 }).as('request')
      cy.intercept({ method: 'POST', url: '**/support/upload' }, { statusCode: 201, body: { token: 'token_string' } }).as('upload')
      // {force: true} is necessary here due to the surrounding div that covers the input.
      cy.get('[data-cy="supportFormAttachment"]').selectFile(['cypress/fixtures/example.json'], { force: true })
      cy.get('[data-cy="supportFormSubmit"]').click()
      cy.wait(['@request', '@upload']).then((interceptions) => {
        expect(interceptions).to.have.length(2)
      })
    })
  })

  describe('File Attachments', () => {
    beforeEach(() => {
      cy.stub(Storage, 'userIsLogged').returns(false)
      cy.stub(Storage, 'getCurrentUser').returns(undefined)
    })

    it('Single attachment displayed', () => {
      cy.mount(
        <BrowserRouter>
          <SupportRequestModal
            onCloseRequest={handler}
            url="url"
            showModal={true}
          />
        </BrowserRouter>,
      )
      // {force: true} is necessary here due to the surrounding div that covers the input.
      cy.get('[data-cy="supportFormAttachment"]').selectFile(['cypress/fixtures/example.json'], { force: true })
      cy.get('[data-cy="supportFormAttachmentContainer"]').should('contain', 'example.json')
    })

    it('Multiple attachments displayed', () => {
      cy.mount(
        <BrowserRouter>
          <SupportRequestModal
            onCloseRequest={handler}
            url="url"
            showModal={true}
          />
        </BrowserRouter>,
      )
      // {force: true} is necessary here due to the surrounding div that covers the input.
      cy.get('[data-cy="supportFormAttachment"]').selectFile(['cypress/fixtures/example.json', 'cypress/fixtures/dataset-registration-schema_v1.json'], { force: true })
      cy.get('[data-cy="supportFormAttachmentContainer"]').should('contain', 'example.json')
      cy.get('[data-cy="supportFormAttachmentContainer"]').should('contain', 'dataset-registration-schema_v1.json')
    })
  })

  describe('When a user is logged in but current user values are undefined:', () => {
    beforeEach(() => {
      cy.stub(Storage, 'userIsLogged').returns(true)
      cy.stub(Storage, 'getCurrentUser').returns({
        displayName: undefined,
        email: undefined,
      })
    })

    it('Renders form correctly', () => {
      cy.mount(
        <BrowserRouter>
          <SupportRequestModal
            onCloseRequest={handler}
            url="url"
            showModal={true}
          />
        </BrowserRouter>,
      )
      // These fields should exist
      cy.get('[data-cy="closeButton"]').should('exist')
      cy.get('[data-cy="supportRequestModal"]').should('exist')
      // When user is logged in but values are undefined, fields are still hidden
      // but form data will have empty strings, requiring manual input
      cy.get('[data-cy="supportFormEmail"]').should('not.exist')
      cy.get('[data-cy="supportFormName"]').should('not.exist')
      cy.get('[data-cy="supportFormType"]').should('exist')
      cy.get('[data-cy="supportFormSubject"]').should('exist')
      cy.get('[data-cy="supportFormDescription"]').should('exist')
      cy.get('[data-cy="supportFormAttachment"]').should('exist')
      // Submit button is disabled because name and email are empty strings
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled')
      cy.get('[data-cy="supportFormCancel"]').should('not.be.disabled')
    })

    it('Submit button remains disabled due to empty name and email', () => {
      cy.mount(
        <BrowserRouter>
          <SupportRequestModal
            onCloseRequest={handler}
            url="url"
            showModal={true}
          />
        </BrowserRouter>,
      )
      // Even with all visible fields filled, submit remains disabled
      // because name and email (from undefined user values) are empty strings
      cy.get('[data-cy="supportFormType"]').click()
      cy.contains('Bug').click()
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled')
      cy.get('[data-cy="supportFormSubject"]').type('Subject')
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled')
      cy.get('[data-cy="supportFormDescription"]').type('Description')
      // Form cannot be completed because name and email are empty but hidden
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled')
      cy.get('[data-cy="supportFormCancel"]').should('not.be.disabled')
    })
  })

  describe('"Using DUOS for my DAC" support type option', () => {
    beforeEach(() => {
      cy.stub(Storage, 'userIsLogged').returns(true)
      cy.stub(Storage, 'getCurrentUser').returns(mockUser)
    })

    it('Renders "Using DUOS for my DAC" as an option in the type dropdown', () => {
      cy.mount(
        <BrowserRouter>
          <SupportRequestModal
            onCloseRequest={handler}
            url="url"
            showModal={true}
          />
        </BrowserRouter>,
      )
      cy.get('[data-cy="supportFormType"]').click()
      cy.contains('Using DUOS for my DAC').should('exist')
    })

    it('Allows selecting "Using DUOS for my DAC" from the type dropdown', () => {
      cy.mount(
        <BrowserRouter>
          <SupportRequestModal
            onCloseRequest={handler}
            url="url"
            showModal={true}
          />
        </BrowserRouter>,
      )
      cy.get('[data-cy="supportFormType"]').click()
      cy.contains('Using DUOS for my DAC').click()
      cy.get('[data-cy="supportFormType"]').should('contain', 'Using DUOS for my DAC')
    })

    it('Enables submit button when "Using DUOS for my DAC" is selected and required fields are filled', () => {
      cy.mount(
        <BrowserRouter>
          <SupportRequestModal
            onCloseRequest={handler}
            url="url"
            showModal={true}
          />
        </BrowserRouter>,
      )
      cy.get('[data-cy="supportFormType"]').click()
      cy.contains('Using DUOS for my DAC').click()
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled')
      cy.get('[data-cy="supportFormSubject"]').type('DAC Setup Question')
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled')
      cy.get('[data-cy="supportFormDescription"]').type('I need help setting up my DAC in DUOS.')
      cy.get('[data-cy="supportFormSubmit"]').should('not.be.disabled')
    })

    it('Submits with dac_usage type and correct payload', () => {
      cy.mount(
        <BrowserRouter>
          <SupportRequestModal
            onCloseRequest={handler}
            url="url"
            showModal={true}
          />
        </BrowserRouter>,
      )
      cy.get('[data-cy="supportFormType"]').click()
      cy.contains('Using DUOS for my DAC').click()
      cy.get('[data-cy="supportFormSubject"]').type('DAC Setup Question')
      cy.get('[data-cy="supportFormDescription"]').type('I need help setting up my DAC in DUOS.')
      cy.intercept({ method: 'POST', url: '**/support/request' }, (req) => {
        expect(req.body.type).to.equal('DAC_USAGE')
        req.reply({ statusCode: 201 })
      }).as('request')
      cy.get('[data-cy="supportFormSubmit"]').click()
      cy.wait('@request')
    })
  })

  describe('RedirectLink functionality', () => {
    describe('When user is logged in:', () => {
      beforeEach(() => {
        cy.stub(Storage, 'userIsLogged').returns(true)
        cy.stub(Storage, 'getCurrentUser').returns(mockUser)
      })

      it('Displays "DUOS Data Library" link text', () => {
        cy.mount(
          <BrowserRouter>
            <SupportRequestModal
              onCloseRequest={handler}
              url="url"
              showModal={true}
            />
          </BrowserRouter>,
        )
        cy.contains('DUOS Data Library').should('exist')
        cy.get('a').filter(':contains("DUOS Data Library")').should('have.length', 2)
      })

      it('Links to /datalibrary when logged in', () => {
        cy.mount(
          <BrowserRouter>
            <SupportRequestModal
              onCloseRequest={handler}
              url="url"
              showModal={true}
            />
          </BrowserRouter>,
        )
        cy.get('a').contains('DUOS Data Library').first().should('have.attr', 'href', '/datalibrary')
        cy.get('a').contains('DUOS Data Library').last().should('have.attr', 'href', '/datalibrary')
      })

      it('Has appropriate styling', () => {
        cy.mount(
          <BrowserRouter>
            <SupportRequestModal
              onCloseRequest={handler}
              url="url"
              showModal={true}
            />
          </BrowserRouter>,
        )
        cy.get('a').contains('DUOS Data Library').first()
          .should('have.css', 'cursor', 'pointer')
      })
    })

    describe('When user is NOT logged in:', () => {
      beforeEach(() => {
        cy.stub(Storage, 'userIsLogged').returns(false)
        cy.stub(Storage, 'getCurrentUser').returns(undefined)
      })

      it('Displays "DUOS Data Library" link text', () => {
        cy.mount(
          <BrowserRouter>
            <SupportRequestModal
              onCloseRequest={handler}
              url="url"
              showModal={true}
            />
          </BrowserRouter>,
        )
        cy.contains('DUOS Data Library').should('exist')
        cy.get('a').filter(':contains("DUOS Data Library")').should('have.length', 2)
      })

      it('Has appropriate styling', () => {
        cy.mount(
          <BrowserRouter>
            <SupportRequestModal
              onCloseRequest={handler}
              url="url"
              showModal={true}
            />
          </BrowserRouter>,
        )
        cy.get('a').contains('DUOS Data Library').first()
          .should('have.css', 'cursor', 'pointer')
      })

      it('Closes modal when link is clicked', () => {
        const onCloseStub = cy.stub().as('onCloseRequest')
        cy.mount(
          <BrowserRouter>
            <SupportRequestModal
              onCloseRequest={onCloseStub}
              url="url"
              showModal={true}
            />
          </BrowserRouter>,
        )
        // Click the first "DUOS Data Library" link
        cy.get('a').contains('DUOS Data Library').first().click()
        // Verify the modal close handler was called
        cy.get('@onCloseRequest').should('be.calledWith', 'support')
      })
    })
  })
})
