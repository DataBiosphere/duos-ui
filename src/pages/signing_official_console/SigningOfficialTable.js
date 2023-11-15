import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { Styles, Theme } from '../../libs/theme';
import { a, h, div } from 'react-hyperscript-helpers';
import { cloneDeep, find, findIndex, join, map, sortedUniq, sortBy, isEmpty, isNil, flow, filter } from 'lodash/fp';
import SimpleTable from '../../components/SimpleTable';
import SimpleButton from '../../components/SimpleButton';
import PaginationBar from '../../components/PaginationBar';
import SearchBar from '../../components/SearchBar';
import {
  Notifications,
  recalculateVisibleTable,
  getSearchFilterFunctions,
  searchOnFilteredList

} from '../../libs/utils';
import LibraryCardFormModal from '../../components/modals/LibraryCardFormModal';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { LibraryCard } from '../../libs/ajax';
import LcaMarkdown from '../../assets/LCA.md';
import {LibraryCardAgreementTermsDownload} from '../../components/LibraryCardAgreementTermsDownload';
import BroadLibraryCardAgreementLink from '../../assets/Library_Card_Agreement_2023_ApplicationVersion.pdf';
import NhgriLibraryCardAgreementLink from '../../assets/NIH_Library_Card_Agreement_11_17_22_version.pdf';
import ScrollableMarkdownContainer from '../../components/ScrollableMarkdownContainer';

//Styles specific to this table
const styles = {
  baseStyle: {
    fontFamily: 'Montserrat',
    fontSize: '1.45rem',
    fontWeight: 400,
    color: 'rgb(53, 64, 82)',
    display: 'flex',
    padding: '1rem 2%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  columnStyle: Object.assign({}, Styles.TABLE.HEADER_ROW, {
    justifyContent: 'space-between',
  }),
  cellWidths: {
    email: '25%',
    name: '20%',
    libraryCard: '25%',
    role: '20%',
  },
};

//column header format for table
const columnHeaderFormat = {
  email: {label: 'Email', cellStyle: {width: styles.cellWidths.email}},
  name: {label: 'Name', cellStyle: {width: styles.cellWidths.name}},
  libraryCard: {label: 'Library Card', cellStyle: {width: styles.cellWidths.libraryCard}},
  role: {label: 'Role', cellStyle: {width: styles.cellWidths.libraryCard}},
  // activeDARs: {label: 'Active DARs', cellStyle: {width: styles.cellWidths.activeDARs}}
};

// Used to determine which modal type to use for either issuing or deleting a Library Card.
export const confirmModalType = {
  issue: 'issue',
  delete: 'delete'
};

const DeactivateLibraryCardButton = (props) => {
  const {card = {}, showConfirmationModal} = props;
  const message = 'Are you sure you want to deactivate this library card?';
  const title = 'Deactivate Library Card';
  return h(SimpleButton, {
    keyProp: `deactivate-card-${card.id}`,
    label: 'Deactivate',
    baseColor: Theme.palette.error,
    hoverStyle: {
      backgroundColor: 'rgb(194, 38,11)',
      color: 'white'
    },
    additionalStyle: {
      padding: '2.25% 5%',
      fontSize: '1.45rem',
      fontWeight: 600,
      fontFamily: 'Montserrat'
    },
    onClick: () => showConfirmationModal({card, message, title, confirmType: confirmModalType.delete})
  });
};

const IssueLibraryCardButton = (props) => {
  //SO should be able to add library cards to users that are not yet in the system, so userEmail needs to be a possible value to send back
  //username can be confirmed on back-end -> if userId exists pull data from db, otherwise only save email
  //institution id should be determined from the logged in SO account on the back-end
  const {card, showConfirmationModal} = props;
  const message = div({}, [
    // LCA Terms Download
    LibraryCardAgreementTermsDownload,
    'Are you sure you want to issue this library card?']);
  const title = 'Issue Library Card';
  return h(SimpleButton, {
    keyProp: `issue-card-${card.userEmail}`,
    label: 'Issue',
    baseColor: Theme.palette.secondary,
    additionalStyle: {
      width: '30%',
      padding: '2.25% 5%',
      fontSize: '1.45rem',
      fontWeight: 600,
      fontFamily: 'Montserrat'
    },
    onClick: () => showConfirmationModal({ card, message, title, confirmType: confirmModalType.issue }),
  });
};

const researcherFilterFunction = getSearchFilterFunctions().signingOfficialResearchers;

const LibraryCardCell = ({
  researcher,
  showConfirmationModal,
  institutionId
}) => {
  const id = researcher.userId || researcher.email;
  const card = !isEmpty(researcher.libraryCards)
    ? find((card) => card.institutionId === institutionId)(researcher.libraryCards)
    : null;
  const button = !isNil(card)
    ? DeactivateLibraryCardButton({
      card,
      showConfirmationModal,
    })
    : IssueLibraryCardButton({
      card: {
        userId: researcher.userId,
        userEmail: researcher.email,
        institutionId: institutionId
      },
      showConfirmationModal
    });

  return {
    isComponent: true,
    id,
    label: 'lc-button',
    data: div(
      {
        style: {
          display: 'flex',
          justifyContent: 'left',
        },
        key: `lc-action-cell-${id}`,
      },
      [button]
    ),
  };
};

const roleCell = (roles, id) => {

  const roleString = flow(
    map((role) => role.name),
    sortBy((name) => name),
    sortedUniq,
    join(', ')
  )(roles);

  return {
    data: roleString || '- -',
    id,
    style: {},
    label: 'user-role'
  };
};

const emailCell = (email, id) => {
  return {
    data: email || '- -',
    id,
    style: {},
    label: 'user-email'
  };
};

const displayNameCell = (displayName, id) => {
  return {
    data: displayName || 'Invite sent, pending registration',
    id,
    style: {},
    label: 'display-name'
  };
};


const onlyResearchersWithoutCardFilter = (institutionId) => (researcher) => {
  const cards = researcher.libraryCards;
  if (isEmpty(cards)) {
    return true;
  }

  return isNil(find((card) => card.institutionId === institutionId)(researcher.libraryCards));
};

export default function SigningOfficialTable(props) {
  const [researchers, setResearchers] = useState(props.researchers || []);
  const [tableSize, setTableSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [filteredResearchers, setFilteredResearchers] = useState([]);
  const [visibleResearchers, setVisibleResearchers] = useState([]);
  const [selectedCard, setSelectedCard] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const searchRef = useRef('');
  const [confirmationModalMsg, setConfirmationModalMsg] = useState('');
  const [confirmationTitle, setConfirmationTitle] = useState('');
  const [confirmType, setConfirmType] = useState(confirmModalType.delete);
  const { signingOfficial, isLoading } = props;

  //Search function for SearchBar component, function defined in utils
  const handleSearchChange = useCallback((searchTerms) => {
    searchOnFilteredList(
      searchTerms,
      researchers,
      researcherFilterFunction,
      setFilteredResearchers
    );
  }, [researchers]);

  const showConfirmationModal = ({card, message, title, confirmType}) => {
    setSelectedCard(card);
    setShowConfirmation(true);
    setConfirmationModalMsg(message);
    setConfirmationTitle(title);
    setConfirmType(confirmType);
  };

  //init hook, need to make ajax calls here
  useEffect(() => {
    const init = async() => {
      try{
        setResearchers(props.researchers);
      } catch(error) {
        Notifications.showError({text: 'Failed to initialize researcher table'});
      }
    };
    init();
  }, [props.researchers]);

  useEffect(() => {
    searchOnFilteredList(
      searchRef.current.value, researchers,
      researcherFilterFunction, setFilteredResearchers
    );
  }, [researchers]);

  useEffect(() => {
    recalculateVisibleTable({
      tableSize, pageCount,
      filteredList: filteredResearchers,
      currentPage,
      setPageCount,
      setCurrentPage,
      setVisibleList: setVisibleResearchers
    });
  }, [tableSize, pageCount, filteredResearchers, currentPage]);

  const goToPage = useCallback((value) => {
    if (value >= 1 && value <= pageCount) {
      setCurrentPage(value);
    }
  }, [pageCount]);

  const changeTableSize = useCallback((value) => {
    if (value > 0 && !isNaN(parseInt(value))) {
      setTableSize(value);
    }
  }, []);

  const paginationBar = h(PaginationBar, {
    pageCount,
    currentPage,
    tableSize,
    goToPage,
    changeTableSize
  });

  const processResearcherRowData = (researchers = []) => {
    return researchers.map(researcher => {
      const {displayName, /*count = 0,*/ roles, libraryCards} = researcher;
      const libraryCard = !isEmpty(libraryCards) ? libraryCards[0] : {};
      const email = researcher.email || libraryCard.userEmail;
      const id = researcher.userId || email;
      return [
        displayNameCell(displayName, id),
        emailCell(email, id),
        LibraryCardCell({
          researcher,
          showConfirmationModal,
          institutionId: signingOfficial.institutionId
        }),
        roleCell(roles, id),
        // activeDarCountCell(count, id)
      ];
    });
  };

  const columnHeaderData = [
    columnHeaderFormat.name,
    columnHeaderFormat.email,
    columnHeaderFormat.libraryCard,
    columnHeaderFormat.role,
    // columnHeaderFormat.activeDARs -> add this back in when back-end supports this
  ];

  const showModalOnClick = () => {
    setSelectedCard({institutionId: signingOfficial.institutionId});
    setShowModal(true);
  };

  const issueLibraryCard = async (selectedCard, researchers) => {
    let messageName;
    try {
      const listCopy = cloneDeep(researchers);
      const newLibraryCard = await LibraryCard.createLibraryCard(selectedCard);
      const {userEmail, userName, userId} = newLibraryCard;
      let targetIndex = findIndex((researcher) => userId === researcher.userId)(listCopy);
      //library cards array should only have one card MAX (officials should not be able to see cards from other institutions)
      if(targetIndex === -1) { //if card is not found, push new user to top of list
        const targetUnregisteredResearcher = find((researcher) => userId === researcher.userId)(props.unregisteredResearchers);
        const attributes = {
          email: userEmail,
          displayName: userName,
          libraryCards: [newLibraryCard],
          roles: [],
        };
        if(!isNil(targetUnregisteredResearcher)) {
          attributes.roles = targetUnregisteredResearcher.roles;
        }
        listCopy.unshift(attributes);
        messageName = userEmail;
      } else {
        listCopy[targetIndex].libraryCards = [newLibraryCard];
        messageName = userName;
      }
      setResearchers(listCopy);
      setShowConfirmation(false);
      setShowModal(false);
      Notifications.showSuccess({text: `Issued new library card to ${messageName}`});
    } catch(error) {
      Notifications.showError({text: `Error issuing library card to ${messageName}`});
    }
  };

  const deactivateLibraryCard = async (selectedCard, researchers) => {
    const {id, userName, userEmail, userId} = selectedCard;
    const listCopy = cloneDeep(researchers);
    const messageName = userName || userEmail;
    try {
      await LibraryCard.deleteLibraryCard(id);
      const targetIndex = findIndex((researcher) => {
        const libraryCards = researcher.libraryCards || [];
        const card = libraryCards[0];
        return !isNil(card) && id === card.id;
      })(researchers);
      if(isNil(userId) || researchers[targetIndex].institutionId !== signingOfficial.institutionId) {
        listCopy.splice(targetIndex, 1);
      } else {
        listCopy[targetIndex].libraryCards = [];
      }
      setResearchers(listCopy);
      setShowConfirmation(false);
      Notifications.showSuccess({text: `Removed library card issued to ${messageName}`});
    } catch(error) {
      Notifications.showError({text: `Error deleting library card issued to ${messageName}`});
    }
  };

  const lcaContent = ScrollableMarkdownContainer({markdown: LcaMarkdown});

  return h(Fragment, {}, [
    div({ style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '112%', marginLeft: '-6%' } }, [
      div({ style: Styles.LEFT_HEADER_SECTION }, [
        div({ style: { ...Styles.HEADER_CONTAINER , marginRight: '-7%' }}, [
          div({ style: { ...Styles.SUB_HEADER,
            marginTop: '0',
            fontFamily: 'Montserrat',
            fontWeight: 600,
            fontSize: '2.8rem'}
          }, [
            'My Institution\'s Researchers',]),
          div({
            style: Object.assign({}, Styles.MEDIUM_DESCRIPTION, {
              fontSize: '16px',
            }),
          },[
            'Issue or Remove Library Card privileges to allow researchers to submit DARs.',
            a({
              rel: 'noopener noreferrer',
              href: 'https://broad-duos.zendesk.com/hc/en-us/articles/360060402751-Signing-Official-User-Guide',
              target: '_blank',
              id: 'so-console-info-link',
              style: { verticalAlign: 'super' }},
            ['i']),
          ]),
          div({
            style: Object.assign({}, Styles.MEDIUM_DESCRIPTION, {
              fontSize: '16px',
            }),
          },[
            'Issuing Library Card privileges is done in accordance with the ', a({target: '_blank', href: BroadLibraryCardAgreementLink}, ['Broad']), ' and ', a({target: '_blank', href: NhgriLibraryCardAgreementLink}, ['NHGRI']), ' Library Card Agreements.',

          ]),
        ]),
      ]),
      h(SearchBar, {style: {marginLeft: '25%'}}, { handleSearchChange, searchRef }),
      div({style: { marginLeft: 15 }}, [
        h(SimpleButton, {
          onClick: () => showModalOnClick(),
          baseColor: Theme.palette.secondary,
          label: 'Add Library Card',
          additionalStyle: {
            width: '22rem',
            height: '4rem',
            padding: '4% 10%',
            fontWeight: '600'
          }
        }),
      ])
    ]),
    h(SimpleTable, {
      isLoading,
      rowData: processResearcherRowData(visibleResearchers),
      columnHeaders: columnHeaderData,
      styles,
      tableSize,
      paginationBar,
    }),
    h(LibraryCardFormModal, {
      showModal,
      createOnClick: (card) => issueLibraryCard(card, researchers),
      closeModal: () => setShowModal(false),
      card: selectedCard,
      users: filter(onlyResearchersWithoutCardFilter(signingOfficial.institutionId))(researchers),
      institutions: [], //pass in empty array to force modal to hide institution dropdown
      modalType: 'add',
      lcaContent: lcaContent
    }),
    h(ConfirmationModal, {
      showConfirmation,
      closeConfirmation: () => setShowConfirmation(false),
      title: confirmationTitle,
      // The issue modal requires a larger view than normal
      styleOverride: confirmType === confirmModalType.issue ? { minWidth: '725px', minHeight: '475px' } : {},
      message:
        confirmType === confirmModalType.delete
          ? div({}, [confirmationModalMsg])
          // Library Card Agreement Text
          : div({}, [lcaContent, confirmationModalMsg]),
      header: `${selectedCard.userName || selectedCard.userEmail} - ${
        !isNil(selectedCard.institution) ? selectedCard.institution.name : ''
      }`,
      onConfirm: () =>
        confirmType === confirmModalType.delete
          ? deactivateLibraryCard(selectedCard, researchers)
          : issueLibraryCard(selectedCard, researchers)
    }),
  ]);
}