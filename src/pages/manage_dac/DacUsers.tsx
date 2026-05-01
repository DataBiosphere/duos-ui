import { difference, union, flatMap } from 'lodash'
import React, { useState, FC, CSSProperties } from 'react'
import { DacObject, DuosUser } from 'src/types/model'

const CHAIR = 'chair'
const MEMBER = 'member'

interface DacUsersProps {
  dac: DacObject
  removeButton?: boolean
  removeHandler?: (dacId: number | undefined, userId: number, role: string) => void
}

interface DacUsersState {
  dac: DacObject
  removeButton: boolean
  removeHandler: (dacId: number | undefined, userId: number, role: string) => void
  removedIds: number[]
}

const buttonPadding: CSSProperties = { paddingTop: 6 }
const headerStyle: CSSProperties = { fontWeight: 500, color: '#00609f' }

export const DacUsers: FC<DacUsersProps> = (props) => {
  const [state, setState] = useState<DacUsersState>({
    dac: props.dac,
    removeButton: props.removeButton ?? false,
    removeHandler: props.removeButton && props.removeHandler ? props.removeHandler : () => {},
    removedIds: [],
  })

  const onRemove = (dacId: number | undefined, userId: number, role: string): void => {
    if (state.removedIds.includes(userId)) {
      setState(prev => ({
        ...prev,
        removedIds: difference(prev.removedIds, [userId]),
      }))
    }
    else {
      setState(prev => ({
        ...prev,
        removedIds: union(prev.removedIds, [userId]),
      }))
    }
    state.removeHandler(dacId, userId, role)
  }

  const columnClass = (): string => {
    return state.removeButton ? 'col-md-4' : 'col-md-6'
  }

  const makeRow = (u: DuosUser, role: string): React.ReactNode => {
    const roleTitle = role === CHAIR ? 'Chairperson' : 'Member'
    const isRemoved = state.removedIds.includes(u.userId)
    const rowStyle: CSSProperties = isRemoved
      ? {
          borderBottom: '1px solid white',
          padding: '.75rem 0 .75rem 0',
          backgroundColor: 'rgba(211, 211, 211, 0.5)',
          borderRadius: 5,
        }
      : { borderBottom: '1px solid lightgray', padding: '.75rem 0 .75rem 0' }
    const buttonMessage = isRemoved ? 'Pending Removal' : 'Remove'
    return (
      <div key={'chair_' + u.userId} className="row" style={rowStyle}>
        <div className={columnClass()}>{u.displayName + ' ' + u.email}</div>
        <div className={columnClass()}>{roleTitle}</div>
        {state.removeButton && (
          <div style={buttonPadding} className={columnClass()}>
            <button
              style={{ display: 'inline' }}
              onClick={(e) => {
                e.preventDefault()
                onRemove(state.dac.dacId, u.userId, role)
              }}
              className="btn cell-button cancel-color"
              data-cy={'remove_button_' + u.userId}
            >
              {buttonMessage}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div style={headerStyle} className={columnClass()}>
          User
        </div>
        <div style={headerStyle} className={columnClass()}>
          Role
        </div>
        {state.removeButton && (
          <div style={{ ...headerStyle, ...buttonPadding }} className={columnClass()}></div>
        )}
      </div>
      {flatMap(state.dac.chairpersons, u => makeRow(u, CHAIR))}
      {flatMap(state.dac.members, u => makeRow(u, MEMBER))}
    </div>
  )
}
