import { useState, useEffect } from 'react';
import { div, h, img, span } from 'react-hyperscript-helpers';
import {isEmpty, isNaN, cloneDeep, findIndex, isEqual, find, isNil } from 'lodash/fp';
import { Institution, User } from '../libs/ajax';
// import { LibraryCard } from '../libs/ajax'; //NOTE: re-enable this once ajax updates have been merged and function has been moved
import SearchBar from '../components/SearchBar';
import { Notifications, tableSearchHandler, calcTablePageCount, calcVisibleWindow} from '../libs/utils';
import { Styles } from '../libs/theme';
import lockIcon from '../images/lock-icon.png';
// import { Style } from '@material-ui/icons';
import SimpleTable from '../components/SimpleTable';
import PaginationBar from '../components/PaginationBar';
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
    padding: '1rem 2%',
    justifyContent: 'space-between'
  },
  columnStyle: Object.assign({}, Styles.TABLE.HEADER_ROW, {justifyContent: 'space-between'}),
  cellWidths: {
    researcher: '15%',
    email: '20%',
    institution: '20%',
    eraCommonsId: '15%',
    createDate: '12%'
  },
};

//following cell functions format data for processing within the SimpleTable component
const emailCell = (email, id) => {
  return {
    data: email || '- -',
    style: {width: styles.cellWidths.email},
    id,
    label: 'email'
  };
};

const userNameCell = (userName, onClick, id) => {
  return {
    data: userName || '- -',
    style: {width: styles.cellWidths.researcher},
    id,
    onClick,
    label: 'username'
  };
};

const institutionCell = (institutionName, id) => {
  return {
    data: institutionName || '- -',
    id,
    style: {width: styles.cellWidths.institution},
    label: 'institution'
  };
};

const eraCommonsCell = (eraCommonsId, id) => {
  return {
    data: eraCommonsId || '- -',
    id,
    style: {width: styles.cellWidths.eraCommonsId},
    label: 'era-commons-id'
  };
};

const createDateCell = (createDate, id) => {
  return {
    data: !isNil(createDate) ? moment(createDate).format('YYYY-MM-DD') : '- -',
    id,
    style: {width: styles.cellWidths.createDate},
    label: 'create-date'
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
  createLibraryCard: async (card) => {
    const url = `${await Config.getApiUrl()}/libraryCards`;
    const res = await axios.post(url, card, Config.authOpts(),);
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

//column row metadata for SimpleTable
const columnHeaderFormat = {
  email: {label: 'Email', cellStyle: {width: styles.cellWidths.email}},
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
  const [visibleCards, setVisibleCards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentCard, setCurrentCard] = useState();
  const [modalType, setModalType] = useState();

  useEffect(() => {
    const initData = async() => {
      const dataPromiseArray = await Promise.all([
        LibraryCard.getAllLibraryCards(),
        Institution.list(),
        User.list()
      ]);
      const cards = dataPromiseArray[0];
      const institutions = dataPromiseArray[1].map((institution) => {
        return {
          ...institution,
          key: institution.id,
          displayText: institution.name
        };
      });
      const users = dataPromiseArray[2];
      setLibraryCards(cards);
      setFilteredCards(cards);
      const visibleList = calcVisibleWindow(
        currentPage,
        tableSize,
        cards
      );
      setVisibleCards(visibleList);
      setInstitutions(institutions);
      setUsers(users);
      setIsLoading(false);
    };
    try{
      initData();
    } catch(error) {
      Notifications.showError({text:'Error: Failed to initialize component'});
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async() => {
      try{
        setIsLoading(true);
        setPageCount(calcTablePageCount(tableSize, filteredCards));
        if(currentPage > pageCount) {
          setCurrentPage(pageCount);
        }
        const visibleList = calcVisibleWindow(currentPage, tableSize, filteredCards);
        setVisibleCards(visibleList);
        setIsLoading(false);
      } catch(error) {
        Notifications.showError({text: 'Error updating Library Card table'});
        setIsLoading(false);
      }
    };
    init();
  }, [filteredCards, tableSize, currentPage, pageCount]);

  const processLCData = (cards = []) => {
    return cards.map((card) => {
      return [
        userNameCell(card.userName, () => showModalOnClick(card, "update"), card.id),
        emailCell(card.userEmail, card.id),
        !isEmpty(card.institution) ? institutionCell(card.institution.name, card.id) : institutionCell('- -', card.id),
        eraCommonsCell(card.eraCommonsId, card.id),
        createDateCell(card.createDate, card.id)
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

  //update function when element in array is updated via modal
  const updateListFn = (payload) => {
    try{
      const id = payload.id;
      const institution = find(institution => institution.id === payload.institutionId)(institutions);
      payload.institution = institution;
      let filteredCopy = cloneDeep(filteredCards);
      let libraryCopy = cloneDeep(libraryCards);
      let filteredIndex = findIndex((card) => card.id === id)(filteredCards);
      let originalIndex = findIndex((card) => card.id === id)(libraryCopy);
      filteredCopy[filteredIndex] = payload;
      libraryCopy[originalIndex] = payload;
      setFilteredCards(filteredCopy);
      setLibraryCards(libraryCopy);
      setShowModal(false);
      Notifications.showSuccess({text:`${payload.userName}'s library card successfully updated`});
    } catch(error) {
      setShowModal(false);
      Notifications.showError({text:'Error: Failed to update library card'});
    }
  };

  const addLibraryCard = async (card) => {
    try {
      //check if card combination already exits, show error if it does
      const alreadyExists = findIndex(
        element => isEqual(element.institutionId)(card.institutionId)
        && (element.userId === card.userId) || isEqual(element.userEmail)(card.userEmail));
      const newCard = await LibraryCard.createLibraryCard(card);
      if(alreadyExists > -1) {
        Notifications.showError({text:"Library Card already exists"});
      //otherwise execute library card update with payload, get the updated card, and
      //add(with sort afterwards) library card to libraryCards (reference list)
      } else {
        const updatedList = cloneDeep(libraryCards);
        updatedList.push(newCard);
        updatedList.sort((a, b) => a - b);
        setLibraryCards(updatedList);
        setShowModal(false);
      }
    } catch (error) {
      setShowModal(false);
      Notifications.showError({text:'Error: Failed to create new library card'});
    }
  };

  //onClick function to show target card via modal
  const showModalOnClick = (card, type) => {
    setCurrentCard(cloneDeep(card));
    setModalType(type);
    setShowModal(true);
  };

  //add signingOfficial when feature is implemented
  const columnHeaderData = [
    columnHeaderFormat.researcher,
    columnHeaderFormat.email,
    columnHeaderFormat.institution,
    columnHeaderFormat.eraCommonsId,
    columnHeaderFormat.createDate,
  ];

  //Search function for SearchBar component
  const handleSearchChange = tableSearchHandler(libraryCards, setFilteredCards, setCurrentPage, "libraryCard");

  //template for render
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
      rowData: processLCData(visibleCards),
      columnHeaders: columnHeaderData,
      styles,
      tableSize,
      paginationBar
    }),
    div({style: {marginLeft: "90%"}}, [
      div({
        onClick: () => showModalOnClick({}, "add")
      }, ['Add Library Card'])
    ]),
    h(LibraryCardFormModal, {
      showModal,
      updateOnClick: updateListFn,
      createOnClick: addLibraryCard,
      closeModal: () => setShowModal(false),
      institutions,
      users,
      card: currentCard,
      modalType
    })
  ]);
}