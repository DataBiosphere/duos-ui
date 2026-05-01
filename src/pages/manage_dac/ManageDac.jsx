import ManageDacTable from 'src/components/manage_dac_table/ManageDacTable'
import React, { useState, useEffect } from 'react'
import { Styles } from 'src/libs/theme'
import { DAC } from 'src/libs/ajax/DAC'
import { Storage } from 'src/libs/storage'
import { Notifications } from 'src/libs/utils'
import { DacMembersModal } from 'src/pages/manage_dac/DacMembersModal'
import ConfirmationModal from 'src/components/modals/ConfirmationModal'
import { useNavigate } from 'react-router-dom'
import EditDac from 'src/pages/manage_dac/EditDac'
import { usePageTitle } from 'src/hooks/usePageTitle'
import TableHeaderSection from 'src/components/TableHeaderSection'
import AddObjectButton from 'src/components/AddObjectButton.tsx'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'

const CHAIR = 'Chairperson'
const ADMIN = 'Admin'

export const ManageDac = function ManageDac() {
  usePageTitle('DACs')
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

  const navigate = useNavigate()

  useEffect(() => {
    if (showDatasetsPage && selectedDatasets.length > 0) {
      navigate('/manage_dac_datasets', {
        state: { dac: selectedDac, datasets: selectedDatasets },
      })
    }
    else if (showDatasetsPage && selectedDatasets.length === 0) {
      Notifications.showError({ text: 'DAC has no datasets.' })
    }
  }, [showDatasetsPage, selectedDac, selectedDatasets, navigate])

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
    navigate('/manage_add_dac_daa', {
      state: { userRole: userRole },
    })
  }

  return (
    <div style={Styles.PAGE}>
      <div>
        <TableHeaderSection
          title="Manage Data Access Committee"
          description="Create and manage Data Access Committee"
        />
      </div>
      <div style={{ ...Styles.SEARCH_ACTION_HEADER_SECTION, justifyContent: 'flex-end' }}>
        <AddObjectButton
          id="btn_addDAC"
          label="ADD DAC"
          onClick={addDac}
          icon={<AddCircleOutlineIcon />}
          className="button button-blue"
        />
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
        <EditDac />
      )}
      {showEditPage && (
        <EditDac />
      )}
    </div>
  )
}

export default ManageDac
