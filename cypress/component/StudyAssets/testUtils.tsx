export function testDeleteViaModal(
  mountComponent: () => void,
  itemDisplayValue: string,
  options?: {
    modalSelector?: string
    deleteButtonSelector?: string
    summaryCardSelector?: string
  },
) {
  return () => {
    const {
      modalSelector = '.ReactModal__Content',
      deleteButtonSelector = 'button',
      summaryCardSelector = '.collaborator-summary-card',
    } = options || {}

    mountComponent()
    cy.contains(itemDisplayValue).should('exist')
    cy.get('.glyphicon-trash').click({ force: true })
    cy.get(modalSelector)
      .should('be.visible')
      .within(() => {
        cy.get(deleteButtonSelector)
          .filter(':visible')
          .contains(/delete/i)
          .click({ force: true })
      })
    cy.get(modalSelector).should('not.exist')
    cy.contains(itemDisplayValue).should('not.exist')
    cy.get(summaryCardSelector).should('have.length', 0)
  }
}
