import React from 'react';
import {FormField, FormFieldTypes} from 'src/components/forms/forms';
import {FormState} from 'src/pages/progress_reports/ProgressReportFormState';
import {DownloadLink} from 'src/components/DownloadLink';
import {DAR} from 'src/libs/ajax/DAR';
import {DuosDatePicker} from 'src/components/DuosDatePicker';

interface IrbDocumentUploadProps {
  readOnly: boolean;
  formState: FormState;
  validation: Record<string, any>;
  uploadedIrbDocument: File | null;
  onIrbDocumentChange: (document: File | null, expiration: string) => void;
  referenceId: string;
}

const IrbDocumentUpload: React.FC<IrbDocumentUploadProps> = ({
  readOnly,
  formState,
  validation,
  uploadedIrbDocument,
  onIrbDocumentChange,
  referenceId
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onIrbDocumentChange(file, formState.irbProtocolExpiration || '');
  };

  const handleExpirationChange = ({ value }: { key: string; value: string }) => {
    onIrbDocumentChange(uploadedIrbDocument, value);
  };

  // Display filename from formState if available, otherwise from uploaded file
  const displayFileName = formState.irbDocumentName || uploadedIrbDocument?.name || '';

  // Ensure we have a proper date value for the form field
  const expirationDateValue = formState.irbProtocolExpiration || '';

  return (
    <div className='progress-report-step-card'>
      <h2>IRB Documentation</h2>

      <div className='progress-report-row'>
        {!readOnly && (
          <FormField
            id='irbDocument'
            type={FormFieldTypes.FILE}
            title='IRB Document'
            description='Upload your current IRB approval document'
            disabled={readOnly}
            onChange={({ key, value }: { key: string; value: File }) => {
              onIrbDocumentChange(value, formState.irbProtocolExpiration || '');
            }}
            validation={validation?.irbDocument}
          />
        )}

        {displayFileName && (
          <div style={{ padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginTop: readOnly ? '0' : '10px' }}>
            <strong>Current file:</strong> {displayFileName}
            {(referenceId && formState.irbDocumentLocation && formState.irbDocumentName) && (
              <div style={{ marginLeft: '10px', display: 'inline-block' }}>
                <DownloadLink
                  label="Download"
                  onDownload={() => {
                    DAR.downloadDARDocument(referenceId, 'irbDocument', formState.irbDocumentName);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <div className='progress-report-row'>
        {readOnly ? (
          formState.irbProtocolExpiration && (
            <div>
              <label style={{ fontWeight: 600, fontSize: '1.6rem', marginBottom: '0.5rem', display: 'block' }}>
                IRB Protocol Expiration Date
              </label>
              <span style={{ fontSize: '1.4rem' }}>
                {formState.irbProtocolExpiration}
              </span>
            </div>
          )
        ) : (
          <div>
            <label style={{ fontWeight: 600, fontSize: '1.6rem', marginBottom: '0.5rem', display: 'block' }}>
              IRB Protocol Expiration Date
            </label>
            <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '1rem' }}>
              When does your current IRB approval expire?
            </p>
            <DuosDatePicker
              inputFormat={'YYYY-MM-DD'}
              defaultValue={expirationDateValue}
              onChange={(value: string | null) => {
                handleExpirationChange({ key: 'irbProtocolExpiration', value: value || '' });
              }}
              onError={(_error: any, value: any) => {
                console.warn('IRB Date picker error:', _error, value);
              }}
              readOnly={readOnly}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default IrbDocumentUpload;
