import * as React from 'react';
import {Box} from '@mui/material';
import {isEmpty} from 'lodash';
import {DatasetTerm} from 'src/types/model';
import SimpleTable from '../SimpleTable';
import {Styles} from '../../libs/theme';
import {
  DatasetSearchTableTab,
} from './DatasetSearchTableConstants';
import {SnapshotSummaryModel} from "src/types/tdrModel";

const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.4rem',
    fontWeight: 400,
    display: 'flex',
    padding: '1rem 2%',
    justifyContent: 'space-between',
    alignItems: 'center',
    whiteSpace: 'pre-wrap',
    backgroundColor: 'white',
    border: '1px solid #DEDEDE',
    borderRadius: '4px',
    textOverflow: 'ellipsis',
    height: '4rem',
    marginTop: 5,
  },
  columnStyle: Object.assign({}, Styles.TABLE.HEADER_ROW, {
    justifyContent: 'space-between',
    fontFamily: 'Montserrat',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    letterSpacing: '0.2px',
    backgroundColor: '#E2E8F4',
    border: 'none',
    textTransform: 'uppercase',
    lineHeight: '16px',
  }),
  containerOverride: {}
};


interface DatasetSearchTableDisplayProps{
  onSelect: (newSelectedIds: number[]) => void;
  filteredData: DatasetTerm[];
  selected: number[];
  exportableDatasets: { [duosId: string]: SnapshotSummaryModel[] }
  tab: DatasetSearchTableTab<DatasetTerm | DatasetTerm[]>
}

export const DatasetSearchTableDisplay = (props: DatasetSearchTableDisplayProps) => {
  const { onSelect, exportableDatasets, filteredData, selected, tab } = props;
  const headers = tab.makeHeaders(filteredData, selected, onSelect, exportableDatasets);
  const rowData = tab.makeRows(filteredData, headers);

  return isEmpty(filteredData) ? (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <h1>There are no datasets that fit these criteria.</h1>
    </Box>
  )
    : (
      <SimpleTable
        rowData={rowData}
        columnHeaders={headers}
        selected={selected}
        styles={styles}
        tableSize={10}
        summary='faceted dataset search table'
      />
    );
};
