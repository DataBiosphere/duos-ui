import React, { useEffect, useState } from 'react';
import {isNil} from 'lodash/fp';
import BroadLibraryCardAgreementLink from '../../assets/Library_Card_Agreement_2023_ApplicationVersion.pdf';
import NhgriLibraryCardAgreementLink from '../../assets/NIH_Library_Card_Agreement_11_17_22_version.pdf';
import { Notifications } from '../../libs/utils';
import { DAA } from '../../libs/ajax/DAA';

import './dar_application.css';

export default function DataUseAgreements(props) {

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

  const RequiredDAAs = () => {
    const fileNames = new Set();
    const daaDivs = datasets.map((dataset) => {
      const datasetDacId = dataset.dacId;
      if (!datasetDacId) {
        return <div key={dataset.id}></div>;
      }
      const daa = daas.find((daa) => daa.dacs.some((d) => d.dacId === datasetDacId));
      const id = daa.daaId;
      const fileName = daa.file.fileName.split('.')[0];
      if (fileNames.has(fileName)) {
        return <div key={id-dataset.name}></div>;
      }
      fileNames.add(fileName);
      return (
        <div key={id}>
          {DAADownload(id, fileName)}
        </div>
      );
    });
    if (fileNames.size === 0) {
      return (
        <div></div>
      );
    } else {
      return (
        <div>
          <h3>By submitting this data access request and in accordance with your Institution’s issuance of Library Cards to you for the agreement(s) below,</h3>
          <div className="flex flex-row" style={{ justifyContent: 'flex-start' }}>
            {daaDivs}
          </div>
        </div>
      );
    }
  };

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
      <h2>Data Use Agreements</h2>

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

      {/* {fileNames.size !== 0 && (
        <>
          <h3>By submitting this data access request and in accordance with your Institution’s issuance of Library Cards to you for the agreement(s) below,</h3>
          <RequiredDAAs/>
        </>
      )} */}
      <RequiredDAAs/>

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
