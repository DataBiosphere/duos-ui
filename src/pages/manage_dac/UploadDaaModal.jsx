import * as ld from 'lodash';
import React, { useState } from 'react';
import AsyncSelect from 'react-select/async';
import { DAC } from '../../libs/ajax/DAC';
import { Models } from '../../libs/models';
import { PromiseSerial } from '../../libs/utils';
import { Alert } from '../../components/Alert';
import { BaseModal } from '../../components/BaseModal';
import {Styles, Theme} from '../../libs/theme';
import documentIcon from '../../images/icon-document.png';
import CloseIconComponent from '../CloseIconComponent';
import Modal from 'react-modal';
import { DacUsers } from './DacUsers';
import ClearIcon from '@mui/icons-material/Clear';
import editDACIcon from '../../images/icon_edit_dac.png';
import addDACIcon from '../../images/icon_add_dac.png';

export const UploadDaaModal = (props) => {

  const okHandler = async () => {
    
  };

  const closeHandler = () => {
    props.onCloseRequest();
  };

  const handleErrors = (message) => {
    
  };

  return (
    <Modal
      isOpen={props.showModal}
      onRequestClose={closeHandler}
      color='common'
      imgSrc={documentIcon}
      title='Upload a file'
      action={{
        label: 'Save',
        handler: okHandler
      }}
      style={{
        content: { ...Styles.MODAL.CONTENT },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <div style={Styles.MODAL.CONTENT}>
        <ClearIcon style={{color:'#00609f'}}/>
        <div style={Styles.MODAL.TITLE_HEADER}>
          Upload a file
        </div>
        <div style={{ borderBottom: '1px solid #1FB50' }} />
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
        </div>
      </div>
    </Modal>
  );
};
