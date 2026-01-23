import React from 'react'
import { RadioButton } from 'src/components/RadioButton'

describe('RadioButton', () => {
  it('renders correctly and does not mutate shared styles', () => {
    cy.mount(
      <div>
        <RadioButton
          id="radio-1"
          name="test-group"
          value="val-1"
          defaultChecked={true}
          label="Label 1"
        />
        <RadioButton
          id="radio-2"
          name="test-group"
          value="val-2"
          defaultChecked={false}
          label="Label 2"
        />
      </div>,
    )

    // The checked radio button should have the blue background
    // In RadioButton.jsx: backgroundColor: '#2196F3'
    cy.get('#radio-1').siblings('span').should('have.css', 'background-color', 'rgb(33, 150, 243)')

    // The unchecked radio button should have white background
    // In RadioButton.jsx basicUnchecked: backgroundColor: 'white'
    cy.get('#radio-2').siblings('span').should('have.css', 'background-color', 'rgb(255, 255, 255)')
  })

  it('maintains independent styles for multiple instances', () => {
    cy.mount(
      <div>
        <RadioButton
          id="radio-a"
          name="group-a"
          value="a"
          defaultChecked={true}
          label="A"
        />
        <RadioButton
          id="radio-b"
          name="group-b"
          value="b"
          defaultChecked={false}
          label="B"
        />
        <RadioButton
          id="radio-c"
          name="group-c"
          value="c"
          defaultChecked={false}
          label="C"
        />
      </div>,
    )

    // Verify checked one is blue
    cy.get('#radio-a').siblings('span').should('have.css', 'background-color', 'rgb(33, 150, 243)')

    // Verify others are white (not mutated by the first one)
    cy.get('#radio-b').siblings('span').should('have.css', 'background-color', 'rgb(255, 255, 255)')
    cy.get('#radio-c').siblings('span').should('have.css', 'background-color', 'rgb(255, 255, 255)')
  })
})
