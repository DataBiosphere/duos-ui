import React from 'react';
import {mount} from 'cypress/react';
import SubmitProgressReport from '../../../src/pages/progress_reports/SubmitProgressReport';
import {StackdriverReporter} from '../../../src/libs/stackdriverReporter';
import '../../../src/index.css';
import '../../../src/styles/buttons.css';


describe('SubmitProgressReport tests', () => {
  beforeEach(() => {
        cy.initApplicationConfig();
        cy.viewport(600, 300);
      }
  );

  it('Should show a submit and cancel button', () => {
    mount(
        <SubmitProgressReport
            progressReport={{}}
            parentId="1"
            onSuccess={() => {
            }}
            onCancel={() => {
            }}
        />
    );
    cy.get('[data-cy=pr-submit-button]').should('exist');
    cy.get('[data-cy=pr-cancel-button]').should('exist');
  });

  it('Submit should succeed', () => {
    cy.intercept('POST', '/api/dar/v2/progress_report/1', {
      statusCode: 200,
      body: {},
    }).as('submitProgressReport');
    mount(
        <SubmitProgressReport
            progressReport={{}}
            parentId="1"
            onSuccess={() => {
            }}
            onCancel={() => {
            }}
        />
    );
    cy.get('[data-cy=pr-submit-button]').click();
    cy.wait('@submitProgressReport').then((interception) => {
      assert(interception?.response?.statusCode === 200, 'Submit was successful');
    });
  });

  it('On Submit handler should be called after successful submit', () => {
    const functionSpy = {
      successHandler: () => {
        console.log('successHandler')
      }
    }
    cy.spy(functionSpy, 'successHandler').as('successHandler');
    cy.intercept('POST', '/api/dar/v2/progress_report/1', {
      statusCode: 200,
      body: {},
    });
    mount(
        <SubmitProgressReport
            progressReport={{}}
            parentId="1"
            onSuccess={functionSpy.successHandler}
            onCancel={() => {
            }}
        />
    );
    cy.get('[data-cy=pr-submit-button]').should('exist');
    cy.get('[data-cy=pr-submit-button]').click();
    cy.get('@successHandler').should('have.been.calledOnce');
  });

  it('On Cancel handler should be called after cancel button clicked', () => {
    const functionSpy = {
      cancelHandler: () => {
        console.log('cancelHandler')
      }
    }
    cy.spy(functionSpy, 'cancelHandler').as('cancelHandler');
    mount(
        <SubmitProgressReport
            progressReport={{}}
            parentId="1"
            onSuccess={() => {
            }}
            onCancel={functionSpy.cancelHandler}
        />
    );
    cy.get('[data-cy=pr-cancel-button]').should('exist');
    cy.get('[data-cy=pr-cancel-button]').click();
    cy.get('@cancelHandler').should('have.been.calledOnce');
  });

  it('Submit failure message should be captured', () => {
    cy.stub(StackdriverReporter, 'report');
    cy.intercept('POST', '/api/dar/v2/progress_report/1', {
      statusCode: 500,
      body: {'message': 'Test Error', 'code': 500},
    }).as('submitProgressReport');
    mount(
        <SubmitProgressReport
            progressReport={{}}
            parentId="1"
            onSuccess={() => {
            }}
            onCancel={() => {
            }}
        />
    );
    cy.get('[data-cy=pr-submit-button]').click();
    cy.wait('@submitProgressReport').then((interception) => {
      assert(interception?.response?.statusCode === 500, 'Submit was not successful');
      cy.get('[data-cy=notification-alert]').should('exist');
      cy.get('[data-cy=notification-alert]').contains('Test Error');
    });
  });
});
