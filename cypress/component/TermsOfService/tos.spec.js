/* eslint-disable no-undef */

import React from 'react';
import {mount} from '@cypress/react';
import TermsOfService from '../../../src/pages/TermsOfService';
import { ToS } from '../../../src/libs/ajax';

describe('Terms of Service Page - Tests', function() {
  it('Terms of Service Page Loads', function () {
    cy.viewport(600, 300);
    const text = 'TOS Text';
    cy.stub(ToS, 'getDUOSText').returns(text);
    mount(<TermsOfService />);
    cy.contains(text).should('exist');
  });

  it('Terms of Service Page Translates Markdown', function () {
    cy.viewport(600, 300);
    const text = 'TOS Text';
    const rawMarkdown = '# ' + text;
    cy.stub(ToS, 'getDUOSText').returns(rawMarkdown);
    mount(<TermsOfService />);
    cy.contains(text).should('exist');
    cy.contains(rawMarkdown).should('not.exist');
  });
});
