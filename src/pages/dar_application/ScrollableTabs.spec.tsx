import {mount} from 'cypress/react';
import React from 'react';
import {ScrollableTabs} from './ScrollableTabs';
import {BrowserRouter} from 'react-router-dom';


const ApplicationTabs = [
    { name: 'Researcher Information', id: 'researcher-info' },
    { name: 'Data Access Request', id: 'data-access-request' },
    { name: 'Research Purpose Statement', id: 'research-purpose-statement' }
];
describe('ScrollableTabs Component - Tests', () => {
    beforeEach(() => {
        mount(<BrowserRouter>
            <div style={{display: 'inline-flex'}}>
                <ScrollableTabs applicationTabs={ApplicationTabs} formSelectedTabId={1}/>
                <div>
                    <div id='researcher-info' style={{height: '1000px', backgroundColor: 'red'}}>Researcher Info</div>
                    <div id='data-access-request' style={{height: '1000px', backgroundColor: 'blue'}}>Data Access Request</div>
                    <div id='research-purpose-statement' style={{height: '1000px', backgroundColor: 'purple'}}>Research Purpose Statement</div>
                </div>
            </div>
        </BrowserRouter>)
    });
    it('Case 1 - change tabs based on formSelectedTabId', () => {
        mount(<BrowserRouter><ScrollableTabs applicationTabs={ApplicationTabs} formSelectedTabId={1}/></BrowserRouter>)
        cy.get('.Mui-selected').contains('Researcher Information').should('exist');
        cy.get('.Mui-selected').contains('Data Access Request').should('not.exist');

        mount(<BrowserRouter><ScrollableTabs applicationTabs={ApplicationTabs} formSelectedTabId={2}/></BrowserRouter>)
        cy.get('button').contains('Data Access Request').click();
        cy.get('.Mui-selected').contains('Data Access Request').should('exist');
    });

    it('Case 2 - Auto-scroll to section on scroll', () => {
        cy.scrollTo(0, 2000);
        cy.get('.Mui-selected').contains('Research Purpose Statement').should('exist');
        cy.window().then(($window) => {
            expect($window.scrollY).to.be.closeTo(2000, 500);
        });

    });

    it('Case 3 - First tab selected by default and can click and select another tab', () => {
        cy.get('.Mui-selected').contains('Researcher Information').should('exist');
        cy.get('.Mui-selected').contains('Data Access Request').should('not.exist');

        cy.get('button').contains('Data Access Request').click();
        cy.get('.Mui-selected').contains('Data Access Request').should('exist');
    });
});