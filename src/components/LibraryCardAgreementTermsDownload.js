import LibraryCardAgreementLink from '../assets/Library_Card_Agreement_2021.pdf';
import DownloadIcon from 'react-material-icon-svg/dist/Download';
import {a, div} from "react-hyperscript-helpers";
import React from "react";

const downloadIcon = <DownloadIcon fill={'black'} style={{verticalAlign: 'middle'}}/>;
export const LibraryCardAgreementTermsDownload =
  div({}, [
    "I agree to the terms of the Library Card Agreement",
    a({
      id: 'link_downloadAgreement',
      href: LibraryCardAgreementLink,
      target: '_blank',
      style: {marginLeft: '.5rem'}
    }, [downloadIcon])]);
