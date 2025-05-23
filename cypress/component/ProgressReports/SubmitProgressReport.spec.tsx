import React from 'react';
import {mount} from 'cypress/react';
import SubmitProgressReport from 'src/pages/progress_reports/SubmitProgressReport';
import {StackdriverReporter} from 'src/libs/stackdriverReporter';
import 'src/index.css';
import 'src/styles/buttons.css';


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
            parentReferenceId="1"
            onSuccess={() => {
            }}
            onCancel={() => {
            }}
            validateForm={() => {
              return {}
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
            parentReferenceId="1"
            onSuccess={() => {
            }}
            onCancel={() => {
            }}
            validateForm={() => {
              return {}
            }}
            formState={{}}/>
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
    const validationSpy = {
        validateForm: () => {
            return {}
        }
    }
    cy.spy(validationSpy, 'validateForm').as('validateForm');

    mount(
        <SubmitProgressReport
            formState={{}}
            parentReferenceId="1"
            onSuccess={functionSpy.successHandler}
            onCancel={() => {
            }}
            validateForm={validationSpy.validateForm}
        />
    );
    cy.get('[data-cy=pr-submit-button]').should('exist');
    cy.get('[data-cy=pr-submit-button]').click();
    cy.get('@validateForm').should('have.been.calledOnce');
    cy.get('@successHandler').should('have.been.calledOnce');
  });

  it('API and On Submit handler should not be called if validation fails', () => {
      const functionSpy = {
          successHandler: () => {
              console.log('successHandler')
          }
      }
      cy.spy(functionSpy, 'successHandler').as('successHandler');
      const submitSpy = cy.spy().as('submitSpy');
      cy.intercept('POST', '/api/dar/v2/progress_report/1', () => submitSpy());

      mount(
          <SubmitProgressReport
              formState={{}}
              parentReferenceId="1"
              onSuccess={functionSpy.successHandler}
              onCancel={() => {
              }}
              validateForm={() => {
                  return {darErrors: {datasetIds: {valid: false, failed: ['required']}}}
              }}
            />
      );
      cy.get('[data-cy=pr-submit-button]').should('exist');
      cy.get('[data-cy=pr-submit-button]').click();
      cy.get('@submitSpy').should('not.always.have.been.called')
      cy.get('@successHandler').should('not.have.been.called');
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
            formState={{}}
            parentReferenceId="1"
            onSuccess={() => {
            }}
            onCancel={functionSpy.cancelHandler}
            validateForm={() => {
              return {}
            }}
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
            formState={{}}
            parentReferenceId="1"
            onSuccess={() => {
            }}
            onCancel={() => {
            }}
            validateForm={() => {
              return {}
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
