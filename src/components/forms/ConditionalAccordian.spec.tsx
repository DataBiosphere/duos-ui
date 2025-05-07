import {mount} from 'cypress/react';
import React from 'react';
import {ConditionalAccordian} from './ConditionalAccordian';
import {BrowserRouter} from 'react-router-dom';

describe('ConditionalAccordian Component - Tests', () => {
    it('should render an accordian with children', () => {
        mount(<BrowserRouter><ConditionalAccordian condition={true} title={'hello world'}><div><h1>Child component</h1></div></ConditionalAccordian></BrowserRouter>)
        cy.get('h3').contains('hello world');
        cy.get('h1').contains('Child component');
        cy.get('[id=root]').find('[data-testid=ExpandMoreIcon]').should('exist');
    });
    it('condition is false, should NOT render an accordian, but still render children', () => {
        mount(<BrowserRouter><ConditionalAccordian condition={false} title={'hello world'}><div><h1>Child component</h1></div></ConditionalAccordian></BrowserRouter>)
        cy.get('h2').contains('hello world');
        cy.get('h1').contains('Child component');
        cy.get('[id=root]').find('[data-testid=ExpandMoreIcon]').should('not.exist');
    });
});
