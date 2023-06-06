
import { a, div, h2, h3, span, li, ol, p } from 'react-hyperscript-helpers';
import {isNil} from 'lodash/fp';
import BroadLibraryCardAgreementLink from '../../assets/Library_Card_Agreement_2023_ApplicationVersion.pdf';
import NhgriLibraryCardAgreementLink from '../../assets/NIH_Library_Card_Agreement_11_17_22_version.pdf';
import ModelDucLink from '../../assets/Model_DUC.pdf';

import './dar_application.css';

export default function DataUseAgreements(props) {

  const {
    save,
    attest,
    darCode,
    isAttested,
    cancelAttest,
  } = props;

  return (
    div({
      className: 'dar-step-card'
    }, [

      h2({}, ['Data Use Agreements']),

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
            'Report any inadvertent data release, breach of data security, or other data management incidents in accordance with the terms specified in the ', a({target: '_blank', href: BroadLibraryCardAgreementLink}, ['Library Card Agreement']), ' and ', a({target: '_blank', href: ModelDucLink}, ['NIH Data Use Certification.'])]),
        ])
      ]),

      h3({}, [
        'By submitting this data access request, you agree to all terms in the agreement(s) listed below.'
      ]),

      div({ className: 'flex flex-row', style: { justifyContent: 'flex-start', }, }, [
        div({}, [
          a({ target: '_blank', href: BroadLibraryCardAgreementLink, className: 'button button-white', style: { marginRight: '2rem', }, }, [
            span({className: 'glyphicon glyphicon-download'}),
            ' Broad Library Card Agreement'
          ])
        ]),
        div({}, [
          a({ target: '_blank', href: NhgriLibraryCardAgreementLink, className: 'button button-white' }, [
            span({className: 'glyphicon glyphicon-download'}),
            ' NHGRI Library Card Agreement'
          ])
        ])
      ]),


      div({ className: 'flex flex-row', style: { justifyContent: 'around', paddingTop: '4rem' } }, [
        div({ className: 'flex flex-row', style: { justifyContent: 'flex-start' }, }, [
          a({
            id: 'btn_attest', isRendered: isNil(darCode), onClick: () => attest(),
            className: 'button button-blue',
            disabled: isAttested,
            style: {
              marginRight: '2rem',
            }
          }, ['Attest']),
          a({
            id: 'btn_saveDar', isRendered: isNil(darCode), onClick: () => save(),
            className: 'button button-white',
            disabled: isAttested,
          }, ['Save']),

        ]),
        a({
          id: 'btn_cancelAttest', isRendered: isNil(darCode) && isAttested, onClick: () => cancelAttest(),
          style: { 'float': 'right' }, className: 'button button-white',
        }, ['Cancel']),
      ])

    ])
  );
}
