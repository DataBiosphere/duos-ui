import { useState, useEffect, Fragment, useCallback } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { isNil, isEmpty } from 'lodash/fp';
import { Styles, Theme } from '../../libs/theme';
import PaginationBar from '../PaginationBar';
import SimpleButton from '../SimpleButton';
import ConfirmationModal from '../modals/ConfirmationModal';
import { formatDate, recalculateVisibleTable, goToPage as updatePage, determineCollectionStatus } from '../../libs/utils';
import SimpleTable from '../SimpleTable';

const getProjectTitle = ((collection) => {
  if(!isNil(collection) && !isEmpty(collection.dars) && !isEmpty(collection.dars[0].data)) {
    return collection.dars[0].data.projectTitle;
  }
});

const styles = {
  baseStyle: {
    fontFamily: 'Arial',
    fontSize: '14px',
    fontWeight: 400,
    display: 'flex',
    padding: '1rem 2%',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  columnStyle: Object.assign({}, Styles.TABLE.HEADER_ROW, {
    justifyContent: 'space-between'
  }),
  cellWidth: {
    darCode: '15%',
    projectTitle: '30%',
    submissionDate: '15%',
    status: '15%',
    actions: '25%'
  }
};

const columnHeaderFormat = {
  darCode: {label: 'DAR Code', cellStyle: { width: styles.cellWidth.darCode}},
  name: {label: 'Project Title', cellStyle: { width: styles.cellWidth.projectTitle}},
  submissionDate: {label: 'Submission Date', cellStyle: {width: styles.cellWidth.submissionDate}},
  status: {label: 'Status', cellStyle: {width: styles.cellWidth.status}},
  actions: {labels: 'DAR Actions', cellStyle: { width: styles.cellWidth.actions}}
};

const columnHeaderData = () => {
  const {darCode, name, submissionDate, status, actions} = columnHeaderFormat;
  return [darCode, name, submissionDate, status, actions];
};

const projectTitleCellData = ({projectTitle = '- -', darCollectionId, style = {}, label = 'project-title'}) => {
  return {
    data: projectTitle,
    id: darCollectionId,
    style,
    label
  };
};

const darCodeCellData = ({darCode = '- -', darCollectionId, style = {}, label = 'dar-code'}) => {
  return {
    data: darCode,
    id: darCollectionId,
    style,
    label
  };
};

const submissionDateCellData = ({createDate, darCollectionId, style = {}, label = 'submission-date'}) => {
  return {
    data: isNil(createDate) ? '- - ' : formatDate(createDate),
    id: darCollectionId,
    style,
    label
  };
};

const statusCellData = ({status = '- -', darCollectionId, style = {}, label = 'status'}) => {
  return {
    data: status,
    id: darCollectionId,
    style,
    label
  };
};

const CancelCollectionButton = (props) => {
  return h(SimpleButton, {
    keyProp: `cancel-collection-${props.collection}`,
    label: 'Cancel',
    baseColor: Theme.palette.primary,
    additionalStyle: {
      width: '30%',
      padding: '2%',
      fontSize: '1.45rem',
    },
    onClick: () => props.showConfirmationModal(props.collection)
  });
};

const actionsCellData = ({collection, showConfirmationModal}) => {
  const { darCollectionId } = collection;
  const cancelButtonTemplate = h(CancelCollectionButton, {
    collection,
    showConfirmationModal
  });

  return {
    isComponent: true,
    darCollectionId,
    label: 'cancel-button',
    data: div(
      {
        style: {
          display: 'flex',
          justifyContent: 'left'
        },
        key: `cancel-collection-cell-${darCollectionId}`
      },
      [cancelButtonTemplate]
    )
  };
};


const processCollectionRowData = (collections, showConfirmationModal) => {
  if(!isNil(collections)) {
    return collections.map((collection) => {
      const { darCollectionId, darCode, createDate } = collection;
      /*I want the election-dependent status to be explicit so that the
      researcher knows why they can't cancel the collection*/
      const status = determineCollectionStatus(collection);
      const projectTitle = getProjectTitle(collection);
      return [
        darCodeCellData({ darCollectionId, darCode }),
        projectTitleCellData({ darCollectionId, projectTitle }),
        submissionDateCellData({ darCollectionId, createDate }),
        statusCellData({ darCollectionId, status }),
        actionsCellData({ collection, showConfirmationModal }),
      ];
    });
  }
};

export default function DarCollectionTable(props) {
  const [visibleCollection, setVisibleCollections] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [tableSize, setTableSize] = useState(10);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState({});
  // const searchRef = useRef(''); //May not need this, could just pass in the value from the parent

  const { collections, isLoading, cancelCollection } = props;
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

  const getModalHeader = (collection) => {
    if(!isNil(collection)) {
      return `${selectedCollection.darCode} - ${getProjectTitle(selectedCollection)}`;
    }
    return '';
  };

  return h(Fragment, {}, [
    h(SimpleTable, {
      isLoading,
      rowData: processCollectionRowData(visibleCollection, showConfirmationModal),
      columnHeaders: columnHeaderData(),
      styles,
      tableSize,
      paginationBar: h(PaginationBar, {
        pageCount,
        currentPage,
        tableSize,
        goToPage,
        changeTableSize
      })
    }),
    h(ConfirmationModal, {
      showConfirmation,
      styleOverride: {height: '35%'},
      closeConfirmation: () => setShowConfirmation(false),
      title: 'Cancel DAR Collection',
      message: `Are you sure you want to cancel ${selectedCollection.darCode}?`,
      header: getModalHeader(selectedCollection),
      onConfirm: () => cancelCollection(selectedCollection.id)
    })
  ]);
}
