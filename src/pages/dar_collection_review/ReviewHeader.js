import React from 'react';

const styles = {
  header: {
    fontWeight: 600,
    marginRight: '1rem'
  },
  default: {
    fontSize: '1.1rem',
    fontWeight: 400
  },
  darCode: {
    borderRight: '2px solid black',
    marginRight: '1rem',
    paddingRight: '1rem',
  },
  containerRow: {
    margin: '0rem 1.2rem',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
    marginLeft: '0px'
  },
  primaryHeaderRow: {
    fontSize: '2.1rem',
    marginBottom: '3.2rem'
  },
  projectTitle: {
    fontWeight: 'normal',
    fontSize: '2.5rem',
  },
  user: {
    fontWeight: 'normal',
    fontSize: '2rem'
  },
  secondaryHeaderRow: {
    fontSize: '3rem',
    fontWeight: 600,
  },
};

const appliedPrimaryHeaderStyle = Object.assign({}, styles.containerRow, styles.primaryHeaderRow);
const appliedSecondaryHeaderStyle =  Object.assign({}, styles.containerRow, styles.secondaryHeaderRow);

export default function ReviewHeader(props) {
  const {
    darCode,
    projectTitle,
    userName,
    institutionName,
    readOnly = false,
    isLoading
  } = props;
  return (
    <>
      {!isLoading && <div className="header-container" style={{ marginBottom: '3rem' }}>
        <div className="primary-header-row" style={appliedPrimaryHeaderStyle}>
          <span style={styles.header}>Data Access Request Review{readOnly ? ' (read-only)' : ''}</span>
        </div>
        <div className="secondary-header-row" style={appliedSecondaryHeaderStyle}>
          <p>{darCode}</p>
        </div>
        <div className="secondary-header-row" style={appliedSecondaryHeaderStyle}>
          <p className="collection-project-title" style={styles.projectTitle}>{projectTitle}</p>
        </div>
        <div className="secondary-header-row" style={appliedSecondaryHeaderStyle}>
          <p style={styles.user}>{`${userName}, ${institutionName}`}</p>
        </div>
      </div>}
      {isLoading && <div className="header-skeleton-loader">
        <div className="primary-header-skeleton" style={appliedPrimaryHeaderStyle}>
          <div className="text-placeholder" style={{ width: '35rem', height: '2.5rem', marginBottom: '0.5rem' }}></div>
        </div>
        <div className="secondary-header-skeleton" style={styles.containerRow}>
          <div className="text-placeholder" style={{ width: '15rem', height: '4rem', marginBottom: '0.5rem' }}></div>
          <div className="text-placeholder" style={{ width: '40rem', height: '4rem', marginBottom: '0.5rem' }}></div>
        </div>
        <div style={styles.containerRow}>
          <div className="text-placeholder" style={{ width: '16rem', height: '3rem', marginBottom: '3.5rem' }}></div>
        </div>
      </div>}
    </>
  );
}
