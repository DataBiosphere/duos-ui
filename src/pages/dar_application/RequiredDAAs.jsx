import React from 'react';

export default function RequiredDAAs(props) {
  const { datasets, daas, daaDownload } = props;
  const fileNames = new Set();
  const daaDivs = datasets.map((dataset) => {
    const datasetDacId = dataset.dacId;
    if (!datasetDacId) {
      return <div key={dataset.id}></div>;
    }
    const daa = daas.find((daa) => daa.dacs?.some((d) => d.dacId === datasetDacId));
    const id = daa.daaId;
    const fileName = daa.file.fileName.split('.')[0];
    if (fileNames.has(fileName)) {
      return <div key={id-dataset.name}></div>;
    }
    fileNames.add(fileName);
    return (
      <div key={id}>
        {daaDownload(id, fileName)}
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
        <h3>By submitting this data access request and in accordance with your Institution’s issuance of Library Cards to you for the agreement(s) below.</h3>
        <div className="flex flex-row" style={{ justifyContent: 'flex-start' }}>
          {daaDivs}
        </div>
      </div>
    );
  }
}