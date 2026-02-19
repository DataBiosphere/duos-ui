import React, { useState } from 'react'
import { useDebouncedValue } from 'src/hooks/useDebouncedValue'

const TestComponent = ({ delay }: { delay?: number }) => {
  const [value, setValue] = useState('initial')
  const debouncedValue = useDebouncedValue(value, delay)

  return (
    <div>
      <div id="value">{value}</div>
      <div id="debounced">{debouncedValue}</div>
      <input
        id="input"
        value={value}
        onChange={e => setValue(e.target.value)}
      />
    </div>
  )
}

describe('useDebouncedValue', () => {
  it('returns initial value immediately', () => {
    cy.mount(<TestComponent />)
    cy.get('#value').should('have.text', 'initial')
    cy.get('#debounced').should('have.text', 'initial')
  })

  it('debounces value updates', () => {
    cy.mount(<TestComponent delay={100} />)

    cy.get('#input').clear()
    cy.get('#input').type('updated')
    cy.get('#value').should('have.text', 'updated')

    // Should still be initial immediately
    cy.get('#debounced').should('have.text', 'initial')

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(150)
    cy.get('#debounced').should('have.text', 'updated')
  })

  it('cancels previous timeout when value changes again', () => {
    cy.mount(<TestComponent delay={1000} />)

    cy.get('#input').clear()
    cy.get('#input').type('first')

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(100)
    cy.get('#input').clear()
    cy.get('#input').type('second')

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500)
    cy.get('#debounced').should('have.text', 'initial')

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(600)
    cy.get('#debounced').should('have.text', 'second')
  })
})
