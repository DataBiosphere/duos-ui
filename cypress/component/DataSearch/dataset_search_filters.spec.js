/* eslint-disable no-undef */

import { mount } from 'cypress/react';
import React from 'react';
import DatasetFilterList from '../../../src/components/data_search/DatasetFilterList';

const duosUser = {
    isSigningOfficial: false,
};

describe('Data Library Filters', () => {
    beforeEach(() => {
        cy.initApplicationConfig();
    });

    it('Renders the data library filters', () => {
        const props = { datasets: [], filters: [], filterHandler: () => {}, isFiltered: () => {}};
        mount(<DatasetFilterList {...props} />);
        cy.get('div').should('contain', 'Filters');
    });
});
