import { useState, useEffect, Fragment, useRef, useCallback } from 'react';
import { div, h } from 'react-hyperscript-helpers';
import { Styles, Theme } from '../../libs/theme';
import SearchBar from '../SearchBar';
import SimpleButton from '../SimpleButton';
import { tableSearchHandler, searchOnFilteredList } from '../../libs/utils';
import { Notifications } from '../../libs/utils';

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

const CancelCollectionButton = (props) => {
  return h(SimpleButton, {
    keyProp: `cancel-collection-${props.collection}`,
    label: 'Cancel',
    baseColor: Theme.palette.primary,
    additionalStyle: {
      width: '30%',
      padding: '2%',
      fontSize: '1.45rem'
    },
    onClick: () => props.showConfirmationModal(props.collection)
  });
};


export default function DARCollectionTable(props) {
  const [collections, setCollections] = useState([]);
  const [filteredCollections, setFilteredCollections] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [tableSize, setTableSize] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState();
  // const searchRef = useRef(''); //May not need this, could just pass in the value from the parent

  //Ajax fetch should be passed into component due to it being a token based response or not
  const { fetchCollections, isLoading } = props;

  //Helper function, defines the term matching function
  const handleSearchChange = tableSearchHandler(
    collections,
    setFilteredCollections,
    setCurrentPage,
    'darCollections'
  );

  const getCurrentList = () => {};

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
    handleSearchChange(props.searchTerms);
  }, [handleSearchChange, props.searchTerms]);

  //NOTE: create useEffect function to update table on page change, tableSize change
  useEffect(() => {}, [tableSize, currentPage]);

  const showConfirmationModal = (collection) => {
    setSelectedCollection(collection);
    setShowModal(true);
  };

  //Helper function to update page
  const goToPage = useCallback(
    (value) => {
      goToPage(value, pageCount, setCurrentPage);
    },
    [pageCount]
  );

  return h(Fragment, {}, [
    div(
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end ',
        },
      },
      [
        div({ style: Styles.LEFT_HEADER_SECTION }, [
          //need to figure out what to do here, can't have awkward empty space
          //NOTE: should I pass tab control from the parent (where it is defined) to be rendered here?
        ]),
        h(SearchBar, { handleSearchChange, searchRef }),
      ]
    ),
  ]);
}
