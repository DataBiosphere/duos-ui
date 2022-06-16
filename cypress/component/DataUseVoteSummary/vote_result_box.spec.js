/* eslint-disable no-undef */
import React from 'react';
import { mount } from 'cypress/react';
import VoteResultIcon from '../../../src/components/common/DataUseVoteSummary/VoteResultBox';

const propKey = 'Test-Label';
const label = 'Test Label';
const additionalLabelStyle = {};

describe('VoteResultBox - Tests', function () {
  it('Renders the label with key and inner text assigned by props', function() {
    mount(<VoteResultIcon label={label} additinoalLabelStyle = {additionalLabelStyle}/>);
    const testElement = cy.get(`.vote-result-box-text-${propKey}`);
    testElement.should('exist');
    testElement.contains('Test Label');
  });
});
