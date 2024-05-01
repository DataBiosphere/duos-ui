import React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Checkbox } from '@mui/material';
import { Styles } from '../../libs/theme';
import { isEmpty } from 'lodash/fp';
import SimpleTable from '../../components/SimpleTable';
import PaginationBar from '../../components/PaginationBar';
import SearchBar from '../../components/SearchBar';
import {
  Notifications,
  recalculateVisibleTable,
  getSearchFilterFunctions,
  searchOnFilteredList
} from '../../libs/utils';
import { DAA } from '../../libs/ajax/DAA';
import {User} from '../../libs/ajax/User';
import { USER_ROLES } from '../../libs/utils';

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

const handleClick = async (researcher, specificDac, filteredDaas, checked, refreshResearchers, setResearchers) => {
  if (!checked) {
    try {
      const daaId = filteredDaas.find(daa => daa.dacs.some(dac => dac.dacId === specificDac.dacId))?.daaId;
      await DAA.createDaaLcLink(daaId, researcher.userId);
      Notifications.showSuccess({text: `Approved access to ${specificDac.name} to user: ${researcher.displayName}`});
      refreshResearchers(setResearchers);
    } catch(error) {
      Notifications.showError({text: `Error approving access to ${specificDac.name} to user: ${researcher.displayName}`});
    }
  } else {
    try {
      const daaId = filteredDaas.find(daa => daa.dacs.some(dac => dac.dacId === specificDac.dacId))?.daaId;
      await DAA.deleteDaaLcLink(daaId, researcher.userId);
      Notifications.showSuccess({text: `Removed approval of access to ${specificDac.name} to user: ${researcher.displayName}`});
      refreshResearchers(setResearchers);
    } catch(error) {
      Notifications.showError({text: `Error removing approval of access to ${specificDac.name} to user: ${researcher.displayName}`});
    }
  }
}

const refreshResearchers = async (setResearchers) => {
  const researcherList = await User.list(USER_ROLES.signingOfficial);
  // the construction of this list is currently a work-around because our endpoint in the backend
  // does not currently populate the DAA IDs on the each researcher's libary card
  const researcherObjectList = await Promise.all(
    researcherList.map(async (researcher) => {
      return await User.getById(researcher.userId);
    })
  );
  setResearchers(researcherObjectList);
}

const DAACell = (
  rowDac, 
  researcher,
  institutionId,
  daas,
  refreshResearchers,
  setResearchers
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
        <Checkbox checked={hasDacId} onClick={() => handleClick(researcher,rowDac, daas, hasDacId, refreshResearchers, setResearchers)}/> 
      </div>
    ),
  };
};

const displayNameCell = (displayName, email, id) => {
  return {
    data: (
      <>
        <div>{displayName || 'Invite sent, pending registration'}</div>
        <div><a href={`mailto:${email}`}>{email || '- -'}</a></div>
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
  const searchRef = useRef('');
  const [columnHeaderData, setColumnHeaderData] = useState([columnHeaderFormat.name]);
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

      columnHeaderFormat = {
        ...columnHeaderFormat,
        ...dacs.reduce((acc, dac) => {
          acc[dac.name] = { label: dac.name, cellStyle: { width: `${dacColumnWidth}%` }};
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
        displayNameCell(displayName, email, id),
        ...dacs.map(dac => DAACell(dac, researcher, signingOfficial.institutionId, daas, refreshResearchers, setResearchers))
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