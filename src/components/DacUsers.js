import _ from 'lodash';
import { Component } from 'react';
import { a, div, hh } from 'react-hyperscript-helpers';
import { CHAIR, MEMBER } from './modals/AddDacModal';


const buttonPadding = { paddingTop: 6 };
const headerStyle = { fontWeight: 500, color: '#00609f' };
function columnClass(hasRemoveButton) {
  return hasRemoveButton ? 'col-md-4' : 'col-md-6';
}

export const DacUsers = hh(class DacUsers extends Component {

  constructor(props) {
    super(props);
    this.state = {
      dac: props.dac,
      removeButton: props.removeButton,
      removeHandler: props.removeButton ? props.removeHandler : (dacId, dacUserId, type) => {},
      removedIds: []
    };
    this.onRemove = this.onRemove.bind(this);
    this.makeRow = this.makeRow.bind(this);
  }

  onRemove(dacId, dacUserId, type) {
    if (this.state.removedIds.includes(dacUserId)) {
      this.setState(prev => {
        prev.removedIds = _.difference(prev.removedIds, [dacUserId]);
        return prev;
      });
    } else {
      this.setState(prev => {
        prev.removedIds = _.union(prev.removedIds, [dacUserId]);
        return prev;
      });
    }
    this.state.removeHandler(dacId, dacUserId, type);
  }

  makeRow(u, type) {
    const isRemoved = this.state.removedIds.includes(u.dacUserId);
    const rowStyle = isRemoved ?
      { borderBottom: '1px solid white', padding: '.75rem 0 .75rem 0', backgroundColor: 'lightgray', opacity: .5, borderRadius: 5 } :
      { borderBottom: '1px solid lightgray', padding: '.75rem 0 .75rem 0' }
    ;
    const colClass = columnClass(this.state.removeButton);
    const buttonMessage = isRemoved ? 'Pending Removal' : 'Remove';
    return div({ key: 'chair_' + u.dacUserId, className: 'row', style: rowStyle }, [
      div({ className: colClass }, [u.displayName + ' ' + u.email]),
      div({ className: colClass }, [type]),
      div({
        isRendered: this.state.removeButton,
        style: buttonPadding,
        className: colClass
      }, [
        a({
          style: { display: 'inline' },
          role: 'button',
          onClick: () => this.onRemove(this.state.dac.dacId, u.dacUserId, type),
          className: 'btn cell-button cancel-color'
        }, [buttonMessage])
      ])
    ]);
  }

  render() {
    const colClass = columnClass(this.state.removeButton);
    return div({ style: {}, className: 'container-fluid' }, [
      div({ className: 'row' }, [
        div({ style: headerStyle, className: colClass }, 'User'),
        div({ style: headerStyle, className: colClass }, 'Role'),
        div({
          isRendered: this.state.removeButton,
          style: { ...headerStyle, ...buttonPadding },
          className: colClass
        }, '')
      ]),
      _.flatMap(this.state.dac.chairpersons, (u) => { return this.makeRow(u, CHAIR); }),
      _.flatMap(this.state.dac.members, (u) => { return this.makeRow(u, MEMBER); })
    ]);
  }
});
