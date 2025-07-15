import {Styles} from 'src/libs/theme';
import ReactTooltip from 'react-tooltip';
import React from 'react';
import {Institution} from 'src/types/model';

export const tableHeaderTemplate = (
    <>
      <div style={Styles.TABLE.ID_CELL}>ID</div>
      <div style={Styles.TABLE.INSTITUTION_CELL}>Institution</div>
      <div style={Styles.TABLE.DATA_ID_CELL}>Domains</div>
      <div style={Styles.TABLE.INSTITUTION_CELL}>Signing Officials</div>
      <div style={Styles.TABLE.DATA_ID_CELL}>Update User</div>
      <div style={Styles.TABLE.SUBMISSION_DATE_CELL}>Updated On</div>
    </>
);

const loadingMarginOverwrite = {margin: '1rem 2%'};

export const tableRowLoadingTemplate = (
    <>
      <div style={{...Styles.TABLE.ID_CELL, ...loadingMarginOverwrite}} className="text-placeholder"/>
      <div style={{...Styles.TABLE.INSTITUTION_CELL, ...loadingMarginOverwrite}} className="text-placeholder"/>
      <div style={{...Styles.TABLE.INSTITUTION_CELL, ...loadingMarginOverwrite}} className="text-placeholder"/>
      <div style={{...Styles.TABLE.DATA_ID_CELL, ...loadingMarginOverwrite}} className="text-placeholder"/>
      <div style={{...Styles.TABLE.SUBMISSION_DATE_CELL, ...loadingMarginOverwrite}} className="text-placeholder"/>
      <div style={{...Styles.TABLE.DATA_ID_CELL, ...loadingMarginOverwrite}} className="text-placeholder"/>
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
    ...Styles.TABLE.HEADER_ROW,
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
    cellStyle: {width: '10%'},
    cellDataFn: (row: Institution) => row.id,
    sortable: true
  },
  name: {
    label: 'Institution',
    cellStyle: {width: '25%'},
    cellDataFn: (row: Institution) => {
      return <a style={{overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'}} onClick={() => {
        // TODO: This needs to be replaced with a proper navigation to the institution edit page
        console.log(row.id);
      }}>{row.name}</a>
    },
    sortable: true
  },
  domains: {
    label: 'Domains',
    cellStyle: {width: '10%'},
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
    cellStyle: {width: '25%'},
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
    cellStyle: {width: '15%'},
    cellDataFn: (row: Institution) => {
      const user = row.updateUser || row.createUser;
      return user ? user.displayName : '- -';
    },
    sortable: true
  },
  updateDate: {
    label: 'Updated On',
    cellStyle: {width: '15%'},
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
