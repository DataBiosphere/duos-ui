import React, { useState, useEffect } from 'react';
import { Styles } from '../../libs/theme';
import { Storage } from '../../libs/storage';
import PaginationBar from '../PaginationBar';
import SimpleTable from '../SimpleTable';
import cellData from './DACDatasetTableCellData';
import {isNil} from 'lodash/fp';
import {goToPage as updatePage, recalculateVisibleTable} from '../../libs/utils';
import {useCallback} from 'react';

export const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.6rem',
    fontWeight: 400,
    display: 'flex',
    padding: '1rem 2%',
    justifyContent: 'space-between',
    alignItems: 'center',
    whiteSpace: 'pre-wrap',
    backgroundColor: 'white',
    border: '1px solid #DEDEDE',
    borderRadius: '4px',
    margin: '0.5% 0'
  },
  columnStyle: Object.assign({}, Styles.TABLE.HEADER_ROW, {
    justifyContent: 'space-between',
    color: '#7B7B7B',
    fontFamily: 'Montserrat',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    letterSpacing: '0.2px',
    textTransform: 'uppercase',
    backgroundColor: 'B8CDD3',
    border: 'none'
  }),
  cellWidths: {
    duosId: '15%',
    dataSubmitter: '15%',
    datasetName: '25%',
    dataCustodian: '15%',
    dataUse: '15%',
    status: '15%'
  },
  color: {
    dataUseGroup: '#000000',
    votes: '#000000',
    numberOfDatasets: '#000000',
    datasets: '#000000',
  },
  fontSize: {
    dataUseGroup: '1.4rem',
    votes: '1.4rem',
    numberOfDatasets: '1.4rem',
    datasets: '1.4rem',
  },
};

export const DACDatasetTableColumnOptions = {
  DUOS_ID: 'duosId',
  DATA_SUBMITTER: 'dataSubmitter',
  DATASET_NAME: 'datasetName',
  DATA_CUSTODIAN: 'dataCustodian',
  DATA_USE: 'dataUse',
  STATUS: 'status',
};

const columnHeaderConfig = {
  duosId: {label: 'DUOS ID', cellStyle: {width: styles.cellWidths.duosId}, cellDataFn: cellData.duosIdCellData, sortable: true},
  dataSubmitter: {label: 'Data Submitter', cellStyle: {width: styles.cellWidths.dataSubmitter}, cellDataFn: cellData.dataSubmitterCellData, sortable: true},
  datasetName: {label: 'Dataset Name', cellStyle: {width: styles.cellWidths.datasetName}, cellDataFn: cellData.datasetNameCellData, sortable: true},
  dataCustodian: {label: 'Data Custodian', cellStyle: {width: styles.cellWidths.dataCustodian}, cellDataFn: cellData.dataCustodianCellData, sortable: true},
  dataUse: {label: 'Data Use', cellStyle: {width: styles.cellWidths.dataUse}, cellDataFn: cellData.dataUseCellData, sortable: false},
  status: {label: 'Status', cellStyle: {width: styles.cellWidths.status}, cellDataFn: cellData.statusCellData, sortable: false},
};

const defaultColumns = Object.keys(columnHeaderConfig);

const columnHeaderData = (columns = defaultColumns) => {
  return columns.map((col) => columnHeaderConfig[col]);
};

const processDatasetRowData = ({
  datasets, columns = defaultColumns, consoleType=''
}) => {
  if(!isNil(datasets)) {
    return datasets.map((dataset) => {
      return columns.map((col) => {
        return columnHeaderConfig[col].cellDataFn({
          dataset, consoleType
        });
      });
    });
  }
};

const storageDACDatasetSort = 'storageDACDatasetSort';

const getInitialSort = (columns = []) => {
  const sort = Storage.getCurrentUserSettings(storageDACDatasetSort) || {
    field: DACDatasetTableColumnOptions.DUOS_ID,
    dir: -1
  };
  const sortIndex = columns.indexOf(sort.field);

  if (sortIndex !== -1) {
    return { colIndex: sortIndex, dir: sort.dir};
  }
  else {
    return { colIndex: 0, dir: 1 };
  }
};

export const DACDatasetsTable = function DACDatasetTable(props) {
  const [visibleDatasets, setVisibleDatasets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [sort, setSort] = useState(getInitialSort(props.columns));
  const [tableSize, setTableSize] = useState(10);
  const { datasets, columns, isLoading, consoleType } = props;

  const changeTableSize = useCallback((value) => {
    if (value > 0 && !isNaN(parseInt(value))) {
      setTableSize(value);
    }
  }, []);

  useEffect(() => {
    recalculateVisibleTable({
      tableSize,
      pageCount,
      filteredList: processDatasetRowData({datasets, columns, consoleType}),
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleDatasets,
      sort,
    });
  }, [tableSize, currentPage, pageCount, datasets, sort, columns, consoleType]);

  //Helper function to update page
  const goToPage = useCallback(
    (value) => {
      updatePage(value, pageCount, setCurrentPage);
    },
    [pageCount]
  );

  return <SimpleTable
    isLoading={isLoading}
    rowData={visibleDatasets}
    columnHeaders={columnHeaderData(columns)}
    styles={styles}
    tableSize={tableSize}
    paginationBar={<PaginationBar
      pageCount={pageCount}
      currentPage={currentPage}
      tableSize={tableSize}
      goToPage={goToPage}
      changeTableSize={changeTableSize}/>}
    sort={sort}
    onSort={(sort) => {
      Storage.setCurrentUserSettings(storageDACDatasetSort, {
        field: columns[sort.colIndex],
        dir: sort.dir
      });
      setSort(sort);
    }}
  />;
};
