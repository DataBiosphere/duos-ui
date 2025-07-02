import React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Info } from '@mui/icons-material';
import { Styles, Theme } from 'src/libs/theme';
import { cloneDeep, findIndex, join, map, sortedUniq, sortBy, isNil, flow } from 'lodash/fp';
import SimpleTable from 'src/components/SimpleTable';
import SimpleButton from 'src/components/SimpleButton';
import PaginationBar from 'src/components/PaginationBar';
import SearchBar from 'src/components/SearchBar';
import {
  Notifications,
  recalculateVisibleTable,
  getSearchFilterFunctions,
  searchOnFilteredList
} from 'src/libs/utils';
import LibraryCardFormModal from 'src/components/modals/LibraryCardFormModal';
import ConfirmationModal from 'src/components/modals/ConfirmationModal';
import { LibraryCard } from 'src/libs/ajax/LibraryCard';
import {LibraryCardAgreementTermsDownload} from 'src/components/LibraryCardAgreementTermsDownload';
import BroadLibraryCardAgreementLink from 'src/assets/Library_Card_Agreement_2023_ApplicationVersion.pdf';
import NihLibraryCardAgreementLink from 'src/assets/NIHLibraryCardAgreement06252025.pdf';
import {
  NIHDataUseCertificationAgreement
} from 'src/components/external_docs/NIHDataUseCertificationAgreement';
import { processLibraryCards } from 'src/utils/LibraryCardUtils';

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
  return (
    <SimpleButton
      keyProp={`deactivate-card-${card.id}`}
      label="Deactivate"
      baseColor={Theme.palette.error}
      hoverStyle={{
        backgroundColor: 'rgb(194, 38,11)',
        color: 'white'
      }}
      additionalStyle={{
        padding: '2.25% 5%',
        fontSize: '1.45rem',
        fontWeight: 600,
        fontFamily: 'Montserrat'
      }}
      onClick={() => showConfirmationModal({card, message, title, confirmType: confirmModalType.delete})}
    />
  );
};

const IssueLibraryCardButton = (props) => {
  //SO should be able to add library cards to users that are not yet in the system, so userEmail needs to be a possible value to send back
  //username can be confirmed on back-end -> if userId exists pull data from db, otherwise only save email
  const {card, showConfirmationModal} = props;
  const message = (
    <div>
      {/* LCA Terms Download */}
      <LibraryCardAgreementTermsDownload />
      {'By clicking \'Confirm\' you agree to the terms of the agreements above for this user. Are you sure you want to issue this library card?'}
    </div>
  );
  const title = 'Issue Library Card';
  return (
    <SimpleButton
      keyProp={`issue-card-${card.userEmail}`}
      label="Issue"
      baseColor={Theme.palette.secondary}
      additionalStyle={{
        width: '30%',
        padding: '2.25% 5%',
        fontSize: '1.45rem',
        fontWeight: 600,
        fontFamily: 'Montserrat'
      }}
      onClick={() => showConfirmationModal({ card, message, title, confirmType: confirmModalType.issue })}
    />
  );
};

const researcherFilterFunction = getSearchFilterFunctions().signingOfficialResearchers;

const LibraryCardCell = ({
  researcher,
  showConfirmationModal,
}) => {
  const id = researcher.userId || researcher.email;
  const card = researcher.libraryCard;
  const button = !isNil(card)
    ? DeactivateLibraryCardButton({
      card,
      showConfirmationModal,
    })
    : IssueLibraryCardButton({
      card: {
        userId: researcher.userId,
        userEmail: researcher.email
      },
      showConfirmationModal
    });

  return {
    isComponent: true,
    id,
    label: 'lc-button',
    data: (
      <div
        style={{
          display: 'flex',
          justifyContent: 'left',
        }}
        key={`lc-action-cell-${id}`}
      >
        {button}
      </div>
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


const onlyResearchersWithoutCardFilter = (researcher) => {
  const card = researcher.libraryCard;
  if (isNil(card)) {
    return true;
  }
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
      } catch(_error) {
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

  const paginationBar = (
    <PaginationBar
      pageCount={pageCount}
      currentPage={currentPage}
      tableSize={tableSize}
      goToPage={goToPage}
      changeTableSize={changeTableSize}
    />
  );

  const processResearcherRowData = (researchers = []) => {
    return researchers.map(researcher => {
      const {displayName, /*count = 0,*/ roles, libraryCard} = researcher;
      const email = researcher.email || libraryCard.userEmail;
      const id = researcher.userId || email;
      return [
        displayNameCell(displayName, id),
        emailCell(email, id),
        LibraryCardCell({
          researcher,
          showConfirmationModal
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

  const issueLibraryCards = async (cards, researchers) => {
    const { successfulCards, failedCards } = await processLibraryCards(cards);

    // Update researchers list with successful cards
    if (successfulCards.length > 0) {
      const listCopy = cloneDeep(researchers);
      successfulCards.forEach((newCard) => {
        const {userEmail, userName, userId} = newCard;
        const targetIndex = findIndex((researcher) => userId === researcher.userId)(listCopy);
        if(targetIndex === -1) { //if card is not found, push new user to top of list
          listCopy.unshift({
            email: userEmail,
            displayName: userName,
            libraryCard: newCard,
            roles: [],
          });
        } else {
          listCopy[targetIndex].libraryCard = newCard;
        }
      });
      setResearchers(listCopy);
    }

    setShowConfirmation(false);
    setShowModal(false);

    const successNotificationText = `Issued ${successfulCards.length} library card${successfulCards.length > 1 ? 's' : ''}`;
    const errorNotificationText = `Error issuing library card${failedCards.length > 1 ? 's' : ''}.`;
    const warningNotificationText = `${successNotificationText}, but encountered errors issuing library cards to ${failedCards.map(fc => fc.card.userEmail || fc.card.email).join(', ')}`;

    if(successfulCards.length > 0 && failedCards.length > 0) {
      Notifications.showWarning({ text: warningNotificationText });
    } else if (successfulCards.length > 0) {
      Notifications.showSuccess({ text: successNotificationText });
    } else if (failedCards.length > 0) {
      Notifications.showError({ text: errorNotificationText });
    }
  };

  const deactivateLibraryCard = async (selectedCard, researchers) => {
    const {id, userName, userEmail, userId} = selectedCard;
    const listCopy = cloneDeep(researchers);
    const messageName = userName || userEmail;
    try {
      await LibraryCard.deleteLibraryCard(id);
      const targetIndex = findIndex((researcher) => {
        const card = researcher.libraryCard;
        return !isNil(card) && id === card.id;
      })(researchers);
      if(isNil(userId) || researchers[targetIndex].institutionId !== signingOfficial.institutionId) {
        listCopy.splice(targetIndex, 1);
      } else {
        listCopy[targetIndex].libraryCard = undefined;
      }
      setResearchers(listCopy);
      setShowConfirmation(false);
      Notifications.showSuccess({text: `Removed library card issued to ${messageName}`});
    } catch(_error) {
      Notifications.showError({text: `Error deleting library card issued to ${messageName}`});
    }
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '112%', marginLeft: '-6%' }}>
        <div style={{ ...Styles.LEFT_HEADER_SECTION, maxWidth: '60%' }}>
          <div style={{ ...Styles.HEADER_CONTAINER }}>
            <div style={{ ...Styles.SUB_HEADER,
              marginTop: '0',
              fontFamily: 'Montserrat',
              fontWeight: 600,
              fontSize: '2.8rem'}}>
              My Institution&apos;s Researchers
            </div>
            <div style={Object.assign({}, Styles.MEDIUM_DESCRIPTION, {
              fontSize: '16px',
            })}>
              Issue or Remove Library Card privileges to allow researchers to submit DARs.
              <a
                rel="noopener noreferrer"
                href="https://support.terra.bio/hc/en-us/articles/28512587249051-How-to-Pre-Authorize-Researchers-to-Submit-Data-Access-Requests-in-DUOS"
                target="_blank"
                id="so-console-info-link"
                style={{ verticalAlign: 'super' }}>
                <Info fontSize='large'/>
              </a>
            </div>
            <div style={Object.assign({}, Styles.MEDIUM_DESCRIPTION, {
              fontSize: '16px', marginTop: '1rem'
            })}>
              Issuing Library Card privileges is done in accordance with the <a target="_blank" rel="noreferrer" href={BroadLibraryCardAgreementLink}>Broad Library Card Agreement</a>, <a target="_blank" rel="noreferrer" href={NihLibraryCardAgreementLink}>NIH Library Card Agreement</a>, and <NIHDataUseCertificationAgreement/> and attests that researchers are a permanent employee of your institution at a level equivalent to, at a minimum, a tenure-track professor or senior researcher. This does <span style={{ fontWeight: 600 }}>not</span> include lab technicians or trainees, e.g., post-docs or graduate students. You also attest this Researcher will have oversight responsibility for others named on their DARs who will be granted access to the data.
            </div>
            <div style={Object.assign({}, Styles.MEDIUM_DESCRIPTION, {
              fontSize: '16px', marginTop: '1rem'
            })}>
              Note: NIH DACs are not currently using DUOS to review Data Access Requests (DARs). Signing Officials agree to review Library Cards for their institutions annually, and add/remove Library Cards as necessary.
            </div>
          </div>
        </div>
        <SearchBar handleSearchChange={handleSearchChange} searchRef={searchRef} style={{ marginLeft: '25%' }} />
        <div style={{ marginLeft: 15 }}>
          <SimpleButton
            onClick={() => showModalOnClick()}
            baseColor={Theme.palette.secondary}
            label="Add Library Card"
            additionalStyle={{
              width: '22rem',
              height: '4rem',
              padding: '4% 10%',
              fontWeight: '600' }}
          />
        </div>
      </div>
      <SimpleTable
        isLoading={isLoading}
        rowData={processResearcherRowData(visibleResearchers)}
        columnHeaders={columnHeaderData}
        styles={styles}
        tableSize={tableSize}
        paginationBar={paginationBar}
      />
      <LibraryCardFormModal
        showModal={showModal}
        createOnClick={(cards) => issueLibraryCards(cards, researchers)}
        closeModal={() => setShowModal(false)}
        users={researchers.filter(onlyResearchersWithoutCardFilter)}
        modalType="add" />
      <ConfirmationModal
        showConfirmation={showConfirmation}
        closeConfirmation={() => setShowConfirmation(false)}
        title={confirmationTitle}
        // The issue modal requires a larger view than normal
        styleOverride={confirmType === confirmModalType.issue ? { minWidth: '725px', minHeight: '475px' } : {}}
        message={confirmType === confirmModalType.delete
          ? <div>{confirmationModalMsg}</div>
          // Library Card Agreement Text
          : <div>{confirmationModalMsg}</div>}
        header={`${selectedCard.userName || selectedCard.userEmail} - ${
          !isNil(selectedCard.institution) ? selectedCard.institution.name : ''
        }`}
        onConfirm={() =>
          confirmType === confirmModalType.delete
            ? deactivateLibraryCard(selectedCard, researchers)
            : issueLibraryCards([selectedCard], researchers)}
      />
    </>
  );
}
