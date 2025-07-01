import React from 'react';
import ControlledAccessGrants from 'src/pages/user_profile/ControlledAccessGrants';
import { User } from 'src/libs/ajax/User';
import {mount} from 'cypress/react';
import {ThemeProvider} from '@mui/material';
import {theme} from 'src/components/sortable_table/Themes';

describe('ControlledAccessGrants', () => {
  beforeEach(() => {
    cy.viewport(1000, 500);
  })

  it('should render the component with correct header and description', () => {
    cy.stub(User, 'getApprovedDatasets').returns(Promise.resolve([]));

    mount(
      <ThemeProvider theme={theme}>
        <ControlledAccessGrants />
      </ThemeProvider>
    );

    cy.contains('h1', 'Controlled Access Grants').should('be.visible');
    cy.contains('p', 'Your current dataset approvals').should('be.visible');

    // Check if all the expected table headers are present
    cy.get('table').should('exist');
    cy.contains('th', 'DAR Code').should('be.visible');
    cy.contains('th', 'Approval Date').should('be.visible');
    cy.contains('th', 'Dataset Identifier').should('be.visible');
    cy.contains('th', 'Dataset Name').should('be.visible');
    cy.contains('th', 'DAC Name').should('be.visible');
  });

  it('should display dataset information', () => {
    const mockDatasets = [
      {
        darCode: 'DAR-001',
        approvalDate: '2025-01-15',
        datasetIdentifier: 'DS-123',
        datasetName: 'Test Dataset 1',
        dacName: 'DAC 1'
      },
      {
        darCode: 'DAR-002',
        approvalDate: '2025-02-20',
        datasetIdentifier: 'DS-456',
        datasetName: 'Test Dataset 2',
        dacName: 'DAC 2'
      }
    ];

    cy.stub(User, 'getApprovedDatasets').returns(Promise.resolve(mockDatasets));

    mount(<ControlledAccessGrants />);

    cy.contains('DAR-001').should('be.visible');
    cy.contains('2025-01-15').should('be.visible');
    cy.contains('DS-123').should('be.visible');
    cy.contains('Test Dataset 1').should('be.visible');
    cy.contains('DAC 1').should('be.visible');

    cy.contains('DAR-002').should('be.visible');
    cy.contains('2025-02-20').should('be.visible');
    cy.contains('DS-456').should('be.visible');
    cy.contains('Test Dataset 2').should('be.visible');
    cy.contains('DAC 2').should('be.visible');
  });

  it('should show error notification when API call fails', () => {
    cy.stub(User, 'getApprovedDatasets').returns(Promise.reject(new Error('Oh no an error occurred')));

    mount(<ControlledAccessGrants />);

    // Verify that the error notification was shown
    cy.contains('Error: Unable to retrieve user data from server')

    // Table should still be rendered, but with no rows
    cy.get('table').should('exist');
  });
});
