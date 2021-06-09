import { useState, useEffect, useCallback } from 'react';
import { div, h, img, span } from 'react-hyperscript-helpers';
import { pick } from 'lodash/fp';
// import { LibraryCard } from '../libs/ajax'; //NOTE: re-enable this once ajax updates have been merged and function has been moved
import SearchBar from '../components/SearchBar';
import { Notifications, tableSearchHandler, updateLibraryCardListFn, calcTablePageCount} from '../libs/utils';
import { Styles } from '../libs/theme';
import lockIcon from '../images/lock-icon.png';
// import { Style } from '@material-ui/icons';
import SimpleTable from '../components/SimpleTable';
import PaginationBar from '../components/PaginationBar';
//import modal(s) for LC (may need to make new ones as well)
//may need to make a skeleton loader for SimpleTable
//NOTE: below two imports are temporary, move these when ajax updates have been merged in
import axios from 'axios';
import {Config} from '../libs/config';

//NOTE: temp const for Styles
//Add to Theme when finalized
const styles = {
  baseStyle: {
    fontFamily: 'Arial',
    fontSize: '14px',
    fontWeight: 400
  },
  columnStyle: {
    fontWeight: 600,
    fontSize: '16px'
  }
};

//NOTE: below is here temporarily
//When ajax updates are merged in move the function there

const LibraryCard = {
  getAllLibraryCards: async() => {
    const url = `${await Config.getApiUrl()}/libraryCards`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  }
};

//NOTE: need to add this to columns once table component renders/processes correctly
const glyphiconSortIcon = ({ isHeader, sortFunc, descOrder }) =>
  span({
    className: 'glyphicon sort-icon glyphicon-sort',
    onClick:
      !isHeader &&
      sortFunc({
        sortKey: 'dac.name',
        descendantOrder: descOrder,
      }),
  });

// NOTE: use this function as a reference for setting up sorting buttons on column
// const tableHeaderTemplate = ({ allowSort }) => {
//   return [
//     div({ style: Styles.TABLE.DATA_ID_CELL, className: 'cell-sort' }, [
//       'Library Card ID',
//       glyphiconSortIcon(allowSort),
//     ]),
//     div({ style: Styles.TABLE.TITLE_CELL, className: 'cell-sort' }, [
//       'Researcher',
//       glyphiconSortIcon(allowSort),
//     ]),
//     div({ style: Styles.TABLE.TITLE_CELL, className: 'cell-sort' }, [
//       'Institution',
//       glyphiconSortIcon(allowSort),
//     ]),
//     div({ style: Styles.TABLE.TITLE_CELL, className: 'cell-sort' }, [
//       'era Commons ID',
//       glyphiconSortIcon(allowSort),
//     ]),
//     div({ style: Styles.TABLE.TITLE_CELL, className: 'cell-sort' }, [
//       'Signing Official',
//       glyphiconSortIcon(allowSort),
//     ]),
//     div({ style: Styles.TABLE.SUBMISSION_DATE_CELL, className: 'cell-sort' }, [
//       'Create Date',
//       glyphiconSortIcon(allowSort),
//     ]),
//   ];
// };

export default function AdminManageLC() {
  //NOTE: assume user details are attached to LC req
  const [libraryCards, setLibraryCards] = useState();
  const [tableSize, setTableSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredCards, setFilteredCards] = useState();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const init = async() => {
      setIsLoading(true);
      try{
        const cards = await LibraryCard.getAllLibraryCards();
        setLibraryCards(cards);
        setFilteredCards(cards);
        calcTablePageCount(tableSize, filteredCards);
        setIsLoading(false);
      } catch(error) {
        Notifications.showError({text: 'Error: unable to retrieve library cards from server'});
        setIsLoading(false);
      }
    };
    init();
  }, [filteredCards, tableSize]);

  //Use this callback function if you're updating attributes on a library card
  //NOTE: method will most likely be passed into modals that will handle the change
  const getUpdateListFn = useCallback(() => {
    return updateLibraryCardListFn(filteredCards, setFilteredCards, libraryCards, setLibraryCards, currentPage, tableSize);
  }, [filteredCards, libraryCards, currentPage, tableSize]);

  //column row metadata for simple table to process rows
  const columnHeaderData = [
    {label: 'ID', cellStyle: {width: '20%'}},
    {label: 'Researcher', cellStyle: {width: '20%'}},
    {label: 'Institution', cellStyle: {width: '20%'}},
    {label: 'era Commons ID', cellStyle: {width: '20%'}},
    {label: 'Signing Official', cellStyle: {width: '20%'}},
    {label: 'Create Date', cellStyle: {width: '20%'}},
  ];

  const generateRowData = (cards) => {
    return cards.map((card) => 
      pick(['id', 'userName', 'institution', 'eraCommonsId', 'createDate'])(card)
    );
  };

  //Search function for SearchBar component
  const handleSearchChange = tableSearchHandler(filteredCards, setFilteredCards, setCurrentPage, "libraryCard");

  //NOTE: define template for th and td here, process into arrays and then pass into table template for render
  //For simple data just pass in basic data
  //For pre-computed components pass component
  //Define base style for column data and column header for reference

  return div({ style: Styles.PAGE }, [
    div({ style: { display: 'flex', justifyContent: 'space-between' } }, [
      div(
        { className: 'left-header-section', style: Styles.LEFT_HEADER_SECTION },
        [
          div({ style: Styles.ICON_CONTAINER }, [
            img({
              id: 'lock-icon',
              src: lockIcon,
              style: Styles.HEADER_IMG,
            }),
          ]),
          div({ style: Styles.HEADER_CONTAINER }, [
            div({ style: Styles.TITLE }, ['Manage Library Cards']),
            div(
              {
                style: Object.assign({}, Styles.MEDIUM_DESCRIPTION, {
                  fontSize: '18px',
                }),
              },
              ['Select and manage Library Cards']
            ),
          ]),
        ]
      ),
      h(SearchBar, { handleSearchChange }),
    ]),
    h(SimpleTable, {
      isLoading,
      //NOTE: should I limit the cards to the current window of cards or pass in the entire list?
      rowData: generateRowData(filteredCards),
      columnHeaders: columnHeaderData,
      styles,
      //Insert Skeleton loader here, may need to make a new one
    }),
    h(PaginationBar, {
      pageCount,
      currentPage,
      tableSize,
      goToPage: setCurrentPage,
      changeTableSize: setTableSize,
    }),
  ]);


}