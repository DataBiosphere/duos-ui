import React from 'react'
import { mount } from 'cypress/react'
import { StudyAsset } from 'src/pages/data_submission/v2/StudyAsset'

describe('StudyAsset component', () => {
  it('renders all configured elements (icon, title, description, children, button)', () => {
    const clickSpy = cy.spy().as('clickSpy')
    mount(
      <StudyAsset
        config={{
          icon: <span data-cy="icon">ICON</span>,
          title: 'Models',
          description: 'Add computational models or algorithms derived from this study',
          children: <div data-cy="children">Child Content</div>,
          button: <button data-cy="action" onClick={() => clickSpy()}>Add</button>,
        }}
      />,
    )

    cy.get('[data-cy="icon"]').should('contain.text', 'ICON')
    cy.contains('Models').should('exist')
    cy.contains('Add computational models or algorithms derived from this study').should('exist')
    cy.get('[data-cy="children"]').should('contain.text', 'Child Content')
    cy.get('[data-cy="action"]').click()
    cy.get('@clickSpy').should('have.been.calledOnce')
  })

  it('renders without optional children and button', () => {
    mount(
      <StudyAsset
        config={{
          icon: <span data-cy="icon-min">I</span>,
          title: 'Empty Section',
          description: 'No children here',
        }}
      />,
    )
    cy.contains('Empty Section').should('exist')
    cy.contains('No children here').should('exist')
    cy.get('[data-cy="icon-min"]').should('exist')
    cy.get('button').should('not.exist')
  })
  it('applies expected container styles', () => {
    mount(
      <StudyAsset
        config={{
          icon: <span>Icon</span>,
          title: 'Style Check',
          description: 'Style test',
          children: <div>Content</div>,
        }}
      />,
    )

    cy.contains('h3', 'Style Check')
      .parents('div')
      .eq(3)
      .as('assetContainer')

    cy.get('@assetContainer')
      .should('have.css', 'background-color', 'rgb(234, 240, 250)')
      .and('have.css', 'border-radius', '12px')

    cy.get('@assetContainer')
      .should('have.css', 'box-shadow')
      .and('match', /rgba\(0, 0, 0, 0\.08\)/)
  })
})
