import React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Checkbox } from '@mui/material';
import { Styles, Theme } from '../../libs/theme';
import { cloneDeep, find, findIndex, join, map, sortedUniq, sortBy, isEmpty, isNil, flow, filter } from 'lodash/fp';
import SimpleTable from '../../components/SimpleTable';
import PaginationBar from '../../components/PaginationBar';
import SearchBar from '../../components/SearchBar';
import { DownloadLink } from '../../components/DownloadLink';
import {
  Notifications,
  recalculateVisibleTable,
  getSearchFilterFunctions,
  searchOnFilteredList
} from '../../libs/utils';
import { DAA } from '../../libs/ajax/DAA';
import Button from '@mui/material/Button';
import { title } from 'process';

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
    backgroundColor: '#e2e8f4',
    fontSize: '1.25rem'
  }),
  cellWidths: {
    email: '25%',
    name: '20%',
    libraryCard: '25%',
    role: '20%',
  },
};

//column header format for table
let columnHeaderFormat = {
  email: {label: 'Email', cellStyle: {width: styles.cellWidths.email}},
  name: {label: 'Name', cellStyle: {width: styles.cellWidths.name}, sortable: true},
  libraryCard: {label: 'Library Card', cellStyle: {width: styles.cellWidths.libraryCard}},
  role: {label: 'Role', cellStyle: {width: styles.cellWidths.role}},
  // activeDARs: {label: 'Active DARs', cellStyle: {width: styles.cellWidths.activeDARs}}
};

// Used to determine which modal type to use for either issuing or deleting a Library Card.
// export const confirmModalType = {
//   issue: 'issue',
//   delete: 'delete'
// };

// const DeactivateLibraryCardButton = (props) => {
//   const {card = {}, showConfirmationModal} = props;
//   const message = 'Are you sure you want to deactivate this library card?';
//   const title = 'Deactivate Library Card';
//   return (
//     <SimpleButton
//       keyProp={`deactivate-card-${card.id}`}
//       label="Deactivate"
//       baseColor={Theme.palette.error}
//       hoverStyle={{
//         backgroundColor: 'rgb(194, 38,11)',
//         color: 'white'
//       }}
//       additionalStyle={{
//         padding: '2.25% 5%',
//         fontSize: '1.45rem',
//         fontWeight: 600,
//         fontFamily: 'Montserrat'
//       }}
//       onClick={() => showConfirmationModal({card, message, title, confirmType: confirmModalType.delete})}
//     />
//   );
// };

// const IssueLibraryCardButton = (props) => {
//   //SO should be able to add library cards to users that are not yet in the system, so userEmail needs to be a possible value to send back
//   //username can be confirmed on back-end -> if userId exists pull data from db, otherwise only save email
//   //institution id should be determined from the logged in SO account on the back-end
//   const {card, showConfirmationModal} = props;
//   const message = (
//     <div>
//       {/* LCA Terms Download */}
//       <LibraryCardAgreementTermsDownload />
//       {'Are you sure you want to issue this library card?'}
//     </div>
//   );
//   const title = 'Issue Library Card';
//   return (
//     <SimpleButton
//       keyProp={`issue-card-${card.userEmail}`}
//       label="Issue"
//       baseColor={Theme.palette.secondary}
//       additionalStyle={{
//         width: '30%',
//         padding: '2.25% 5%',
//         fontSize: '1.45rem',
//         fontWeight: 600,
//         fontFamily: 'Montserrat'
//       }}
//       onClick={() => showConfirmationModal({ card, message, title, confirmType: confirmModalType.issue })}
//     />
//   );
// };

const researcherFilterFunction = getSearchFilterFunctions().signingOfficialResearchers;

const handleClick = async (researcher, specificDac, filteredDaas, checked) => {
  if (!checked) {
    try {
      const daaId = filteredDaas.find(daa => daa.dacs.some(dac => dac.dacId === specificDac.dacId))?.daaId;
      await DAA.createDaaLcLink(daaId, researcher.userId);
      Notifications.showSuccess({text: `Approved access to ${specificDac.name} to user: ${researcher.displayName}`});
      // history.push(`/signing_official_console/researchers`);
    } catch(error) {
      Notifications.showError({text: `Error approving access to ${specificDac.name} to user: ${researcher.displayName}`});
    }
  } else {
    try {
      const daaId = filteredDaas.find(daa => daa.dacs.some(dac => dac.dacId === specificDac.dacId))?.daaId;
      await DAA.deleteDaaLcLink(daaId, researcher.userId);
      Notifications.showSuccess({text: `Removed approval of access to ${specificDac.name} to user: ${researcher.displayName}`});
      // history.push(`/signing_official_console/researchers`);
    } catch(error) {
      Notifications.showError({text: `Error removing approval of access to ${specificDac.name} to user: ${researcher.displayName}`});
    }
  }
}

// const LibraryCardCell = ({
//   researcher,
//   showConfirmationModal,
//   institutionId
// }) => {
//   const id = researcher.userId || researcher.email;
//   const card = !isEmpty(researcher.libraryCards)
//     ? find((card) => card.institutionId === institutionId)(researcher.libraryCards)
//     : null;
//   const button = !isNil(card)
//     ? DeactivateLibraryCardButton({
//       card,
//       showConfirmationModal,
//     })
//     : IssueLibraryCardButton({
//       card: {
//         userId: researcher.userId,
//         userEmail: researcher.email,
//         institutionId: institutionId
//       },
//       showConfirmationModal
//     });

//   return {
//     isComponent: true,
//     id,
//     label: 'lc-button',
//     data: (
//       <div
//         style={{
//           display: 'flex',
//           justifyContent: 'left',
//         }}
//         key={`lc-action-cell-${id}`}
//       >
//         {button}
//       </div>
//     ),
//   };
// };

const DAACell = (
  rowDac, 
  researcher,
  institutionId,
  daas
) => {
  const id = researcher && (researcher.userId || researcher.email);
  // const actualResearcher = await User.getById(researcher.userId);
  const libraryCards = researcher && researcher.libraryCards;
  // console.log('libraryCards', libraryCards);
  const card = libraryCards && libraryCards.find(card => card.institutionId === institutionId);
  const daaIds = researcher && card && card.daaIds;
  // console.log('daaIds', daaIds);
  const filteredDaas = daaIds && daas.filter(daa => daaIds.includes(daa.daaId));
  const hasDacId = filteredDaas && filteredDaas.some(daa => daa.dacs.some(dac => dac.dacId === rowDac.dacId));
  // console.log(researcher.displayName);
  // if (researcher.displayName === 'Aarohi Nadkarni') {
  //   console.log('libraryCards', libraryCards);
  //   console.log('hasDacId', hasDacId);
  // }
  // const message = hasDacId ? `Are you sure you want to remove ${researcher.displayName}'s approval for ${rowDac.name}'s datasets? ` : `Are you sure you want to approve ${researcher.displayName} for ${rowDac.name}'s datasets?`;
  // const title = hasDacId ? `Remove ${researcher.displayName}'s access` : `Approve ${researcher.displayName}'s access`;
  // const confirmDaaType = hasDacId ? confirmModalType.delete : confirmModalType.issue;

  return {
    isComponent: true,
    id,
    label: 'lc-button',
    data: (
      <div>
        {/* <Checkbox checked={hasDacId}/>  */}
        <Checkbox checked={hasDacId} onClick={() => handleClick(researcher,rowDac, daas, hasDacId)}/> 
      </div>
    ),
  };
};

// const roleCell = (roles, id) => {

//   const roleString = flow(
//     map((role) => role.name),
//     sortBy((name) => name),
//     sortedUniq,
//     join(', ')
//   )(roles);

//   return {
//     data: roleString || '- -',
//     id,
//     style: {},
//     label: 'user-role'
//   };
// };

// {dropdown(applyAllDaa, removeAllDaa, handleApplyAllDaaChange, handleRemoveAllDaaChange, handleApplyAllDaa, 'Agreement Actions', 'Apply all agreements to this user', 'Remove all agreements from this user', false)}
// dropdown(applyAllUser, removeAllUser, handleApplyAllUserChange, handleRemoveAllUserChange, handleApplyAllUser(id, dac.name), `${dac.name} Actions`, 'Apply agreement to all users', 'Remove agreement from all users', {id, fileName})
const dropdown = (applyAll, removeAll, handleApplyAllChange, handleRemoveAllChange, handleApplyAll, actionsTitle, option1, option2, download, moreData) => {
  const name = download ? 'users' : 'daa';
  return (
    <ul className="dropdown-menu" role="menu" style={{ padding: '20px', textTransform:'none'}}>
    <th id="link_signOut" style={{display:'flex', padding: '5px', textAlign: 'left'}}>
      <strong>{actionsTitle}</strong>
    </th>
    <form>
      {download && 
      <li style={{paddingTop: '5px', paddingBottom: '5px'}}> 
        <DownloadLink label={`Download agreement`} onDownload={() => {DAA.getDaaFileById(download.id, download.fileName)}}/>
        {/* <a href={download}>Download agreement</a> */}
      </li>}
      <li style={{paddingTop: '5px', paddingBottom: '5px'}}> 
        <label style={{fontWeight: 'normal', whiteSpace: 'nowrap'}}>
          <input type="radio" name={name} value="apply" checked={applyAll} onChange={handleApplyAllChange}/>
          &nbsp;&nbsp;{option1}
        </label>
      </li>
      <li style={{paddingTop: '5px', paddingBottom: '5px'}}>
      <label style={{fontWeight: 'normal', whiteSpace: 'nowrap' }}>
          <input type="radio" name={name} value="remove" checked={removeAll} onChange={handleRemoveAllChange}/>
          &nbsp;&nbsp;{option2}
        </label>
      </li>
    </form>
    <li style={{paddingTop: '5px', paddingBottom: '5px'}}>
      <Button style={{
        fontSize: '15px',
        fontWeight: 'normal',
        border: '1px solid #0948B7',
        borderRadius: '5px',
        height: '40px',
        marginRight: '1em',
        cursor: 'pointer',
        color: '#0948B7',
        padding: '10px 20px'
      }} onClick={() => handleApplyAll(moreData.id, moreData.name)}>Apply</Button>
    </li>
  </ul>
  );
}

const displayNameCell = (displayName, email, id, daas, handleApplyAllDaaChange, handleRemoveAllDaaChange, applyAllDaa, removeAllDaa) => {
  // const [applyAllDaa, setApplyAllDaa] = useState(false);
  // let applyAllDaa = false;
  // let removeAllDaa = false;
  const handleApplyAllDaa = async (x, y) => {
    const daaList = { "daaList": daas.map(daa => daa.daaId) };
    console.log(daaList);
    console.log(id);
    if (applyAllDaa) {
      try {
        await DAA.bulkAddDaasToUser(id, daaList);
        Notifications.showSuccess({text: `Gave access to all DACs to user: ${displayName}`});
      } catch(error) {
        Notifications.showError({text: `Error issuing access to all DAC's to user: ${displayName}`});
      }
    } else if (removeAllDaa) {
      try {
        await DAA.bulkRemoveDaasFromUser(id, daaList);
        Notifications.showSuccess({text: `Removed access for all DACs from user: ${displayName}`});
      } catch(error) {
        Notifications.showError({text: `Error removing access for all DAC's from user: ${displayName}`});
      }
    }
  }

  return {
    data: (
      <>
        <li className="dropdown" style={{ listStyleType: 'none' }}>
          <a role="button" data-toggle="dropdown">
            <div id="dacUser" style={{ color: 'black' }}>
              {displayName || 'Invite sent, pending registration'}
              <span className="caret caret-margin" style={{color: '#337ab7', float: 'right', marginTop: '15px'}}></span>
              <small><a href={`mailto:${email}`}>{email || '- -'}</a></small>
            </div>
          </a>
          {dropdown(applyAllDaa, removeAllDaa, handleApplyAllDaaChange, handleRemoveAllDaaChange, handleApplyAllDaa, 'Agreement Actions', 'Apply all agreements to this user', 'Remove all agreements from this user', false, false)}
        </li>
        {/* <div>{displayName || 'Invite sent, pending registration'}</div>
        <div><a href={`mailto:${email}`}>{email || '- -'}</a></div> */}
      </>
    ),
    id,
    style: {},
    label: 'display-names'
  };
};


// const onlyResearchersWithoutCardFilter = (institutionId) => (researcher) => {
//   const cards = researcher.libraryCards;
//   if (isEmpty(cards)) {
//     return true;
//   }

//   return isNil(find((card) => card.institutionId === institutionId)(researcher.libraryCards));
// };

export default function SigningOfficialTable2(props) {
  const [researchers, setResearchers] = useState(props.researchers || []);
  const [tableSize, setTableSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [filteredResearchers, setFilteredResearchers] = useState([]);
  const [visibleResearchers, setVisibleResearchers] = useState([]);
  const [selectedCard, setSelectedCard] = useState({});
  // const [showModal, setShowModal] = useState(false);
  // const [showConfirmation, setShowConfirmation] = useState(false);
  const searchRef = useRef('');
  // const [confirmationModalMsg, setConfirmationModalMsg] = useState('');
  // const [confirmationTitle, setConfirmationTitle] = useState('');
  // const [confirmType, setConfirmType] = useState(confirmModalType.delete);
  const [columnHeaderData, setColumnHeaderData] = useState([columnHeaderFormat.name]);
  const [applyAllDaa, setApplyAllDaa] = useState(false);
  const [removeAllDaa, setRemoveAllDaa] = useState(false);
  const [applyAllUser, setApplyAllUser] = useState(false);
  const [removeAllUser, setRemoveAllUser] = useState(false);
  const { signingOfficial, isLoading, dacs, daas } = props;

  //Search function for SearchBar component, function defined in utils
  const handleSearchChange = useCallback((searchTerms) => {
    searchOnFilteredList(
      searchTerms,
      researchers,
      researcherFilterFunction,
      setFilteredResearchers
    );
  }, [researchers]);

  // const showConfirmationModal = ({card, message, title, confirmType}) => {
  //   setSelectedCard(card);
  //   setShowConfirmation(true);
  //   setConfirmationModalMsg(message);
  //   setConfirmationTitle(title);
  //   setConfirmType(confirmType);
  // };

  const handleApplyAllDaaChange = (event) => {
    setApplyAllDaa(event.target.checked);
    setRemoveAllDaa(!event.target.checked);
  };

  const handleRemoveAllDaaChange = (event) => {
    setRemoveAllDaa(event.target.checked);
    setApplyAllDaa(!event.target.checked);
  };

  const handleApplyAllUserChange = (event) => {
    setApplyAllUser(event.target.checked);
    setRemoveAllUser(!event.target.checked);
  };

  const handleRemoveAllUserChange = (event) => {
    setRemoveAllUser(event.target.checked);
    setApplyAllUser(!event.target.checked);
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
    const generateColumnData = () => {
      const dacColumnWidth = dacs.length > 0 ? 60 / dacs.length : 0;

      const handleApplyAllUser = async (id, dacName) => {
        const userList = { "users": props.researchers.map(researcher => researcher.userId) };
        console.log(userList);
        if (applyAllUser) {
          try {
            DAA.bulkAddUsersToDaa(id, userList).then(() => {
              Notifications.showSuccess({
                text: `Approved all users access to request from: ${dacName}`,
              });
            props.history.push('/signing_official_console/researchers');});
            // await DAA.bulkAddUsersToDaa(id, userList);
            // Notifications.showSuccess({text: `Approved all users access to request from: ${dacName}`});
          } catch(error) {
            Notifications.showError({text: `Error approving all users access to request from: ${dacName}`});
          }
        } else if (removeAllUser) {
          try {
            await DAA.bulkRemoveUsersFromDaa(id, userList);
            Notifications.showSuccess({text: `Removed all users' approval to request from: ${dacName}`});
          } catch(error) {
            Notifications.showError({text: `Error removing all users' approval to request from: ${dacName}`});
          }
        }
      }

      const downloadLink = async (id) => {
        DAA.getDaaFileById(id);
        // console.log(link);
        // return link;
        // return (
        //   <a href={link}>Download agreement</a>
        // );
      }

      columnHeaderFormat = {
        ...columnHeaderFormat,
        ...dacs.reduce((acc, dac) => {
          const daa = daas.find(daa => daa.dacs.some(d => d.dacId === dac.dacId));
          const id = daa.daaId;
          const fileName = daa.file.fileName;
          console.log(fileName);
          // const download = downloadLink(id);
          //download link & then pass it into dropdown?!?!
          acc[dac.name] = { label: dac.name, cellStyle: { width: `${dacColumnWidth}%` }, data: dropdown(applyAllUser, removeAllUser, handleApplyAllUserChange, handleRemoveAllUserChange, handleApplyAllUser, `${dac.name} Actions`, 'Apply agreement to all users', 'Remove agreement from all users', {id, fileName}, {id: id, name: dac})};
          return acc;
        }, {}),
      };

      const dacColumns = dacs.map((dac) => dac.name);

      const newColumnHeaderData = [
        ...columnHeaderData,
        ...dacColumns.map((column) => columnHeaderFormat[column]),
      ];

      setColumnHeaderData(newColumnHeaderData);
    };
    generateColumnData();
  }, [dacs]);

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

  // useEffect(() => {
  //   const init = async() => {
  //     try{
  //       // setDaas(props.daas);
  //       addColumns();
  //     } catch(error) {
  //       Notifications.showError({text: '!!!'});
  //     }
  //   };
  //   init();
  // }, []);

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
      const {displayName, /*count = 0,*/ roles, libraryCards} = researcher;
      const libraryCard = !isEmpty(libraryCards) ? libraryCards[0] : {};
      const email = researcher.email || libraryCard.userEmail;
      const id = researcher.userId || email;
      return [
        displayNameCell(displayName, email, id, daas, handleApplyAllDaaChange, handleRemoveAllDaaChange, applyAllDaa, removeAllDaa),
        ...dacs.map(dac => DAACell(dac, researcher, signingOfficial.institutionId, daas))
      ];
    });
  };

  // const showModalOnClick = () => {
  //   setSelectedCard({institutionId: signingOfficial.institutionId});
  //   setShowModal(true);
  // };

  // const issueLibraryCard = async (selectedCard, researchers) => {
  //   let messageName;
  //   try {
  //     const listCopy = cloneDeep(researchers);
  //     const newLibraryCard = await LibraryCard.createLibraryCard(selectedCard);
  //     const {userEmail, userName, userId} = newLibraryCard;
  //     let targetIndex = findIndex((researcher) => userId === researcher.userId)(listCopy);
  //     //library cards array should only have one card MAX (officials should not be able to see cards from other institutions)
  //     if(targetIndex === -1) { //if card is not found, push new user to top of list
  //       const targetUnregisteredResearcher = find((researcher) => userId === researcher.userId)(props.unregisteredResearchers);
  //       const attributes = {
  //         email: userEmail,
  //         displayName: userName,
  //         libraryCards: [newLibraryCard],
  //         roles: [],
  //       };
  //       if(!isNil(targetUnregisteredResearcher)) {
  //         attributes.roles = targetUnregisteredResearcher.roles;
  //       }
  //       listCopy.unshift(attributes);
  //       messageName = userEmail;
  //     } else {
  //       listCopy[targetIndex].libraryCards = [newLibraryCard];
  //       messageName = userName;
  //     }
  //     setResearchers(listCopy);
  //     setShowConfirmation(false);
  //     setShowModal(false);
  //     Notifications.showSuccess({text: `Issued new library card to ${messageName}`});
  //   } catch(error) {
  //     Notifications.showError({text: `Error issuing library card to ${messageName}`});
  //   }
  // };

  // const addDaaLcAssociation = async (selectedCard, researchers) => {
  //   let messageName;
  //   try {
  //     const listCopy = cloneDeep(researchers);
  //     const newDaaLcAssociatoin = await DAA.createDaaLcLink(selectedCard);
  //     const {userEmail, userName, userId} = newDaaLcAssociatoin;
  //     let targetIndex = findIndex((researcher) => userId === researcher.userId)(listCopy);
  //     //library cards array should only have one card MAX (officials should not be able to see cards from other institutions)
  //     if(targetIndex === -1) { //if card is not found, push new user to top of list
  //       const targetUnregisteredResearcher = find((researcher) => userId === researcher.userId)(props.unregisteredResearchers);
  //       const attributes = {
  //         email: userEmail,
  //         displayName: userName,
  //         libraryCards: [newDaaLcAssociatoin],
  //         roles: [],
  //       };
  //       if(!isNil(targetUnregisteredResearcher)) {
  //         attributes.roles = targetUnregisteredResearcher.roles;
  //       }
  //       listCopy.unshift(attributes);
  //       messageName = userEmail;
  //     } else {
  //       listCopy[targetIndex].libraryCards = [newDaaLcAssociatoin];
  //       messageName = userName;
  //     }
  //     setResearchers(listCopy);
  //     setShowConfirmation(false);
  //     setShowModal(false);
  //     Notifications.showSuccess({text: `Issued new library card to ${messageName}`});
  //   } catch(error) {
  //     Notifications.showError({text: `Error issuing library card to ${messageName}`});
  //   }
  // };

  // const removeDaaLcAssociation = async (selectedDac, researchers) => {
  //   let messageName;
  //   try {
  //     const listCopy = cloneDeep(researchers);
  //     const newDaaLcAssociatoin = await DAA.createDaaLcLink(selectedCard);
  //     const {userEmail, userName, userId} = newDaaLcAssociatoin;
  //     let targetIndex = findIndex((researcher) => userId === researcher.userId)(listCopy);
  //     //library cards array should only have one card MAX (officials should not be able to see cards from other institutions)
  //     if(targetIndex === -1) { //if card is not found, push new user to top of list
  //       const targetUnregisteredResearcher = find((researcher) => userId === researcher.userId)(props.unregisteredResearchers);
  //       const attributes = {
  //         email: userEmail,
  //         displayName: userName,
  //         libraryCards: [newDaaLcAssociatoin],
  //         roles: [],
  //       };
  //       if(!isNil(targetUnregisteredResearcher)) {
  //         attributes.roles = targetUnregisteredResearcher.roles;
  //       }
  //       listCopy.unshift(attributes);
  //       messageName = userEmail;
  //     } else {
  //       listCopy[targetIndex].libraryCards = [newDaaLcAssociatoin];
  //       messageName = userName;
  //     }
  //     setResearchers(listCopy);
  //     setShowConfirmation(false);
  //     setShowModal(false);
  //     Notifications.showSuccess({text: `Issued new library card to ${messageName}`});
  //   } catch(error) {
  //     Notifications.showError({text: `Error issuing library card to ${messageName}`});
  //   }
  // };

  // const deactivateLibraryCard = async (selectedCard, researchers) => {
  //   const {id, userName, userEmail, userId} = selectedCard;
  //   const listCopy = cloneDeep(researchers);
  //   const messageName = userName || userEmail;
  //   try {
  //     await LibraryCard.deleteLibraryCard(id);
  //     const targetIndex = findIndex((researcher) => {
  //       const libraryCards = researcher.libraryCards || [];
  //       const card = libraryCards[0];
  //       return !isNil(card) && id === card.id;
  //     })(researchers);
  //     if(isNil(userId) || researchers[targetIndex].institutionId !== signingOfficial.institutionId) {
  //       listCopy.splice(targetIndex, 1);
  //     } else {
  //       listCopy[targetIndex].libraryCards = [];
  //     }
  //     setResearchers(listCopy);
  //     setShowConfirmation(false);
  //     Notifications.showSuccess({text: `Removed library card issued to ${messageName}`});
  //   } catch(error) {
  //     Notifications.showError({text: `Error deleting library card issued to ${messageName}`});
  //   }
  // };

  // const lcaContent = ScrollableMarkdownContainer({markdown: LcaMarkdown});

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '112%', marginLeft: '-6%' }}>
        <div style={Styles.LEFT_HEADER_SECTION}>
          <div style={{ ...Styles.HEADER_CONTAINER, marginRight: '-7%' }}>
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
              Issue, Update, or Deactivate for User&apos;s ability to request access to datasets, by agreeing to
              {/* <a
                rel="noopener noreferrer"
                href="https://broad-duos.zendesk.com/hc/en-us/articles/360060402751-Signing-Official-User-Guide"
                target="_blank"
                id="so-console-info-link"
                style={{ verticalAlign: 'super' }}>
                <Info fontSize='large'/>
              </a> */}
            </div>
            <div style={Object.assign({}, Styles.MEDIUM_DESCRIPTION, {
              fontSize: '16px',
            })}>
              Data Access Committee&apos;s (DAC&apos;s) Data Access Agreements (DAAs) in the table below.
            </div>
            <div style={Object.assign({}, Styles.MEDIUM_DESCRIPTION, {
              fontSize: '16px',
            })}>
              Issuing a checkmark in a cell for a researcher denotes your approval of that researcher
            </div>
            <div style={Object.assign({}, Styles.MEDIUM_DESCRIPTION, {
              fontSize: '16px',
            })}>
              to request data from the listed DAC, according to its linked DAA.
            </div>
          </div>
        </div>
        {/* <div style={{ marginLeft: 15 }}>
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
        </div> */}
        <SearchBar handleSearchChange={handleSearchChange} searchRef={searchRef}/>
      </div>
      <SimpleTable
        isLoading={isLoading}
        rowData={processResearcherRowData(visibleResearchers)}
        columnHeaders={columnHeaderData}
        styles={styles}
        tableSize={tableSize}
        paginationBar={paginationBar}
      />
      {/* <LibraryCardFormModal
        showModal={showModal}
        createOnClick={(card) => issueLibraryCard(card, researchers)}
        closeModal={() => setShowModal(false)}
        card={selectedCard}
        users={filter(onlyResearchersWithoutCardFilter(signingOfficial.institutionId))(researchers)}
        institutions={[]} //pass in empty array to force modal to hide institution dropdown
        modalType="add"
        lcaContent={lcaContent} />
      <ConfirmationModal
        showConfirmation={showConfirmation}
        closeConfirmation={() => setShowConfirmation(false)}
        title={confirmationTitle}
        // The issue modal requires a larger view than normal
        // styleOverride={confirmType === confirmModalType.issue ? { minWidth: '725px', minHeight: '475px' } : {}}
        message={<div>{confirmationModalMsg}</div>}
        header={`${selectedCard.userName || selectedCard.userEmail} - ${
          !isNil(selectedCard.institution) ? selectedCard.institution.name : ''
        }`}
        onConfirm={() =>
          confirmType === confirmModalType.delete
            ? removeDaaLcAssociation(selectedCard, researchers)
            : addDaaLcAssociation(selectedCard, researchers)}
      /> */}
    </>
  );
}