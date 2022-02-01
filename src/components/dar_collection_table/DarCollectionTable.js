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
    alignItems: 'center'
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
  darCode: {label: 'DAR Code', cellStyle: { width: styles.cellWidth.darCode }},
  name: {label: 'Project Title', cellStyle: { width: styles.cellWidth.projectTitle }},
  submissionDate: {label: 'Submission Date', cellStyle: {width: styles.cellWidth.submissionDate }},
  pi: {label: 'PI', cellStyle: {width: styles.cellWidth.pi }},
  institution: {label: 'Institution', cellStyle: { width: styles.cellWidth.institution }},
  datasetCount: {label: 'Datasets', cellStyle: { width: styles.cellWidth.datasetCount }},
  status: {label: 'Status', cellStyle: {width: styles.cellWidth.status }},
  actions: {label: 'Action', cellStyle: { width: styles.cellWidth.actions }}
};

const defaultColumns = Object.keys(columnHeaderConfig);

const columnHeaderData = (columns = defaultColumns) => {
  return columns?.map((col) => columnHeaderConfig[col]);
};

const processCollectionRowData = ({ collections, showConfirmationModal, actionsDisabled, columns = defaultColumns }) => {
  if(!isNil(collections)) {
    return collections.map((collection) => {
      const { darCollectionId, darCode, createDate, datasets, createUser } = collection;
      /*I want the election-dependent status to be explicit so that the
      researcher knows why they can't cancel the collection*/
      const status = determineCollectionStatus(collection);
      const projectTitle = getProjectTitle(collection);
      const institution = isNil(createUser) || isNil(createUser.institution) ? "- -" : createUser.institution.name;
      const actionsButton = actionsDisabled
        ? div()
        : cellData.actionsCellData({ collection, showConfirmationModal });

      // TODO: Populate institution when https://broadworkbench.atlassian.net/browse/DUOS-1595 is complete
      return columns.map((col) => {
        switch(col) {
          case 'darCode': return cellData.darCodeCellData({ darCollectionId, darCode });
          case 'name': return cellData.projectTitleCellData({ darCollectionId, projectTitle });
          case 'submissionDate': return cellData.submissionDateCellData({ darCollectionId, createDate });
          case 'pi': return cellData.piCellData({ darCollectionId });
          case 'institution': return cellData.institutionCellData({ darCollectionId, institution });
          case 'datasetCount': return cellData.datasetCountCellData({ darCollectionId, datasets });
          case 'status': return cellData.statusCellData({ darCollectionId, status });
          case 'actions': return actionsButton;
        }
      });
    });
  }
};

export const DarCollectionTable = function DarCollectionTable(props) {
  const [visibleCollection, setVisibleCollections] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [tableSize, setTableSize] = useState(10);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState({});

  const { collections, columns, isLoading, cancelCollection, resubmitCollection, actionsDisabled } = props;
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
      filteredList: collections,
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleCollections
    });
  }, [tableSize, currentPage, pageCount, collections]);

  const showConfirmationModal = (collection) => {
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
      "rowData": processCollectionRowData({
        collections: visibleCollection,
        columns,
        showConfirmationModal,
        actionsDisabled
      }),
      "columnHeaders": columnHeaderData(columns),
      styles,
      tableSize: tableSize,
      "paginationBar": h(PaginationBar, {
        pageCount,
        currentPage,
        tableSize,
        goToPage,
        changeTableSize
      })
    }),
    CollectionConfirmationModal({
      collection: selectedCollection,
      showConfirmation,
      setShowConfirmation,
      cancelCollection,
      resubmitCollection})
  ]);
};
