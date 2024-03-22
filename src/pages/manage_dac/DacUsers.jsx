import * as ld from 'lodash';
import React, { useState } from 'react';
import { CHAIR, MEMBER } from './AddDacModal';

const buttonPadding = { paddingTop: 6 };
const headerStyle = { fontWeight: 500, color: '#00609f' };

export const DacUsers = (props) => {
  const [state, setState] = useState({
    dac: props.dac,
    removeButton: props.removeButton,
    removeHandler: props.removeButton ? props.removeHandler : () => {},
    removedIds: []
  });

  const onRemove = (dacId, userId, role) => {
    if (state.removedIds.includes(userId)) {
      setState(prev => ({
        ...prev,
        removeIds: ld.difference(prev.removeIds,[userId])
      }));
    } else {
      setState(prev => ({
        ...prev,
        removeIds: ld.union(prev.removeIds, [userId])
      }));
    }
    state.removeHandler(dacId, userId, role);
  };

  const columnClass = () => {
    return state.removeButton ? 'col-md-4' : 'col-md-6';
  };

  const makeRow = (u, role) => {
    const roleTitle = (role === CHAIR) ? 'Chairperson' : 'Member';
    const isRemoved = state.removedIds.includes(u.userId);
    const rowStyle = isRemoved ?
      { borderBottom: '1px solid white', padding: '.75rem 0 .75rem 0', backgroundColor: 'lightgray', opacity: .5, borderRadius: 5 } :
      { borderBottom: '1px solid lightgray', padding: '.75rem 0 .75rem 0' };
    const buttonMessage = isRemoved ? 'Pending Removal' : 'Remove';
    return (
      <div key={'chair_' + u.userId} className="row" style={rowStyle}>
        <div className={columnClass()}>{u.displayName + ' ' + u.email}</div>
        <div className={columnClass()}>{roleTitle}</div>
        {state.removeButton &&
          <div style={buttonPadding} className={columnClass()}>
            <button
              style={{ display: 'inline' }}
              onClick={() => onRemove(state.dac.dacId, u.userId, role)}
              className="btn cell-button cancel-color"
            >
              {buttonMessage}
            </button>
          </div>
        }
      </div>
    );
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div style={headerStyle} className={columnClass()}>User</div>
        <div style={headerStyle} className={columnClass()}>Role</div>
        {state.removeButton &&
          <div style={{ ...headerStyle, ...buttonPadding }} className={columnClass()}></div>
        }
      </div>
      {ld.flatMap(state.dac.chairpersons, (u) => makeRow(u, CHAIR))}
      {ld.flatMap(state.dac.members, (u) => makeRow(u, MEMBER))}
    </div>
  );
}