import React from 'react'
import { mount } from 'cypress/react'
import { SearchSelect } from 'src/components/SearchSelect'

const options = [
  { key: '1', displayText: 'Option One' },
  { key: '2', displayText: 'Option Two' },
  { key: '3', displayText: 'Option Three' },
]

describe('<SearchSelect />', () => {
  it('renders with empty value', () => {
    mount(
      <SearchSelect
        onSelection={cy.stub().as('onSelection')}
        placeholder="Select an option"
        options={options}
        value=""
        isClearable={true}
      />,
    )
    cy.get('input').should('contain', '')
  })

  it('preselects option when value matches', () => {
    mount(
      <SearchSelect
        onSelection={cy.stub().as('onSelection')}
        placeholder="Select an option"
        options={options}
        value="2"
        isClearable={true}
      />,
    )
    cy.contains('Option Two').should('exist')
  })

  it('calls onSelection when user selects an option', () => {
    mount(
      <SearchSelect
        onSelection={cy.stub().as('onSelection')}
        placeholder="Select an option"
        options={options}
        value=""
        isClearable={true}
      />,
    )
    cy.get('input').click()
    cy.get('[role="option"]').contains('Option One').click({ force: true })
    cy.get('@onSelection').should('have.been.calledOnce')
  })

  it('does not allow interaction when disabled', () => {
    mount(
      <SearchSelect
        onSelection={cy.stub().as('onSelection')}
        placeholder="Disabled select"
        options={options}
        value=""
        isClearable={true}
        disabled={true}
      />,
    )
    cy.get('input').should('be.disabled')
  })
})
