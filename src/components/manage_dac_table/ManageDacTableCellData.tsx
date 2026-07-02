import React from 'react'
import { isNil, isEmpty } from 'src/utils/NodashUtil'
import { styles } from './manageDacTableUtils'
import TableIconButton from 'src/components/TableIconButton'
import { Styles } from 'src/libs/theme'
import { Delete } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import editPencilIcon from 'src/images/edit_pencil.svg'
import type { DacObject } from 'src/types/model'

export interface CellData {
  data: React.ReactNode
  value?: string
  id: number | undefined
  style?: React.CSSProperties
  label: string
  isComponent?: boolean
}

interface NameCellDataParams {
  name?: string
  dacId?: number
  label?: string
}

interface DescriptionCellDataParams {
  description?: string
  dacId?: number
  label?: string
}

interface DatasetsCellDataParams {
  dac: DacObject
  viewDatasets: (dac: DacObject) => void
  label?: string
}

interface ActionsCellDataParams {
  dac: DacObject
  deleteDac: (dac: DacObject) => void
  userRole: string
}

export function nameCellData({ name = '- -', dacId, label = 'dac-name' }: NameCellDataParams): CellData {
  return {
    isComponent: true,
    id: dacId,
    label,
    data: (
      <Link
        to={`/manage_dac/${dacId}`}
        style={{
          color: styles.color.name,
          fontSize: styles.fontSize.name,
          fontWeight: '500',
        }}
      >
        {name || '- -'}
      </Link>
    ),
  }
}

export function descriptionCellData({ description = '- -', dacId, label = 'dac-description' }: DescriptionCellDataParams): CellData {
  return {
    data: isEmpty(description) ? '- -' : description,
    id: dacId,
    style: {
      color: '#354052',
      fontSize: styles.fontSize.name,
    },
    label,
  }
}

export function datasetsCellData({ dac, viewDatasets, label = 'dac-datasets' }: DatasetsCellDataParams): CellData {
  const datasetCount = (dac.datasets ?? []).length
  return {
    isComponent: true,
    id: dac.dacId,
    label,
    data: (
      <button
        id={`${dac.dacId}_dacDatasets`}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#354052', fontSize: styles.fontSize.datasets }}
        onClick={() => viewDatasets(dac)}
      >
        {datasetCount}
      </button>
    ),
  }
}

export function actionsCellData({ dac, deleteDac, userRole }: ActionsCellDataParams): CellData {
  const isAdmin = userRole === 'Admin'
  const deleteDisabled = !isNil(dac.datasets) && !isEmpty(dac.datasets)

  const actions = (
    <>
      <div style={{ paddingTop: '5px' }}>
        <Link
          to={`/manage_dac/${dac.dacId}`}
          data-tip={`Edit ${dac.name}`}
          aria-label={`Edit ${dac.name}`}
        >
          <img id="edit-pencil-icon" src={editPencilIcon} alt="Edit DAC" />
        </Link>
      </div>
      {isAdmin && (
        <TableIconButton
          key="delete-dac-icon"
          dataTip={deleteDisabled ? 'All datasets assigned to this DAC must be reassigned before this can be deleted' : 'Delete DAC'}
          disabled={deleteDisabled}
          onClick={() => deleteDac(dac)}
          icon={Delete}
          style={{ ...Styles.TABLE.TABLE_ICON_BUTTON }}
          hoverStyle={{ ...Styles.TABLE.TABLE_BUTTON_ICON_HOVER }}
        />
      )}
    </>
  )

  return {
    isComponent: true,
    id: dac.dacId,
    style: {
      color: styles.color.actions,
      fontSize: styles.fontSize.actions,
    },
    label: 'table-actions',
    data: (
      <div style={{ display: 'flex' }}>
        {actions}
      </div>
    ),
  }
}

export default {
  nameCellData,
  descriptionCellData,
  datasetsCellData,
  actionsCellData,
}
