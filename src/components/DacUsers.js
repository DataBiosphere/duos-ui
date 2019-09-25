import _ from 'lodash';
import { Component } from 'react';
import { a, hh, table, tbody, td, tr } from 'react-hyperscript-helpers';
import { CHAIR, MEMBER } from './modals/AddDacModal';


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
  }

  onRemove(dacId, dacUserId, type) {
    if (this.state.removedIds.includes(dacUserId)) {
      this.setState(prev => {
        prev.removedIds = _.difference(prev.removedIds, dacUserId);
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

  render() {
    const removedStyle = { opacity: '.5' };
    const col1Style = { width: '60%' };
    const col2Style = { width: (this.state.removeButton) ? '15%' : '40%' };
    const col3Style = { width: '25%' };

    return table({ style: { marginLeft: '2rem' }, className: 'table' }, [
      tbody({}, [
        _.flatMap(this.state.dac.chairpersons,
          (u) => {
            const rowStyle = this.state.removedIds.includes(u.dacUserId) ? removedStyle : {};
            const buttonMessage = this.state.removedIds.includes(u.dacUserId) ? 'Pending Removal' : 'Remove';
            return tr({ key: 'chair_' + u.dacUserId, style: rowStyle }, [
              td({ style: col1Style }, [u.displayName, ' ', u.email]),
              td({ style: col2Style }, ['Chairperson']),
              td({ isRendered: this.state.removeButton, style: col3Style }, [
                a({
                  style: { display: 'inline' },
                  role: 'button',
                  onClick: () => this.onRemove(this.state.dac.dacId, u.dacUserId, CHAIR),
                  className: 'btn cell-button cancel-color'
                }, [buttonMessage])
              ])
            ]);
          }),
        _.flatMap(this.state.dac.members,
          (u) => {
            const rowStyle = this.state.removedIds.includes(u.dacUserId) ? removedStyle : {};
            const buttonMessage = this.state.removedIds.includes(u.dacUserId) ? 'Pending Removal' : 'Remove';
            return tr({ key: 'member_' + u.dacUserId, style: rowStyle }, [
              td({ style: col1Style }, [u.displayName, ' ', u.email]),
              td({ style: col2Style }, ['Member']),
              td({ isRendered: this.state.removeButton, style: col3Style }, [
                a({
                  style: { display: 'inline' },
                  role: 'button',
                  onClick: () => this.onRemove(this.state.dac.dacId, u.dacUserId, MEMBER),
                  className: 'btn cell-button cancel-color'
                }, [buttonMessage])
              ])
            ]);
          })
      ])
    ]);
  }
});
