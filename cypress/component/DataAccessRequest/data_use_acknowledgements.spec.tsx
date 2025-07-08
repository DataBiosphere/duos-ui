import React from 'react';
import { mount } from 'cypress/react';
import { DataUseAcknowledgements } from 'src/pages/dar_application/DataUseAcknowlegements';

describe('DataUseAcknowledgements Component', () => {
    let onChangeSpy: () => void;
    let onValidationChangeSpy: () => void;

    const mountComponent = (customProps = {}) => {
        const defaultProps = {
            title: 'Data Use Acknowledgements',
            datasets: [],
            dataUseTranslations: [],
            formData: {},
            readOnlyMode: false,
            includeInstructions: true,
            onChange: onChangeSpy,
            onValidationChange: onValidationChangeSpy,
            validation: {},
            ...customProps
        };
        return mount(<DataUseAcknowledgements {...defaultProps} />);
    }

    beforeEach(() => {
        onChangeSpy = cy.stub().as('onChangeSpy');
        onValidationChangeSpy = cy.stub().as('onValidationChangeSpy');
        mountComponent();
    });

    it('renders the component with default props', () => {
        cy.get('.data-use-acknowledgements').should('exist');
    });

    it('renders the GSO acknowledgement field when needed', () => {
        mountComponent({ datasets: [{ dataUse: { geneticStudiesOnly: true } }] });
        cy.get('#gsoAcknowledgement').should('exist');
    });

    it('renders the PUB acknowledgement field when needed', () => {
        mountComponent({ datasets: [{ dataUse: { publicationResults: true } }] });
        cy.get('#pubAcknowledgement').should('exist');
    });

    it('renders the DS acknowledgement field when needed', () => {
        mountComponent({ dataUseTranslations: ['DS', 'DS2'] });
        cy.get('#dsAcknowledgement').should('exist');
    });

    it('does not render fields when conditions are not met', () => {
        cy.get('#gsoAcknowledgement').should('not.exist');
        cy.get('#pubAcknowledgement').should('not.exist');
        cy.get('#dsAcknowledgement').should('not.exist');
    });

    it('calls onChange when a checkbox is toggled', () => {
        mountComponent({ datasets: [{ dataUse: { geneticStudiesOnly: true } }] });
        cy.get('input[type="checkbox"]').check();
        cy.get('@onChangeSpy').should('have.been.called');
    });

    it('disables fields in read-only mode', () => {
        mountComponent({
            datasets: [{ dataUse: { geneticStudiesOnly: true } }],
            readOnlyMode: true
        });
        cy.get('input[type="checkbox"]').should('be.disabled');
    });
});
