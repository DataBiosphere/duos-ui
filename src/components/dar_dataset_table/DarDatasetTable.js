import { useState, useEffect, Fragment, useCallback } from 'react';
import { h } from 'react-hyperscript-helpers';
import { Styles } from '../../libs/theme';
import { Storage } from '../../libs/storage';
import PaginationBar from '../PaginationBar';
import { recalculateVisibleTable, goToPage as updatePage } from '../../libs/utils';
import SimpleTable from '../SimpleTable';
import cellData from './DarDatasetTableCellData';
import {flow, isNil} from 'lodash/fp';
import {
  generatePreProcessedBucketData,
  getMatchDataForBuckets,
  processDataUseBuckets,
} from '../../utils/DarCollectionUtils';
import {Notifications} from '../../libs/utils';


const storageDarDatasetSort = 'storageDarDatasetSort';

export const styles = {
  containerOverride: Styles.TABLE.CARDCONTAINER,
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
    dataUseGroup: '30%',
    votes: '15%',
    numberOfDatasets: '15%',
    datasets: '40%',
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
    cellDataFn: cellData.dataUseGroupCellData,
    sortable: true
  },
  votes: {
    label: 'Votes',
    cellStyle: { width: styles.cellWidth.votes },
    cellDataFn: cellData.votesCellData,
    sortable: false
  },
  numberOfDatasets: {
    label: '# of Datasets',
    cellStyle: { width: styles.cellWidth.numberOfDatasets },
    cellDataFn: cellData.numberOfDatasetsCellData,
    sortable: true
  },
  datasets: {
    label: 'Datasets',
    cellStyle: { width: styles.cellWidth.datasets },
    cellDataFn: cellData.datasetsCellData,
    sortable: false
  },
};

const columns = Object.keys(columnHeaderConfig);

const columnHeaderData = (columns = columns) => {
  return columns.map((col) => columnHeaderConfig[col]);
};

const processBucketRowData = ({
  buckets
}) => {
  if(!isNil(buckets)) {
    return buckets.map((bucket) => {
      const {
        key: dataUseGroup,
        votes,
        datasets,
        elections,
      } = bucket;
      return columns.map((col) => {
        return columnHeaderConfig[col].cellDataFn({
          dataUseGroup,
          datasets,
          elections: elections[0],
          votes: votes[0]?.dataAccess || [],
        });
      });
    });
  }
};

const getInitialSort = (columns = []) => {
  const sort = Storage.getCurrentUserSettings(storageDarDatasetSort) || {
    field: DarDatasetTableColumnOptions.NUMBER_OF_DATASETS,
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

  const [isInitializing, setIsInitializing] = useState(true);

  const init = useCallback(async () => {
    try {
      const { dars, datasets } = collection;
      if (isNil(dars) || isNil(datasets)) {
        setBuckets([]);
        return;
      }
      const processedBuckets = await flow([
        generatePreProcessedBucketData,
        processDataUseBuckets,
      ])({ dars, datasets });
      await getMatchDataForBuckets(processedBuckets);
      const filteredDataUseBuckets = processedBuckets.filter(
        (b) => b.isRP !== true
      );
      setBuckets(filteredDataUseBuckets);
    } catch (error) {
      Notifications.showError({
        text: 'Error initializing DAR Collection Dataset summary.',
      });
    }
    setIsInitializing(false);
  }, [collection]);

  useEffect(() => {
    try {
      init();
    } catch (error) {
      Notifications.showError({ text: 'Failed to initialize collection' });
    }
  }, [init]);

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
  }, [tableSize, currentPage, pageCount, buckets, sort]);

  //Helper function to update page
  const goToPage = useCallback(
    (value) => {
      updatePage(value, pageCount, setCurrentPage);
    },
    [pageCount]
  );

  return h(Fragment, {}, [
    h(SimpleTable, {
      isLoading: isLoading || isInitializing,
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
