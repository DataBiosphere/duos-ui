import React from 'react';
import { BaseModal } from '../../components/BaseModal';
import { DacUsers } from './DacUsers';

export const DacMembersModal = ({ showModal, onCloseRequest, dac }) => {
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
  );
};
