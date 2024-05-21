import React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
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
import {User} from '../../libs/ajax/User';
import { USER_ROLES } from '../../libs/utils';
import ManageUsersDropdown from './ManageUsersDropdown';
import ManageDaasDropdown from './ManageDaasDropdown';
import DAACell from './DAACell';

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

let columnHeaderFormat = {
  email: {label: 'Email', cellStyle: {width: styles.cellWidths.email}},
  name: {label: 'Name', cellStyle: {width: styles.cellWidths.name}},
  libraryCard: {label: 'Library Card', cellStyle: {width: styles.cellWidths.libraryCard}},
  role: {label: 'Role', cellStyle: {width: styles.cellWidths.role}},
};

const researcherFilterFunction = getSearchFilterFunctions().signingOfficialResearchers;

const refreshResearchers = async (setResearchers) => {
  const researcherList = await User.list(USER_ROLES.signingOfficial);
  setResearchers(researcherList);
};

const displayNameCell = (displayName, email, id, daas, setResearchers) => {
  return {
    data: (
      <>
        <li className="dropdown" style={{ listStyleType: 'none' }}>
          <div role="button" data-toggle="dropdown">
            <div id="dacUser" style={{ color: 'black' }}>
              {displayName || 'Invite sent, pending registration'}
              <span className="caret caret-margin" style={{color: '#337ab7', float: 'right', marginTop: '15px'}}></span>
              <small><a href={`mailto:${email}`}>{email || '- -'}</a></small>
            </div>
          </div>
          <ManageUsersDropdown daas={daas} refreshResearchers={refreshResearchers} setResearchers={setResearchers} moreData={{id: id, name: displayName}}/>
        </li>
      </>
    ),
    id,
    style: {},
    label: 'display-names',
    striped: true
  };
};

export default function ManageResearcherDAAsTable(props) {
  const [researchers, setResearchers] = useState(props.researchers || []);
  const [tableSize, setTableSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [filteredResearchers, setFilteredResearchers] = useState([]);
  const [visibleResearchers, setVisibleResearchers] = useState([]);
  const searchRef = useRef('');
  const { signingOfficial, isLoading, dacs, daas } = props;

  const headers = (dacs) => {
    const dacColumnWidth = dacs.length > 0 ? 60 / dacs.length : 0;
    columnHeaderFormat = {
      ...columnHeaderFormat,
      ...dacs.reduce((acc, dac) => {
        const daa = daas.find(daa => daa.dacs.some(d => d.dacId === dac.dacId));
        const id = daa.daaId;
        const fileName = daa.file.fileName;
        acc[dac.name] = { label: dac.name, cellStyle: { width: `${dacColumnWidth}%` }, data: <ManageDaasDropdown actionsTitle={`${dac.name} Actions`} download={{id: id, fileName: fileName}} moreData={{id: id, name: dac.name}} researchers={props.researchers} refreshResearchers={refreshResearchers} setResearchers={setResearchers}/>};
        return acc;
      }, {}),
    };
    const dacColumns = dacs.map((dac) => dac.name);
    return [columnHeaderFormat.name, ...dacColumns.map((column) => columnHeaderFormat[column])];
  };

  //Search function for SearchBar component, function defined in utils
  const handleSearchChange = useCallback((searchTerms) => {
    searchOnFilteredList(
      searchTerms,
      researchers,
      researcherFilterFunction,
      setFilteredResearchers
    );
  }, [researchers]);

  //init hook
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
      const { displayName, libraryCards } = researcher;
      const libraryCard = !isEmpty(libraryCards) ? libraryCards[0] : {};
      const email = researcher.email || libraryCard.userEmail;
      const id = researcher.userId || email;
      return [
        displayNameCell(displayName, email, id, daas, setResearchers),
        ...dacs.map(dac => DAACell({ rowDac: dac, researcher: researcher, institutionId: signingOfficial.institutionId, daas: daas, refreshResearchers: refreshResearchers,setResearchers: setResearchers })),
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
              maxWidth: '60%',
            })}>
              Issue, Update, or Deactivate for User&apos;s ability to request access to datasets, by agreeing to
              Data Access Committee&apos;s (DAC&apos;s) Data Access Agreements (DAAs) in the table below.
              Issuing a checkmark in a cell for a researcher denotes your approval of that researcher
              to request data from the listed DAC, according to its linked DAA.
            </div>
          </div>
        </div>
        <SearchBar handleSearchChange={handleSearchChange} searchRef={searchRef}/>
      </div>
      <SimpleTable
        isLoading={isLoading}
        rowData={processResearcherRowData(visibleResearchers)}
        columnHeaders={headers(dacs)}
        styles={styles}
        tableSize={tableSize}
        paginationBar={paginationBar}
      />
    </>
  );
}