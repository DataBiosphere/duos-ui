import { useState, useEffect, Fragment, useCallback } from 'react';
import { h } from 'react-hyperscript-helpers';
import {isNil} from 'lodash/fp';
import { Styles } from '../../libs/theme';
import { Storage } from '../../libs/storage';
import PaginationBar from '../PaginationBar';
import { recalculateVisibleTable, goToPage as updatePage } from '../../libs/utils';
import SimpleTable from '../SimpleTable';
import cellData from './DarDatasetTableCellData';
import './dar_collection_table.css';

const storageDarDatasetSort = 'storageDarDatasetSort';

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
  cellWidth: {
    darCode: '12.5%',
    projectTitle: '18%',
    submissionDate: '12.5%',
    researcher: '10%',
    institution: '12.5%',
    datasetCount: '7.5%',
    status: '10%',
    actions: '14.5%',
  },
  color: {
    darCode: '#000000',
    projectTitle: '#000000',
    submissionDate: '#000000',
    researcher: '#000000',
    institution: '#354052',
    datasetCount: '#354052',
    status: '#000000',
    actions: '#000000',
  },
  fontSize: {
    darCode: '1.6rem',
    projectTitle: '1.4rem',
    submissionDate: '1.4rem',
    researcher: '1.4rem',
    institution: '1.4rem',
    datasetCount: '2.0rem',
    status: '1.6rem',
    actions: '1.6rem',
  },
};

export const DarDatasetTableColumnOptions = {
  DATA_USE_GROUP: 'dataUseGroup',
  VOTES: 'votes',
  NUMBER_OF_DATASETS: 'numberOfDatasets',
  DATASETS: 'datasets',
};

const columnHeaderConfig = {
  dataUseGroup: {
    label: 'Data Use Group',
    cellStyle: { width: styles.cellWidth.dataUseGroup },
    cellDataFn: cellData.dataUseGroup,
    sortable: true
  },
  votes: {
    label: 'Votes',
    cellStyle: { width: styles.cellWidth.votes },
    cellDataFn: cellData.votes,
    sortable: false
  },
  numberOfDatasets: {
    label: '# of Datasets',
    cellStyle: { width: styles.cellWidth.numberOfDatasets },
    cellDataFn: cellData.numberOfDatasets,
    sortable: true
  },
  datasets: {
    label: 'Datasets',
    cellStyle: { width: styles.cellWidth.datasets },
    cellDataFn: cellData.datasets,
    sortable: false
  },
};

const defaultColumns = Object.keys(columnHeaderConfig);

const columnHeaderData = (columns = defaultColumns) => {
  return columns.map((col) => columnHeaderConfig[col]);
};

const processBucketRowData = ({
  buckets
}) => {
  console.log(buckets);
  if(!isNil(buckets)) {
    return buckets.map((bucket) => {
      const {
        a
      } = bucket;
      return columns.map((col) => {
        return columnHeaderConfig[col].cellDataFn({
          dataUseGroup: 'asdf'
        });
      });
    });
  }
};

const getInitialSort = (columns = []) => {
  const sort = Storage.getCurrentUserSettings(storageDarDatasetSort) || {
    field: DarCollectionTableColumnOptions.SUBMISSION_DATE,
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

export const DarDatasetTable = (props) => {
  const [visibleBuckets, setVisibleBuckets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [sort, setSort] = useState(getInitialSort(props.columns));
  const [tableSize, setTableSize] = useState(10);

  const [buckets, setBuckets] = useState([]);

  const {
    collection, isLoading
  } = props;


  const init = useCallback(async () => {
    const user = Storage.getCurrentUser();
    try {
      const { dars, datasets } = collection;
      const processedBuckets = await flow([
        generatePreProcessedBucketData,
        processDataUseBuckets,
      ])({ dars, datasets });
      await getMatchDataForBuckets(processedBuckets);
      const filteredBuckets = adminPage
        ? processedBuckets
        : filterBucketsForUser(user, processedBuckets);
      setBuckets(filteredBuckets);
    } catch (error) {
      Notifications.showError({
        text: 'Error initializing DAR Collection Dataset summary. You have been redirected to your console',
      });
      Navigation.console(user, props.history);
    }
  }, []);

  const changeTableSize = useCallback((value) => {
    if (value > 0 && !isNaN(parseInt(value))) {
      setTableSize(value);
    }
  }, []);

  useEffect(() => {
    recalculateVisibleTable({
      tableSize,
      pageCount,
      filteredList: processBucketRowData({
        buckets
      }),
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleBuckets,
      sort
    });
  }, [tableSize, currentPage, pageCount, buckets, sort, columns]);

  //Helper function to update page
  const goToPage = useCallback(
    (value) => {
      updatePage(value, pageCount, setCurrentPage);
    },
    [pageCount]
  );

  return h(Fragment, {}, [
    h(SimpleTable, {
      isLoading,
      'rowData': visibleBuckets,
      'columnHeaders': columnHeaderData(columns),
      styles,
      tableSize: tableSize,
      'paginationBar': h(PaginationBar, {
        pageCount,
        currentPage,
        tableSize,
        goToPage,
        changeTableSize
      }),
      sort,
      onSort: (sort) => {
        Storage.setCurrentUserSettings(storageDarDatasetSort, {
          field: columns[sort.colIndex],
          dir: sort.dir
        });
        setSort(sort);
      }
    }),
  ]);
};
