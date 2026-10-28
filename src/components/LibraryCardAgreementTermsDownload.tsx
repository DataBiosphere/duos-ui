import React from 'react'
import {
  NIHDataUseCertificationAgreement,
} from 'src/components/external_docs/NIHDataUseCertificationAgreement'
import NihLibraryCardAgreementLink
  from 'src/assets/NIHLibraryCardAgreement06252025.pdf'
import BroadLibraryCardAgreementLink
  from 'src/assets/Library_Card_Agreement_2023_ApplicationVersion.pdf'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import { inlineIconSx } from 'src/libs/inlineIcon'

export const LibraryCardAgreementTermsDownload = () => (
  <div>
    <div style={{ marginBottom: '25px' }}>
      <a target="_blank" rel="noreferrer" href={BroadLibraryCardAgreementLink} className="button button-white">
        <FileDownloadOutlinedIcon sx={inlineIconSx} />
        {' '}
        Broad Library Card Agreement
      </a>
    </div>
    <div style={{ marginBottom: '25px' }}>
      <a target="_blank" rel="noreferrer" href={NihLibraryCardAgreementLink} className="button button-white">
        <FileDownloadOutlinedIcon sx={inlineIconSx} />
        {' '}
        NIH Library Card Agreement
      </a>
    </div>
    <div style={{ marginBottom: '25px' }}>
      <NIHDataUseCertificationAgreement showDownloadIcon={true} className="button button-white" />
    </div>
  </div>
)
