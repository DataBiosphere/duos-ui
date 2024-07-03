import React from 'react';
import { DAA } from '../../libs/ajax/DAA';

export default function LibraryCard(props) {

  const {
    issuedOn,
    issuedBy,
    daas
  } = props;

  const DAADownload = (id, fileName) => {
    return (
      <div className="flex flex-row" style={{ justifyContent: 'flex-start', marginBottom: '30px'}}>
        <div>
          <a target="_blank" rel="noreferrer" onClick={() => DAA.getDaaFileById(id, fileName)} className="button button-white" style={{ marginRight: '2rem'}}>
            <span className="glyphicon glyphicon-download"></span>
            {' '}
            {fileName}
          </a>
        </div>
      </div>
    );
  };

  const daaDivs = daas.map((daa) => {
    const id = daa.daaId;
    const fileName = daa.file.fileName.split('.')[0];
    return (
      <div key={id}>
        {DAADownload(id, fileName)}
      </div>
    );
  });

  return <div style={{ display: 'flex' }}>
    <div style={{display: 'flex', flexDirection: 'column'}}>
      {daaDivs}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <p style={{ margin: '0px 0px 0px 10px' }}>Issued on: {issuedOn}</p>
      <p style={{ margin: '0px 0px 0px 10px' }}>Issued by: {issuedBy}</p>
    </div>
  </div>;
}