import React from 'react';
import SortableTable from '../../components/SortableTable'

export default function ControlledAccessGrants() {
  
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
    <SortableTable />
  </div>;
}
