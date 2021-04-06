import { a, span } from 'react-hyperscript-helpers';
import LibraryCardAgreementLink from '../assets/Library_Card_Agreement_2021.pdf';

export const LibraryCardAgreement =
  a({
    id: 'link_downloadAgreement',
    href: LibraryCardAgreementLink,
    target: '_blank',
    className: 'btn-secondary btn-download-pdf hover-color',
    style: {paddingBottom: '1rem'},
  }, [
    span({className: 'glyphicon glyphicon-download'}),
    'DUOS Library Card Agreement']);