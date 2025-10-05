describe('Home', function () {
  it('Home page loads correctly', function () {
    cy.visit(Cypress.env('baseUrl'))
    cy.contains('DUOS')
    cy.contains('Sign In')
    cy.contains('What is DUOS and how does it work?')
    cy.contains('DUOS for DACs')
    cy.contains('Institutional Oversight')
    cy.contains('Looking for data')
    cy.contains('Data Libraries in DUOS')
    cy.get('#blog-support-dac-link').should(
      'have.attr',
      'href',
      'https://duos.blog/help/dacguide/',
    )
    cy.get('#terra-support-so-link').should(
      'have.attr',
      'href',
      'https://duos.blog/help/preauthorize_researchers_librarycards/',
    )

    cy.get('#blog-support-researcher-link').should(
      'have.attr',
      'href',
      'https://duos.blog/help/researcherguide/',
    )
  })

  describe('Accessibility', function () {
    it('Home page has proper accessibility features', function () {
      cy.visit(Cypress.env('baseUrl'))

      // Check that images have appropriate alt attributes
      cy.get('img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt')

        // Decorative images should have empty alt or role="presentation"
        const altText = $img.attr('alt')
        const role = $img.attr('role')

        if (altText === '') {
          // Empty alt is acceptable for decorative images
          expect(altText).to.equal('')
        }
        else if (role === 'presentation') {
          // Presentation role is acceptable for decorative images
          expect(role).to.equal('presentation')
        }
        else {
          // Informative images should have meaningful alt text
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          expect(altText).to.not.be.empty
          expect(altText).to.not.match(/^(image|img|picture|photo)$/i)
        }
      })

      // Check that all links have accessible names
      cy.get('a').each(($link) => {
        const linkText = $link.text().trim()
        const ariaLabel = $link.attr('aria-label')
        const ariaLabelledby = $link.attr('aria-labelledby')
        const title = $link.attr('title')

        // Link should have at least one form of accessible name
        const hasAccessibleName = linkText || ariaLabel || ariaLabelledby || title
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        expect(hasAccessibleName).to.be.ok

        if (linkText) {
          expect(linkText).to.not.match(/^(click here|read more|link)$/i)
        }
      })

      // Check for proper heading structure
      cy.get('h1, h2, h3, h4, h5, h6').should('exist')

      // Verify main navigation is accessible
      cy.get('[role="navigation"], nav').should('exist')
    })
  })
})
