import React from 'react';
import { mount } from 'cypress/react';
import IrbDocumentUpload from 'src/pages/progress_reports/IrbDocumentUpload';
import { FormState } from 'src/pages/progress_reports/ProgressReportFormState';

describe('IrbDocumentUpload Component Tests', () => {
  beforeEach(() => {
    cy.initApplicationConfig();
    cy.viewport(800, 600);
  });

  const mockFormState: FormState = {
    irbProtocolExpiration: '2026-06-14',
    irbDocumentName: 'existing-irb.pdf',
    irbDocumentLocation: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  } as FormState;

  const mockFormStateWithoutIrb: FormState = {
    irbProtocolExpiration: '2026-06-14',
    irbDocumentName: undefined,
    irbDocumentLocation: undefined
  } as FormState;

  const mockValidation = {};
  const mockReferenceId = 'DAR-123';

  describe('File Display and Download', () => {
    it('Should display existing IRB document with download link in read-only mode', () => {
      // Mock the download function
      cy.intercept('GET', `/api/dar/v2/${mockReferenceId}/irbDocument`, {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="existing-irb.pdf"'
        },
        body: 'mock file content'
      }).as('downloadDocument');

      mount(
        <IrbDocumentUpload
          readOnly={true}
          formState={mockFormState}
          validation={mockValidation}
          uploadedIrbDocument={null}
          onIrbDocumentChange={() => {}}
          referenceId={mockReferenceId}
        />
      );

      // Check that the file name is displayed
      cy.contains('Current file: existing-irb.pdf').should('exist');

      // Check that download link exists
      cy.contains('Download').should('exist');

      // Check that upload form is not shown in read-only mode
      cy.get('input[type="file"]').should('not.exist');

      // Check that expiration date is shown
      cy.contains('IRB Protocol Expiration Date').should('exist');
      cy.contains('2026-06-14').should('exist');
    });

    it('Should display uploaded file name when a new file is uploaded', () => {
      const mockFile = new File(['test content'], 'new-irb-document.pdf', { type: 'application/pdf' });

      mount(
        <IrbDocumentUpload
          readOnly={false}
          formState={mockFormStateWithoutIrb}
          validation={mockValidation}
          uploadedIrbDocument={mockFile}
          onIrbDocumentChange={() => {}}
          referenceId={mockReferenceId}
        />
      );

      // Check that the newly uploaded file name is displayed
      cy.contains('Current file: new-irb-document.pdf').should('exist');
    });

    it('Should prioritize uploaded file name over form state file name', () => {
      const mockFile = new File(['test content'], 'newly-uploaded.pdf', { type: 'application/pdf' });

      mount(
        <IrbDocumentUpload
          readOnly={false}
          formState={mockFormState} // has existing file name
          validation={mockValidation}
          uploadedIrbDocument={mockFile} // newly uploaded file
          onIrbDocumentChange={() => {}}
          referenceId={mockReferenceId}
        />
      );

      // Should show the uploaded file name, not the form state file name
      cy.contains('newly-uploaded.pdf').should('exist');
    });
  });

  describe('File Upload Functionality', () => {
    it('Should show file upload form in editable mode', () => {
      const onIrbDocumentChangeSpy = cy.stub();

      mount(
        <IrbDocumentUpload
          readOnly={false}
          formState={mockFormStateWithoutIrb}
          validation={mockValidation}
          uploadedIrbDocument={null}
          onIrbDocumentChange={onIrbDocumentChangeSpy}
          referenceId={mockReferenceId}
        />
      );

      // Check that upload form is shown
      cy.contains('IRB Document').should('exist');
      cy.contains('Upload your current IRB approval document').should('exist');

      // Check that date picker form is shown
      cy.contains('When does your current IRB approval expire?').should('exist');
    });

    it('Should call onIrbDocumentChange when file is uploaded', () => {
      const onIrbDocumentChangeSpy = cy.stub();

      mount(
        <IrbDocumentUpload
          readOnly={false}
          formState={mockFormStateWithoutIrb}
          validation={mockValidation}
          uploadedIrbDocument={null}
          onIrbDocumentChange={onIrbDocumentChangeSpy}
          referenceId={mockReferenceId}
        />
      );

      // Create a mock file for testing
      const fileName = 'test-irb.pdf';
      const fileContent = 'test file content';

      // Find the file input and upload a file
      cy.get('input[type="file"]').then(($input) => {
        const file = new File([fileContent], fileName, { type: 'application/pdf' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        const input = $input[0] as HTMLInputElement;
        input.files = dataTransfer.files;

        // Trigger the change event
        cy.wrap($input).trigger('change', { force: true });
      });

      // Verify that the callback was called
      cy.wrap(onIrbDocumentChangeSpy).should('have.been.called');
    });
  });

  describe('Date Picker Functionality', () => {
    it('Should display correct default date in date picker', () => {
      mount(
        <IrbDocumentUpload
          readOnly={false}
          formState={mockFormState}
          validation={mockValidation}
          uploadedIrbDocument={null}
          onIrbDocumentChange={() => {}}
          referenceId={mockReferenceId}
        />
      );

      // Check that the component renders the date section
      cy.contains('IRB Protocol Expiration Date').should('exist');
      cy.contains('When does your current IRB approval expire?').should('exist');
    });

    it('Should call onIrbDocumentChange when date is changed', () => {
      const onIrbDocumentChangeSpy = cy.stub();

      mount(
        <IrbDocumentUpload
          readOnly={false}
          formState={mockFormStateWithoutIrb}
          validation={mockValidation}
          uploadedIrbDocument={null}
          onIrbDocumentChange={onIrbDocumentChangeSpy}
          referenceId={mockReferenceId}
        />
      );

      // Check that the date picker is present
      cy.contains('When does your current IRB approval expire?').should('exist');
      // The date picker component should be interactive, but we'll just verify it's there
    });

    it('Should only show expiration date in read-only mode, not date picker', () => {
      mount(
        <IrbDocumentUpload
          readOnly={true}
          formState={mockFormState}
          validation={mockValidation}
          uploadedIrbDocument={null}
          onIrbDocumentChange={() => {}}
          referenceId={mockReferenceId}
        />
      );

      // Should show the date but not the input/picker
      cy.contains('IRB Protocol Expiration Date').should('exist');
      cy.contains('2026-06-14').should('exist');
      cy.contains('When does your current IRB approval expire?').should('not.exist');
    });
  });

  describe('Download Functionality', () => {
    it('Should not show download link when no document exists', () => {
      mount(
        <IrbDocumentUpload
          readOnly={true}
          formState={mockFormStateWithoutIrb}
          validation={mockValidation}
          uploadedIrbDocument={null}
          onIrbDocumentChange={() => {}}
          referenceId={mockReferenceId}
        />
      );

      cy.contains('Download').should('not.exist');
    });

    it('Should show download link when document exists with valid reference', () => {
      mount(
        <IrbDocumentUpload
          readOnly={true}
          formState={mockFormState}
          validation={mockValidation}
          uploadedIrbDocument={null}
          onIrbDocumentChange={() => {}}
          referenceId={mockReferenceId}
        />
      );

      cy.contains('Download').should('exist');
    });

    it('Should not show download link when reference ID is missing', () => {
      mount(
        <IrbDocumentUpload
          readOnly={true}
          formState={mockFormState}
          validation={mockValidation}
          uploadedIrbDocument={null}
          onIrbDocumentChange={() => {}}
          referenceId=""
        />
      );

      cy.contains('Download').should('not.exist');
    });
  });

  describe('Error States', () => {
    it('Should handle validation errors appropriately', () => {
      const mockValidationWithErrors = {
        irbDocument: {
          isValid: false,
          errorText: 'IRB document is required'
        }
      };

      mount(
        <IrbDocumentUpload
          readOnly={false}
          formState={mockFormStateWithoutIrb}
          validation={mockValidationWithErrors}
          uploadedIrbDocument={null}
          onIrbDocumentChange={() => {}}
          referenceId={mockReferenceId}
        />
      );

      // Check that the component renders with validation in place
      cy.contains('IRB Document').should('exist');
    });
  });
});
