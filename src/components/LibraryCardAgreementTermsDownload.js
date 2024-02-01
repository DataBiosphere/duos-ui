import React from 'react';
import LibraryCardAgreementLink from '../assets/Library_Card_Agreement_2023_ApplicationVersion.pdf';
import DownloadIcon from 'react-material-icon-svg/dist/Download';

export const LibraryCardAgreementTermsDownload = () => (
  <div>
    I agree to the terms of the Library Card Agreement
    <a
      id="link_downloadAgreement"
      href={LibraryCardAgreementLink}
      target="_blank"
      rel="noreferrer"
      style={{marginLeft: '.5rem'}}
    >
      <DownloadIcon fill={'black'} style={{verticalAlign: 'middle', height: '24px'}}/>
    </a>
  </div>
);
