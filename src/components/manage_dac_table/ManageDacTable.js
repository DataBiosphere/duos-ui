import {Fragment, useState, useEffect, useCallback} from 'react';
import { h } from 'react-hyperscript-helpers';
import ReactTooltip from 'react-tooltip';
import {DAC} from '../../libs/ajax';
import {filter, isNil} from 'lodash/fp';
import {Styles} from '../../libs/theme';
import { recalculateVisibleTable, goToPage as updatePage } from '../../libs/utils';
import cellData from './ManageDacTableCellData';
import SimpleTable from '../../components/SimpleTable';
import PaginationBar from '../../components/PaginationBar';


export const styles = {
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
    margin: '0.5% 0',
    overflow: 'visible'
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
    border: 'none',
  }),
  cellWidth: {
    name: '25%',
    description: '60%',
    datasets: '10%',
    actions: '5%',
  },
  color: {
    name: '#337ab7',
    description: '#000000',
    datasets: '#000000',
    actions: '#000000',
  },
  fontSize: {
    name: '1.6rem',
    description: '1.4rem',
    datasets: '1.4rem',
    actions: '1.6rem',
  },
};

const columnHeaderConfig = {
  name: {
    label: 'DAC Name',
    cellStyle: { width: styles.cellWidth.name },
    cellDataFn: cellData.nameCellData,
    sortable: true
  },
  description: {
    label: 'DAC Description',
    cellStyle: { width: styles.cellWidth.description },
    cellDataFn: cellData.descriptionCellData,
    sortable: false
  },
  datasets: {
    label: 'DAC Datasets',
    cellStyle: { width: styles.cellWidth.datasets },
    cellDataFn: cellData.datasetsCellData,
    sortable: false
  },
  actions: {
    label: 'Action',
    cellStyle: { width: styles.cellWidth.actions },
    cellDataFn: cellData.actionsCellData
  }
};

const columns = Object.keys(columnHeaderConfig);

const columnHeaderData = (columns = columns) => {
  return columns.map((col) => columnHeaderConfig[col]);
};

const getInitialSort = (columns = []) => {
  const sort = {
    field: 'name',
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

const processDacRowData = ({ dacs, viewDatasets, viewMembers, editDac, deleteDac, userRole, columns = columns }) => {
  if(!isNil(dacs)) {
    return dacs.map((dac) => {
      const {
        dacId,
        name,
        description
      } = dac;

      return columns.map((col) => {
        return columnHeaderConfig[col].cellDataFn({
          dac,
          dacId,
          description,
          name,
          viewDatasets,
          viewMembers,
          editDac,
          deleteDac,
          userRole
        });
      });
    });
  }
};

export const ManageDacTable = function ManageDacTable(props) {

  // table data
  const [visibleDacs, setVisibleDacs] = useState([]);

  // table state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [sort, setSort] = useState(getInitialSort(props.columns));
  const [tableSize, setTableSize] = useState(10);

  const {
    isLoading,
    dacs,
    userRole,
    setShowDacModal,
    setShowDatasetsModal,
    setShowMembersModal,
    setShowConfirmationModal,
    setIsEditMode,
    setSelectedDac,
    setSelectedDatasets
  } = props;

  useEffect(() => {
    recalculateVisibleTable({
      tableSize,
      pageCount,
      filteredList: processDacRowData({
        dacs,
        viewDatasets,
        viewMembers,
        editDac,
        deleteDac,
        userRole,
        columns
      }),
      currentPage,
      setPageCount: (c) => setPageCount(c),
      setCurrentPage: (p) => setCurrentPage(p),
      setVisibleList: (l) => setVisibleDacs(l),
      sort
    });
  }, [dacs, tableSize, pageCount, userRole, currentPage, sort, deleteDac, editDac, viewDatasets, viewMembers]);


  const editDac = useCallback((selectedDac) => {
    setShowDacModal(true);
    setSelectedDac(selectedDac);
    setIsEditMode(true);
  }, [setShowDacModal, setSelectedDac, setIsEditMode]);

  const deleteDac = useCallback((selectedDac) => {
    setShowConfirmationModal(true);
    setSelectedDac(selectedDac);
    setIsEditMode(false);
  }, [setShowConfirmationModal, setSelectedDac, setIsEditMode]);

  const viewMembers = useCallback((selectedDac) => {
    setShowMembersModal(true);
    setSelectedDac(selectedDac);
  }, [setShowMembersModal, setSelectedDac]);

  const viewDatasets = useCallback(async (selectedDac) => {
    const datasets = await DAC.datasets(selectedDac.dacId);
    setShowDatasetsModal(true);
    setSelectedDac(selectedDac);
    setSelectedDatasets(datasets);
  }, [setShowDatasetsModal, setSelectedDac, setSelectedDatasets]);

  const changeTableSize = useCallback((value) => {
    if (value > 0 && !isNaN(parseInt(value))) {
      setTableSize(value);
    }
  }, []);

  const goToPage = useCallback(
    (value) => {
      updatePage(value, pageCount, (page) => {
        setCurrentPage(page);
      });
    },
    [pageCount]
  );


  return h(Fragment, {}, [
    h(SimpleTable, {
      isLoading,
      'rowData': visibleDacs,
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
        setSort(sort);
      }
    }),
    h(ReactTooltip, {
      place: 'left',
      effect: 'solid',
      multiline: true,
      className: 'tooltip-wrapper'
    })
  ]);
};

export default ManageDacTable;
