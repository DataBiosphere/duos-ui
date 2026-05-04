import React from 'react'
import { BaseModal } from 'src/components/BaseModal'
import { DacUsers } from 'src/pages/manage_dac/DacUsers'
import { DacObject } from 'src/types/model'

export interface DacMembersModalProps {
  showModal: boolean
  onCloseRequest: () => void
  dac: DacObject
}

export const DacMembersModal = ({ showModal, onCloseRequest, dac }: DacMembersModalProps) => {
  return (
    <BaseModal
      id="dacMembersModal"
      showModal={showModal}
      onRequestClose={onCloseRequest}
      color="common"
      type="informative"
      iconSize="none"
      title={`DAC Members associated with DAC: ${dac.name}`}
      action={{ label: 'Close', handler: onCloseRequest }}
    >
      <div>
        <DacUsers dac={dac} removeButton={false} />
      </div>
    </BaseModal>
  )
}
