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

// Add these to cypress/component/StudyAssets/testUtils.tsx

export function testViewModeFlow(
  mountFn: () => void,
  titleText: string,
  options?: {
    fieldId?: string
    titleSelector?: string
  },
) {
  const {
    fieldId = '#title',
    titleSelector = '',
  } = options || {}

  mountFn()
  cy.get('.glyphicon-eye-open').click({ force: true })
  cy.contains(titleSelector || titleText).should('exist')
  cy.get(fieldId).should('be.disabled')
  cy.get('.collaborator-form-add-save-button').should('not.exist')
  cy.get('.collaborator-form-cancel-button').contains('Close').should('exist')
}

export function testCloseViewMode(
  mountFn: () => void,
  options?: {
    fieldId?: string
  },
) {
  const { fieldId = '#title' } = options || {}

  mountFn()
  cy.get('.glyphicon-eye-open').click({ force: true })
  cy.get('.collaborator-form-cancel-button').click()
  cy.get(fieldId).should('not.exist')
  cy.get('.glyphicon-eye-open').should('exist')
}

export function testEditModeRender<T>(
  mountRow: (overrides: Partial<T>) => void,
  fieldId: string,
  expectedValue: string,
) {
  mountRow({ editMode: true } as unknown as Partial<T>)
  cy.get(fieldId).should('have.value', expectedValue)
}

export function testViewModeRender<T>(
  mountRow: (overrides: Partial<T>) => void,
  fieldId: string,
  expectedValue: string,
) {
  mountRow({ viewMode: true, viewAction: cy.stub() } as unknown as Partial<T>)
  cy.get(fieldId).should('have.value', expectedValue)
  cy.get(fieldId).should('be.disabled')
  cy.get('.collaborator-form-add-save-button').should('not.exist')
}

export function testViewActionTrigger<T>(
  mountRow: (overrides: Partial<T>) => void,
) {
  mountRow({ viewAction: cy.stub().as('view') } as unknown as Partial<T>)
  cy.get('.glyphicon-eye-open').click({ force: true })
  cy.get('@view').should('have.been.calledOnce')
}

export function testSummaryViewActionTrigger(
  mountComponent: () => void,
) {
  mountComponent()
  cy.get('.glyphicon-eye-open').should('exist')
  cy.get('.glyphicon-eye-open').click({ force: true })
  cy.get('@view').should('have.been.calledOnce')
}
