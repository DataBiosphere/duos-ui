describe('Home', function () {
  it('Home page loads correctly', function () {
    cy.visit(Cypress.env('baseUrl'))
    cy.contains('DUOS')
    cy.contains('Sign In')
    cy.contains('How does DUOS expedite compliant data sharing?')
    cy.contains('DUOS for DACs')
    cy.contains('Institutional Oversight')
    cy.contains('Looking for data')
    cy.contains('Data Libraries in DUOS')
    cy.get('#blog-support-dac-link').should(
      'have.attr',
      'href',
      'https://duos.blog/help/dacguide/',
    )
    cy.get('#blog-support-so-link').should(
      'have.attr',
      'href',
      'https://duos.blog/help/preauthorize_researchers_librarycards/',
    )

    cy.get('#data-library-link').should(
      'have.attr',
      'href',
      'https://duos.org/datalibrary',
    )
  })
})
