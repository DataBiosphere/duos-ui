/* eslint-disable no-undef */
import React from 'react';
import { mount } from '@cypress/react';
import VoteResultIcon from '../../../src/components/common/DataUseVoteSummary/VoteResultLabel';

const propKey = 'Test-Label';
const label = 'Test Label';
const additionalLabelStyle = {};

describe('VoteResultLabel - Tests', function () {
  it('Renders the label with key and inner text assigned by props', function() {
    mount(<VoteResultIcon label={label} additinoalLabelStyle = {additionalLabelStyle}/>);
    const testElement = cy.get(`.vote-result-label-text-${propKey}`);
    testElement.should('exist');
    testElement.contains('Test Label');
  });
});
