/* eslint-disable no-undef */

import {mount} from 'cypress/react';
import React from 'react';
import {Spinner} from '../../src/components/Spinner';

describe('Spinner', () => {
  it('Renders the spinner component', () => {
    mount(<Spinner/>);
    cy.get('div').find('img').should('be.visible');
  });
});
