import { React } from 'react'
import { mount } from 'cypress/react'
import ReviewHeader from 'src/pages/dar_collection_review/ReviewHeader'

describe('ReviewHeader - Tests', () => {
  it('Renders the header', () => {
    mount(
      <ReviewHeader
        darCode="DAR-100"
        projectTitle="Title"
        readOnly={true}
      />,
    )

    const reviewHeader = '.header-container'
    cy.get(reviewHeader).should('exist')
    cy.get(reviewHeader).should('contain.text', 'DAR-100')
    cy.get(reviewHeader).should('contain.text', 'Title')
  })

  it('Renders read-only text in Review Header when readOnly prop is true', function () {
    mount(
      <ReviewHeader
        darCode="DAR-100"
        projectTitle="Title"
        readOnly={true}
      />,
    )

    cy.get('.header-container').should('contain.text', 'Data Access Request Review (read-only)')
  })

  it('Does not render read-only text in Review Header when readOnly prop is false', function () {
    mount(
      <ReviewHeader
        darCode="DAR-100"
        projectTitle="Title"
        readOnly={false}
      />,
    )

    const reviewContainer = '.header-container'
    cy.get(reviewContainer).should('exist')
    cy.get(reviewContainer).should('contain.text', 'Data Access Request Review')
    cy.get(reviewContainer).should('not.contain.text', 'read-only')
  })
})
