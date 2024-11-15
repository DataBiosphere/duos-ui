/* eslint-disable no-undef */
import {Metrics} from '../../../src/libs/ajax/Metrics';
import eventList from '../../../src/libs/events';

describe('Metrics Tests', function () {

  // Intercept configuration calls
  beforeEach(() => {
    cy.intercept({
      method: 'GET',
      url: '/config.json',
      hostname: 'localhost',
    }, {'env': 'ci'});
  });

  Cypress._.each(Object.keys(eventList), (eventType) => {
    it(`Captures ${eventType} Event`, function () {
      cy.intercept('**/event').as('event');
      Metrics.captureEvent(eventType);
      cy.wait('@event').then(interception => {
        expect(interception).to.exist;
      });
    });
  });

  it('Sync Profile', function () {
    cy.intercept('**/syncProfile').as('sync');
    Metrics.syncProfile();
    cy.wait('@sync').then(interception => {
      expect(interception).to.exist;
    });
  });

  it('Identify', function () {
    cy.intercept('**/identify').as('identify');
    Metrics.identify('anonymousId');
    cy.wait('@identify').then(interception => {
      expect(interception).to.exist;
    });
  });

});
