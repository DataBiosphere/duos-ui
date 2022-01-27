import { useState, useEffect, Fragment, useCallback } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { isNil, isEmpty, includes, find } from 'lodash/fp';
import { Styles, Theme } from '../../libs/theme';
import PaginationBar from '../PaginationBar';
import SimpleButton from '../SimpleButton';
import ConfirmationModal from '../modals/ConfirmationModal';
import { formatDate, recalculateVisibleTable, goToPage as updatePage, darCollectionUtils } from '../../libs/utils';
import SimpleTable from '../SimpleTable';
import CancelCollectionButton from './DarCollectionTableCancelButton';
import ResubmitCollectionButton from "./DarCollectionTableResubmitButton";

const { determineCollectionStatus, isCollectionCanceled } = darCollectionUtils;
const getProjectTitle = ((collection) => {
  if(!isNil(collection) && !isEmpty(collection.dars)) {
    const darData = find((dar) => !isEmpty(dar.data))(collection.dars).data;
    return darData.projectTitle;
  }
});

const styles = {
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
    projectTitle: '25%',
    submissionDate: '10%',
    pi: '5%',
    institution: '10%',
    datasetCount: '7.5%',
    status: '7.5%',
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

const columnHeaderFormat = {
  darCode: {label: 'DAR Code', cellStyle: { width: styles.cellWidth.darCode }},
  name: {label: 'Project Title', cellStyle: { width: styles.cellWidth.projectTitle }},
  submissionDate: {label: 'Submission Date', cellStyle: {width: styles.cellWidth.submissionDate }},
  pi: {label: 'PI', cellStyle: {width: styles.cellWidth.pi }},
  institution: {label: 'Institution', cellStyle: { width: styles.cellWidth.institution }},
  datasetCount: {label: 'Datasets', cellStyle: { width: styles.cellWidth.datasetCount }},
  status: {label: 'Status', cellStyle: {width: styles.cellWidth.status }},
  actions: {label: 'Action', cellStyle: { width: styles.cellWidth.actions }}
};

const columnHeaderData = () => {
  const {darCode, name, submissionDate, pi, institution, datasetCount, status, actions} = columnHeaderFormat;
  return [darCode, name, submissionDate, pi, institution, datasetCount, status, actions];
};

const projectTitleCellData = ({projectTitle = '- -', darCollectionId, label = 'project-title'}) => {
  return {
    data: projectTitle,
    id: darCollectionId,
    style : {
      color: styles.color.projectTitle,
      fontSize: styles.fontSize.projectTitle
    },
    label
  };
};

const darCodeCellData = ({darCode = '- -', darCollectionId, label = 'dar-code'}) => {
  return {
    data: darCode,
    id: darCollectionId,
    style: {
      color: styles.color.darCode,
      fontSize: styles.fontSize.darCode,
      fontWeight: '500'
    },
    label
  };
};

const submissionDateCellData = ({createDate, darCollectionId, label = 'submission-date'}) => {
  return {
    data: isNil(createDate) ? '- - ' : formatDate(createDate),
    id: darCollectionId,
    style: {
      color: styles.color.submissionDate,
      fontSize: styles.fontSize.submissionDate
    },
    label
  };
};

const piCellData =  ({darCollectionId, pi, label = 'pi'}) => {
  return {
    data: '--',
    id: darCollectionId,
    style: {
      color: styles.color.pi,
      fontSize: styles.fontSize.pi
    },
    label
  };
};

const institutionCellData = ({darCollectionId, institution, label = 'institution'}) => {
  return {
    data: institution,
    id: darCollectionId,
    style: {
      color: styles.color.institution,
      fontSize: styles.fontSize.institution
    },
    label
  };
};

const datasetCountCellData = ({darCollectionId, datasets, label = 'datasets'}) => {
  return {
    data: datasets.length,
    id: darCollectionId,
    style: {
      color: styles.color.datasetCount,
      fontSize: styles.fontSize.datasetCount
    },
    label
  };
};

const statusCellData = ({status = '- -', darCollectionId, label = 'status'}) => {
  return {
    data: status,
    id: darCollectionId,
    style: {
      color: styles.color.status,
      fontSize: styles.fontSize.status
    },
    label
  };
};


const actionsCellData = ({collection, showConfirmationModal}) => {
  const { darCollectionId } = collection;
  const cancel = {
    isComponent: true,
    id: darCollectionId,
    style: {
      color: styles.color.actions,
      fontSize: styles.fontSize.actions
    },
    label: 'cancel-button',
    data: div(
      {
        style: {
          display: 'flex',
          justifyContent: 'left'
        },
        key: `cancel-collection-cell-${darCollectionId}`
      },
      [h(CancelCollectionButton, {collection, showConfirmationModal})]
    )};
  const revise = {
    isComponent: true,
    id: darCollectionId,
    label: 'resubmit-button',
    data: div(
      {
        style: {
          display: 'flex',
          justifyContent: 'left'
        },
        key: `resubmit-collection-cell-${darCollectionId}`
      },
      [h(ResubmitCollectionButton, {collection, showConfirmationModal})]
    )
  };

  return isCollectionCanceled(collection) ? revise : cancel;
};


const processCollectionRowData = (collections, showConfirmationModal, actionsFlag) => {
  if(!isNil(collections)) {
    return collections.map((collection) => {
      const { darCollectionId, darCode, createDate, datasets } = collection;
      const institution = collection.createUser.institution.name;
      /*I want the election-dependent status to be explicit so that the
      researcher knows why they can't cancel the collection*/
      const status = determineCollectionStatus(collection);
      const projectTitle = getProjectTitle(collection);
      const actionsButton = actionsFlag ? actionsCellData({ collection, showConfirmationModal }) : div();

      // TODO: Populate institution when https://broadworkbench.atlassian.net/browse/DUOS-1595 is complete
      return [
        darCodeCellData({ darCollectionId, darCode }),
        projectTitleCellData({ darCollectionId, projectTitle }),
        submissionDateCellData({ darCollectionId, createDate }),
        piCellData({ darCollectionId }),
        institutionCellData({ darCollectionId, institution }),
        datasetCountCellData({ darCollectionId, datasets }),
        statusCellData({ darCollectionId, status }),
        actionsButton,
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

  const { collections, isLoading, cancelCollection, resubmitCollection, actionsFlag } = props;
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

  const cancelOnClick = async() => {
    await cancelCollection(selectedCollection);
    setShowConfirmation(false);
  };

  const resubmitOnClick = async() => {
    await resubmitCollection(selectedCollection);
    setShowConfirmation(false);
  };

  const cancelModal = (collection) =>
    h(ConfirmationModal, {
      showConfirmation,
      styleOverride: {height: '35%'},
      closeConfirmation: () => setShowConfirmation(false),
      title: 'Cancel DAR Collection',
      message: `Are you sure you want to cancel ${collection.darCode}?`,
      header: getModalHeader(collection),
      onConfirm: cancelOnClick
    });

  const resubmitModal = (collection) =>
    h(ConfirmationModal, {
      showConfirmation,
      styleOverride: {height: '35%'},
      closeConfirmation: () => setShowConfirmation(false),
      title: 'Resubmit DAR Collection',
      message: `Are you sure you want to resubmit ${collection.darCode}?`,
      header: getModalHeader(collection),
      onConfirm: resubmitOnClick
    });

  const confirmationModal = (collection) => {
    if(isCollectionCanceled(collection) === true) {
      return resubmitModal(collection);
    } else {
      return cancelModal(collection);
    }
  };

  return h(Fragment, {}, [
    h(SimpleTable, {
      isLoading,
      "rowData": processCollectionRowData(visibleCollection, showConfirmationModal, actionsFlag),
      "columnHeaders": columnHeaderData(),
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
    confirmationModal(selectedCollection)
  ]);
}
