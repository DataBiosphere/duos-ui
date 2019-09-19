import _ from 'lodash';
import { Component } from 'react';
import { a, hh, table, tbody, td, th, thead, tr } from 'react-hyperscript-helpers';


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
    return table({ style: { marginLeft: '2rem' }, className: 'table' }, [
      thead({}, [
        tr({}, [
          th({ style: { width: '60%' } }, 'User'),
          th({ style: { width: (this.state.removeButton) ? '20%' : '40%'} }, 'Role'),
          th({ isRendered: this.state.removeButton, style: { width: '20%' } }, '')
        ])
      ]),
      tbody({}, [
        _.flatMap(this.state.dac.chairpersons,
          (u) => tr({}, [
            td({}, [u.displayName, ' ', u.email]),
            td({}, ['Chairperson']),
            td({ isRendered: this.state.removeButton }, [
              a({
                style: { display: 'inline' },
                role: 'button',
                onClick: () => this.state.removeHandler(this.state.dac.dacId, u.dacUserId),
                className: 'btn cell-button cancel-color'
              }, ['Remove'])
            ])
          ])),
        _.flatMap(this.state.dac.members,
          (u) => tr({}, [
            td({}, [u.displayName, ' ', u.email]),
            td({}, ['Member']),
            td({ isRendered: this.state.removeButton }, [
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
