/* eslint-disable no-undef */

import { mount } from 'cypress/react';
import React from 'react';
import {Storage} from '../../../src/libs/storage';
import DatasetSearch from '../../../src/pages/DatasetSearch';

const duosUser = {
    isSigningOfficial: false,
};

describe('Data Library', () => {
    // Intercept configuration calls
    beforeEach(() => {
        cy.intercept({
            method: 'GET',
            url: '/config.json',
            hostname: 'localhost',
        }, { 'env': 'ci' });
    });

    it('Renders the data library without a query', () => {
        const props = { match: { params: { query: undefined } } };
        cy.stub(Storage, 'getCurrentUser').returns(duosUser);
        mount(<DatasetSearch {...props} />);
    });

    it('Renders the data library with a query', () => {
        const props = { match: { params: { query: 'test' } } };
        cy.stub(Storage, 'getCurrentUser').returns(duosUser);
        mount(<DatasetSearch {...props} />);
    });
});
