/* eslint-disable no-undef */
import {Config} from '../../../../src/libs/config';
import {Schema} from '../../../../src/libs/ajax/Schema';

describe('Schema', () => {
  beforeEach(() => {
    cy.stub(Config, 'getApiUrl').resolves(Cypress.env().baseUrl);
  });
  describe('Tests for /schemas/dataset-registration/v1', () => {
    it('Successfully GETs a dataset registration schema', () => {
      cy.intercept('GET', '/schemas/dataset-registration/v1', {statusCode: 200, body: '{"schema":true}'}).as('schema');
      Schema.datasetRegistrationV1();
      cy.wait('@schema').then((interception) => {
        expect(interception.request.headers.authorization).to.not.be.null;
        expect(interception.request.headers['x-app-id']).to.not.be.null;
        expect(interception.response.statusCode).to.eq(200);
      });
    });
    describe('Error Cases', () => {
      [400, 404, 500].forEach((code) => {
        it(`${code}`, () => {
          cy.intercept('GET', '/schemas/dataset-registration/v1', {statusCode: code}).as('schema');
          Schema.datasetRegistrationV1().then((response) => {
            expect(response).to.be.null;
          }).catch((err) => {
            expect(err.response.status.to.eq(code));
            expect(err).to.not.be.null;
          });
        });
      });
    });
  });
});
