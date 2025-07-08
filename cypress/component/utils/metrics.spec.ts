import { Metrics } from 'src/libs/ajax/Metrics';
import eventList from 'src/libs/events';

describe('Metrics Tests', function () {

  beforeEach(() => {
    cy.initApplicationConfig();
  });

  Cypress._.each(Object.keys(eventList), (eventType) => {
    it(`Captures ${eventType} Event`, function () {
      cy.intercept('**/event').as('event');
      Metrics.captureEvent(eventType);
      cy.wait('@event').should('exist');
    });
  });

  it('Sync Profile', function () {
    cy.intercept('**/syncProfile').as('sync');
    Metrics.syncProfile();
    cy.wait('@sync').should('exist');
  });

  it('Identify', function () {
    cy.intercept('**/identify').as('identify');
    Metrics.identify('anonymousId');
    cy.wait('@identify').should('exist');
  });

});
