import { useState, useEffect, Fragment, useCallback } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { isNil, isEmpty, cloneDeep, every, toLower } from 'lodash/fp';
import { Styles, Theme } from '../../libs/theme';
import PaginationBar from '../PaginationBar';
import SimpleButton from '../SimpleButton';
import ConfirmationModal from '../modals/ConfirmationModal';
import { tableSearchHandler, formatDate, Notifications, recalculateVisibleTable } from '../../libs/utils';
import { Collections } from '../../libs/ajax';
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
  darCode: {label: 'DAR Code', cellStyle: { width: styles.cellWidth.email}},
  name: {label: 'Project Title', cellStyle: { width: styles.cellWidth.projectTitle}},
  submissionDate: {label: 'Submission Date', cellStyle: {width: styles.cellWidth.submissionDate}},
  status: {label: 'Status', cellStyle: {width: styles.cellWidth.status}},
  actions: {labels: 'DAR Actions', cellStyle: { width: styles.cellWidth.actions}}
};

const columnHeaderData = () => {
  const {darCode, name, submissionDate, status, actions} = columnHeaderFormat;
  return [darCode, name, submissionDate, status, actions];
};

const projectTitleCellData = ({projectTitle = '- -', id, style = {}, label = 'project-title'}) => {
  return {
    data: projectTitle,
    id,
    style,
    label
  };
};

const darCodeCellData = ({darCode = '- -', id, style = {}, label = 'dar-code'}) => {
  return {
    data: darCode,
    id,
    style,
    label
  };
};

const submissionDateCellData = ({submissionDate, id, style = {}, label = 'submission-date'}) => {
  return {
    data: isEmpty(submissionDate) ? '- - ' : formatDate(submissionDate),
    id,
    style,
    label
  };
};

const statusCellData = ({status = '- -', id, style = {}, label = 'status'}) => {
  return {
    data: status,
    id,
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
    onClick: () => props.showConfirmationModal(props.collection),
  });
};

const actionsCellData = ({collection, showConfirmationModal}) => {
  const { id } = collection;
  const cancelButtonTemplate = h(CancelCollectionButton, {
    collection,
    showConfirmationModal
  });

  return {
    isComponent: true,
    id,
    label: 'cancel-button',
    data: div(
      {
        style: {
          display: 'flex',
          justifyContent: 'left'
        },
        key: `cancel-collection-cell-${id}`
      },
      [cancelButtonTemplate]
    )
  };
};


const processCollectionRowData = (collection, showConfirmationModal) => {
  return collection.map((collection) => {
    const { id, darCode, submissionDate, dars = [], elections } = collection;
    const isCollectionCancelled = every(
      (dar) => toLower(dar.status) === 'canceled'
    )(dars);
    /*I want the election-dependent status to be explicit so that the
    researcher knows why they can't cancel the collection*/
    const status = !isEmpty(elections) ?
      'Under Election' :
      isCollectionCancelled ? 'Canceled' : 'Submitted';
    const projectTitle = getProjectTitle(collection);
    return [
      darCodeCellData({ id, darCode }),
      projectTitleCellData({ id, projectTitle }),
      submissionDateCellData({ id, submissionDate }),
      statusCellData({ id, status }),
      actionsCellData({ collection, showConfirmationModal }),
    ];
  });
};

export default function DarCollectionTable(props) {
  const [collections, setCollections] = useState([]);
  const [filteredCollections, setFilteredCollections] = useState([]);
  const [visibleCollection, setVisibleCollections] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [tableSize, setTableSize] = useState(10);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState();
  const [isLoading, setIsLoading] = useState(true);
  // const searchRef = useRef(''); //May not need this, could just pass in the value from the parent

  /*
    NOTE: This component will most likely be used in muliple consoles
    Right now the table is assuming a fetchAll request since it's being implemented for the ResearcherConsole
    This will be updated to account for token based requests when that feature is implemented
  */
  const { fetchCollections } = props;

  const changeTableSize = useCallback((value) => {
    if (value > 0 && !isNaN(parseInt(value))) {
      setTableSize(value);
    }
  }, []);

  //Helper function, defines the term matching function
  const handleSearchChange = tableSearchHandler(
    collections,
    setFilteredCollections,
    setCurrentPage,
    'darCollections'
  );

  useEffect(() => {
    const init = async () => {
      const userCollections = await fetchCollections();
      setCollections(userCollections);
      setFilteredCollections(userCollections);
    };
    try {
      init();
    } catch (error) {
      Notifications.showError({
        text: 'Failed to initialize collection table',
      });
    }
  }, [fetchCollections]);

  useEffect(() => {
    setIsLoading(true);
    recalculateVisibleTable({
      tableSize,
      pageCount,
      filteredList: filteredCollections,
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleCollections
    });
    setIsLoading(false);
  }, [tableSize, currentPage, filteredCollections, pageCount]);

  useEffect(() => {
    handleSearchChange(props.searchTerms);
  }, [handleSearchChange, props.searchTerms, collections]);

  const showConfirmationModal = (collection) => {
    setSelectedCollection(collection);
    setShowConfirmation(true);
  };

  const cancelCollection = async (collectionId) => {
    try {
      const cancelledCollection = await Collections.cancelCollection(collectionId);
      const targetIndex = collections.findIndex((collection) => {
        collection.id === collectionId;
      });
      if(targetIndex < 0) {
        throw new Error();
      }
      const clonedCollections = cloneDeep(collections);
      clonedCollections[targetIndex] = cancelledCollection;
      setCollections(cancelledCollection);
    } catch(error) {
      Notifications.showError({text: 'Error: Could not find target collection'});
    }
  };

  //Helper function to update page
  const goToPage = useCallback(
    (value) => {
      goToPage(value, pageCount, setCurrentPage);
    },
    [pageCount]
  );

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
      closeConfirmation: () => setShowConfirmation(false),
      title: 'Cancel DAR Collection',
      message: 'Confirm DAR Collection Cancellation', //NOTE: come up with a better message
      header: `${selectedCollection.darCode} - ${getProjectTitle(selectedCollection)}`,
      onConfirm: () => cancelCollection(selectedCollection.id) //NOTE: implement this function
    })
  ]);
}
