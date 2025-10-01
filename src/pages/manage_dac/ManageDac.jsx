import ManageDacTable from 'src/components/manage_dac_table/ManageDacTable'
import React, { useState, useEffect } from 'react'
import { Styles } from 'src/libs/theme'
import lockIcon from 'src/images/lock-icon.png'
import { DAC } from 'src/libs/ajax/DAC'
import { Storage } from 'src/libs/storage'
import { Notifications } from 'src/libs/utils'
import { DacMembersModal } from 'src/pages/manage_dac/DacMembersModal'
import ConfirmationModal from 'src/components/modals/ConfirmationModal'
import ManageEditDac from 'src/pages/manage_dac/ManageEditDac'
import { Link, useHistory } from 'react-router-dom'
import EditDac from 'src/pages/manage_dac/EditDac'
import { DAAUtils } from 'src/utils/DAAUtils'

const CHAIR = 'Chairperson'
const ADMIN = 'Admin'

export const ManageDac = function ManageDac() {
  const [isLoading, setIsLoading] = useState(false)
  const [dacs, setDacs] = useState([])
  const [userRole, setUserRole] = useState()

  // modal state
  const [showEditPage, setShowEditPage] = useState(false)
  const [showAddPage, setShowAddPage] = useState(false)
  const [showDatasetsPage, setShowDatasetsPage] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)

  // modal data
  const [selectedDac, setSelectedDac] = useState({})
  const [selectedDatasets, setSelectedDatasets] = useState([])

  const initializeDACs = async () => {
    const currentUser = Storage.getCurrentUser()
    const roles = (currentUser.roles) ? currentUser.roles.map(r => r.name) : []
    const role = roles.includes(ADMIN) ? ADMIN : CHAIR
    setUserRole(role)
    const chairDACIds = new Set(currentUser.roles.filter(r => r.name === CHAIR).map(r => r.dacId))
    setIsLoading(true)
    const allDacs = await DAC.list()
    if (roles.includes(ADMIN)) {
      setDacs(allDacs)
    }
    else {
      setDacs(allDacs.filter(dac => chairDACIds.has(dac.dacId)))
    }
    setIsLoading(false)
  }

  useEffect(() => {
    const init = async () => {
      await initializeDACs()
    }
    init()
  }, [])

  const history = useHistory()

  useEffect(() => {
    if (showDatasetsPage && selectedDatasets.length > 0) {
      history.push({
        pathname: '/manage_dac_datasets',
        state: { dac: selectedDac, datasets: selectedDatasets },
      })
    }
    else if (showDatasetsPage && selectedDatasets.length === 0) {
      Notifications.showError({ text: 'DAC has no datasets.' })
    }
  }, [showDatasetsPage, selectedDac, selectedDatasets, history])

  const handleDeleteDac = async () => {
    let status
    await DAC.delete(selectedDac.dacId).then((resp) => {
      status = resp.status
    })
    if (Number(status) === 200) {
      Notifications.showSuccess({ text: 'DAC successfully deleted.' })
      setShowConfirmationModal(false)
      await initializeDACs()
    }
    else {
      Notifications.showError({ text: 'DAC could not be deleted.' })
    }
  }

  const closeViewMembersModal = () => {
    setShowMembersModal(false)
    setSelectedDac({})
  }

  const closeConfirmation = () => {
    setShowConfirmationModal(false)
  }

  const addDac = () => {
    setShowAddPage(true)
  }

  return (
    <div style={Styles.PAGE}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', width: '112%', marginLeft: '-6%', padding: '0 2.5%' }}
      >
        <div className="left-header-section" style={Styles.LEFT_HEADER_SECTION}>
          <div style={Styles.ICON_CONTAINER}>
            <img id="lock-icon" src={lockIcon} style={Styles.HEADER_IMG} alt="Manage Data Access Committee" />
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
            className="btn-primary btn-add common-background"
            style={{ marginTop: '30%', display: 'flex' }}
            onClick={addDac}
            to={{
              pathname: DAAUtils.isEnabled() ? `/manage_add_dac_daa` : `/manage_add_dac`,
              state: { userRole: userRole },
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
        setShowDatasetsPage={setShowDatasetsPage}
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
      {showAddPage && (
        <ManageEditDac />
      )}
      {showEditPage && (
        DAAUtils.isEnabled()
          ? <EditDac />
          : <ManageEditDac />
      )}
    </div>
  )
}

export default ManageDac
