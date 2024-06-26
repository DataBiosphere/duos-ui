import React from 'react';
import ManageDacTable from '../../components/manage_dac_table/ManageDacTable';
import {useState, useEffect, useCallback} from 'react';
import { Styles } from '../../libs/theme';
import lockIcon from '../../images/lock-icon.png';
import { DAC } from '../../libs/ajax/DAC';
import { DAA } from '../../libs/ajax/DAA';
import {contains, filter, map} from 'lodash/fp';
import {Storage} from '../../libs/storage';
import {Notifications} from '../../libs/utils';
import DacDatasetsModal from '../../components/modals/DacDatasetsModal';
import {DacMembersModal} from './DacMembersModal';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import ManageEditDac from './ManageEditDac';
import { Link } from 'react-router-dom';
import ManageEditDacDaa from './ManageEditDacDaa';
import { checkEnv, envGroups } from '../../utils/EnvironmentUtils';

const CHAIR = 'Chairperson';
const ADMIN = 'Admin';

export const ManageDac = function ManageDac() {

  const [isLoading, setIsLoading] = useState(false);
  const [dacs, setDacs] = useState([]);
  const [daas, setDaas] = useState([]);
  const [dacIDs, setDacIDs] = useState([]);
  const [userRole, setUserRole] = useState();

  // modal state
  const [showEditPage, setShowEditPage] = useState(false);
  const [showAddPage, setShowAddPage] = useState(false);
  const [showDatasetsModal, setShowDatasetsModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // modal data
  const [selectedDac, setSelectedDac] = useState({});
  const [selectedDatasets, setSelectedDatasets] = useState([]);


  const reloadUserRole = useCallback(async () => {
    setIsLoading(true);
    const currentUser = Storage.getCurrentUser();
    const roles = (currentUser.roles) ? currentUser.roles.map(r => r.name) : [];
    const role = contains(ADMIN)(roles) ? ADMIN : CHAIR;
    let dacIDs = filter({name: CHAIR})(currentUser.roles);
    dacIDs = map('dacId')(dacIDs);
    if (role === CHAIR) {
      setDacIDs(dacIDs);
    }
    setUserRole(role);
    setIsLoading(false);
  }, []);

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

  useEffect(() => {
    Promise.all([
      reloadUserRole(),
      reloadDacList()
    ]);
  }, [reloadDacList, reloadUserRole]);

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const daaList = await DAA.getDaas();
        setDaas(daaList);
        setIsLoading(false);
      } catch (error) {
        Notifications.showError({
          text: 'Error: Unable to retrieve current DAAs from server',
        });
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleDeleteDac = async () => {
    let statusDac;
    const matchingDaas = daas.filter(daa => daa.initialDacId === selectedDac.dacId && daa.daaId !== 21);
    const deletePromises = matchingDaas.map(daa => DAA.deleteDaa(daa.daaId));
    const deleteResponses = await Promise.all(deletePromises);
    const failedDeletes = deleteResponses.filter(resp => resp.status !== 200);
    const fullSelectedDac = await DAC.get(selectedDac.dacId); // THIS IS HACKY! BUT ALL I CAN DO
    if (fullSelectedDac.associatedDaa.daaId === 21) {
      await DAA.deleteDacDaaRelationship(21, selectedDac.dacId).then((resp) => {
        if (resp.status !== 200) {
          failedDeletes.push(resp);
        }
      });
    }
    if (failedDeletes.length > 0) {
      Notifications.showError({text: 'Some DAAs could not be deleted.'});
      return;
    }

    await DAC.delete(selectedDac.dacId).then((resp) => {
      statusDac = resp.status;
    });

    if (statusDac === 200) {
      Notifications.showSuccess({text: 'DAC successfully deleted.'});
      setShowConfirmationModal(false);
      await reloadDacList();
    } else {
      Notifications.showError({text: 'DAC could not be deleted.'});
    }
  };

  const closeViewMembersModal = () => {
    setShowMembersModal(false);
    setSelectedDac({});
  };

  const closeConfirmation = () => {
    setShowConfirmationModal(false);
  };

  const addDac = () => {
    setShowAddPage(true);
  };

  const closeViewDatasetsModal = () => {

    setShowDatasetsModal(false);
    setSelectedDac({});
    setSelectedDatasets([]);
  };

  return (
    <div style={Styles.PAGE}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '112%', marginLeft: '-6%', padding: '0 2.5%' }}>
        <div className="left-header-section" style={Styles.LEFT_HEADER_SECTION}>
          <div style={Styles.ICON_CONTAINER}>
            <img id="lock-icon" src={lockIcon} style={Styles.HEADER_IMG} />
          </div>
          <div style={Styles.HEADER_CONTAINER}>
            <div style={{ fontFamily: 'Montserrat', fontWeight: 600, fontSize: '2.8rem' }}>
              Manage Data Access Committee
            </div>
            <div style={{ fontFamily: 'Montserrat', fontSize: '1.6rem' }}>
              Create and manage Data Access Committee
            </div>
          </div>
        </div>
        <div className="right-header-section">
          <Link
            id="btn_addDAC"
            className="col-md-12 btn-primary btn-add common-background"
            style={{ marginTop: '30%', display: 'flex' }}
            onClick={addDac}
            to={{
              pathname: 'manage_add_dac',
              state: { userRole: userRole}
            }}
          >
            <span>Add DAC</span>
          </Link>
        </div>
      </div>
      <ManageDacTable
        isLoading={isLoading}
        dacs={dacs}
        userRole={userRole}
        setShowDatasetsModal={setShowDatasetsModal}
        setShowMembersModal={setShowMembersModal}
        setShowConfirmationModal={setShowConfirmationModal}
        setSelectedDac={setSelectedDac}
        setSelectedDatasets={setSelectedDatasets}
        setShowEditPage={setShowEditPage}
      />
      <ConfirmationModal
        showConfirmation={showConfirmationModal}
        closeConfirmation={closeConfirmation}
        title="Delete DAC?"
        message="Are you sure you want to delete this Data Access Committee?"
        header={selectedDac.name}
        onConfirm={handleDeleteDac}
      />
      {showMembersModal && (
        <DacMembersModal
          showModal={showMembersModal}
          onOKRequest={closeViewMembersModal}
          onCloseRequest={closeViewMembersModal}
          dac={selectedDac}
        />
      )}
      {showDatasetsModal && (
        <DacDatasetsModal
          showModal={showDatasetsModal}
          onOKRequest={closeViewDatasetsModal}
          onCloseRequest={closeViewDatasetsModal}
          dac={selectedDac}
          datasets={selectedDatasets}
        />
      )}
      {showAddPage && (
        <ManageEditDac
        />
      )}
      {showEditPage && (
        checkEnv(envGroups.DEV) ?
          <ManageEditDacDaa/> :
          <ManageEditDac/>
        
      )}
    </div>
  );
};

export default ManageDac;