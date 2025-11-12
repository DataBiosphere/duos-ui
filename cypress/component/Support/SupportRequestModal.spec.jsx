import React from 'react'
import { mount } from 'cypress/react'
import { SupportRequestModal } from 'src/components/modals/SupportRequestModal'
import { Storage } from 'src/libs/storage'
import { BrowserRouter } from 'react-router-dom'

const mockUser = {
  displayName: 'Display Name',
  email: 'email@test.com',
}

const handler = () => {
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
      mount(
        <BrowserRouter>
          <SupportRequestModal
            onCloseRequest={handler}
            onOKRequest={handler}
            url="url"
            showModal={true}
          />
        </BrowserRouter>,
      )
      // These fields should exist
      cy.get('[data-cy="closeButton"]').should('exist')
      cy.get('[data-cy="supportForm"]').should('exist')
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
      mount(
        <BrowserRouter>
          <SupportRequestModal
            onCloseRequest={handler}
            onOKRequest={handler}
            url="url"
            showModal={true}
          />
        </BrowserRouter>,
      )
      // Ensure that all required fields are filled out before submit becomes available
      cy.get('[data-cy="supportFormType"]').select('bug')
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
        assert(interceptions.length === 2)
      })
    })
  })

  describe('When a user is NOT logged in:', () => {
    beforeEach(() => {
      cy.stub(Storage, 'userIsLogged').returns(false)
      cy.stub(Storage, 'getCurrentUser').returns(undefined)
    })

    it('Renders form correctly', () => {
      mount(
        <BrowserRouter>
          <SupportRequestModal
            onCloseRequest={handler}
            onOKRequest={handler}
            url="url"
            showModal={true}
          />
        </BrowserRouter>,
      )
      // These fields should exist
      cy.get('[data-cy="closeButton"]').should('exist')
      cy.get('[data-cy="supportForm"]').should('exist')
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
      mount(
        <BrowserRouter>
          <SupportRequestModal
            onCloseRequest={handler}
            onOKRequest={handler}
            url="url"
            showModal={true}
          />
        </BrowserRouter>,
      )
      // Ensure that all required fields are filled out before submit becomes available
      cy.get('[data-cy="supportFormName"]').type('Name')
      cy.get('[data-cy="supportFormSubmit"]').should('be.disabled')
      cy.get('[data-cy="supportFormType"]').select('bug')
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
        assert(interceptions.length === 2)
      })
    })
  })

  describe('File Attachments', () => {
    beforeEach(() => {
      cy.stub(Storage, 'userIsLogged').returns(false)
      cy.stub(Storage, 'getCurrentUser').returns(undefined)
    })
    it('Single attachment displayed', () => {
      mount(
        <BrowserRouter>
          <SupportRequestModal
            onCloseRequest={handler}
            onOKRequest={handler}
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
      mount(
        <BrowserRouter>
          <SupportRequestModal
            onCloseRequest={handler}
            onOKRequest={handler}
            url="url"
            showModal={true}
          />
        </BrowserRouter>,
      )
      // {force: true} is necessary here due to the surrounding div that covers the input.
      cy.get('[data-cy="supportFormAttachment"]').selectFile(['cypress/fixtures/example.json', 'cypress/fixtures/dataset-registration-schema_v1.json'], { force: true })
      cy.get('[data-cy="supportFormAttachmentContainer"]').should('contain', '2 files selected')
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
      mount(
        <BrowserRouter>
          <SupportRequestModal
            onCloseRequest={handler}
            onOKRequest={handler}
            url="url"
            showModal={true}
          />
        </BrowserRouter>,
      )
      // These fields should exist
      cy.get('[data-cy="closeButton"]').should('exist')
      cy.get('[data-cy="supportForm"]').should('exist')
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
      mount(
        <BrowserRouter>
          <SupportRequestModal
            onCloseRequest={handler}
            onOKRequest={handler}
            url="url"
            showModal={true}
          />
        </BrowserRouter>,
      )
      // Ensure that all required fields are filled out before submit becomes available
      cy.get('[data-cy="supportFormType"]').select('bug')
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
        assert(interceptions.length === 2)
      })
    })
  })

  describe('RedirectLink functionality', () => {
    describe('When user is logged in:', () => {
      beforeEach(() => {
        cy.stub(Storage, 'userIsLogged').returns(true)
        cy.stub(Storage, 'getCurrentUser').returns(mockUser)
      })

      it('Displays "Data Library" link text', () => {
        mount(
          <BrowserRouter>
            <SupportRequestModal
              onCloseRequest={handler}
              onOKRequest={handler}
              url="url"
              showModal={true}
            />
          </BrowserRouter>,
        )
        cy.contains('Data Library').should('exist')
        cy.get('a').filter(':contains("Data Library")').should('have.length', 2)
      })

      it('Links to /datalibrary when logged in', () => {
        mount(
          <BrowserRouter>
            <SupportRequestModal
              onCloseRequest={handler}
              onOKRequest={handler}
              url="url"
              showModal={true}
            />
          </BrowserRouter>,
        )
        cy.get('a').contains('Data Library').first().should('have.attr', 'href', '/datalibrary')
        cy.get('a').contains('Data Library').last().should('have.attr', 'href', '/datalibrary')
      })

      it('Has appropriate styling', () => {
        mount(
          <BrowserRouter>
            <SupportRequestModal
              onCloseRequest={handler}
              onOKRequest={handler}
              url="url"
              showModal={true}
            />
          </BrowserRouter>,
        )
        cy.get('a').contains('Data Library').first()
          .should('have.css', 'cursor', 'pointer')
      })
    })

    describe('When user is NOT logged in:', () => {
      beforeEach(() => {
        cy.stub(Storage, 'userIsLogged').returns(false)
        cy.stub(Storage, 'getCurrentUser').returns(undefined)
      })

      it('Displays "Data Library" link text', () => {
        mount(
          <BrowserRouter>
            <SupportRequestModal
              onCloseRequest={handler}
              onOKRequest={handler}
              url="url"
              showModal={true}
            />
          </BrowserRouter>,
        )
        cy.contains('Data Library').should('exist')
        cy.get('a').filter(':contains("Data Library")').should('have.length', 2)
      })

      it('Has appropriate styling', () => {
        mount(
          <BrowserRouter>
            <SupportRequestModal
              onCloseRequest={handler}
              onOKRequest={handler}
              url="url"
              showModal={true}
            />
          </BrowserRouter>,
        )
        cy.get('a').contains('Data Library').first()
          .should('have.css', 'cursor', 'pointer')
      })

      it('Closes modal when link is clicked', () => {
        const onCloseStub = cy.stub().as('onCloseRequest')
        mount(
          <BrowserRouter>
            <SupportRequestModal
              onCloseRequest={onCloseStub}
              onOKRequest={handler}
              url="url"
              showModal={true}
            />
          </BrowserRouter>,
        )
        // Click the first "Data Library" link
        cy.get('a').contains('Data Library').first().click()
        // Verify the modal close handler was called
        cy.get('@onCloseRequest').should('be.calledWith', 'support')
      })
    })
  })
})
