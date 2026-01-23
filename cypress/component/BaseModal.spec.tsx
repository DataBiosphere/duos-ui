import React from 'react'
import { BaseModal } from 'src/components/BaseModal'

describe('BaseModal Component', () => {
  beforeEach(() => {
    const appRoot = document.createElement('div')
    appRoot.setAttribute('id', 'root')
    document.body.appendChild(appRoot)
  })

  const getDefaultProps = () => ({
    showModal: true,
    onRequestClose: cy.stub().as('onRequestClose'),
    title: 'Test Modal',
    description: 'This is a test modal description',
    color: 'common',
    action: {
      label: 'Confirm',
      handler: cy.stub().as('actionHandler'),
    },
  })

  it('should render modal when showModal is true', () => {
    cy.mount(<BaseModal {...getDefaultProps()} />)

    cy.get('.modal-header').should('exist')
    cy.get('.modal-content').should('exist')
    cy.get('.modal-footer').should('exist')
  })

  it('should not render modal when showModal is false', () => {
    cy.mount(<BaseModal {...getDefaultProps()} showModal={false} />)

    cy.get('.modal-header').should('not.exist')
  })

  it('should display the correct title', () => {
    cy.mount(<BaseModal {...getDefaultProps()} />)

    cy.contains('Test Modal').should('be.visible')
  })

  it('should display the correct description', () => {
    cy.mount(<BaseModal {...getDefaultProps()} />)

    cy.contains('This is a test modal description').should('be.visible')
  })

  it('should render children content', () => {
    cy.mount(
      <BaseModal {...getDefaultProps()}>
        <div data-cy="test-child">Child Content</div>
      </BaseModal>,
    )

    cy.get('[data-cy="test-child"]').should('contain', 'Child Content')
  })

  it('should call onRequestClose when close button is clicked', () => {
    cy.mount(<BaseModal {...getDefaultProps()} />)

    cy.get('.modal-close-btn').click()
    cy.get('@onRequestClose').should('have.been.called')
  })

  it('should call onRequestClose when cancel button is clicked', () => {
    cy.mount(<BaseModal {...getDefaultProps()} />)

    cy.get('#btn-cancel').click()
    cy.get('@onRequestClose').should('have.been.called')
  })

  it('should call action handler when action button is clicked', () => {
    cy.mount(<BaseModal {...getDefaultProps()} />)

    cy.get('#btn_action').click()
    cy.get('@actionHandler').should('have.been.called')
  })

  it('should display the correct action button label', () => {
    cy.mount(<BaseModal {...getDefaultProps()} />)

    cy.get('#btn_action').should('contain', 'Confirm')
  })

  it('should hide cancel button when type is informative', () => {
    cy.mount(<BaseModal {...getDefaultProps()} type="informative" />)

    cy.get('#btn-cancel').should('not.exist')
    cy.get('#btn_action').should('exist')
  })

  it('should show cancel button when type is default', () => {
    cy.mount(<BaseModal {...getDefaultProps()} type="default" />)

    cy.get('#btn-cancel').should('exist')
    cy.get('#btn_action').should('exist')
  })

  it('should show cancel button when type is not specified', () => {
    cy.mount(<BaseModal {...getDefaultProps()} />)

    cy.get('#btn-cancel').should('exist')
  })

  it('should disable action button when disableOkBtn is true', () => {
    cy.mount(<BaseModal {...getDefaultProps()} disableOkBtn={true} />)

    cy.get('#btn_action').should('be.disabled')
  })

  it('should enable action button when disableOkBtn is false', () => {
    cy.mount(<BaseModal {...getDefaultProps()} disableOkBtn={false} />)

    cy.get('#btn_action').should('not.be.disabled')
  })

  it('should enable action button by default', () => {
    cy.mount(<BaseModal {...getDefaultProps()} />)

    cy.get('#btn_action').should('not.be.disabled')
  })

  it('should apply the correct color class to action button', () => {
    cy.mount(<BaseModal {...getDefaultProps()} color="cancel" />)

    cy.get('#btn_action').should('have.class', 'cancel-background')
  })

  it('should call afterOpen callback when modal opens', () => {
    const afterOpen = cy.stub().as('afterOpen')
    cy.mount(<BaseModal {...getDefaultProps()} afterOpen={afterOpen} />)

    cy.get('@afterOpen').should('have.been.called')
  })

  it('should render with custom iconSize prop', () => {
    cy.mount(<BaseModal {...getDefaultProps()} iconSize="large" />)

    cy.get('.modal-header').should('exist')
  })

  it('should render with id prop', () => {
    cy.mount(<BaseModal {...getDefaultProps()} id="custom-modal-id" />)

    cy.get('.modal-header').should('exist')
  })

  it('should render with imgSrc prop', () => {
    cy.mount(<BaseModal {...getDefaultProps()} imgSrc="/test-image.png" />)

    cy.get('.modal-header').should('exist')
  })

  it('should have correct button classes', () => {
    cy.mount(<BaseModal {...getDefaultProps()} />)

    cy.get('#btn_action')
      .should('have.class', 'btn')
      .and('have.class', 'common-background')

    cy.get('#btn-cancel')
      .should('have.class', 'btn')
      .and('have.class', 'dismiss-background')
  })
})
