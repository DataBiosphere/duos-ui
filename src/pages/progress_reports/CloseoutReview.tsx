import React from 'react';
import InfoIcon from '@mui/icons-material/Info';
import {Acknowledgement} from 'src/types/model';

interface CloseoutReviewProps {
  acknowledgement?: Acknowledgement;
  onApprove?: () => void;
  onReturn?: () => void;
}

export const CloseoutReview: React.FC<CloseoutReviewProps> = ({
                                                                acknowledgement,
                                                                onApprove,
                                                                onReturn,
                                                              }) => {

  const approveButton =
      <button
          type="button"
          onClick={onApprove}
          style={{
            backgroundColor: '#4D72AA',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            minWidth: '136px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#3d5a8a';
          }}
          onFocus={(e) => {
            e.currentTarget.style.backgroundColor = '#3d5a8a';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#4D72AA';
          }}
          onBlur={(e) => {
            e.currentTarget.style.backgroundColor = '#4D72AA';
          }}>
        Approve closeout
      </button>;

  const approvedButton =
      (acknowledgement: Acknowledgement) => {
        let approvalDate = '';
        if (acknowledgement.lastAcknowledged) {
          approvalDate += new Date(acknowledgement.lastAcknowledged).toISOString().substring(0, 10);
        } else if (acknowledgement.firstAcknowledged) {
          approvalDate += new Date(acknowledgement.firstAcknowledged).toISOString().substring(0, 10);
        } else {
          approvalDate += 'unknown date';
        }
        return <button
            type='button' disabled={true}
            style={{
              backgroundColor: '#cccccc',
              color: 'black',
              border: '1px solid gray',
              borderRadius: '4px',
              padding: '10px 20px',
              cursor: 'default',
              minWidth: '136px'
            }}>
          Approved on {approvalDate}
        </button>
      }

  return (
      <div className="progress-report-step-card" style={{
        border: '1px solid #4D72AA',
        borderRadius: '4px',
        padding: '24px',
        marginTop: '20px'
      }}>
        <div style={{display: 'flex', alignItems: 'flex-start', gap: '16px'}}>
          <InfoIcon style={{
            color: '#4D72AA',
            fontSize: '24px',
            flexShrink: 0
          }}/>

          <div style={{flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'}}>
            <div style={{flex: 1}}>
              <p style={{
                margin: 0,
                color: '#333F52',
                fontSize: '14px',
                lineHeight: '1.4',
                fontWeight: 'bold'
              }}>
                Please note:
              </p>
              <p style={{
                margin: '4px 0 0 0',
                color: '#333F52',
                fontSize: '14px',
                lineHeight: '1.4'
              }}>
                If there are issues with the content in this closeout report, please contact the researcher.
              </p>
            </div>

            <div style={{display: 'flex', gap: '12px', marginLeft: '16px'}}>
              {/* If there is a closeout acknowledgement, show the approved button with the approved date */}
              {acknowledgement ? approvedButton(acknowledgement) : approveButton}

              <button
                  type="button"
                  onClick={onReturn}
                  style={{
                    backgroundColor: 'white',
                    color: '#4D72AA',
                    border: '1px solid #4D72AA',
                    borderRadius: '4px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    minWidth: '183px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f7fa';
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f7fa';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                  }}
              >
                Go to DAR Requests
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};
