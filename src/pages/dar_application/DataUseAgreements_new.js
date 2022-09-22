
import { a, div, h2, h3, span, li, ol, p} from 'react-hyperscript-helpers';
import {isNil} from 'lodash/fp';
import LibraryCardAgreementLink from '../../assets/Library_Card_Agreement_2021.pdf';

import './dar_application_new.css';

export default function DataUseAgreements(props) {

  const {
    save,
    attestAndSend,
    darCode,
  } = props;

  return (
    div({
      className: 'dar-step-card'
    }, [

      h2({}, ['Step 4: Attestation and Agreement(s)']),

      div({ className: 'form-group' }, [
        h3({}, [
          'DUOS Library Card Data Access Agreement and Attestation'
        ]),

        p({
          className: 'data-use-paragraph',
        }, [
          'Under the National Institutes of Health (NIH) Genomic Data Sharing Policy, the Genomic Data User Code of Conduct sets forth principles for responsible management and use of large-scale genomic data and associated phenotypic data accessed through controlled access to NIH-designated data repositories (e.g., the database of Genotypes and Phenotypes (dbGaP), repositories established as NIH Trusted Partners). Failure to abide by any term within this Code of Conduct may result in revocation of approved access to datasets obtained through these repositories. Investigators who are approved to access data agree to:'
        ]),

        ol({ className: 'data-use-list' }, [
          li({}, ['Use datasets solely in connection with the research project described in the approved Data Access Request for each dataset; ']),
          li({}, ['Make no attempt to identify or contact individual participants or groups from whom data were collected, or generate information that could allow participants’ identities to be readily ascertained, without appropriate approvals from the submitting institutions;']),
          li({}, ['Maintain the confidentiality of the data and not distribute them to any entity or individual beyond those specified in the approved Data Access Request;']),
          li({}, ['Adhere to the NIH Security Best Practices for Controlled-Access Data Subject to the NIH Genomic Data Sharing Policy and ensure that only approved users can gain access to data files;']),
          li({}, ['Acknowledge the Intellectual Property terms as specified in the Library Card Agreement; ']),
          li({}, ['Provide appropriate acknowledgement in any dissemination of research findings including the investigator(s) who generated the data, the funding source, accession numbers of the dataset, and the data repository from which the data were accessed; and,']),
          li({}, [
            'Report any inadvertent data release, breach of data security, or other data management incidents in accordance with the terms specified in the ', a({target: '_blank', href: LibraryCardAgreementLink}, ['Library Card Agreement']), ' and ', a({target: '_blank', href: ''}, ['NIH Data Use Certification.'])]),
        ])
      ]),

      h3({}, [
        'By submitting this data access request, you agree to all terms in the agreement(s) listed below.'
      ]),

      div({ className: 'flex flex-row', style: { justifyContent: 'flex-start', }, }, [
        div({}, [
          a({ target: '_blank', href: LibraryCardAgreementLink, className: 'button button-white', style: { marginRight: '2rem', }, }, [
            span({className: 'glyphicon glyphicon-download'}),
            ' Broad Library Card Agreement'
          ])
        ]),
        div({}, [
          a({ target: '_blank', href: '', className: 'button button-white' }, [
            span({className: 'glyphicon glyphicon-download'}),
            ' NIH Library Card Agreement'
          ])
        ])
      ]),


      div({ className: 'flex flex-row', style: { justifyContent: 'flex-end', }, }, [
        a({
          id: 'btn_save', isRendered: isNil(darCode), onClick: save(),
          className: 'button button-white'
        }, ['Save']),
        a({
          id: 'btn_submit', isRendered: isNil(darCode), onClick: attestAndSend(),
          className: 'button button-blue '
        }, ['Attest and Send']),
      ])
    ])
  );
}
