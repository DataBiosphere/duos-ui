import React from 'react';
import {isNil, isEmpty} from 'lodash/fp';
import {styles} from './ManageDacTable';
import TableIconButton from '../../components/TableIconButton';
import {Styles} from '../../libs/theme';
import {Delete, Edit} from '@mui/icons-material';

export function nameCellData({name = '- -', dac, viewMembers, dacId, label= 'dac-name'}) {
  return {
    data: name,
    id: dacId,
    style : {
      color: styles.color.name,
      fontSize: styles.fontSize.name,
      fontWeight: '500',
      cursor:'pointer',
    },
    onClick: () => viewMembers(dac),
    label
  };
}

export function descriptionCellData({description = '- -', dacId, label= 'dac-description'}) {
  return {
    data: isEmpty(description) ? '- -' : description,
    id: dacId,
    style : {
      color: '#354052',
      fontSize: styles.fontSize.name,
    },
    label
  };
}


export function datasetsCellData({dac, viewDatasets, label='dac-datasets'}) {
  return {
    data: (
      <a
        id={dac.dacId + '_dacDatasets'}
        name='dacDatasets'
        onClick={() => viewDatasets(dac)}
      >
        View Datasets
      </a>
    ),
    id: dac.dacId,
    style : {
      color: '#354052',
      fontSize: styles.fontSize.datasets,
    },
    label
  };
}


export function actionsCellData({dac, editDac, deleteDac, userRole}) {
  const isAdmin = (userRole === 'Admin');
  const deleteDisabled = (!isNil(dac.datasets) && !isEmpty(dac.datasets));

  const actions = (
    <>
      <TableIconButton
        key='edit-dac-icon'
        dataTip='Edit DAC'
        onClick={() => editDac(dac)}
        icon={Edit}
        style={Object.assign({}, Styles.TABLE.TABLE_ICON_BUTTON)}
        hoverStyle={Object.assign({}, Styles.TABLE.TABLE_BUTTON_ICON_HOVER)}
      />
      {isAdmin && <TableIconButton
        key='delete-dac-icon'
        dataTip={(deleteDisabled?'All datasets assigned to this DAC must be reassigned before this can be deleted' :'Delete DAC')}
        disabled={deleteDisabled}
        onClick={() => deleteDac(dac)}
        icon={Delete}
        style={Object.assign({}, Styles.TABLE.TABLE_ICON_BUTTON)}
        hoverStyle={Object.assign({}, Styles.TABLE.TABLE_BUTTON_ICON_HOVER)}
      />}
    </>
  );

  return {
    isComponent: true,
    id: dac.dacId,
    style: {
      color: styles.color.actions,
      fontSize: styles.fontSize.actions
    },
    label: 'table-actions',
    data: (
      <div style={{ display: 'flex' }}>
        {actions}
      </div>
    )
  };
}


export default {
  nameCellData,
  descriptionCellData,
  datasetsCellData,
  actionsCellData,
};