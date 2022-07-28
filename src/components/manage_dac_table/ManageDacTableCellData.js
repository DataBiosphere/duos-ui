import {isNil, isEmpty} from 'lodash/fp';
import {styles} from './ManageDacTable';
import {a, label, h, div} from 'react-hyperscript-helpers';
import TableIconButton from '../../components/TableIconButton';
import {Styles} from '../../libs/theme';
import {Delete, Edit} from '@material-ui/icons';

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


export function datasetsCellData({dac, viewDatasets}) {
  return {
    data: a({
      id: dac.dacId + '_dacDatasets',
      name: 'dacDatasets',
      className: '',
      onClick: () => viewDatasets(dac)
    }, [`View Datasets`]),
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
  const deleteDisabled = (!isNil(dac.datasets) && !isEmpty(dac.datasets) || !isAdmin);

  const actions = [
    h(TableIconButton, {
      key: 'edit-dac-icon',
      dataTip: !isAdmin ? 'You do not have the permissions to edit this DAC.' : 'Edit DAC',
      disabled: !isAdmin,
      onClick: () => editDac(dac),
      icon: Edit,
      style: Object.assign({}, Styles.TABLE.TABLE_ICON_BUTTON),
      hoverStyle: Object.assign({}, Styles.TABLE.TABLE_BUTTON_ICON_HOVER)
    }),
    h(TableIconButton, {
      key: 'delete-dac-icon',
      dataTip: deleteDisabled ? 'All datasets assigned to this DAC must be reassigned before this can be deleted' : 'Delete DAC',
      disabled: deleteDisabled,
      onClick: () => deleteDac(dac),
      icon: Delete,
      style: Object.assign({}, Styles.TABLE.TABLE_ICON_BUTTON),
      hoverStyle: Object.assign({}, Styles.TABLE.TABLE_BUTTON_ICON_HOVER)
    })
  ];

  return {
    isComponent: true,
    id: dac.dacId,
    style: {
      color: styles.color.actions,
      fontSize: styles.fontSize.actions
    },
    label: 'table-actions',
    data: div({
      style: {
        display: 'flex',
      }
    }, actions)
  };
}


export default {
  nameCellData,
  descriptionCellData,
  datasetsCellData,
  actionsCellData,
};