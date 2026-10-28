import React from 'react'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import { inlineIconSx } from 'src/libs/inlineIcon'

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
      {showDownloadIcon && (<FileDownloadOutlinedIcon sx={inlineIconSx} />)}
      {' '}
      NIH Data Use Certification Agreement
    </a>
  )
}
