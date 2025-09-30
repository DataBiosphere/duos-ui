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
})
