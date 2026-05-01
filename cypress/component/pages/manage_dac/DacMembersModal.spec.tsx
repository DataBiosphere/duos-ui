import React from 'react'
import { DacMembersModal } from 'src/pages/manage_dac/DacMembersModal'
import { DacObject } from 'src/types/model'

describe('DacMembersModal Component Tests', () => {
  const dac: DacObject = {
    name: 'Test DAC',
    chairpersons: [],
    members: [],
  }

  const mountModal = (onCloseRequest = cy.stub()) => {
    cy.mount(
      <div id="modal-root">
        <DacMembersModal showModal={true} onCloseRequest={onCloseRequest} dac={dac} />
      </div>,
    )
  }

  it('renders the modal with the correct title', () => {
    mountModal()
    cy.get('#dacMembersModal_title').should('contain.text', 'DAC Members associated with DAC: Test DAC')
  })

  it('renders DacUsers content in the modal body', () => {
    mountModal()
    cy.contains('User').should('exist')
    cy.contains('Role').should('exist')
  })

  it('calls onCloseRequest when Close is clicked', () => {
    const onCloseRequest = cy.stub().as('onCloseRequest')
    mountModal(onCloseRequest)
    cy.get('#btn_action').click()
    cy.get('@onCloseRequest').should('have.been.calledOnce')
  })
})
