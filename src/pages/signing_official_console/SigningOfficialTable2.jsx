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
};

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

const DAACell = (
  rowDac, 
  researcher,
  institutionId,
  daas
) => {
  const id = researcher && (researcher.userId || researcher.email);
  const libraryCards = researcher && researcher.libraryCards;
  const card = libraryCards && libraryCards.find(card => card.institutionId === institutionId);
  const daaIds = researcher && card && card.daaIds;
  const filteredDaas = daaIds && daas.filter(daa => daaIds.includes(daa.daaId));
  const hasDacId = filteredDaas && filteredDaas.some(daa => daa.dacs.some(dac => dac.dacId === rowDac.dacId));

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
      </>
    ),
    id,
    style: {},
    label: 'display-names'
  };
};

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

      columnHeaderFormat = {
        ...columnHeaderFormat,
        ...dacs.reduce((acc, dac) => {
          const daa = daas.find(daa => daa.dacs.some(d => d.dacId === dac.dacId));
          const id = daa.daaId;
          const fileName = daa.file.fileName;
          console.log(fileName);
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
    </>
  );
}