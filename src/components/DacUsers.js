import _ from 'lodash';
import { Component } from 'react';
import { a, hh, table, tbody, td, tr } from 'react-hyperscript-helpers';


export const DacUsers = hh(class DacUsers extends Component {

  constructor(props) {
    super(props);
    this.state = {
      dac: props.dac,
      removeButton: props.removeButton,
      removeHandler: props.removeButton ? props.removeHandler : (dacId, dacUserId) => {}
    };
  }

  render() {
    const col1Style = { width: '60%' };
    const col2Style = { width: (this.state.removeButton) ? '20%' : '40%' };
    const col3Style = { width: '20%' };

    return table({ style: { marginLeft: '2rem' }, className: 'table' }, [
      tbody({}, [
        _.flatMap(this.state.dac.chairpersons,
          (u) => tr({key: "chair_" + u.dacUserId}, [
            td({ style: col1Style }, [u.displayName, ' ', u.email]),
            td({ style: col2Style }, ['Chairperson']),
            td({ isRendered: this.state.removeButton, style: col3Style }, [
              a({
                style: { display: 'inline' },
                role: 'button',
                onClick: () => this.state.removeHandler(this.state.dac.dacId, u.dacUserId),
                className: 'btn cell-button cancel-color'
              }, ['Remove'])
            ])
          ])),
        _.flatMap(this.state.dac.members,
          (u) => tr({key: "member_" + u.dacUserId}, [
            td({ style: col1Style }, [u.displayName, ' ', u.email]),
            td({ style: col2Style }, ['Member']),
            td({ isRendered: this.state.removeButton, style: col3Style }, [
              a({
                style: { display: 'inline' },
                role: 'button',
                onClick: () => this.state.removeHandler(this.state.dac.dacId, u.dacUserId),
                className: 'btn cell-button cancel-color'
              }, ['Remove'])
            ])
          ]))
      ])
    ]);
  }
});
