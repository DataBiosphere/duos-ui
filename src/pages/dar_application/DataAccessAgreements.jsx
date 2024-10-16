import React, { useEffect, useState } from 'react';
import {isNil} from 'lodash/fp';
import { Notifications } from '../../libs/utils';
import { DAA } from '../../libs/ajax/DAA';
import RequiredDAAs from './RequiredDAAs';

import './dar_application.css';

export default function DataAccessAgreements(props) {

  const {
    save,
    attest,
    darCode,
    isAttested,
    cancelAttest,
    datasets
  } = props;
  const [daas, setDaas] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        const daaList = await DAA.getDaas();
        setDaas(daaList);
      } catch (error) {
        Notifications.showError({
          text: 'Error: Unable to retrieve DAAs from server',
        });
      }
    };
    init();
  }, []);

  const DAADownload = (id, fileName) => {
    return (
      <div className="flex flex-row" style={{ justifyContent: 'flex-start' }}>
        <div>
          <a target="_blank" rel="noreferrer" onClick={() => DAA.getDaaFileById(id, fileName)} className="button button-white" style={{ marginRight: '2rem' }}>
            <span className="glyphicon glyphicon-download"></span>
            {' '}
            {fileName}
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="dar-step-card">
      <h2>Data Access Agreements (DAA)</h2>

      <div className="form-group">
        <h3>DUOS Code of Conduct</h3>

        <p className="data-use-paragraph">
          Failure to abide by any term within this Code of Conduct may result in revocation of approved access to datasets obtained through these repositories. Investigators who are approved to access data agree to:
        </p>

        <ol className="data-use-list">
          <li>Use datasets solely in connection with the research project described in the approved Data Access Request for each dataset;</li>
          <li>Make no attempt to identify or contact individual participants or groups from whom data were collected, or generate information that could allow participants’ identities to be readily ascertained, without appropriate approvals from the submitting institution;</li>
          <li>Maintain the confidentiality of the data and not distribute them to any entity or individual beyond those specified in the approved Data Access Request;</li>
          <li>Adhere to the security best practices for controlled-access data subject to the genomic data sharing policy/policies listed below and ensure that only approved users can gain access to data files;</li>
          <li>Acknowledge the Intellectual property terms as specified in the Data Access Agreements and data use certification;</li>
          <li>Provide appropriate acknowledgement in any dissemination of research findings including the investigator(s) who generated the data, the funding source, accession numbers of the dataset, and the data repository from which the data were accessed; and,</li>
          <li>Report any inadvertent data release, break of data security, or other data management incidents in accordance with the terms specified in the Data Use Agreements below and data use certification.</li>
        </ol>
      </div>

      <RequiredDAAs datasets={datasets} daas={daas} daaDownload={DAADownload}/>

      <div className="flex flex-row" style={{ justifyContent: 'around', paddingTop: '4rem' }}>
        <div className="flex flex-row" style={{ justifyContent: 'flex-start' }}>
          {isNil(darCode) && <a id="btn_attest" onClick={attest} className="button button-blue" disabled={isAttested} style={{ marginRight: '2rem' }}>
            Attest
          </a>}
          {isNil(darCode) && <a id="btn_saveDar" onClick={save} className="button button-white" disabled={isAttested}>
            Save
          </a>}
        </div>
        {isNil(darCode) && isAttested && <a id="btn_cancelAttest" onClick={cancelAttest} style={{ float: 'right' }} className="button button-white">
          Cancel
        </a>}
      </div>
    </div>
  );
}
