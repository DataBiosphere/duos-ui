import React from 'react';
import BroadLibraryCardAgreementLink from 'src/assets/Library_Card_Agreement_2023_ApplicationVersion.pdf';
import NihLibraryCardAgreementLink from 'src/assets/NIHLibraryCardAgreement06252025.pdf';

import './dar_application.css';
import {
  NIHDataUseCertificationAgreement,
  NIHDataUseCertificationAgreementLink
} from 'src/components/external_docs/NIHDataUseCertificationAgreement.js';

export interface DataUseAgreementsProps {
  save: () => void;
  attest: () => void;
  isDraft: boolean;
  isAttested: boolean;
  cancelAttest: () => void;
}

export const DataUseAgreements: React.FC<DataUseAgreementsProps> = (props: DataUseAgreementsProps) => {
  const {
    save,
    attest,
    isDraft,
    isAttested,
    cancelAttest,
  } = props;

  return (
      <div className='dar-step-card' data-cy='data-use-agreements'>
        <h2>Data Use Agreements</h2>

        <div className='form-group'>
          <h3>DUOS Code of Conduct</h3>

          <p className='data-use-paragraph'>
            Failure to abide by any term within this Code of Conduct may result in revocation of approved access to
            datasets obtained through these repositories. Investigators who are approved to access data agree to:
          </p>

          <ol className='data-use-list'>
            <li>Use datasets solely in connection with the research project described in the approved Data Access
              Request for each dataset;
            </li>
            <li>Make no attempt to identify or contact individual participants or groups from whom data were collected,
              or generate information that could allow participants’ identities to be readily ascertained, without
              appropriate approvals from the submitting institutions;
            </li>
            <li>Maintain the confidentiality of the data and not distribute them to any entity or individual beyond
              those specified in the approved Data Access Request;
            </li>
            <li>Adhere to the NIH Security Best Practices for Controlled-Access Data Subject to the NIH Genomic Data
              Sharing Policy and ensure that only approved users can gain access to data files;
            </li>
            <li>Acknowledge the Intellectual Property terms as specified in the Library Card Agreement;</li>
            <li>Provide appropriate acknowledgement in any dissemination of research findings including the
              investigator(s) who generated the data, the funding source, accession numbers of the dataset, and the data
              repository from which the data were accessed; and,
            </li>
            <li>Report any inadvertent data release, breach of data security, or other data management incidents in
              accordance with the terms specified in the <a target='_blank' rel='noreferrer'
                                                            href={BroadLibraryCardAgreementLink}>Library Card
                Agreement</a> and <a target='_blank' rel='noreferrer' href={NIHDataUseCertificationAgreementLink}>NIH
                Data Use Certification</a>.
            </li>
          </ol>
        </div>

        <div>
          By submitting this DAR you agree to all terms in the agreement(s) below, and you attest you are a permanent
          employee of your institution at a level equivalent to, at a minimum, a tenure-track professor or senior
          researcher. This does <span style={{fontWeight: 600}}>not</span> include lab technicians or trainees, e.g.,
          post-docs or graduate students. All DARs submitted and approved in DUOS are valid for 12 months. Researchers
          may submit a Progress Report to extend their access if necessary.
        </div>

        <div className='flex flex-row' style={{justifyContent: 'left', marginTop: '3rem'}}>
          <div data-cy='broad-library-card'>
            <a target='_blank' rel='noreferrer' href={BroadLibraryCardAgreementLink} className='button button-white'
               style={{marginRight: '2rem'}}>
              <span className='glyphicon glyphicon-download'></span>
              {' '}
              Broad Library Card Agreement
            </a>
          </div>
          <div data-cy='nih-library-card'>
            <a target='_blank' rel='noreferrer' href={NihLibraryCardAgreementLink} className='button button-white'>
              <span className='glyphicon glyphicon-download'></span>
              {' '}
              NIH Library Card Agreement
            </a>
          </div>
        </div>
        <div data-cy='nih-certification-agreement' className='flex flex-row' style={{justifyContent: 'left', marginTop: '3rem'}}>
          <NIHDataUseCertificationAgreement className={'button button-white'} showDownloadIcon={true}/>
        </div>

        <div className="flex flex-row" style={{justifyContent: 'around', paddingTop: '4rem'}}>
          <div className="flex flex-row" style={{justifyContent: 'flex-start'}}>
            {isDraft &&
              <button id="btn_attest"
                      type="button"
                      data-cy={'attest-button'}
                      onClick={attest}
                      className="button button-blue"
                      style={{marginRight: '2rem'}}>
                Attest
              </button>}
            {isDraft &&
              <button id="btn_saveDar"
                      type="button"
                      data-cy={'save-button'}
                      onClick={save}
                      className="button button-white">
                Save
              </button>}
          </div>
          {isDraft && isAttested &&
            <button id="btn_cancelAttest"
                    type="button"
                    data-cy={'cancel-button'}
                    onClick={cancelAttest}
                    style={{float: 'right'}}
                    className="button button-white">
              Cancel
            </button>}
        </div>
      </div>
  );
};
