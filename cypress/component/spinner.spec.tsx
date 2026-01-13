import React from 'react'
import { Spinner } from 'src/components/Spinner'

describe('Spinner', () => {
  it('Renders the spinner component', () => {
    cy.mount(<Spinner />)
    cy.get('div').find('img').should('be.visible')
  })
})
