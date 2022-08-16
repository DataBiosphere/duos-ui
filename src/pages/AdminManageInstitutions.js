import { useState, useEffect } from 'react';
import { div, h, img, a, span } from 'react-hyperscript-helpers';
import { Institution } from '../libs/ajax';
import { Styles} from '../libs/theme';
import { Notifications } from '../libs/utils';
import manageInstitutionsIcon from '../images/icon_manage_dac.png';
import SearchBar from '../components/SearchBar';
import InstitutionTable from '../components/institution_table/InstitutionTable';
import AddInstitutionModal from '../components/modals/AddInstitutionModal';
import DarTableSkeletonLoader from '../components/TableSkeletonLoader';
import { tableHeaderTemplate, tableRowLoadingTemplate } from '../components/institution_table/InstitutionTable';

export default function AdminManageInstitutions(props) {
  const [institutionList, setInstitutionList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [tableSize, setTableSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddInstitutionModal, setShowAddInstitutionModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadInstitutions = async () => {
    try {
      setIsLoading(true);
      const listOfInstitutions = await Institution.list();
      setInstitutionList(listOfInstitutions);
      filter(listOfInstitutions, searchTerm);
      setIsLoading(false);
    } catch (error) {
      Notifications.showError({text: 'Error: Unable to retrieve data requests from server'});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const listOfInstitutions = await Institution.list();
        setInstitutionList(listOfInstitutions);
        setFilteredList(listOfInstitutions);
        setIsLoading(false);
      } catch (error) {
        Notifications.showError({text: 'Error: Unable to retrieve data requests from server'});
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const handleSearchChange = (query) => {
    const value = query.current.value;
    setSearchTerm(value);
    filter(institutionList, value);
  };

  const filter = (list, value) => {
    setFilteredList(list.filter(institution => {
      if (value && value !== undefined) {
        let text = JSON.stringify(institution);
        return text.toLowerCase().includes(value.toLowerCase());
      }
      return true;
    }));
  };

  const addInstitution = () => {
    setShowAddInstitutionModal(true);
  };

  const closeAddInstitutionModal = () => {
    setShowAddInstitutionModal(false);
  };

  const modalSave = (result) => {
    if (result) {
      setShowAddInstitutionModal(false);
      loadInstitutions();
    }
  };

  return (
    div({style: Styles.PAGE}, [
      div({ style: {display: 'flex', justifyContent: 'space-between'}}, [
        div({className: 'left-header-section', style: Styles.LEFT_HEADER_SECTION}, [
          div({style: Styles.ICON_CONTAINER}, [
            img({
              id: 'lock-icon',
              src: manageInstitutionsIcon,
              style: Styles.HEADER_IMG
            })
          ]),
          div({style: Styles.HEADER_CONTAINER}, [
            div({style: Styles.TITLE}, ['Manage Institutions']),
            div({style: Styles.SMALL}, ['Select and manage Institutions'])
          ]),
        ]),
        h(SearchBar, {handleSearchChange, currentPage,
          style: {
            width: '60%',
            margin: '0 3% 0 0',
          },
          button: div({
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'center',
            }
          }, [
            a({
              id: 'btn_addInstitution',
              className: 'btn-primary btn-add common-background',
              style: {
                marginTop: '30%',
                display: 'flex',
                lineHeight: 1,
              },
              onClick: addInstitution
            }, [
              div({ className: 'all-icons add-dac_white' }),
              span({}, ['Add Institution']),
            ]),
          ]),
        })
      ]),
      h(InstitutionTable, {
        filteredList,
        history: props.history,
        currentPage,
        setCurrentPage,
        tableSize,
        setTableSize,
        isRendered: !isLoading,
        onUpdateSave: modalSave
      }),
      h(DarTableSkeletonLoader, {isRendered: isLoading, tableHeaderTemplate, tableRowLoadingTemplate}),
      h(AddInstitutionModal, {
        isRendered: showAddInstitutionModal,
        showModal: showAddInstitutionModal,
        closeModal: closeAddInstitutionModal,
        onOKRequest: modalSave,
        onCloseRequest: closeAddInstitutionModal
      }),
    ])
  );
}
