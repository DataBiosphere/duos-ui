import React, { useState, useEffect } from 'react';
import SortableTable from '../../components/SortableTable';
import { User } from '../../libs/ajax';
import { Notifications } from '../../libs/utils';

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

function createData(darCode, approvalDate, datasetIdentifier, datasetName, dacName) {
  return {
    darCode,
    approvalDate,
    datasetIdentifier,
    datasetName,
    dacName
  };
}

function createRows(userRows) {
  return userRows.map((exampleRow) => createData(
    exampleRow.darCode,
    exampleRow.approvalDate,
    exampleRow.datasetIdentifier,
    exampleRow.datasetName,
    exampleRow.dacName
  ));
}

export default function ControlledAccessGrants() {

  const [rows, setRows] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        const userRows = await User.getApprovedDatasets();
        setRows(createRows(userRows));
      } catch (error) {
        Notifications.showError({ text: 'Error: Unable to retrieve user data from server' });
      }
    };
    init();
  }, []);

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
    <SortableTable rows={rows} headCells={headCells} />
  </div>;
}
