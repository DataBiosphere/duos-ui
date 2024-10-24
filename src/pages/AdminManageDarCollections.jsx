import React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import SearchBar from '../components/SearchBar';
import { Collections } from '../libs/ajax/Collections';
import { Notifications, searchOnFilteredList, getSearchFilterFunctions, USER_ROLES } from '../libs/utils';
import { Styles } from '../libs/theme';
import lockIcon from '../images/lock-icon.png';
import { DarCollectionTable, DarCollectionTableColumnOptions } from '../components/dar_collection_table/DarCollectionTable';
import { cancelCollectionFn, openCollectionFn, updateCollectionFn } from '../utils/DarCollectionUtils';
import { consoleTypes } from '../components/dar_collection_table/DarCollectionTableCellData';

export default function AdminManageDarCollections() {
  const [collections, setCollections] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchRef = useRef('');
  const filterFn = getSearchFilterFunctions().darCollections;

  const handleSearchChange = useCallback((searchTerms) => searchOnFilteredList(
    searchTerms,
    collections,
    filterFn,
    setFilteredList
  ), [collections, filterFn]);

  useEffect(() => {
    const init = async () => {
      try {
        const collectionsResp = await Collections.getCollectionSummariesByRoleName(USER_ROLES.admin);
        setCollections(collectionsResp);
        setFilteredList(collectionsResp);
        setIsLoading(false);
      } catch (error) {
        Notifications.showError({ text: 'Error initializing Collections table' });
      }
    };
    init();
  }, []);

  const updateCollections = updateCollectionFn({ collections, filterFn, searchRef, setCollections, setFilteredList });
  const cancelCollection = cancelCollectionFn({ updateCollections, role: USER_ROLES.admin });
  const openCollection = openCollectionFn({ updateCollections, role: USER_ROLES.admin });

  return (
    <div style={Styles.PAGE}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '112%', marginLeft: '-6%', padding: '0 2.5%' }}>
        <div className='left-header-section' style={Styles.LEFT_HEADER_SECTION}>
          <div style={Styles.ICON_CONTAINER}>
            <img id='lock-icon' src={lockIcon} style={Styles.HEADER_IMG} />
          </div>
          <div style={Styles.HEADER_CONTAINER}>
            <div style={{ fontFamily: 'Montserrat', fontWeight: 600, fontSize: '2.8rem' }}>
              All Data Access Requests
            </div>
            <div style={{ fontFamily: 'Montserrat', fontSize: '1.6rem' }}>
              List of all Data Access Requests saved in DUOS
            </div>
          </div>
        </div>
        <SearchBar handleSearchChange={handleSearchChange} searchRef={searchRef} />
      </div>
      <DarCollectionTable
        collections={filteredList}
        columns={[
          DarCollectionTableColumnOptions.DAR_CODE,
          DarCollectionTableColumnOptions.DAC,
          DarCollectionTableColumnOptions.NAME,
          DarCollectionTableColumnOptions.SUBMISSION_DATE,
          DarCollectionTableColumnOptions.RESEARCHER,
          DarCollectionTableColumnOptions.INSTITUTION,
          DarCollectionTableColumnOptions.DATASET_COUNT,
          DarCollectionTableColumnOptions.STATUS,
          DarCollectionTableColumnOptions.ACTIONS,
        ]}
        isLoading={isLoading}
        cancelCollection={cancelCollection}
        reviseCollection={null}
        openCollection={openCollection}
        consoleType={consoleTypes.ADMIN}
      />
    </div>
  );
}