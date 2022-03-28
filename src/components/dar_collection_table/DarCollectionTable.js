import { useState, useEffect, Fragment, useCallback } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { isNil, isEmpty, find } from 'lodash/fp';
import { Styles } from '../../libs/theme';
import PaginationBar from '../PaginationBar';
import { recalculateVisibleTable, goToPage as updatePage, darCollectionUtils } from '../../libs/utils';
import SimpleTable from '../SimpleTable';
import cellData from './DarCollectionTableCellData';
import CollectionConfirmationModal from "./CollectionConfirmationModal";

const { determineCollectionStatus } = darCollectionUtils;
export const getProjectTitle = ((collection) => {
  if(!isNil(collection) && !isEmpty(collection.dars)) {
    const darData = find((dar) => !isEmpty(dar.data))(collection.dars).data;
    return darData.projectTitle;
  }
});

export const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.6rem',
    fontWeight: 400,
    display: 'flex',
    padding: '1rem 2%',
    justifyContent: 'space-between',
    alignItems: 'center',
    whiteSpace: 'pre-wrap'
  },
  columnStyle: Object.assign({}, Styles.TABLE.HEADER_ROW, {
    justifyContent: 'space-between',
    color: '#7B7B7B',
    fontFamily: 'Montserrat',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    letterSpacing: '0.2px',
    textTransform: 'uppercase'
  }),
  cellWidth: {
    darCode: '15%',
    projectTitle: '20%',
    submissionDate: '12.5%',
    pi: '10%',
    institution: '12.5%',
    datasetCount: '7.5%',
    status: '10%',
    actions: '7.5%'
  },
  color: {
    darCode: '#000000',
    projectTitle: '#000000',
    submissionDate: '#000000',
    pi: '#000000',
    institution: '#354052',
    datasetCount: '#354052',
    status: '#000000',
    actions: '#000000',
  },
  fontSize: {
    darCode: '1.6rem',
    projectTitle: '1.4rem',
    submissionDate: '1.4rem',
    pi: '1.4rem',
    institution: '1.4rem',
    datasetCount: '2.0rem',
    status: '1.6rem',
    actions: '1.6rem'
  },
};

export const DarCollectionTableColumnOptions = {
  DAR_CODE: 'darCode',
  NAME: 'name',
  SUBMISSION_DATE: 'submissionDate',
  PI: 'pi',
  INSTITUTION: 'institution',
  DATASET_COUNT: 'datasetCount',
  STATUS: 'status',
  ACTIONS: 'actions'
};

const columnHeaderConfig = {
  darCode: {
    label: 'DAR Code',
    cellStyle: { width: styles.cellWidth.darCode },
    cellDataFn: cellData.darCodeCellData,
    sortable: true
  },
  name: {
    label: 'Title',
    cellStyle: { width: styles.cellWidth.projectTitle },
    cellDataFn: (props) => {
      props.projectTitle = getProjectTitle(props.collection);
      return cellData.projectTitleCellData(props);
    },
    sortable: true
  },
  submissionDate: {
    label: 'Submission Date',
    cellStyle: { width: styles.cellWidth.submissionDate },
    cellDataFn: cellData.submissionDateCellData,
    sortable: true
  },
  pi: {
    label: 'PI',
    cellStyle: { width: styles.cellWidth.pi },
    cellDataFn: cellData.piCellData,
    sortable: true
  },
  institution: {
    label: 'Institution',
    cellStyle: { width: styles.cellWidth.institution },
    cellDataFn: (props) => {
      // TODO: Populate institution when https://broadworkbench.atlassian.net/browse/DUOS-1595 is complete
      props.institution = isNil(props.createUser) || isNil(props.createUser.institution) ? "- -" : props.createUser.institution.name;
      return cellData.institutionCellData(props);
    },
    sortable: true
  },
  datasetCount: {
    label: 'Datasets',
    cellStyle: { width: styles.cellWidth.datasetCount },
    cellDataFn: cellData.datasetCountCellData,
    sortable: true
  },
  status: {
    label: 'Status',
    cellStyle: { width: styles.cellWidth.status },
    cellDataFn: (props) => {
      props.status = determineCollectionStatus(props.collection);
      return cellData.statusCellData(props);
    },
    sortable: true
  },
  actions: {
    label: 'Action',
    cellStyle: { width: styles.cellWidth.actions },
    cellDataFn: (props) => {
      return props.actionsDisabled
        ? div()
        : props.consoleType
          ? cellData.consoleActionsCellData(props)
          : cellData.actionsCellData(props);
    }
  }
};

const defaultColumns = Object.keys(columnHeaderConfig);

const columnHeaderData = (columns = defaultColumns) => {
  return columns.map((col) => columnHeaderConfig[col]);
};

const processCollectionRowData = ({ collections, openCollection, showConfirmationModal, actionsDisabled, columns = defaultColumns, consoleType = '', goToVote, relevantDatasets}) => {
  if(!isNil(collections)) {
    return collections.map((collection) => {
      const { darCollectionId, darCode, createDate, datasets, createUser } = collection;
      return columns.map((col) => {
        return columnHeaderConfig[col].cellDataFn({
          collection, darCollectionId, datasets, darCode,
          createDate, createUser, actionsDisabled,
          showConfirmationModal, consoleType,
          openCollection, goToVote, relevantDatasets
        });
      });
    });
  }
};

export const DarCollectionTable = function DarCollectionTable(props) {
  const [visibleCollection, setVisibleCollections] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [sort, setSort] = useState({ colIndex: 0, dir: 1 });
  const [tableSize, setTableSize] = useState(10);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState({});
  const [consoleAction, setConsoleAction] = useState();

  //cancel, resubmit, and open need to be assigned as an "updateCollection" when relevant?
  //  - depends, if cancel and resubmit are locked behind modals then I only would have to pass in openCollection (only for admin and chair)
  const {
    collections, columns, isLoading, cancelCollection, resubmitCollection,
    openCollection, actionsDisabled, goToVote, consoleType, relevantDatasets = []
  } = props;
  /*
    NOTE: This component will most likely be used in muliple consoles
    Right now the table is assuming a fetchAll request since it's being implemented for the ResearcherConsole
    This will be updated to account for token based requests on a later ticket
  */

  const changeTableSize = useCallback((value) => {
    if (value > 0 && !isNaN(parseInt(value))) {
      setTableSize(value);
    }
  }, []);

  useEffect(() => {
    recalculateVisibleTable({
      tableSize,
      pageCount,
      filteredList: processCollectionRowData({
        collections,
        columns,
        showConfirmationModal,
        actionsDisabled,
        consoleType,
        openCollection,
        goToVote,
        relevantDatasets
      }),
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleCollections,
      sort
    });
  }, [tableSize, currentPage, pageCount, collections, sort, columns, actionsDisabled, consoleType, openCollection, goToVote, relevantDatasets]);

  const showConfirmationModal = (collection, action = '') => {
    setConsoleAction(action);
    setSelectedCollection(collection);
    setShowConfirmation(true);
  };

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
      "rowData": visibleCollection,
      "columnHeaders": columnHeaderData(columns),
      styles,
      tableSize: tableSize,
      "paginationBar": h(PaginationBar, {
        pageCount,
        currentPage,
        tableSize,
        goToPage,
        changeTableSize
      }),
      sort,
      onSort: setSort
    }),
    /*
      Modal needs to be more flexible
      Should take in an operation type, use that to determine message on modal
      Operations: Open, Cancel, Revise

      How to make more flexible?
        - Need to change message based on operation
        - Need to change prop function based on operation
        - showConfirmationModal
          - Can be take in an extra op argument, assign that as a state variable
          - Modal function can be defined via useCallback, recomputed if op state variable changes
          - Above can also be applied for modal message (expect use useMemo instead of useCallback)
    */
    h(CollectionConfirmationModal, {
      collection: selectedCollection,
      showConfirmation,
      setShowConfirmation,
      cancelCollection,
      resubmitCollection,
      openCollection,
      consoleAction
    })
  ]);
};
