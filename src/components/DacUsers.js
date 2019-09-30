import _ from 'lodash';
import { Component } from 'react';
import { a, div, hh } from 'react-hyperscript-helpers';
import { CHAIR, MEMBER } from './modals/AddDacModal';


const buttonPadding = { paddingTop: 6 };
const headerStyle = { fontWeight: 500, color: '#00609f' };

export const DacUsers = hh(class DacUsers extends Component {

  constructor(props) {
    super(props);
    this.state = {
      dac: props.dac,
      removeButton: props.removeButton,
      removeHandler: props.removeButton ? props.removeHandler : () => {},
      removedIds: []
    };
    this.onRemove = this.onRemove.bind(this);
    this.columnClass = this.columnClass.bind(this);
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

  columnClass() {
    return this.state.removeButton ? 'col-md-4' : 'col-md-6';
  }

  makeRow(u, type) {
    const roleTitle = (type === CHAIR) ? 'Chairperson' : 'Member';
    const isRemoved = this.state.removedIds.includes(u.dacUserId);
    const rowStyle = isRemoved ?
      { borderBottom: '1px solid white', padding: '.75rem 0 .75rem 0', backgroundColor: 'lightgray', opacity: .5, borderRadius: 5 } :
      { borderBottom: '1px solid lightgray', padding: '.75rem 0 .75rem 0' }
    ;
    const buttonMessage = isRemoved ? 'Pending Removal' : 'Remove';
    return div({ key: 'chair_' + u.dacUserId, className: 'row', style: rowStyle }, [
      div({ className: this.columnClass() }, [u.displayName + ' ' + u.email]),
      div({ className: this.columnClass() }, [roleTitle]),
      div({
        isRendered: this.state.removeButton,
        style: buttonPadding,
        className: this.columnClass()
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
    return div({ style: {}, className: 'container-fluid' }, [
      div({ className: 'row' }, [
        div({ style: headerStyle, className: this.columnClass() }, 'User'),
        div({ style: headerStyle, className: this.columnClass() }, 'Role'),
        div({
          isRendered: this.state.removeButton,
          style: { ...headerStyle, ...buttonPadding },
          className: this.columnClass()
        }, '')
      ]),
      _.flatMap(this.state.dac.chairpersons, (u) => { return this.makeRow(u, CHAIR); }),
      _.flatMap(this.state.dac.members, (u) => { return this.makeRow(u, MEMBER); })
    ]);
  }
});
