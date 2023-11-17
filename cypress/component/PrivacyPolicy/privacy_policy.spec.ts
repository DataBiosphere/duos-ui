/* eslint-disable no-undef */

import { mount } from 'cypress/react';
import PrivacyPolicy from '../../../src/pages/PrivacyPolicy';

describe('Privacy Policy', () => {
  it('Renders the privacy policy page', () => {
    mount(PrivacyPolicy);
    cy.get('h1').should('contain', 'DUOS Privacy Policy');
  });
});
