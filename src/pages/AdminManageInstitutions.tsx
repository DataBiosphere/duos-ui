import React, {useEffect, useState} from 'react';
import {Institution as InstitutionAPI} from 'src/libs/ajax/Institution';
import {Institution} from 'src/types/model';
import {Styles} from 'src/libs/theme';
import {Notifications} from 'src/libs/utils';
import manageInstitutionsIcon from 'src/images/icon_manage_dac.png';
import SearchBar from 'src/components/SearchBar';
import InstitutionTable from 'src/components/institution_table/InstitutionTable';
import {tableHeaderTemplate, tableRowLoadingTemplate} from 'src/components/institution_table/InstitutionTableUtils';
// import AddInstitutionModal from 'src/components/modals/AddInstitutionModal';
import DarTableSkeletonLoader from 'src/components/TableSkeletonLoader';
import {extractError} from 'src/utils/ErrorUtils';

interface AdminManageInstitutionsProps {
  readonly history?: History;
}

export default function AdminManageInstitutions(props: AdminManageInstitutionsProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {history} = props;
  const [institutionList, setInstitutionList] = useState<Institution[]>([]);
  const [filteredList, setFilteredList] = useState<Institution[]>([]);
  const [tableSize, setTableSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // const [showAddInstitutionModal, setShowAddInstitutionModal] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // const loadInstitutions = async () => {
  //   try {
  //     setIsLoading(true);
  //     const listOfInstitutions = await InstitutionAPI.list();
  //     setInstitutionList(listOfInstitutions);
  //     setFilteredList(listOfInstitutions);
  //   } catch (error) {
  //     const message = extractError(error);
  //     Notifications.showError({ text: 'Error: Unable to retrieve institutions from server: ' + message});
  //   }
  //   setIsLoading(false);
  // };

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const listOfInstitutions = await InstitutionAPI.list();
        setInstitutionList(listOfInstitutions);
        setFilteredList(filter(listOfInstitutions, searchTerm));

        console.log('AdminManageInstitutions useEffect triggered');
        console.log('AdminManageInstitutions: Filtered List:', filteredList);
        console.log('AdminManageInstitutions: isLoading:', isLoading);

      } catch (error) {
        const message = extractError(error);
        Notifications.showError({ text: 'Error: Unable to retrieve institutions from server: ' + message});
      }
      setIsLoading(false);
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
      const filtered = list.filter(institution => {
        const text = JSON.stringify(institution);
        return text.toLowerCase().includes(value.toLowerCase());
      });
      console.log('Search term provided, showing filtered institutions:', filtered);
      return filtered;
    }
    return list;
  };

  // const addInstitution = () => {
  //   setShowAddInstitutionModal(true);
  // };

  // const closeAddInstitutionModal = () => {
  //   setShowAddInstitutionModal(false);
  // };

  // const modalSave = (result: never) => {
  //   if (result) {
  //     setShowAddInstitutionModal(false);
  //     loadInstitutions();
  //   }
  // };

  return (
    <div style={Styles.PAGE}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="left-header-section" style={Styles.LEFT_HEADER_SECTION as React.CSSProperties}>
          <div style={Styles.ICON_CONTAINER}>
            <img id="lock-icon" src={manageInstitutionsIcon} style={Styles.HEADER_IMG} alt="Manage Institutions" />
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
              <a
                id="btn_addInstitution"
                className="btn-primary btn-add common-background"
                style={{ marginTop: '30%', display: 'block', lineHeight: 0.6 }}
                // onClick={addInstitution}
              >
                <span>Add Institution</span>
              </a>
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
      {/*{showAddInstitutionModal && <AddInstitutionModal*/}
      {/*  showModal={showAddInstitutionModal}*/}
      {/*  closeModal={closeAddInstitutionModal}*/}
      {/*  onOKRequest={modalSave}*/}
      {/*  onCloseRequest={closeAddInstitutionModal}*/}
      {/*/>}*/}
    </div>
  );
};
