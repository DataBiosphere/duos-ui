import { useState, useEffect, useCallback } from 'react';
import { div, h, img, span } from 'react-hyperscript-helpers';
import {isEmpty, isNaN, cloneDeep, findIndex } from 'lodash/fp';
import { Institution, User } from '../libs/ajax';
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
import moment from 'moment';
import LibraryCardFormModal from '../components/modals/LibraryCardFormModal';

//NOTE: temp const for Styles
//Add to Theme when finalized
const styles = {
  baseStyle: {
    fontFamily: 'Arial',
    fontSize: '14px',
    fontWeight: 400,
    display: 'flex',
    padding: '1rem 2%'
  },
  columnStyle: Styles.TABLE.HEADER_ROW,
  cellWidths: {
    id: '20%',
    researcher: '20%',
    institution: '20%',
    eraCommonsId: '20%',
    createDate: '20%'
  }
};

//following cell functions format the data for processing within simple table
const idCell = (id) => {
  return {
    data: id,
    style: {width: styles.cellWidths.id},
  };
};

const userNameCell = (userName, onClick) => {
  return {
    data: userName,
    style: {width: styles.cellWidths.researcher},
    onClick
  };
};

const institutionCell = (institutionName) => {
  return {
    data: institutionName,
    style: {width: styles.cellWidths.institution}
  };
};

const eraCommonsCell = (eraCommonsId) => {
  return {
    data: eraCommonsId,
    style: {width: styles.cellWidths.eraCommonsId}
  };
};

const createDateCell = (createDate) => {
  return {
    data: moment(createDate).format('YYYY-MM-DD'),
    style: {width: styles.cellWidths.createDate}
  };
};

//NOTE: below is here temporarily
//When ajax updates are merged in move the function there
//Need to merge in develop as well
const LibraryCard = {
  getAllLibraryCards: async () => {
    const url = `${await Config.getApiUrl()}/libraryCards`;
    const res = await axios.get(url, Config.authOpts());
    return res.data;
  },
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

//column row metadata for simple table to process rows
const columnHeaderFormat = {
  id: {label: 'ID', cellStyle: {width: styles.cellWidths.id}},
  researcher: {label: 'Researcher', cellStyle: {width: styles.cellWidths.researcher}},
  institution: {label: 'Institution', cellStyle: {width: styles.cellWidths.institution}},
  eraCommonsId: {label: 'era Commons ID', cellStyle: {width: styles.cellWidths.eraCommonsId}},
  createDate: {label: 'Create Date', cellStyle: {width: styles.cellWidths.createDate}},
};

export default function AdminManageLC() {
  //NOTE: assume user details are attached to LC req
  const [libraryCards, setLibraryCards] = useState();
  const [tableSize, setTableSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredCards, setFilteredCards] = useState([]);
  const [viewIndex, setViewIndex] = useState();
  const [showModal, setShowModal] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentCard, setCurrentCard] = useState();

  useEffect(() => {
    const initData = async() => {
      const dataPromiseArray = await Promise.all([
        LibraryCard.getAllLibraryCards,
        Institution.list(),
        User.list()
      ]);
      const cards = dataPromiseArray[0];
      const institutions = dataPromiseArray[1];
      const users = dataPromiseArray[2];
      setLibraryCards(cards);
      setFilteredCards(cards);
      setInstitutions(institutions);
      setUsers(users);
      setIsLoading(false);
    };
    try{
      initData();
    } catch(error) {
      Notifications.showError('Error: Failed to initialize component');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async() => {
      try{
        setIsLoading(true);
        setPageCount(calcTablePageCount(tableSize, filteredCards));
        setIsLoading(false);
      } catch(error) {
        Notifications.showError({text: 'Error updating Library Card table'});
        setIsLoading(false);
      }
    };
    init();
  }, [filteredCards, tableSize]);

  const processLCData = (cards) => {
    return cards.map((card) => {
      return [
        idCell(card.id),
        userNameCell(card.userName, showModalOnClick),
        !isEmpty(card.institution) ? institutionCell(card.institution.name) : institutionCell('- -'),
        eraCommonsCell(card.eraCommonsId),
        createDateCell(card.createDate)
      ];
    });
  };

  const goToPage = (value) => {
    if(value > 1 && value <= pageCount) {
      setCurrentPage(value);
    }
  };

  const changeTableSize = (value) => {
    if(value > 0 && !isNaN(parseInt(value))) {
      setTableSize(value);
    }
  };

  const paginationBar = h(PaginationBar, {
    pageCount,
    currentPage,
    tableSize,
    goToPage,
    changeTableSize,
  });

  //NOTE: update function to be sent to modal
  //modal will only get the target card to change
  //card will have id which can be used to find the target call in each list
  //therefore function should only send the filteredList, originalList, set for the two, and the payload
  const updateListFn = (filteredCards, setFilteredCards, libraryCards, setLibraryCards, payload) => {
    try{
      const id = payload.id;
      let filteredCopy = cloneDeep(filteredCards);
      let libraryCopy = cloneDeep(libraryCards);
      let filteredIndex = findIndex((card) => card.id === id);
      let originalIndex = findIndex((card) => card.id === id);
      filteredCopy[filteredIndex] = payload;
      libraryCopy[originalIndex] = payload;
      setFilteredCards(filteredCopy);
      setLibraryCards(libraryCopy);
      Notifications.showSuccess(`${payload.userName}'s library cardd successfully updated`);
    } catch(error) {
      Notification.error('Error: Failed to update library card');
    }
  };

  const showModalOnClick = (card) => {
    setCurrentCard(card);
    setShowModal(true);
  };

  //add signingOfficial when feature is implemented
  const columnHeaderData = [
    columnHeaderFormat.id,
    columnHeaderFormat.researcher,
    columnHeaderFormat.institution,
    columnHeaderFormat.eraCommonsId,
    columnHeaderFormat.createDate
  ];

  //Search function for SearchBar component
  const handleSearchChange = tableSearchHandler(libraryCards, setFilteredCards, setCurrentPage, "libraryCard");

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
      rowData: processLCData(filteredCards),
      columnHeaders: columnHeaderData,
      styles,
      tableSize,
      paginationBar
      //Insert Skeleton loader here, may need to make a new one
    }),
    h(LibraryCardFormModal, {
      isRendered: showModal,
      updateFn: updateLibraryCardListFn,
      closeModal: () => setShowModal(false),

    })
  ]);


}