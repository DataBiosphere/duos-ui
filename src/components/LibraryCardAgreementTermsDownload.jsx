import React from 'react';
import LibraryCardAgreementLink from '../assets/Library_Card_Agreement_2023_ApplicationVersion.pdf';
import { Download } from '@mui/icons-material';
import {
  NIHDataUseCertificationAgreement
} from '../../src/components/external_docs/NIHDataUseCertificationAgreement';

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
      <Download sx={{ verticalAlign: 'middle', fontSize: '24px' }}/>
    </a>
    <div style={{marinTop:'.5rem'}}>
    <NIHDataUseCertificationAgreement/>
    </div>
  </div>
);
