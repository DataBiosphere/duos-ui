/* eslint-disable no-undef */

import { mount } from 'cypress/react';
import React from 'react';
import {Storage} from '../../../src/libs/storage';
import DatasetFilterList from '../../../src/components/data_search/DatasetFilterList';

const duosUser = {
    isSigningOfficial: false,
};

describe('Data Library Filters', () => {
    // Intercept configuration calls
    beforeEach(() => {
        cy.intercept({
            method: 'GET',
            url: '/config.json',
            hostname: 'localhost',
        }, { 'env': 'ci' });
    });

    it('Renders the data library filters', () => {
        const props = { datasets: [], filters: [], filterHandler: () => {}, isFiltered: () => {}};
        mount(<DatasetFilterList {...props} />);
        cy.get('div').should('contain', 'Filters');
    });
});
