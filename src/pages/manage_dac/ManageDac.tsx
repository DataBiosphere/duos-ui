import ManageDacTable from 'src/components/manage_dac_table/ManageDacTable'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
import AddObjectButton from 'src/components/AddObjectButton'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import type { DacObject, Dataset } from 'src/types/model'

const CHAIR = 'Chairperson'
const ADMIN = 'Admin'
type ManageDacRole = typeof CHAIR | typeof ADMIN

export const ManageDac = function ManageDac() {
  usePageTitle('DACs')
  const currentUser = useMemo(() => Storage.getCurrentUser(), [])
  const roles = useMemo(() => currentUser.roles?.map(r => r.name) ?? [], [currentUser])
  const userRole: ManageDacRole = roles.includes(ADMIN) ? ADMIN : CHAIR
  const chairDACIds = useMemo(() => new Set(
    currentUser.roles
      .filter(roleItem => roleItem.name === CHAIR && roleItem.dacId !== undefined)
      .map(roleItem => roleItem.dacId as number),
  ), [currentUser])

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [dacs, setDacs] = useState<DacObject[]>([])

  // modal state
  const [showEditPage, setShowEditPage] = useState<boolean>(false)
  const [showAddPage, setShowAddPage] = useState<boolean>(false)
  const [showDatasetsPage, setShowDatasetsPage] = useState<boolean>(false)
  const [showMembersModal, setShowMembersModal] = useState<boolean>(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState<boolean>(false)

  // modal data
  const [selectedDac, setSelectedDac] = useState<DacObject | null>(null)
  const [selectedDatasets, setSelectedDatasets] = useState<Dataset[]>([])

  const initializeDACs = useCallback(async () => {
    const allDacs = await DAC.list()
    if (roles.includes(ADMIN)) {
      setDacs(allDacs)
    }
    else {
      setDacs(allDacs.filter(dac => dac.dacId !== undefined && chairDACIds.has(dac.dacId)))
    }
    setIsLoading(false)
  }, [chairDACIds, roles])

  useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      void initializeDACs()
    }, 0)

    return () => globalThis.clearTimeout(timeoutId)
  }, [initializeDACs])

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
    if (selectedDac?.dacId === undefined) {
      Notifications.showError({ text: 'DAC could not be deleted.' })
      return
    }

    const { status } = await DAC.delete(selectedDac.dacId)
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
    setSelectedDac(null)
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
        header={selectedDac?.name}
        onConfirm={handleDeleteDac}
      />
      {showMembersModal && (
        <DacMembersModal
          showModal={showMembersModal}
          onCloseRequest={closeViewMembersModal}
          dac={selectedDac ?? {}}
        />
      )}
      {(showAddPage || showEditPage) && (
        <EditDac />
      )}
    </div>
  )
}

export default ManageDac
