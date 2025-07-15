import ReactTooltip from 'react-tooltip';
import React from 'react';
import {Institution} from 'src/types/model';
import {Link} from 'react-router-dom';

const columnWidths = {
  id: '10%',
  name: '25%',
  domains: '15%',
  signingOfficials: '25%',
  updateUser: '15%',
  updateDate: '10%'
}

const baseTemplateStyle = {
  margin: '1rem 2%'
}

export const tableHeaderTemplate = (
    <>
      <div style={{...baseTemplateStyle, ...{width: columnWidths.id}}}>ID</div>
      <div style={{...baseTemplateStyle, ...{width: columnWidths.name}}}>Institution</div>
      <div style={{...baseTemplateStyle, ...{width: columnWidths.domains}}}>Domains</div>
      <div style={{...baseTemplateStyle, ...{width: columnWidths.signingOfficials}}}>Signing Officials</div>
      <div style={{...baseTemplateStyle, ...{width: columnWidths.updateUser}}}>Update User</div>
      <div style={{...baseTemplateStyle, ...{width: columnWidths.updateDate}}}>Updated On</div>
    </>
);

export const tableRowLoadingTemplate = (
    <>
      <div style={{...baseTemplateStyle, ...{width: columnWidths.id}}} className="text-placeholder"/>
      <div style={{...baseTemplateStyle, ...{width: columnWidths.name}}} className="text-placeholder"/>
      <div style={{...baseTemplateStyle, ...{width: columnWidths.domains}}} className="text-placeholder"/>
      <div style={{...baseTemplateStyle, ...{width: columnWidths.signingOfficials}}} className="text-placeholder"/>
      <div style={{...baseTemplateStyle, ...{width: columnWidths.updateUser}}} className="text-placeholder"/>
      <div style={{...baseTemplateStyle, ...{width: columnWidths.updateDate}}} className="text-placeholder"/>
    </>
);

export const tableStyles = {
  baseStyle: {
    fontSize: '1.5rem',
    display: 'flex',
    padding: '1rem 2%',
    backgroundColor: 'white',
    border: '1px solid #DEDEDE',
    margin: '0.5% 0'
  },
  columnStyle: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem',
    color: '#7B7B7B',
    fontSize: '1.6rem',
    fontWeight: 'bold',
    letterSpacing: '0.2px',
    textTransform: 'uppercase',
    backgroundColor: 'B8CDD3',
    border: 'none'
  },
};

interface ColumnConfig {
  [key: string]: ColumnConfigCell;
}

interface ColumnConfigCell {
  label: string;
  cellStyle: React.CSSProperties;
  cellDataFn: (row: Institution) => React.ReactNode;
  sortable?: boolean;
}

export const columnConfig: ColumnConfig = {
  id: {
    label: 'ID',
    cellStyle: {width: columnWidths.id},
    cellDataFn: (row: Institution) => row.id,
    sortable: true
  },
  name: {
    label: 'Institution',
    cellStyle: {width: columnWidths.name},
    cellDataFn: (row: Institution) => {
      return <Link
          to={{pathname: `/admin_manage_institutions/${row.id}`}}
          style={{
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            textDecoration: 'none',
            color: '#1f75b6',
            cursor: 'pointer'
          }}
      >
        {row.name}
      </Link>
    },
    sortable: true
  },
  domains: {
    label: 'Domains',
    cellStyle: {width: columnWidths.domains},
    cellDataFn: (row: Institution) => {
      if (row.domains) {
        return row.domains.join(', ');
      } else {
        return '- -';
      }
    },
    sortable: true
  },
  signingOfficials: {
    label: 'Signing Officials',
    cellStyle: {width: columnWidths.signingOfficials},
    cellDataFn: (row: Institution) => {
      if (row.signingOfficials && row.signingOfficials.length > 0) {
        const fullNames = row.signingOfficials.map((user) => `${user.displayName} (${user.email})`).join(', ');
        if (fullNames.length > 40) {
          return <div>
            <span data-tip data-for={`signing-officials-tooltip-${row.id}`} className='tooltip-text'>
              {fullNames.slice(0, 40)}...
            </span>
            <ReactTooltip
                place='right'
                effect='solid'
                id={`signing-officials-tooltip-${row.id}`}
            >
              <span>
                <ul>
                  {row.signingOfficials.map((user) => {
                    return <li key={user.email}>
                      {user.displayName} ({user.email})
                    </li>
                  })}
                </ul>
              </span>
            </ReactTooltip>
          </div>
        } else {
          return fullNames;
        }
      } else {
        return '- -';
      }
    },
    sortable: false
  },
  updateUser: {
    label: 'Updated By',
    cellStyle: {width: columnWidths.updateUser},
    cellDataFn: (row: Institution) => {
      const user = row.updateUser || row.createUser;
      return user ? user.displayName : '- -';
    },
    sortable: true
  },
  updateDate: {
    label: 'Updated On',
    cellStyle: {width: columnWidths.updateDate},
    cellDataFn: (row: Institution) => {
      if (row.updateDate) {
        return row.updateDate;
      } else {
        return row.createDate;
      }
    },
    sortable: true
  }
};

export interface CellData {
  data: React.ReactNode;
  id: number;
  cellStyle: React.CSSProperties;
  label: string;
}

export const processRowData = (row: Institution) => {
  const rowData: CellData[] = [];
  Object.keys(columnConfig).forEach((col) => {
    const {cellDataFn, cellStyle, label} = columnConfig[col];
    rowData.push({
      data: cellDataFn(row),
      id: row.id,
      cellStyle: cellStyle,
      label: label
    } as CellData);
  });
  return rowData;
}
