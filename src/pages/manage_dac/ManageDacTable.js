import {Component, Fragment, useState, useEffect, useCallback} from 'react';
import {a, button, div, h, hr, span, table, thead, tr, th, tbody, td} from 'react-hyperscript-helpers';
import ReactTooltip from 'react-tooltip';
import {PageHeading} from '../../components/PageHeading';
import {PaginatorBar} from '../../components/PaginatorBar';
import {SearchBox} from '../../components/SearchBox';
import {DAC} from '../../libs/ajax';
import {Storage} from '../../libs/storage';
import {contains, filter, reverse, sortBy, map, isNil, isEmpty} from 'lodash/fp';
import manageDACIcon from '../../images/icon_manage_dac.png';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import TableIconButton from '../../components/TableIconButton';
import {Delete} from '@material-ui/icons';
import {Styles} from '../../libs/theme';
import {Theme} from '../../libs/theme';
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
    description: '45%',
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

const limit = 10;
const CHAIR = 'Chairperson';
const ADMIN = 'Admin';
const actionButtonStyle = { width: '40%', marginRight: '1rem' };

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
        datasets,
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
  const [limit, setLimit] = useState(limit);





  const {
    isLoading,
    dacs,
    userRole,
    reloadUserRole,
    reloadDacList,
    showDacModal, setShowDacModal,
    showDatasetsModal, setShowDatasetsModal,
    showMembersModal, setShowMembersModal,
    showConfirmationModal, setShowConfirmationModal,
    isEditMode, setIsEditMode,
    selectedDac, setSelectedDac,
    selectedDatasets, setSelectedDatasets
  } = props

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
  }, [dacs, tableSize, pageCount, userRole, currentPage, tableSize, pageCount, sort])

  const handlePageChange = page => {
    setCurrentPage(page);
  };

  const handleSizeChange = size => {
    setLimit(size);
    setCurrentPage(1);
  };

  const editDac = (selectedDac) => {
    setShowDacModal(true);
    setSelectedDac(selectedDac);
    setIsEditMode(true);
  };

  const deleteDac = async (selectedDac) => {
    setShowDacModal(true);
    setSelectedDac(selectedDac);
    setIsEditMode(false);
  };

  const closeConfirmation = () => {
    setShowConfirmationModal(false);
  };



  const addDac = () => {
    setShowDacModal(true);
    setIsEditMode(false);
  };

  const okAddDacModal = async () => {
    await reloadDacList();

    setShowDacModal(false);
    setCurrentPage(1);
  };

  const closeAddDacModal = async () => {
    await reloadDacList();

    setShowDacModal(false);
    setCurrentPage(1);
  };

  const viewMembers = (selectedDac) => {
    setShowMembersModal(true);
    setSelectedDac(selectedDac);
  };



  const viewDatasets = async (selectedDac) => {
    const datasets = await DAC.datasets(selectedDac.dacId);
    const activeDatasets = filter({ active: true })(datasets);

    setShowDatasetsModal(true);
    setSelectedDac(selectedDac);
    setSelectedDatasets(activeDatasets);
  };



  const changeTableSize = useCallback((value) => {
    if (value > 0 && !isNaN(parseInt(value))) {
      setTableSize(value);
    }
  }, []);

  const goToPage = useCallback(
    (value) => {
      updatePage(value, pageCount, (page) => {
        setCurrentPage(page)
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
      // div({className: 'row no-margin'}, [
      //   div({className: 'col-lg-6 col-md-6 col-sm-12 col-xs-12 no-padding'}, [
      //     PageHeading({
      //       id: 'manageDac',
      //       imgSrc: manageDACIcon,
      //       iconSize: 'large',
      //       color: 'dataset',
      //       title: 'Manage Data Access Committee',
      //       description: 'Create and manage Data Access Commitee'
      //     })
      //   ]),
      //   div({
      //     isRendered: (userRole === ADMIN),
      //     className: 'col-md-6 col-xs-12 search-wrapper no-padding'}, [
      //     div({className: 'col-xs-6'}, [
      //       h(SearchBox, {
      //         id: 'manageDac',
      //         searchHandler: handleSearchDac,
      //         pageHandler: handlePageChange,
      //         color: 'common'
      //       })
      //     ]),
      //     a({
      //       id: 'btn_addDAC',
      //       className: 'col-xs-6 btn-primary btn-add common-background',
      //       onClick: addDac
      //     }, [
      //       div({className: 'all-icons add-dac_white'}),
      //       span({}, ['Add Data Access Committee'])
      //     ])
      //   ]),
      //   div({
      //     isRendered: (userRole === CHAIR),
      //     className: 'search-wrapper no-padding'}, [
      //     div({className: 'col-xs-6'}, [
      //       h(SearchBox, {
      //         id: 'manageDac',
      //         searchHandler: handleSearchDac,
      //         pageHandler: handlePageChange,
      //         color: 'common'
      //       })
      //     ])
      //   ])
      // ]),
      // div({ className:  'table-scroll' }, [
      //   div({style: Theme.lightTable}, [
      //     table({ className: 'table' }, [
      //       thead({}, [
      //         tr({}, [
      //           th({
      //             className: 'col-2 cell-size cell-sort',
      //             onClick: sort('name', !descendingOrder)
      //           }, [
      //             'DAC Name',
      //             span({className: 'glyphicon sort-icon glyphicon-sort'})]),
      //           th({ className: 'cell-size' }, ['DAC Description']),
      //           th({ className: 'cell-size' }, ['DAC Datasets']),
      //           th({ className: 'cell-size' }, ['Actions']),
      //         ]),
      //       ]),
      //       tbody({}, [
      //         dacs.filter(searchTable(searchDacText))
      //           .slice((currentPage - 1) * limit, currentPage * limit)
      //           .map(dac => {
      //             const disabled = !isNil(dac.datasets) && !isEmpty(dac.datasets);
      //             return (h(Fragment, {key: dac.dacId}, [
      //               tr({
      //                 id: dac.dacId,
      //                 className: 'tableRow'
      //               }, [
      //                 td({
      //                   id: dac.dacId + '_dacName',
      //                   name: 'name',
      //                   className: 'cell-size',
      //                   style: tableBody,
      //                   title: dac.name
      //                 }, [dac.name]),
      //                 td({
      //                   id: dac.dacId + '_dacDescription',
      //                   name: 'dacDescription',
      //                   className: 'cell-size',
      //                   style: tableBody,
      //                   title: dac.description
      //                 }, [dac.description]),
      //                 td({
      //                   className: 'cell-size',
      //                   style: tableBody,
      //                 }, [
      //                   button({
      //                     id: dac.dacId + '_dacDatasets',
      //                     name: 'dacDatasets',
      //                     className: 'cell-button hover-color',
      //                     style: actionButtonStyle,
      //                     onClick: () => viewDatasets(dac)
      //                   }, ['View'])
      //                 ]),
      //                 td({
      //                   className: 'col-2 cell-body f-center',
      //                   style: {display: 'flex'}
      //                 }, [
      //                   button({
      //                     id: dac.dacId + '_btnViewDAC',
      //                     name: 'btn_viewDac',
      //                     className: 'cell-button hover-color',
      //                     style: actionButtonStyle,
      //                     onClick: () => viewMembers(dac)
      //                   }, ['View']),
      //                   button({
      //                     id: dac.dacId + '_btnEditDAC',
      //                     name: 'btn_editDac',
      //                     className: 'cell-button hover-color',
      //                     style: actionButtonStyle,
      //                     onClick: () => editDac(dac)
      //                   }, ['Edit']),
      //                   h(TableIconButton, {
      //                     key: 'delete-dac-icon',
      //                     dataTip: disabled ? 'All datasets assigned to this DAC must be reassigned before this can be deleted' : 'Delete DAC',
      //                     isRendered: userRole === ADMIN,
      //                     disabled: disabled,
      //                     onClick: () => deleteDac(dac),
      //                     icon: Delete,
      //                     style: Object.assign({}, Styles.TABLE.TABLE_ICON_BUTTON),
      //                     hoverStyle: Object.assign({}, Styles.TABLE.TABLE_BUTTON_ICON_HOVER)
      //                   })
      //                 ])
      //               ]),
      //             ]));
      //           }),
      //       ]),
      //     ]),
      //   ]),


      h(ReactTooltip, {
        place: 'left',
        effect: 'solid',
        multiline: true,
        className: 'tooltip-wrapper'
      })
    ]);
  }

export default ManageDacTable;
