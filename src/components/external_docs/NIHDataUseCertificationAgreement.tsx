import React from 'react'

export const NIHDataUseCertificationAgreementLink = 'https://sharing.nih.gov/accessing-data/accessing-genomic-data/using-genomic-data-responsibly/nih-data-use-certification-agreement'

export type NIHDataUseCertificationAgreementProps = {
  className: string | undefined
  showDownloadIcon: boolean | undefined
}
export const NIHDataUseCertificationAgreement = (props: NIHDataUseCertificationAgreementProps) => {
  const { className, showDownloadIcon } = props
  return (
    <a
      href={NIHDataUseCertificationAgreementLink}
      target="_blank"
      rel="noreferrer"
      className={className ?? className}
    >
      {showDownloadIcon && (<span className="glyphicon glyphicon-download" />)}
      {' '}
      NIH Data Use Certification Agreement
    </a>
  )
}
