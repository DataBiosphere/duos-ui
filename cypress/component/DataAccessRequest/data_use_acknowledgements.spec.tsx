import React from 'react';
import { mount } from 'cypress/react';
import { DataUseAcknowledgements } from 'src/pages/dar_application/DataUseAcknowlegements';

describe('DataUseAcknowledgements Component', () => {
    let defaultProps: any;

    beforeEach(() => {
        defaultProps = {
            title: 'Data Use Acknowledgements',
            datasets: [],
            dataUseTranslations: [],
            formData: {},
            readOnlyMode: false,
            includeInstructions: true,
            onChange: cy.stub(),
            onValidationChange: cy.stub(),
            validation: {}
        };
    });

    it('renders the component with default props', () => {
        mount(<DataUseAcknowledgements {...defaultProps} />);
        cy.get('.data-use-acknowledgements').should('exist');
    });

    it('renders the GSO acknowledgement field when needed', () => {
        const props = {
            ...defaultProps,
            datasets: [{ dataUse: {geneticStudiesOnly: true }}]
        };
        mount(<DataUseAcknowledgements {...props} />);
        cy.get('#gsoAcknowledgement').should('exist');
    });

    it('renders the PUB acknowledgement field when needed', () => {
        const props = {
            ...defaultProps,
            datasets: [{dataUse: { publicationResults: true }}]
        };
        mount(<DataUseAcknowledgements {...props} />);
        cy.get('#pubAcknowledgement').should('exist');
    });

    it('renders the DS acknowledgement field when needed', () => {
        const props = {
            ...defaultProps,
            dataUseTranslations: ['DS', 'DS2']
        };
        mount(<DataUseAcknowledgements {...props} />);
        cy.get('#dsAcknowledgement').should('exist');
    });

    it('does not render fields when conditions are not met', () => {
        mount(<DataUseAcknowledgements {...defaultProps} />);
        cy.get('#gsoAcknowledgement').should('not.exist');
        cy.get('#pubAcknowledgement').should('not.exist');
        cy.get('#dsAcknowledgement').should('not.exist');
    });

    it('calls onChange when a checkbox is toggled', () => {
        const props = {
            ...defaultProps,
            datasets: [{ dataUse: {geneticStudiesOnly: true }}]
        };
        mount(<DataUseAcknowledgements {...props} />);
        cy.get('input[type="checkbox"]').check().then(() => {
            expect(props.onChange).to.have.been.called;
        });
    });

    it('disables fields in read-only mode', () => {
        const props = {
            ...defaultProps,
            datasets: [{ dataUse: {geneticStudiesOnly: true }}],
            readOnlyMode: true
        };
        mount(<DataUseAcknowledgements {...props} />);
        cy.get('input[type="checkbox"]').should('be.disabled');
    });
});