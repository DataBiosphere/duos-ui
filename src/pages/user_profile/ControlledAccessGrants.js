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
      darCode: 'darCode2',
      datasetName: "datasetName2",
      dacName: "dacName2",
      approvalDate: "approvalDate2",
      datasetIdentifier: "datasetIdentifier2"
    }
  ];

  function createRows() {
    const rows = []
    example.map((exampleRow) => (
      rows.push(createData(exampleRow.darCode, exampleRow.approvalDate, exampleRow.datasetIdentifier, exampleRow.datasetName, exampleRow.dacName))
    ))
    return rows
  }

  function createData(darCode, approvalDate, datasetIdentifier, datasetName, dacName) {
    return {
      darCode,
      approvalDate,
      datasetIdentifier,
      datasetName,
      dacName
    };
  }

  useEffect(() => {
    const init = async () => {
      try {
        const res = await User.getApprovedDatasets();
        setExample(res)
      } catch (error) {
        Notifications.showError({ text: 'Error: Unable to retrieve user data from server' });
      }
    };

    init();
  });

  const headCells = [
    {
      id: 'darCode',
      numeric: false,
      disablePadding: false,
      label: 'DAR Code',
    },
    {
      id: 'approvalDate',
      numeric: true,
      disablePadding: false,
      label: 'Approval Date',
    },
    {
      id: 'datasetIdentifier',
      numeric: true,
      disablePadding: false,
      label: 'Dataset Identifier',
    },
    {
      id: 'datasetName',
      numeric: true,
      disablePadding: false,
      label: 'Dataset Name',
    },
    {
      id: 'dacName',
      numeric: true,
      disablePadding: false,
      label: 'DAC Name',
    },
  ];



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
