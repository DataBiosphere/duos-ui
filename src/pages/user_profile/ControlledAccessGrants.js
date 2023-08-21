import React from 'react';
import SortableTable from '../../components/SortableTable'

export default function ControlledAccessGrants() {

  const example = [
    {
      alias: 1,
      darCode: "darCode1",
      datasetName: "datasetName1",
      dacName: "dacName1",
      approvalDate: "approvalDate1",
      datasetIdentifier: "datasetIdentifier1"
    },
    {
      alias: 2,
      darCode: "darCode2",
      datasetName: "datasetName2",
      dacName: "dacName2",
      approvalDate: "approvalDate2",
      datasetIdentifier: "datasetIdentifier2"
    }
  ];

  const rows = [
    example.map((exampleRow, i) => (
      createData(exampleRow.darCode, exampleRow.approvalDate, exampleRow.datasetIdentifier, exampleRow.datasetName, exampleRow.dacName)
    ))
  ]

  const columns = ['DAR ID', "Approval Date", "Dataset ID", "Dataset Name", "Data Access Committee"];

  function createData(darCode, approvalDate, datasetIdentifier, datasetName, dacName) {
    return {darCode, approvalDate, datasetIdentifier, datasetName, dacName};
  }

  const rowNames = [{name: "DAR ID", sortable: false}, {name: "Approval Date", sortable: false}, {name: "Dataset ID", sortable: false}, {name: "Dataset Name", sortable: false}, {name: "Data Access Committee", sortable: false}]
  

  return <div>
    <h1
      style={{
        color: '#01549F',
        fontSize: '20px',
        fontWeight: '600',
      }}
    >
      Controlled Access Grants
    </h1>
    <p
      style={{
        color: '#000',
        fontSize: '16px',
        fontWeight: '400',
      }}
    >
      Your current dataset approvals
    </p>
    <div style={{ marginTop: '20px' }} />
    <SortableTable rows={example} rowNames={rowNames} />
  </div>;
}
