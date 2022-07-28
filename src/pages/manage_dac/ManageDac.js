import ManageDacTable from '../../components/manage_dac_table/ManageDacTable';
import {useState, useEffect, useCallback} from 'react';
import {div, h, img, a, span} from 'react-hyperscript-helpers';
import { Styles } from '../../libs/theme';
import lockIcon from '../../images/lock-icon.png';
import {DAC} from '../../libs/ajax';
import {contains, filter, map} from 'lodash/fp';
import {Storage} from '../../libs/storage';
import {Notifications} from '../../libs/utils';
import {AddDacModal} from './AddDacModal';
import {DacDatasetsModal} from '../../components/modals/DacDatasetsModal';
import {DacMembersModal} from './DacMembersModal';
import ConfirmationModal from '../../components/modals/ConfirmationModal';

const CHAIR = 'Chairperson';
const ADMIN = 'Admin';

export const ManageDac = function ManageDac() {

  const [isLoading, setIsLoading] = useState(false);
  const [dacs, setDacs] = useState([]);
  const [dacIDs, setDacIDs] = useState([]);
  const [userRole, setUserRole] = useState();

  // modal state
  const [showDacModal, setShowDacModal] = useState(false);
  const [showDatasetsModal, setShowDatasetsModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // modal data
  const [selectedDac, setSelectedDac] = useState({});
  const [selectedDatasets, setSelectedDatasets] = useState([]);


  useEffect(() => {
    Promise.all([
      reloadUserRole(),
      reloadDacList()
    ]);
  }, [reloadDacList, reloadUserRole]);

  const handleDeleteDac = async () => {
    let status;
    await DAC.delete(selectedDac.dacId).then((resp) => {
      status = resp.status;
    });
    if (status === 200) {
      Notifications.showSuccess({text: 'DAC successfully deleted.'});
      setShowConfirmationModal(false);
      await reloadDacList();
    } else {
      Notifications.showError({text: 'DAC could not be deleted.'});
    }
  };

  const reloadDacList = useCallback(async () => {
    setIsLoading(true);
    DAC.list().then(
      dacs => {
        if (userRole === CHAIR) {
          dacs = dacs.filter((dac) => dacIDs.includes(dac.dacId));
        }
        setDacs(dacs);
        setIsLoading(false);
      }
    );
  }, [dacIDs, userRole]);


  const reloadUserRole = useCallback(async () => {
    setIsLoading(true);
    const currentUser = Storage.getCurrentUser();
    const roles = currentUser.roles.map(r => r.name);
    const role = contains(ADMIN)(roles) ? ADMIN : CHAIR;
    let dacIDs = filter({name: CHAIR})(currentUser.roles);
    dacIDs = map('dacId')(dacIDs);
    if (role === CHAIR) {
      setDacIDs(dacIDs);
    }
    setUserRole(role);
    setIsLoading(false);
  }, []);

  const closeViewMembersModal = () => {
    setShowMembersModal(false);
    setSelectedDac({});
  };

  const closeConfirmation = () => {
    setShowConfirmationModal(false);
  };


  const closeAddDacModal = async () => {
    await reloadDacList();

    setShowDacModal(false);
  };

  const addDac = () => {
    setShowDacModal(true);
    setIsEditMode(false);
  };

  const okAddDacModal = async () => {
    await reloadDacList();

    setShowDacModal(false);
  };

  const closeViewDatasetsModal = () => {

    setShowDatasetsModal(false);
    setSelectedDac({});
    setSelectedDatasets([]);
  };

  return div({ style: Styles.PAGE }, [
    div({ style: { display: 'flex', justifyContent: 'space-between', width: '112%', marginLeft: '-6%', padding: '0 2.5%' } }, [
      div(
        { className: 'left-header-section', style: Styles.LEFT_HEADER_SECTION },
        [
          div({ style: Styles.ICON_CONTAINER }, [
            img({
              id: 'lock-icon',
              src: lockIcon,
              style: Styles.HEADER_IMG,
            }),
          ]),
          div({ style: Styles.HEADER_CONTAINER }, [
            div({ style: {
              fontFamily: 'Montserrat',
              fontWeight: 600,
              fontSize: '2.8rem'
            } }, [
              `Manage Data Access Committee`,
            ]),
            div(
              {
                style: {
                  fontFamily: 'Montserrat',
                  fontSize: '1.6rem'
                },
              },
              ['Create and manage Data Access Commitee']
            ),
          ]),
        ]
      ),
      div({className: 'right-header-section'}, [
        a({
          id: 'btn_addDAC',
          className: 'col-md-12 btn-primary btn-add common-background',
          style: {
            marginTop: '30%'
          },
          onClick: addDac
        }, [
          div({className: 'all-icons add-dac_white'}),
          span({}, ['Add DAC'])
        ])
      ])

    ]),
    h(ManageDacTable, {
      isLoading,
      dacs,
      userRole,
      setShowDacModal,
      setShowDatasetsModal,
      setShowMembersModal,
      setShowConfirmationModal,
      setIsEditMode,
      setSelectedDac,
      setSelectedDatasets
    }),
    h(ConfirmationModal, {
      showConfirmation: showConfirmationModal,
      closeConfirmation: closeConfirmation,
      title: 'Delete DAC?',
      message: 'Are you sure you want to delete this Data Access Committee?',
      header: selectedDac.name,
      onConfirm: () => handleDeleteDac(),
    }),
    DacMembersModal({
      isRendered: showMembersModal,
      showModal: showMembersModal,
      onOKRequest: closeViewMembersModal,
      onCloseRequest: closeViewMembersModal,
      dac: selectedDac
    }),
    DacDatasetsModal({
      isRendered: showDatasetsModal,
      showModal: showDatasetsModal,
      onOKRequest: closeViewDatasetsModal,
      onCloseRequest: closeViewDatasetsModal,
      dac: selectedDac,
      datasets: selectedDatasets
    }),
    AddDacModal({
      isRendered: showDacModal,
      showModal: showDacModal,
      isEditMode: isEditMode,
      onOKRequest: okAddDacModal,
      onCloseRequest: closeAddDacModal,
      dac: selectedDac,
      userRole: userRole
    }),
  ]);
};

export default ManageDac;