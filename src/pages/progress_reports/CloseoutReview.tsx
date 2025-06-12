import React from 'react';

interface CloseoutReviewProps {
    onApprove?: () => void;
    onReturn?: () => void;
}

export const CloseoutReview: React.FC<CloseoutReviewProps> = ({
    onApprove,
    onReturn,
}) => {
    return (
        <div className="progress-report-step-card" style={{
            border: '1px solid #4D72AA',
            borderRadius: '4px',
            padding: '24px',
            marginTop: '20px'
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                {/* Information Icon */}
                <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#4D72AA',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                    marginTop: '0px'
                }}>
                    i
                </div>
                
                {/* Content */}
                <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1 }}>
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
                    
                    <div style={{ display: 'flex', gap: '12px', marginLeft: '16px' }}>
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
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = '#4D72AA';
                            }}
                        >
                            Approve closeout
                        </button>
                        
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
                            onMouseOut={(e) => {
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