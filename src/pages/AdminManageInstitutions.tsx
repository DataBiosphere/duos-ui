import React, {useEffect, useState} from 'react';
import {Institution as InstitutionAPI} from 'src/libs/ajax/Institution';
import {Institution} from 'src/types/model';
import {Styles} from '../libs/theme';
import {getSearchFilterFunctions, Notifications} from 'src/libs/utils';
import manageInstitutionsIcon from 'src/images/icon_manage_dac.png';
import SearchBar from 'src/components/SearchBar';
import InstitutionTable from 'src/components/institution_table/InstitutionTable';
import {tableHeaderTemplate, tableRowLoadingTemplate} from 'src/components/institution_table/InstitutionTableUtils';
import DarTableSkeletonLoader from 'src/components/TableSkeletonLoader';
import {Link} from 'react-router-dom';
import {extractError} from 'src/utils/ErrorUtils';

export default function AdminManageInstitutions() {
  const [institutionList, setInstitutionList] = useState<Institution[]>([]);
  const [filteredList, setFilteredList] = useState<Institution[]>([]);
  const [tableSize, setTableSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const listOfInstitutions = await InstitutionAPI.list();
        setInstitutionList(listOfInstitutions);
        setFilteredList(filter(listOfInstitutions, searchTerm));
        setIsLoading(false);
      } catch (error) {
        const message = extractError(error);
        Notifications.showError({text: 'Error: Unable to retrieve institutions from server: ' + message});      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const handleSearchChange = (query: { current: { value: string } }) => {
    const value = query.current.value;
    setSearchTerm(value);
    setFilteredList(filter(institutionList, searchTerm));
  };

  const filter = (list: Institution[], value: string): Institution[] => {
    if (value) {
      return getSearchFilterFunctions().institutions(value, list);
    }
    return list;
  };
  return (
    <div style={Styles.PAGE} data-cy="admin-manage-institutions">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="left-header-section" style={Styles.LEFT_HEADER_SECTION as React.CSSProperties}>
          <div style={Styles.ICON_CONTAINER}>
            <img alt={'Admin Manage Institutions'} id="lock-icon" src={manageInstitutionsIcon} style={Styles.HEADER_IMG} />
          </div>
          <div style={Styles.HEADER_CONTAINER as React.CSSProperties}>
            <div style={Styles.TITLE}>Manage Institutions</div>
            <div style={Styles.SMALL}>Select and manage Institutions</div>
          </div>
        </div>
        <SearchBar
          handleSearchChange={handleSearchChange}
          currentPage={currentPage}
          style={{ width: '60%', margin: '0 3% 0 0' }}
          button={
            <div>
              <Link
                  id="btn_addInstitution"
                  to={{
                    pathname: '/admin_manage_institutions/create_new',
                    state: { institutionList }
                  }}
                  className="btn-primary btn-add common-background"
                  style={{marginTop: '30%', display: 'block', lineHeight: 0.6}}
              >
                <span>Add Institution</span>
              </Link>
            </div>
          }
        />
      </div>
      {!isLoading && <InstitutionTable
          filteredList={filteredList}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          tableSize={tableSize}
          setTableSize={setTableSize}
      />}
      {isLoading && <DarTableSkeletonLoader
        tableHeaderTemplate={tableHeaderTemplate}
        tableRowLoadingTemplate={tableRowLoadingTemplate}
      />}
    </div>
  );
}
